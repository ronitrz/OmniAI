# OmniAI — Multi-Model AI Consensus Platform

> Query multiple frontier AI models simultaneously, stream their responses side-by-side, and synthesize a consensus verdict — all in one premium interface.

---

## ✨ Overview

**OmniAI** is a full-stack web application that dispatches a single prompt to **Gemini Flash**, **GPT-4o**, **Claude Haiku**, and **DeepSeek R1** concurrently. Responses stream in real-time via **Server-Sent Events (SSE)** into a responsive side-by-side grid. Once all models finish, a three-stage **Jury Consensus Engine** extracts agreements, highlights contradictions, surfaces unique insights, and generates an authoritative synthesized verdict with a visual confidence gauge.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **JWT Authentication** | Secure registration, login, and session management with `bcryptjs` password hashing |
| **Workspaces & Sessions** | Organize conversations into named workspaces with full cascading data management |
| **Multi-AI Streaming Grid** | Parallel SSE streams from up to 4 providers rendered simultaneously in real-time |
| **Standard & Research Modes** | Switch between conversational cards and structured, document-style tabbed research reports |
| **Jury Consensus Engine** | 3-stage pipeline (extraction → scoring → synthesis) producing agreements, contradictions, unique insights, and an actionable recommendation |
| **Confidence Gauge** | Animated circular SVG dial displaying consensus level: High / Medium / Low |
| **Draggable Floating Panels** | Pop any response card into a draggable overlay panel without losing its live stream |
| **Premium Profile Center** | Avatar upload with canvas crop, real-time password strength meter, and profession selector |
| **User-Supplied API Keys** | Users can bring their own provider keys; keys are integrated into the Jury Engine pipeline |
| **Demo Mode** | Transparent, high-fidelity mock streaming fallback when keys are unconfigured — zero setup required to explore the app |

---

## 🗺️ Architecture

```mermaid
graph TD
    A[Angular Frontend] -->|Submit Prompt| B[Express Backend]
    B -->|Save Metadata| C[(PostgreSQL · Prisma)]
    B -->|Orchestrate| D[AI Orchestrator]
    D -->|Concurrent Requests| E[Gemini · GPT-4o · Claude · DeepSeek]
    E -->|Token Streams| D
    D -->|SSE Chunks| A
    A -->|Render| F[Grid Cards / Floating Panels]
    A -->|Request Synthesis| B
    B -->|Run Pipeline| G[Jury Engine]
    G --> G1[Extractor]
    G --> G2[Scorer]
    G --> G3[Synthesizer]
    G3 -->|Verdict + Score| B
    B -->|Save & Return| A
```

---

## 🛠️ Tech Stack

### Backend — `omni-backend`
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| ORM / DB | Prisma Client + PostgreSQL (Neon serverless) |
| Auth | JWT + bcryptjs |
| Validation | Zod |
| AI SDKs | `@google/generative-ai`, `openai`, `@anthropic-ai/sdk` |
| Dev Tools | `nodemon`, `ts-node` |

### Frontend — `omni-frontend`
| Layer | Technology |
|---|---|
| Framework | Angular 19 (Standalone Components) |
| State | Angular Signals API |
| Streaming | Custom SSE service with per-model routing |
| Styling | Vanilla CSS · CSS Variables · Glassmorphism theme |
| Markdown | `marked` + `dompurify` (XSS-safe rendering) |

---

## 🗄️ Database Schema

Managed via Prisma. Key models:

- **`User`** — auth credentials, roles, avatar
- **`Workspace`** — top-level project containers (e.g. "Placement Prep")
- **`Session`** — individual chat threads within a workspace
- **`Message`** — user prompts tied to their session
- **`ModelResponse`** — streamed output per model, with latency metrics and mock-fallback flag
- **`JuryVerdict`** — synthesized consensus, recommendations, agreements/contradictions (JSON), and confidence score
- **`OtpVerification`** — codes for SMS/email verification flows

---

## ⚖️ The Jury Consensus Engine

Once all models complete streaming, their outputs are fed through a three-stage pipeline:

1. **Extractor** — Identifies shared assertions (**Agreements**), opposing claims (**Contradictions**), and model-exclusive findings (**Unique Insights**)
2. **Scorer** — Computes a consensus score from `0.0` (full disagreement) to `1.0` (complete alignment) and assigns a qualitative label
3. **Synthesizer** — Compiles a markdown summary and generates an **Actionable Recommendation**

---

## 🎨 Frontend Highlights

- **`chat.component.ts`** — Primary page managing multi-stream layout, floating overlay dock, drag offsets, panel maximize/minimize, and chat state
- **`model-selector.component.ts`** — Interactive 4-up model grid with official SVG brand logos, strength pills, live/demo badges, and toggle selection (min 1, max 4)
- **`chat-input.component.ts`** — Auto-resizing textarea with Standard/Research mode toggle and inline model selector panel
- **`jury-verdict.component.ts`** — Binds and renders the animated SVG confidence gauge and structured verdict
- **`research-report.component.ts`** — Tabbed document layout using deep analytical system prompts (600–900 words)
- **`response-card.component.ts`** — Per-model streaming panel with pop-out, minimize, and maximize controls
- **`dashboard.component.ts`** — Full profile center with canvas avatar cropper, password complexity meter, and profession selector

---

## ⚙️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (local or [Neon](https://neon.tech) serverless)

### 1. Clone & configure

```bash
git clone https://github.com/ronitrz/OmniAI.git
cd OmniAI
```

Copy and populate the backend environment file:

```bash
cp omni-backend/.env.example omni-backend/.env
```

Edit `omni-backend/.env` with your values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/omni_ai"
JWT_SECRET="your-jwt-secret"
GEMINI_API_KEY="..."
OPENAI_API_KEY="..."
ANTHROPIC_API_KEY="..."
DEEPSEEK_API_KEY="..."
```

> **Note:** All API keys are optional. Any unconfigured provider automatically falls back to the built-in Demo Mode.

### 2. Set up the database

```bash
cd omni-backend
npm install
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
```

### 3. Run the backend

```bash
npm run dev
```
Server starts at `http://localhost:3000`

### 4. Run the frontend

```bash
cd ../omni-frontend
npm install
npm start
```
App launches at `http://localhost:4200`

---

## 📁 Project Structure

```
OmniAI/
├── omni-backend/
│   ├── prisma/                  # Prisma schema & migrations
│   └── src/
│       ├── controllers/         # Auth, workspace, session, message handlers
│       ├── routes/              # Express route definitions
│       ├── services/
│       │   ├── ai/              # Orchestrator, SSE manager, provider implementations
│       │   └── jury/            # Extractor, scorer, synthesizer
│       └── app.ts
└── omni-frontend/
    └── src/app/
        ├── core/services/       # API service, SSE service, workspace state
        └── features/
            ├── auth/            # Login & register pages
            ├── chat/            # Chat grid, input, model selector, jury verdict, research report
            └── dashboard/       # Profile, settings panel
```

---

## 🐛 Notable Technical Challenges Solved

| Challenge | Resolution |
|---|---|
| **DeepSeek R1 rejects `system` role** | Strip system prompt; inject as structured prefix in the first `user` message |
| **DeepSeek token budget exhaustion** | Extended max tokens to `8000`; disabled unsupported params (`temperature`, `response_format`) |
| **Jury synthesizer Pi false-positive** | Fixed mock keyword detector — replaced substring match with exact word-boundary matching |
| **Prisma EPERM lock on Windows** | Shut down `nodemon` before running `prisma generate` to release DLL file lock |
| **Intrusive modal alerts on save** | Replaced `alert()` with Angular Signals-driven inline success labels that auto-fade after 3s |

---

## 📄 License

This project was developed as part of an internship program. All rights reserved.
