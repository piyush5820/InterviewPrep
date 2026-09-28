<div align="center">

# 🎯 PreplystHub AI

### Your personal AI interview coach — practice, get scored, get hired.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-0f766e?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-2e4bff?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-ff6a3d?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Gemini-Live%20Voice-0f766e?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-027fb7?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-15803d?style=for-the-badge)](LICENSE)

*Mock interviews with real-time voice AI • ATS resume intelligence • Analytics that show you improving*

[✨ Features](#-features) • [🚀 Quickstart](#-quickstart) • [🗺️ Pages](#️-pages--routes) • [🔌 API](#-api-reference) • [⚙️ Config](#️-configuration) • [🏗️ Architecture](#️-architecture)

</div>

---

## 🌟 Why PreplystHub?

| The old way 😩 | The PreplystHub way 🚀 |
|---|---|
| Static "top 50 questions" lists | Questions generated for **your role, level, stack & target company** |
| Reading answers silently | **Speaking out loud** — voice input, live AI interviewer, webcam practice |
| Zero feedback after rejection | **Per-answer scores + ideal answers + delivery ratings** (confidence, communication, language) |
| Resumes lost in ATS black holes | **ATS scan, keyword gaps, optimizer & builder** in one studio |
| Scattered prep across 5 tools | **One sidebar**: prep, scan, build, track, review |

---

## ✨ Features

### 🎙️ AI Mock Interviews (the centerpiece)

| Mode | What happens |
|---|---|
| 🗣️ **Live Voice (audio-to-audio)** | Real-time conversation with Gemini Live. Auto-starts, tracks planned-question coverage live (`Q 3/5`), allows **max 2 follow-ups per session**, closes itself with a goodbye — then auto-saves, evaluates & summarizes. |
| ⌨️ **Classic mode** | Speech-to-text answers (Web Speech API) or an in-browser **code editor** (CodeMirror) for coding questions, with text-to-speech question playback. |
| 📄 **Resume-to-interview** | Upload your resume PDF → questions grounded in *your* projects, skills & experience. |
| ⏭️ **Skip smart** | Skip any question and instantly receive the **ideal answer**. |
| 📷 **Webcam practice** | Mirror-preview panel for body-language practice while you answer. |

Every answer is evaluated (0–10) with concise coach feedback. Interviews persist to Firestore and flow into results, history & dashboard automatically.

### 📊 Results, History & Analytics

| Surface | You get |
|---|---|
| 🏁 **Results** | Overall score, performance level, per-question breakdown (your answer vs feedback vs ideal answer), **Delivery Summary** (confidence / communication / language / overall + notes), one-click TXT download, retake flow. |
| 🕘 **History** | Card grid of every session with score badges & skill tags; slide-over detail panel (desktop) / modal (mobile). |
| 📈 **Dashboard** | Service shortcuts, recent-interviews table, **performance-over-time** charts (area / bar / line / composed with time-range filters), score-distribution pie, **skills radar**, and **delivery averages** across live-voice sessions. |

### 📄 Resume Intelligence Suite

| Tool | What it does |
|---|---|
| 🔍 **ATS Scanner** | PDF text extraction → keyword analysis (matched / missing), deterministic + LLM ATS scores, skills / tone / content / structure breakdowns, AI-optimized rewrite, printable download templates, scan-report history. |
| ✨ **Optimizer** | Paste resume + job description → accept/reject individual AI suggestions, live score, template formatting, one-click rescan. |
| 🧱 **Resume Builder** | Template picker → inline editing, add/remove/reorder sections, print-to-PDF. |
| ✏️ **Bullet-point generator** | Role-grounded achievement bullets with accept/copy workflow. |

### 💼 Job Tracker

| Capability | Detail |
|---|---|
| 📋 Pipeline | Add / edit / delete / status-flow (`saved → applied → screening → interview → offer → accepted`, plus `rejected`/`withdrawn`). |
| 🤖 AI match | Match-score + keyword analysis per application against the job description. |
| 🔎 Command bar | Search + status filter, aggregate stats (total, active, interviews, offers, avg match). |
| 🔗 Integrations | "Track application" pushes ATS scans straight into the pipeline. |

### 🔐 Auth, Plans & Polish

| Item | Detail |
|---|---|
| 🔑 Auth | Email/password + Google sign-in, **email verification gate**, password reset. |
| 💳 Subscription | Free / Pro / Enterprise tiers with monthly–annual toggle. |
| 🎨 Studio UI | Single-sidebar navigation, Tidepool design system (teal + cobalt + coral), dark live-interview stage, ambient/3D motion with `prefers-reduced-motion` support, toasts, skeletons & friendly empty states. |
| 📱 Responsive | Mobile drawer navigation, adaptive grids, touch-friendly controls throughout. |

---

## 🗺️ Pages & Routes

| Route | Page | Nav |
|---|---|---|
| `/` | Landing — hero, stats, features, success stories, CTA | Marketing nav |
| `/auth` | Sign in / Sign up + verify-email flow | — |
| `/dashboard` | Performance command center | Sidebar |
| `/homeform` | Interview setup (form **or** resume upload) | — |
| `/interview` | Live practice room (classic + voice) | In-room controls |
| `/results` | Latest session report + delivery summary | In-page actions |
| `/history` | All sessions + detail inspector | Sidebar |
| `/ResumeScanner` | ATS resume scan | Sidebar |
| `/atsDashboard` | Past scan reports | Sidebar |
| `/optimize` | Resume optimizer | Sidebar |
| `/resume-builder` | Resume builder | Sidebar |
| `/jobTracker` | Application pipeline | Sidebar |
| `/subscription` | Plans & billing toggle | Sidebar |

> **Navigation rule:** one shared `Sidebar` everywhere inside the app — no competing topbars.

---

## 🔌 API Reference

All routes live under `app/api/`:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/generateQuestions` | POST | Role/level/skills-aware question generation |
| `/api/resume-to-questions` | POST | Resume PDF → grounded interview questions |
| `/api/evaluateAnswer` | POST | Score + feedback for one answer |
| `/api/getIdealAnswer` | POST | Model answer (incl. coding variants) |
| `/api/processLiveInterview` | POST | Live transcript → per-question evaluations + delivery summary |
| `/api/gemini-token` | GET | Server-side Gemini key handoff for Live Voice |
| `/api/scan-resume` | POST | Streaming ATS scan (NDJSON: keywords → scores → rewrite) |
| `/api/extract-text` | POST | PDF → text extraction |
| `/api/optimize-resume` | POST | Accept/reject-style resume suggestions |
| `/api/bullet-points` | POST | Achievement bullet generation |
| `/api/job-match` | POST | Application ↔ JD match score + keywords |
| `/api/cleanUp` | POST | Maintenance cleanup (protected) |

**AI providers** (graceful fallback chain): Google Gemini → NVIDIA → OpenRouter → Groq. Missing keys disable only their features — the app still builds and runs.

---

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript 5 |
| Styling | Tailwind CSS 4, CSS variables, custom keyframe system |
| Auth & DB | Firebase Auth, Firestore (`users/{uid}/interviews`, `/reports`, `/applications`) |
| AI | `@google/generative-ai`, `@google/genai` (Live Voice WS), NVIDIA / OpenRouter / Groq via OpenAI-compatible clients |
| Voice | Gemini Multimodal Live (16 kHz in / 24 kHz out PCM), Web Speech API (classic mode + TTS) |
| Editor/Charts/UI | CodeMirror, Recharts, Framer Motion, Lucide icons, Headless UI, react-hot-toast |
| Docs/PDF | pdf-parse, pdfjs-dist, pdf2pic |

---

## 🚀 Quickstart

### Prerequisites

| Requirement | Notes |
|---|---|
| Node.js | v20–v24 LTS |
| Firebase project | Auth (Email + Google) & Firestore enabled |
| AI keys | Gemini key required for Live Voice; NVIDIA/OpenRouter/Groq optional |

### 1️⃣ Clone & install

```bash
git clone https://github.com/Saurabh7Goku/AI-Interview-Prep.git
cd AI-Interview-Prep
npm install
```

### 2️⃣ Configure environment

Create `.env.local` in the project root:

```env
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# AI providers (server)
GEMINI_API_KEY=your_gemini_key            # required for Live Voice + generation
NVIDIA_API_KEY=your_nvidia_key            # optional — eval/scan fallback
OPENROUTER_API_KEY=your_openrouter_key    # optional — generation fallback
GROQ_API_KEY=your_groq_key                # optional — fallback

# Admin / maintenance (optional)
FIREBASE_ADMIN_SERVICE_ACCOUNT={"project_id":"..."}  # required only for /api/cleanUp
CLEANUP_SECRET=your_cleanup_secret
```

> `.env*` is gitignored — never commit keys.

### 3️⃣ Run

```bash
npm run dev      # → http://localhost:3000
npm run build    # production build
npm start        # serve production build
npm run lint     # eslint
```

### 4️⃣ Try the golden path 🥇

1. `/auth` → create account → verify email → sign in
2. `/homeform` → fill role *or* upload resume → **Generate**
3. `/interview` → Live Voice auto-connects 🎙️ → answer all questions → it says goodbye → auto-save
4. `/results` → scores + delivery summary → `/dashboard` → watch your charts move 📈

---

## 🏗️ Architecture

```
AI-Interview-Prep/
├── app/
│   ├── (pages)/          # landing, auth, dashboard, homeform, interview,
│   │                     # results, history, ResumeScanner, atsDashboard,
│   │                     # optimize, resume-builder, jobTracker, subscription
│   └── api/              # 12 server routes (generation, eval, scan, match…)
├── components/           # Sidebar (sole nav), interview room, scanners,
│                         # optimizers, builders, trackers, toasts…
├── hooks/                # useGeminiLive (Live Voice WS + coverage tracking)
│                         # useSpeechRecognition, useGeminiLive helpers
├── lib/                  # gemini / nvidia / openrouter / groq clients,
│                         # questions, keywordAnalysis, resumeTemplates…
├── firebase/             # client init, saveInterview, getInterviewHistory,
│                         # applications CRUD, admin
├── types/  styles/  public/  hooks/
└── .env.local            # you create this (see above)
```

**Data flow (live interview):**

```
Mic 🎤 → Gemini Live WS → transcriptEntries → coverage tracker (Q n/5, ≤2 follow-ups)
  → "This concludes…" → /api/processLiveInterview → per-question eval + delivery summary
  → Firestore → results / history / dashboard update together
```

---

## 📸 Screenshots

> Drop captures in `public/` and link them here:

| Landing | Live interview | Dashboard | ATS scan |
|---|---|---|---|
| `![landing](public/shot-landing.png)` | `![live](public/shot-live.png)` | `![dashboard](public/shot-dashboard.png)` | `![ats](public/shot-ats.png)` |

---

## 🗺️ Roadmap

- [ ] Interview streaks & XP gamification
- [ ] Company-specific question packs
- [ ] Peer-sharable result links
- [ ] Mobile PWA install + offline question packs
- [ ] Recruiter view for shared pipelines

---

## 🤝 Contributing

1. Fork → branch (`feat/my-thing`) → commit → PR.
2. Keep the **single-sidebar** navigation rule and the Tidepool token palette (`styles/globals.css`).
3. Presentation-only changes must not rename handlers, props, routes or Firestore shapes.
4. `npm run lint` + `npx tsc --noEmit` must pass before requesting review.

---

## 📄 License

MIT — see [LICENSE](LICENSE) (add one if missing).

---

<div align="center">

**Built with ❤️ for the next generation of professionals.**

*Anmol • Sahil • Manilal • Dipanshu — our success stories started exactly where you are.* 🚀

</div>
