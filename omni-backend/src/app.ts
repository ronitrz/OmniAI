// src/app.ts
// Express application entry point.
// Mounts all routes, middleware, and starts the server.

import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { errorHandler } from './middleware/error';
import { authenticate } from './middleware/auth';
import { createMessage } from './controllers/message.controller';

// Routes
import authRoutes from './routes/auth.routes';
import providerRoutes from './routes/provider.routes';
import workspaceRoutes from './routes/workspace.routes';
import sessionRoutes from './routes/session.routes';
import { messageRouter } from './routes/message.routes';
import { listByWorkspace, create as createSession } from './controllers/session.controller';

const app = express();

// ── Global Middleware ──────────────────────────────────────────────────────

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ───────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/workspaces', workspaceRoutes);

// Workspace-scoped session routes
app.get('/api/workspaces/:workspaceId/sessions', authenticate, listByWorkspace);
app.post('/api/workspaces/:workspaceId/sessions', authenticate, createSession);

// Session-level routes
app.use('/api/sessions', sessionRoutes);

// Session-scoped message creation
app.post('/api/sessions/:id/messages', authenticate, createMessage);

// Message-level routes (streaming + jury)
app.use('/api/messages', messageRouter);

// ── 404 Handler ────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ───────────────────────────────────────────────────

app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────────

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(env.PORT, () => {
      console.log(`🚀 OmniAI backend running on http://localhost:${env.PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🎭 Mock Mode: ${env.MOCK_MODE ? 'ENABLED' : 'DISABLED'}`);
      console.log('');
      console.log('📡 AI Provider Status:');
      console.log(`   Gemini Flash:  ${env.GEMINI_API_KEY ? '🟢 LIVE' : '🟡 DEMO (no key)'}`);
      console.log(`   DeepSeek:      ${env.DEEPSEEK_API_KEY ? '🟢 LIVE' : '🟡 DEMO (no key)'}`);
      console.log(`   GPT-4o:        ${env.OPENAI_API_KEY ? '🟢 LIVE' : '🟡 DEMO (no key)'}`);
      console.log(`   Claude Haiku:  ${env.ANTHROPIC_API_KEY ? '🟢 LIVE' : '🟡 DEMO (no key)'}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

start();

// Trigger reload
export default app;
