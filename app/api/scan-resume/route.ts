import { NextResponse } from 'next/server';
import * as nvidiaApi from '@/lib/nvidia';
import * as openrouterApi from '@/lib/openrouter';
import * as geminiApi from '@/lib/gemini';
import pdfParse from 'pdf-parse';
import { analyzeKeywords, computeDeterministicScore } from '@/lib/keywordAnalysis';

export const runtime = 'nodejs';

const MAX_RESUME_CHARS = 12000;
const MAX_JD_CHARS = 8000;
const API_TIMEOUT_MS = 90000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File;
    const preExtractedText = formData.get('resumeText') as string | null;
    const jobDescription = formData.get('jobDescription') as string;
    const yearsOfExperience = Number(formData.get('yearsOfExperience'));
    const companyName = (formData.get('companyName') as string) || '';
    const jobTitle = (formData.get('jobTitle') as string) || '';
    const userId = (formData.get('userId') as string) || 'anonymous';
    const aiProvider = (formData.get('aiProvider') as string) || 'openrouter';

    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    if ((!resumeFile && !preExtractedText) || !jobDescription || isNaN(yearsOfExperience)) {
      return NextResponse.json(
        { error: 'Missing or invalid resume file/text, job description, or years of experience' },
        { status: 400 }
      );
    }

    let resumeText: string;

    if (preExtractedText && preExtractedText.trim().length >= 50) {
      resumeText = preExtractedText;
    } else if (resumeFile) {
      if (!(resumeFile instanceof File)) {
        return NextResponse.json({ error: 'Invalid resume file format' }, { status: 400 });
      }

      if (resumeFile.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Resume file must be under 10MB' }, { status: 400 });
      }

      const arrayBuffer = await resumeFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text;

      if (!resumeText || resumeText.trim().length < 50) {
        return NextResponse.json(
          { error: 'Could not extract sufficient text from the PDF. Please ensure your resume is not image-based.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Could not extract sufficient text from the resume.' },
        { status: 400 }
      );
    }

    const truncatedResume = resumeText.length > MAX_RESUME_CHARS
      ? resumeText.slice(0, MAX_RESUME_CHARS) + "\n\n[Resume truncated for analysis]"
      : resumeText;
    const truncatedJD = jobDescription.length > MAX_JD_CHARS
      ? jobDescription.slice(0, MAX_JD_CHARS) + "\n\n[Job description truncated]"
      : jobDescription;

    console.log(`[scan-resume] Provider: ${aiProvider}, Resume: ${truncatedResume.length} chars, JD: ${truncatedJD.length} chars`);

    const keywordAnalysis = analyzeKeywords(truncatedResume, truncatedJD);
    const deterministicScores = computeDeterministicScore(keywordAnalysis);

    const missingKeywords = keywordAnalysis.keywords
      .filter((k) => !k.present)
      .map((k) => k.keyword);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(data: any) {
          controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
        }

        send({ type: 'keywords', resumeText, keywordAnalysis, deterministicScores });

        async function scanWithProvider(provider: string) {
          switch (provider) {
            case 'gemini':
              return geminiApi.scanResumeGemini(truncatedResume, truncatedJD, yearsOfExperience, companyName, jobTitle);
            case 'openrouter':
              return openrouterApi.scanResumeOpenRouter(truncatedResume, truncatedJD, yearsOfExperience, companyName, jobTitle);
            case 'nvidia':
            default:
              return nvidiaApi.scanResumeNvidia(truncatedResume, truncatedJD, yearsOfExperience, companyName, jobTitle);
          }
        }

        async function tryScan(provider: string) {
          return withTimeout(
            scanWithProvider(provider),
            API_TIMEOUT_MS,
            `${provider} scan`
          );
        }

        try {
          let llmReport;
          try {
            llmReport = await tryScan(aiProvider);
          } catch (fallbackErr: any) {
            if (aiProvider !== 'nvidia' && (fallbackErr.message?.includes("429") || fallbackErr.status === 429)) {
              console.log(`[scan-resume] ${aiProvider} 429, falling back to NVIDIA`);
              send({ type: 'fallback', message: `${aiProvider} rate limited. Falling back to NVIDIA.` });
              llmReport = await tryScan('nvidia');
            } else {
              throw fallbackErr;
            }
          }

          const finalMatchScore = computeFinalScore(
            llmReport.matchScore || 50,
            deterministicScores.keywordScore,
            deterministicScores.sectionScore,
            deterministicScores.criticalPenalty
          );

          const skills = {
            score: blendScores(llmReport.skills?.score || 50, deterministicScores.keywordScore),
            tips: llmReport.skills?.tips || [],
          };

          send({ type: 'scan_result', llmReport, finalMatchScore, skills });
        } catch (err: any) {
          console.error("ATS scan failed:", err.message);
          send({ type: 'scan_result', error: err.message });
        }

        async function optimizeWithProvider(provider: string) {
          switch (provider) {
            case 'gemini':
              return geminiApi.generateOptimizedResumeGemini(truncatedResume, truncatedJD, companyName, jobTitle, missingKeywords);
            case 'openrouter':
              return openrouterApi.generateOptimizedResumeOpenRouter(truncatedResume, truncatedJD, companyName, jobTitle, missingKeywords);
            case 'nvidia':
            default:
              return nvidiaApi.generateOptimizedResume(truncatedResume, truncatedJD, companyName, jobTitle, missingKeywords);
          }
        }

        async function tryOptimize(provider: string) {
          return withTimeout(
            optimizeWithProvider(provider),
            API_TIMEOUT_MS,
            `${provider} optimize`
          );
        }

        try {
          let optimizedResume;
          try {
            optimizedResume = await tryOptimize(aiProvider);
          } catch (fallbackErr: any) {
            if (aiProvider !== 'nvidia' && (fallbackErr.message?.includes("429") || fallbackErr.status === 429)) {
              console.log(`[scan-resume] ${aiProvider} optimize 429, falling back to NVIDIA`);
              optimizedResume = await tryOptimize('nvidia');
            } else {
              throw fallbackErr;
            }
          }
          send({ type: 'optimized_resume', optimizedResume });
        } catch (err: any) {
          console.error("Optimized resume generation failed (non-fatal):", err.message);
          send({ type: 'optimized_resume', error: err.message });
        }

        send({ type: 'complete' });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in scan-resume API:', error);
    return NextResponse.json(
      { error: 'Failed to scan resume', details: error.message },
      { status: 500 }
    );
  }
}

function computeFinalScore(
  llmScore: number,
  keywordScore: number,
  sectionScore: number,
  criticalPenalty: number
): number {
  const blended = Math.round(llmScore * 0.4 + keywordScore * 0.35 + sectionScore * 0.25);
  return Math.max(1, Math.min(100, blended - criticalPenalty));
}

function blendScores(llmScore: number, deterministicScore: number): number {
  return Math.round(llmScore * 0.5 + deterministicScore * 0.5);
}
