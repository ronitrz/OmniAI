# OmniAI: Multi-Model AI Consensus Platform
## Comprehensive Project Progress, Architecture, and Technical Report

---

## 1. Executive Summary
OmniAI is an advanced multi-model artificial intelligence aggregation and consensus platform. It allows users to execute complex queries across multiple frontier AI models (OpenAI, Anthropic, Gemini, DeepSeek) simultaneously in a single interface. By running model responses through a specialized **Jury Engine**, the platform extracts structural agreements, identifies contradictions, surfaces unique individual perspectives, and compiles an authoritative synthesized consensus answer in real-time.

---

## 2. Technical Architecture & Tech Stack

### 2.1 Backend Architecture
* **Core:** Node.js + Express structured with TypeScript.
* **Database Management:** PostgreSQL hosted on Neon (Serverless Database Infrastructure).
* **ORM:** Prisma Client for schema definition, migrations, and type-safe database queries.
* **Streaming Protocol:** Server-Sent Events (SSE) to push token streams from individual AI providers concurrently to the client without the overhead of WebSockets.

### 2.2 Frontend Architecture
* **Core:** Angular 19+ utilizing standalone component routing.
* **State Management:** Angular Signals API, providing fine-grained reactivity, reducing change detection cycles, and improving performance.
* **Styling System:** Vanilla CSS designed with CSS Custom Properties (Variables) for light/dark themes, utilizing modern layout patterns (CSS Grid, Flexbox) and premium glassmorphic overlays.

---

## 3. Core Features & Unique Innovations

### 3.1 Concurrent Multi-Model Stream Execution
Users select which models to query (e.g., Gemini, GPT-4o, DeepSeek, Claude). The backend triggers concurrent API requests to each provider. Using Server-Sent Events (SSE), the client streams and renders the outputs in real-time within separate UI cards.

### 3.2 Draggable & Floating Response Panels (Overlay Dock)
To support advanced side-by-side analysis, any individual response card can be popped out into a floating panel.
* **Dragging Mechanism:** Custom Angular mouse event handlers calculate client delta offsets, positioning panels absolutely on a spatial overlay layer.
* **Active Stream Binding:** Floating cards retain their active data subscriptions, rendering incoming token streams even while being dragged or repositioned.
* **Controls:** Panels can be dragged, minimized into a dock, or maximized back into the grid.

### 3.3 The Jury Consensus Engine
Once all models finish generating, their responses are processed by a multi-stage **Jury Engine**:
* **The Extractor:** A fast reasoning pass identifies:
  - **Agreements:** Verifiable facts and assertions shared by two or more models.
  - **Contradictions:** Discrepancies where models express opposing statements on the same topic.
  - **Unique Insights:** Domain-specific facts or context raised by exactly one model that others missed.
* **The Synthesizer:** Compiles a unified markdown consensus response and generates an **Actionable Recommendation**.
* **Confidence Gauge:** Computes a consensus score (0.0 to 1.0) and assigns a visual status badge (High, Medium, or Low Consensus).

### 3.4 Premium Profile & Settings Center
A tabbed settings modal (Profile, History, Projects, General) structured with:
* **Account Info:** Read-only cards for verified email, phone, and metadata.
* **Role Selection:** A profession selector supporting roles (Student, Developer, Businessman, Researcher, Writer, Designer, Educator, Hobbyist, Other) which dynamically updates the user's role badge in the UI.
* **Interactive Password Strength Meter:** Evaluates password complexity in real-time on the client side, showing Weak (Red), Medium (Yellow), and Strong (Green) indicators.
* **Avatar Upload & Resizer:** Accepts custom profile picture uploads, crops them to a square, and compresses them on a canvas element to optimize backend storage constraints.

---

## 4. Problems Faced, Technical Challenges & Bugs Resolved

During development, several complex integration challenges, compatibility blocks, and logic bugs were discovered and resolved:

### 4.1 DeepSeek R1 System Message Incompatibility
* **Problem:** Upgrading DeepSeek to their reasoning model (`deepseek-reasoner` / R1) resulted in immediate API crash errors (Status Code 400).
* **Root Cause:** Unlike other models, DeepSeek's R1 reasoning API does not support the `system` role inside the messages payload. Including a `system` instruction array causes the model gateway to reject the call.
* **Resolution:** Re-architected the payload builder for DeepSeek. System instructions are now stripped from the `system` block and appended as a structured prefix in the first `user` message block, keeping instructions intact while avoiding API errors.

### 4.2 DeepSeek R1 Chain-of-Thought Token Budgeting
* **Problem:** DeepSeek R1 returns both a reasoning path (Chain-of-Thought) and a final content block. When generating complex math/reasoning answers, the token limit was frequently hit, causing cut-off answers.
* **Resolution:** Extended the maximum token parameter in the DeepSeek payload to `8000` tokens and disabled unsupported parameters (e.g. `response_format` and `temperature` adjustments which are locked on the DeepSeek reasoning API).

### 4.3 Jury Synthesizer Fallback Trigger (Pi False Positive)
* **Problem:** Factual math consensus queries (e.g. "What is 1972 * 216") returned the value of Pi (π) in the consensus box instead of the actual calculation, despite individual models calculating it correctly.
* **Root Cause:** 
  1. The Mock Provider checks the prompt for `"Jury Verdict"` to verify if it is a synthesis request. However, the system's actual synthesis prompt template uses `"consensus synthesizer"`. Because it didn't match, it fell back to generating a normal mock chat response.
  2. The mock provider's keyword matcher checked for the letters `"pi"` and `"value"` using a simple substring check (`clean.includes('pi')`). Since the synthesis prompt instructions contains words like `"opinion"`, `"participants"`, `"simple"` (which all contain the letters `"pi"`), and `"value"`, it incorrectly matched the value of Pi (π) response.
* **Resolution:** 
  1. Updated the mock provider's check to detect either `"Jury Verdict"` or `"consensus synthesizer"`.
  2. Replaced loose substring matching with exact word boundary matching (`words.includes(kw)`) to prevent substring letters in words like "opinion" from triggering false positive matches.

### 4.4 Prisma Query Engine Lock EPERM Error
* **Problem:** During backend schema pushes (`npx prisma db push`), the build crashed with `EPERM: operation not permitted` on `query_engine-windows.dll.node`.
* **Root Cause:** The nodemon development process was active and holding a read/write file lock on the query engine node DLL, preventing Prisma from regenerating the client.
* **Resolution:** Created a deployment workflow where the backend server is temporarily shut down to free file locks, running `npx prisma db push` and `npx prisma generate` cleanly, and then restarting the server.

### 4.5 User Interruption via Modal Alert Dialogs
* **Problem:** When saving profile information or updating passwords, the app threw intrusive modal popup alerts that forced the user to stop and click "OK".
* **Resolution:** Replaced the modal alerts with reactive Angular Signals (`profileSaved` and `passwordUpdated`). Saving now triggers a premium inline success label next to the save buttons (`✓ Saved successfully!`) that automatically fades out after 3 seconds, preserving user focus.
