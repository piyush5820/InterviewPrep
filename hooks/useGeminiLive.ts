import { useEffect, useRef, useState, useCallback } from "react";

interface GeminiLiveConfig {
  jobProfile: string;
  experienceLevel: string;
  skills: string;
  interviewType: string;
  targetCompany?: string;
  focusTopics?: string;
  questions: string[];
  currentIndex: number;
}

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type TranscriptEntry = {
  speaker: "Interviewer" | "Candidate";
  text: string;
};

// Max follow-up questions the interviewer may ask across the whole live session.
export const LIVE_MAX_TOTAL_FOLLOW_UPS = 2;

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/^(interviewer|candidate)\s*:\s*/, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantWords(text: string): string[] {
  const stop = new Set([
    "what", "whats", "which", "would", "could", "should", "please", "explain",
    "describe", "share", "about", "your", "with", "have", "that", "this",
    "from", "they", "them", "then", "than", "into", "does", "doing",
    "question",
  ]);
  return normalizeForMatch(text)
    .split(" ")
    .filter((w) => w.length > 3 && !stop.has(w));
}

export function useGeminiLive() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  // Live plan coverage: which planned question is currently being asked (0-based)
  // plus follow-up guard counters so the interviewer cannot drift off-plan.
  const [liveQuestionIndex, setLiveQuestionIndex] = useState(0);
  const [liveFollowUpCount, setLiveFollowUpCount] = useState(0);
  const [liveTotalFollowUps, setLiveTotalFollowUps] = useState(0);

  const ws = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextPlayTimeRef = useRef<number>(0);
  const intentionalDisconnectRef = useRef(false);
  const plannedQuestionsRef = useRef<string[]>([]);
  const lastClassifiedTurnRef = useRef<string>("");

  const appendTranscript = useCallback((speaker: "Interviewer" | "Candidate", text: string) => {
    const cleanedText = text.trim();
    if (!cleanedText) return;

    setTranscriptEntries((prev) => {
      const last = prev[prev.length - 1];
      if (last?.speaker === speaker) {
        if (cleanedText.startsWith(last.text)) {
          return [...prev.slice(0, -1), { ...last, text: cleanedText }];
        }

        if (last.text.endsWith(cleanedText)) {
          return prev;
        }

        const separator = /[\s.,!?;:]$/.test(last.text) ? "" : " ";
        const nextText = `${last.text}${separator}${cleanedText}`.replace(/\s+/g, " ").trim();
        return [...prev.slice(0, -1), { ...last, text: nextText }];
      }

      return [...prev, { speaker, text: cleanedText }];
    });
  }, []);

  const maybeMarkInterviewComplete = useCallback((text: string) => {
    if (/\b(this concludes|that concludes|interview is complete|we are done|goodbye|good bye)\b/i.test(text)) {
      setIsComplete(true);
    }
  }, []);

  // Classify an interviewer turn: planned question (advance coverage) or follow-up.
  // Runs on streamed chunks, so already-classified text is skipped to avoid double counting.
  const classifyInterviewerTurn = useCallback((text: string) => {
    const cleaned = text.trim();
    if (!cleaned || cleaned === lastClassifiedTurnRef.current) return;
    if (lastClassifiedTurnRef.current.startsWith(cleaned)) return;
    // Only classify turns that actually ask something (or close the interview).
    if (!/[?]/.test(cleaned) && !/\b(this concludes|that concludes|interview is complete|goodbye|good bye)\b/i.test(cleaned)) return;
    lastClassifiedTurnRef.current = cleaned;

    const planned = plannedQuestionsRef.current;
    if (planned.length === 0) return;

    // Explicit "Question N" prefix (the interviewer is instructed to number planned questions).
    const numbered = cleaned.match(/question\s+(\d+)/i);
    if (numbered) {
      const idx = Math.min(Math.max(parseInt(numbered[1], 10) - 1, 0), planned.length - 1);
      setLiveQuestionIndex((prev) => Math.max(prev, idx));
      setLiveFollowUpCount(0);
      return;
    }

    // Fuzzy match against the planned questions.
    const words = new Set(significantWords(cleaned));
    let bestIdx = -1;
    let bestRatio = 0;
    planned.forEach((q, i) => {
      const keys = significantWords(q);
      if (keys.length === 0) return;
      const hits = keys.filter((w) => words.has(w)).length;
      const ratio = hits / keys.length;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestIdx = i;
      }
    });

    if (bestIdx !== -1 && bestRatio >= 0.5) {
      setLiveQuestionIndex((prev) => (bestIdx > prev ? bestIdx : prev));
      setLiveFollowUpCount(0);
      return;
    }

    // Otherwise this turn is a follow-up, not a planned question.
    setLiveFollowUpCount((prev) => prev + 1);
    setLiveTotalFollowUps((prev) => prev + 1);
  }, []);

  // Stop all active audio playback (Barge-in / Interruption)
  const stopAllPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Source might have already stopped
      }
    });
    activeSourcesRef.current.clear();
    if (audioContextRef.current) {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
    setIsSpeaking(false);
  }, []);

  const disconnect = useCallback(() => {
    stopAllPlayback();
    intentionalDisconnectRef.current = true;

    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (ws.current) {
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.close();
      }
      ws.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
  }, [stopAllPlayback]);

  const connect = useCallback(async (config: GeminiLiveConfig) => {
    disconnect();
    intentionalDisconnectRef.current = false;
    setError(null);
    setIsComplete(false);
    setTranscriptEntries([]);
    setLiveQuestionIndex(0);
    setLiveFollowUpCount(0);
    setLiveTotalFollowUps(0);
    lastClassifiedTurnRef.current = "";
    plannedQuestionsRef.current = Array.isArray(config.questions) ? config.questions.map((q) => String(q)) : [];

    try {
      // 1. Fetch the API key from Next.js server route
      const tokenRes = await fetch("/api/gemini-token");
      if (!tokenRes.ok) {
        const text = await tokenRes.text().catch(() => "");
        throw new Error(`Failed to retrieve Gemini API Key (status ${tokenRes.status}). ${text}`);
      }
      const { apiKey } = await tokenRes.json();
      console.log("Gemini token fetched, apiKey present:", !!apiKey);

      // 2. Initialize Web Audio Context
      const AudioContextConstructor =
        window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!AudioContextConstructor) {
        throw new Error("Web Audio API is not supported in this browser.");
      }

      const audioContext = new AudioContextConstructor();
      audioContextRef.current = audioContext;
      nextPlayTimeRef.current = audioContext.currentTime;

      // 3. Connect WebSocket to Gemini Multimodal Live API
      const model = "models/gemini-3.1-flash-live-preview";
      const wsBase = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`;
      const wsUrl = `${wsBase}?key=${apiKey}`;
      console.log("Connecting to Gemini Live WebSocket:", wsBase);

      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      socket.onopen = () => {
        setIsConnected(true);

        // Read resume text from localStorage if this is a resume-based interview
        const resumeText = typeof window !== "undefined" ? localStorage.getItem("resumeText") : null;

        const resumeContext = resumeText
          ? `\nResume context excerpt for grounding follow-ups:\n${resumeText.slice(0, 5000)}`
          : "";

        // Define system instructions built from candidate's profile + optional resume context
        const sysInstruction = `You are a disciplined AI interviewer conducting a ${config.interviewType} interview.
Role: ${config.jobProfile}
Experience: ${config.experienceLevel}
Skills/topics: ${[config.skills, config.focusTopics].filter(Boolean).join(", ") || "role-relevant topics"}
${resumeContext}

You MUST ask every planned question below, in order, without skipping any:
${config.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

STRICT RULES (follow exactly):
1. Start with a one-line greeting, then ask planned question 1.
2. Begin every planned question by saying its number aloud, e.g. "Question 2. ..." — never skip the number.
3. Ask the planned questions in strict numeric order. After the candidate answers, move to the next planned question.
4. You may ask AT MOST ${LIVE_MAX_TOTAL_FOLLOW_UPS} follow-up questions in the ENTIRE interview, each under 15 words, only to clarify the answer just given. Never ask two follow-ups in a row: after any follow-up, return to the next planned question immediately.
5. Never invent new topics or drill deeper than one short clarification. Do not repeat a planned question unless the candidate asked you to.
6. Keep every interviewer turn under 60 words. Be professional and encouraging.
7. After planned question ${config.questions.length} is answered (and any final allowed follow-up), say exactly: "This concludes the interview. Goodbye." and nothing else.`;

        // Send Setup Payload
        const setupMsg = {
          setup: {
            model: model,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede", // Aoede is a warm, engaging female voice configuration
                  },
                },
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            contextWindowCompression: {
              slidingWindow: {},
            },
            sessionResumption: {},
            systemInstruction: {
              parts: [{ text: sysInstruction }],
            },
          },
        };

        try {
          socket.send(JSON.stringify(setupMsg));
        } catch (sendErr) {
          console.error("Failed to send setup message:", sendErr);
          setError("Failed to initialize live session (failed to send setup).");
        }
      };

      socket.onmessage = async (event) => {
        try {
          // Normalize incoming message data to a string before parsing.
          // Some environments deliver JSON text as a Blob or ArrayBuffer.
          let rawData: string;
          if (typeof event.data === "string") {
            rawData = event.data;
          } else if (event.data instanceof Blob) {
            rawData = await event.data.text();
          } else if (event.data instanceof ArrayBuffer) {
            rawData = new TextDecoder().decode(event.data);
          } else {
            rawData = typeof event.data === "object" ? JSON.stringify(event.data) : String(event.data);
          }

          const response = JSON.parse(rawData);
          const inputTranscript = response.serverContent?.inputTranscription?.text;
          const outputTranscript = response.serverContent?.outputTranscription?.text;

          if (inputTranscript) {
            appendTranscript("Candidate", inputTranscript);
          }

          if (outputTranscript) {
            appendTranscript("Interviewer", outputTranscript);
            maybeMarkInterviewComplete(outputTranscript);
            classifyInterviewerTurn(outputTranscript);
          }

          // Handle interruption signal (Barge-in)
          if (response.serverContent?.interrupted || response.interrupted) {
            console.log("Gemini Live: Interruption detected. Stopping playback.");
            stopAllPlayback();
            return;
          }

          // Handle server audio output
          if (response.serverContent?.modelTurn?.parts) {
            for (const part of response.serverContent.modelTurn.parts) {
              // Real-time Text Transcription
              if (part.text && !outputTranscript) {
                appendTranscript("Interviewer", part.text);
                maybeMarkInterviewComplete(part.text);
                classifyInterviewerTurn(part.text);
              }

              // Real-time Audio Streaming Playback
              if (part.inlineData && part.inlineData.data) {
                const base64Data = part.inlineData.data;
                const binaryString = window.atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }

                // Gemini returns 24kHz Mono 16-bit PCM
                const pcm16 = new Int16Array(bytes.buffer);
                const float32 = new Float32Array(pcm16.length);
                for (let i = 0; i < pcm16.length; i++) {
                  float32[i] = pcm16[i] / 32768.0;
                }

                if (audioContextRef.current) {
                  const audioCtx = audioContextRef.current;
                  const sampleRate = 24000; // Gemini response rate
                  const audioBuffer = audioCtx.createBuffer(1, float32.length, sampleRate);
                  audioBuffer.getChannelData(0).set(float32);

                  const source = audioCtx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(audioCtx.destination);

                  // Schedule sequential playback
                  const playTime = Math.max(nextPlayTimeRef.current, audioCtx.currentTime);
                  source.start(playTime);
                  nextPlayTimeRef.current = playTime + audioBuffer.duration;

                  // Track source so we can stop it upon interruption
                  activeSourcesRef.current.add(source);
                  setIsSpeaking(true);

                  source.onended = () => {
                    activeSourcesRef.current.delete(source);
                    if (activeSourcesRef.current.size === 0) {
                      setIsSpeaking(false);
                    }
                  };
                }
              }
            }
          }
        } catch (e) {
          console.error("Error processing Gemini message:", e);
        }
      };

      socket.onerror = (e) => {
        if (ws.current !== socket) return;

        console.error("Gemini WebSocket Error:", e);
        try {
          setError(`WebSocket error occurred: ${JSON.stringify(e)}`);
        } catch {
          setError("WebSocket error occurred.");
        }
        setIsConnected(false);
      };

      socket.onclose = (ev) => {
        if (ws.current !== socket) return;

        console.warn("Gemini WebSocket closed:", ev);
        setIsConnected(false);
        if (!intentionalDisconnectRef.current && ev.code !== 1000) {
          setError(`Live Voice connection closed unexpectedly: code=${ev.code} reason=${ev.reason || "none"}`);
        }
      };

      // 4. Capture Microphone Input (16kHz 16-bit Mono PCM)
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      // Ensure audio context is running (some browsers require resume after user gesture)
      try {
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
      } catch (resumeErr) {
        console.warn("AudioContext resume failed:", resumeErr);
      }

      const micSource = audioContext.createMediaStreamSource(micStream);
      // Create ScriptProcessor with buffer size of 2048
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorNodeRef.current = processor;

      micSource.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (socket.readyState !== WebSocket.OPEN) return;

        const inputChannel = e.inputBuffer.getChannelData(0);

        // Downsample Float32 mic stream to 16kHz Int16 PCM
        const pcm16 = downsampleBuffer(inputChannel, audioContext.sampleRate, 16000);

        // Convert pcm16 to base64
        let binary = "";
        const u8 = new Uint8Array(pcm16.buffer);
        for (let i = 0; i < u8.length; i++) {
          binary += String.fromCharCode(u8[i]);
        }
        const base64 = window.btoa(binary);

        // Stream real-time audio chunk to Gemini (new API format)
        try {
          socket.send(
            JSON.stringify({
              realtimeInput: {
                audio: {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64,
                },
              },
            })
          );
        } catch (audioErr) {
          console.error("Failed to send audio chunk:", audioErr);
        }
      };
    } catch (err) {
      console.error("Failed to connect to Gemini Multimodal Live API:", err);
      setError(err instanceof Error ? err.message : "Failed to open live audio session.");
      disconnect();
    }
  }, [appendTranscript, classifyInterviewerTurn, disconnect, maybeMarkInterviewComplete, stopAllPlayback]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isSpeaking,
    transcript: transcriptEntries.map((entry) => `${entry.speaker}: ${entry.text}`).join("\n"),
    transcriptEntries,
    error,
    isComplete,
    liveQuestionIndex,
    liveFollowUpCount,
    liveTotalFollowUps,
    connect,
    disconnect,
    stopAllPlayback,
  };
}

// Downsampler helper function: converts mic Float32 buffer to 16kHz mono Int16 PCM
function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number): Int16Array {
  if (outputSampleRate === inputSampleRate) {
    const pcm = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      pcm[i] = Math.min(1, Math.max(-1, buffer[i])) * 0x7fff;
    }
    return pcm;
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = Math.min(1, Math.max(-1, accum / (count || 1))) * 0x7fff;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}
