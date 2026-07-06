# OmniAI — Multi-Model AI Consensus Platform
## Developer & System Architecture Overview

OmniAI is a premium, web application designed to query multiple AI models (Gemini, DeepSeek, GPT-4o, Claude) concurrently, stream their answers side-by-side using Server-Sent Events (SSE), and process their outputs through a specialized multi-stage **Jury Engine** that synthesizes a final consensus verdict and action recommendation.

This document outlines the architecture, backend components, frontend design, database schema, and third-party dependencies used in the project.

---

## 🗺️ System Architecture

The following diagram illustrates the information flow from user query submission to side-by-side SSE streaming and subsequent Jury consensus analysis:

```mermaid
graph TD
    A[Client: Angular Frontend] -->|1. Submit Prompt| B[Backend: Express Router]
    B -->|2. Save Message & Responses Metadata| C[(PostgreSQL Database)]
    B -->|3. Query Providers Concurrently| D[AI Orchestrator]
    D -->|4. Request SSE Chunk Streams| E[AI Providers: Gemini, DeepSeek, OpenAI, Anthropic]
    E -->|5. Token Stream| D
    D -->|6. Server-Sent Events| A
    A -->|7. Streams render in Grid Cards| F[Grid View / Floating Overlay Dock]
    
    A -->|8. Request Synthesis| B
    B -->|9. Trigger Synthesis Pipeline| G[Jury Consensus Engine]
    G -->|10. Stage 1: Extraction| G1[Extractor]
    G -->|11. Stage 2: Scoring| G2[Scorer]
    G -->|12. Stage 3: Synthesis| G3[Synthesizer]
    G3 -->|13. Return Verdict & confidence score| B
    B -->|14. Save Verdict| C
    B -->|15. Return Synthesized Report| A
```

---

## 🛠️ Technology Stack & Dependencies

The system is separated into a Node.js TypeScript backend and an Angular Standalone frontend.

### 1. Backend (`omni-backend`)
Defined in [omni-backend/package.json](file:///d:/Projects/OmniAI/omni-backend/package.json):
* **Core Runtime**: Node.js & TypeScript
* **Web Framework**: Express
* **Database ORM**: Prisma Client (with PostgreSQL hosted on Neon serverless database infrastructure)
* **Request Validation**: Zod
* **Security & Tokens**: JSON Web Tokens (JWT) for session authentication, `bcryptjs` for secure password hashing
* **AI Provider Integrations**:
  * `@google/generative-ai` (Gemini API)
  * `openai` (GPT models and DeepSeek client proxy)
  * `@anthropic-ai/sdk` (Claude models)
* **Dev Tools**: `nodemon` & `ts-node` for live reload, `typescript` compiler

### 2. Frontend (`omni-frontend`)
Defined in [omni-frontend/package.json](file:///d:/Projects/OmniAI/omni-frontend/package.json):
* **Web Framework**: Angular 18/19 (utilizing Standalone components)
* **State Management**: Angular Signals API (for highly granular reactive state tracking)
* **Streaming Handler**: Reactive SSE stream processing
* **Security**: Client-side JWT interceptors
* **Markdown Renderer**: `marked` (for structured model responses and synthesis report parsing)
* **Sanitization**: `dompurify` (to prevent XSS vulnerability vectors in generated markdown)
* **Styling System**: Vanilla CSS utilising CSS Variables for responsive layout styling, interactive glassmorphic theme overlays, and dynamic UI panels

---

## 🗄️ Database Architecture

Database operations are managed via Prisma Client. The schema is configured at [schema.prisma](file:///d:/Projects/OmniAI/omni-backend/prisma/schema.prisma) and maps to PostgreSQL:

* **`User`**: Manages authenticated user details, password hashes, and profile settings (roles, avatar uploads).
* **`Workspace`**: Represents high-level categories/projects created by users (e.g. "Placement Prep") for task organization.
* **`Session`**: Contains specific chat conversations within a workspace.
* **`Message`**: Stores user inputs and maps them to their respective multi-AI answers.
* **`ModelResponse`**: Captures concrete streamed responses, recording model source, contents, status, latency metrics, and whether a transparent mock fallback was used.
* **`JuryVerdict`**: Houses synthesized consensus summaries, actionable recommendations, agreements/contradictions arrays (JSON format), and confidence scores/badges.
* **`OtpVerification`**: Handles verification codes during mobile-phone registration/auth steps.

---

## 📡 Backend Architecture & Orchestration

The entry point of the server is [app.ts](file:///d:/Projects/OmniAI/omni-backend/src/app.ts). Routes are divided into modular domain routes:

### 1. Controllers & Endpoints
* **Authentication**: [auth.controller.ts](file:///d:/Projects/OmniAI/omni-backend/src/controllers/auth.controller.ts) maps to routes under `/api/auth` (Register, Login, SMS/OTP codes, Profiles).
* **Workspaces**: [workspace.controller.ts](file:///d:/Projects/OmniAI/omni-backend/src/controllers/workspace.controller.ts) manages workspace life-cycles, including cascading record deletion.
* **Sessions**: [session.controller.ts](file:///d:/Projects/OmniAI/omni-backend/src/controllers/session.controller.ts) handles chat logs per workspace.
* **Streaming**: [message.controller.ts](file:///d:/Projects/OmniAI/omni-backend/src/controllers/message.controller.ts) sets up the request pipeline and launches parallel streams.

### 2. Multi-Model AI Router
* **Registry**: [provider-registry.ts](file:///d:/Projects/OmniAI/omni-backend/src/services/ai/provider-registry.ts) registers active models (Gemini Flash, DeepSeek R1, GPT-4o, Claude Haiku).
* **Orchestration**: [orchestrator.ts](file:///d:/Projects/OmniAI/omni-backend/src/services/ai/orchestrator.ts) schedules queries to multiple models concurrently and feeds data buffers into SSE channels via [sse-manager.ts](file:///d:/Projects/OmniAI/omni-backend/src/services/ai/sse-manager.ts).
* **Provider Implementations**:
  * [gemini.provider.ts](file:///d:/Projects/OmniAI/omni-backend/src/services/ai/providers/gemini.provider.ts)
  * [openai.provider.ts](file:///d:/Projects/OmniAI/omni-backend/src/services/ai/providers/openai.provider.ts)
  * [deepseek.provider.ts](file:///d:/Projects/OmniAI/omni-backend/src/services/ai/providers/deepseek.provider.ts) (strips out `system` roles from reasoning API formats and routes system prompts inside user content arrays).
  * [anthropic.provider.ts](file:///d:/Projects/OmniAI/omni-backend/src/services/ai/providers/anthropic.provider.ts)
  * [mock.provider.ts](file:///d:/Projects/OmniAI/omni-backend/src/services/ai/providers/mock.provider.ts) (transparent mock simulation containing high-fidelity streaming responses if API keys are unconfigured).

---

## ⚖️ The Jury Consensus Engine

Once the prompt outputs return from the active models, the backend feeds the combined text blocks to the Jury Consensus Engine, which uses a 3-stage modular pipeline to summarize the findings:

1. **Extraction**: [extractor.ts](file:///d:/Projects/OmniAI/omni-backend/src/services/jury/extractor.ts) separates overlapping assertions. It extracts **Agreements** (points where models share views), **Contradictions** (opposing views), and **Unique Insights** (points mentioned by only one model).
2. **Scoring**: [scorer.ts](file:///d:/Projects/OmniAI/omni-backend/src/services/jury/scorer.ts) evaluates consensus agreement levels on a scale of `0.0` (high disagreement) to `1.0` (complete alignment) and assigns qualitative labels (High Consensus, Medium Consensus, Low Consensus).
3. **Synthesis**: [synthesizer.ts](file:///d:/Projects/OmniAI/omni-backend/src/services/jury/synthesizer.ts) compiles a markdown overview report containing a consensus summary and actionable, final suggestions.

---

## 🎨 Angular Frontend Core Design

The UI is built using Standalone routing and is driven by modern UX styling elements:

### 1. State & Communication Services
* [api.service.ts](file:///d:/Projects/OmniAI/omni-frontend/src/app/core/services/api.service.ts): Handles standard REST calls (Workspace creation, profile changes, history queries) and automatically forwards JWT credentials.
* [sse.service.ts](file:///d:/Projects/OmniAI/omni-frontend/src/app/core/services/sse.service.ts): Manages active event stream listeners, routing individual model text chunks into appropriate UI panels.
* [workspace-state.service.ts](file:///d:/Projects/OmniAI/omni-frontend/src/app/core/services/workspace-state.service.ts): Keeps track of selected workspaces, active sessions, and layouts.

### 2. Main Page Controllers
* [chat.component.ts](file:///d:/Projects/OmniAI/omni-frontend/src/app/features/chat/chat.component.ts): The primary interaction page containing stream layout templates. It manages side-by-side columns, floating overlay docks, spatial dragging offsets, panel maximization, and standard chat input state.
* [dashboard.component.ts](file:///d:/Projects/OmniAI/omni-frontend/src/app/features/dashboard/dashboard.component.ts): Integrates user configurations. Hosts profile settings, custom crop canvas operations for avatar pictures, real-time password complexity scores, and profession choices.

### 3. Modular Feature Components
* [jury-verdict.component.ts](file:///d:/Projects/OmniAI/omni-frontend/src/app/features/chat/jury-verdict/jury-verdict.component.ts): Binds consensus reports and renders the animated SVG consensus confidence gauge.
* [research-report.component.ts](file:///d:/Projects/OmniAI/omni-frontend/src/app/features/chat/research-report/research-report.component.ts): Hosts structured document-style research layouts (tabbed view) using dedicated reasoning instructions.
* [response-card.component.ts](file:///d:/Projects/OmniAI/omni-frontend/src/app/features/chat/response-card/response-card.component.ts): Controls individual response panels, minimizing them to active docks, popping them out to draggable panels, and hosting active subscription rendering.

---

## 🚀 Running the Project Locally

### 1. Prerequisite Database Generation
Ensure PostgreSQL database servers are up, and write connection paths inside the backend environment variables:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/omni_ai"
```
Execute compiler setup commands:
```bash
cd omni-backend
npm run db:generate
npm run db:push
```

### 2. Backend Boot Configuration
Install packages and start the Node runtime server:
```bash
npm install
npm run dev
```

### 3. Frontend Build Execution
Open a separate terminal shell, compile Angular routes, and start the local development server:
```bash
cd omni-frontend
npm install
npm start
```
The application will launch on port `http://localhost:4200` with the API running on `http://localhost:3000`.
