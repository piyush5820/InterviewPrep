import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ToastProvide";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");
  const { showToast } = useToast();
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!isSupported) {
      showToast("⚠️ Speech recognition is not supported in this browser.", "warning");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = finalTranscriptRef.current;
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + " ";
        } else {
          interimTranscript += transcriptPart + " ";
        }
      }
      finalTranscriptRef.current = finalTranscript.trim();
      const newTranscript = finalTranscript + (interimTranscript ? " " + interimTranscript : "");
      setTranscript(newTranscript.trim());
      console.log("Transcript updated:", newTranscript.trim()); // Debug log
      // Reset inactivity timeout on new speech
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      if (isListening) {
        inactivityTimeoutRef.current = setTimeout(() => {
          stopListening();
          showToast("⚠️ No speech detected for 30 seconds. Stopped listening.", "warning");
        }, 30000);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      if (event.error === "no-speech") {
        showToast("⚠️ No speech detected. Please try again.", "warning");
        return;
      }
      if (event.error === "not-allowed") {
        showToast("❌ Microphone access denied. Please allow microphone access.", "error");
        return;
      }
      showToast(`❌ Speech recognition error: ${event.error}`, "error");
      console.error("Speech recognition error:", event.error);
    };

    recognitionRef.current.onend = () => {
      console.log("Speech recognition ended, final transcript:", finalTranscriptRef.current.trim()); // Debug log
      setTimeout(() => {
        setIsListening(false);
        setTranscript(finalTranscriptRef.current.trim());
      }, 100); // Delay to ensure transcript is finalized
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
  }, [showToast, isSupported]);

  const startListening = () => {
    if (!recognitionRef.current || !isSupported) return;
    console.log("Starting speech recognition"); // Debug log
    recognitionRef.current.start();
    setIsListening(true);
    finalTranscriptRef.current = "";
    setTranscript("");
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      console.log("Stopping speech recognition"); // Debug log
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    finalTranscriptRef.current = "";
    setTranscript("");
    console.log("Transcript reset"); // Debug log
  };

  return { transcript, isListening, startListening, stopListening, resetTranscript, isSupported };
};