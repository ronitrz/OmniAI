# OmniAI — Multi-AI Consensus Platform

OmniAI is a premium, placement-ready web application that queries multiple AI models (Gemini, DeepSeek, GPT-4o, Claude) concurrently, streams their answers side-by-side using Server-Sent Events (SSE), and then acts as a "Jury" to synthesize a final consensus verdict and recommendation.

It includes a dedicated **Research Mode** that shifts from conversational cards to a structured, professional document-style report analysis.

---

## 🚀 Key Features

1. **JWT Authentication**: Secure registration, login, and profile loading.
2. **Workspaces & Sessions**: Group conversations into workspaces (e.g., "Placement Prep") with cascading data deletes.
3. **Multi-AI Streaming Grid**: Queries multiple providers simultaneously and streams content in real-time via custom chunk processing.
4. **Jury Verdict & Consensus Engine**: A three-stage pipeline (extraction, arithmetic scoring, and synthesis) that:
   - Evaluates agreements between models.
   - Highlights contradictions (diverging model positions).
   - Extracts unique insights specific to individual models.
   - Generates an authoritative consensus summary and recommendation.
   - Animates a circular SVG confidence gauge (High/Medium/Low agreement).
5. **Research Mode**: Switches the interface to a single-column, tabbed document view using structured analytical system prompts (600–900 word depth).
6. **Demo Mode (Transparent Mock Fallback)**: Automatically falls back to high-fidelity local streaming simulations if API keys or accounts are unconfigured.

---

## 🛠️ Tech Stack

### Backend (`omni-backend`)
- **Runtime**: Node.js & TypeScript
- **Framework**: Express
- **Database ORM**: Prisma client with PostgreSQL
- **Validation**: Zod
- **SDK integrations**: `@google/generative-ai` & `openai` SDK

### Frontend (`omni-frontend`)
- **Framework**: Angular 18 (Standalone Components)
- **State Management**: Angular Signals
- **Styling**: Vanilla CSS featuring a responsive, custom dark-mode theme
- **Markdown Parsing**: `marked`

---

## ⚙️ Quick Start

### 1. Database Setup
Ensure PostgreSQL is running, then populate `omni-backend/.env` with your connection string:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/omni_ai"
```
Generate Prisma client and run migrations:
```bash
cd omni-backend
npm run db:generate
npm run db:migrate
```

### 2. Run Backend
Install dependencies and run the server:
```bash
cd omni-backend
npm install
npm run dev
```
The backend server runs at `http://localhost:3000`.

### 3. Run Frontend
Install dependencies and run the Angular application:
```bash
cd omni-frontend
npm install
npm start
```
The frontend application runs at `http://localhost:4200`.
