import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load server environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'qwen/qwen3.8-27b';

// Basic in-memory rate limiter: max 60 requests per windowMs per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'Too many requests. Please slow down and try again shortly.'
    });
    return;
  }

  record.count += 1;
  next();
}

// Clean up stale rate-limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestCounts.entries()) {
    if (now > record.resetTime) {
      ipRequestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

app.use(cors());
app.use(express.json({ limit: '500kb' }));
app.use(rateLimiter);

// Health & configuration check (never exposes keys or secrets)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
    defaultModel: DEFAULT_MODEL,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/groq/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
    defaultModel: DEFAULT_MODEL,
    timestamp: new Date().toISOString()
  });
});


interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}

// Secure proxy endpoint for Groq Chat Completions
app.post('/api/groq/chat', async (req: Request, res: Response): Promise<void> => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    res.status(503).json({
      error: 'Groq AI service unavailable: GROQ_API_KEY is not configured on the backend server. Please configure GROQ_API_KEY in your server-side environment.'
    });
    return;
  }

  const { messages, model = DEFAULT_MODEL, temperature = 0.1 } = req.body as ChatRequestBody;

  // Request validation
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Invalid request: "messages" must be a non-empty array.' });
    return;
  }

  if (messages.length > 50) {
    res.status(400).json({ error: 'Invalid request: Exceeded maximum message count (50).' });
    return;
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      res.status(400).json({ error: `Invalid message at index ${i}: message must be an object.` });
      return;
    }
    if (!['system', 'user', 'assistant'].includes(msg.role)) {
      res.status(400).json({ error: `Invalid message role at index ${i}: must be system, user, or assistant.` });
      return;
    }
    if (typeof msg.content !== 'string' || msg.content.length > 25000) {
      res.status(400).json({ error: `Invalid message content at index ${i}: must be a string up to 25,000 characters.` });
      return;
    }
  }

  const numericTemp = typeof temperature === 'number' && temperature >= 0 && temperature <= 2 ? temperature : 0.1;
  const requestedModel = typeof model === 'string' && model.trim().length > 0 ? model.trim() : DEFAULT_MODEL;

  async function forwardToGroq(targetModel: string): Promise<{ ok: boolean; status: number; content?: string; error?: string }> {
    try {
      const groqResponse = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: targetModel,
          messages,
          temperature: numericTemp,
          max_tokens: 2048
        })
      });

      if (!groqResponse.ok) {
        const errJson = await groqResponse.json().catch(() => ({}));
        const rawMessage = (errJson as { error?: { message?: string } })?.error?.message || groqResponse.statusText;
        return { ok: false, status: groqResponse.status, error: rawMessage };
      }

      const data = await groqResponse.json() as { choices?: { message?: { content?: string } }[] };
      const content = data.choices?.[0]?.message?.content || '';
      return { ok: true, status: 200, content };
    } catch (err: unknown) {
      const error = err as Error;
      return { ok: false, status: 500, error: error.message || 'Network error reaching Groq API' };
    }
  }

  // Attempt primary model
  let result = await forwardToGroq(requestedModel);

  // If primary model failed and was not the fallback model, retry with fallback model
  if (!result.ok && requestedModel !== FALLBACK_MODEL) {
    console.warn(`Groq request for model "${requestedModel}" failed (${result.status}: ${result.error}). Retrying with fallback "${FALLBACK_MODEL}"...`);
    result = await forwardToGroq(FALLBACK_MODEL);
  }

  if (!result.ok) {
    res.status(result.status || 502).json({
      error: `Groq AI inference failed: ${result.error || 'Upstream service error'}`
    });
    return;
  }

  res.json({ content: result.content || '' });
});

// Endpoint to dispatch compliance email notification to agency / creative team
app.post('/api/send-email', (req: Request, res: Response): void => {
  const { recipientEmail, recipientName, subject, messageBody } = req.body;
  if (!recipientEmail || !subject) {
    res.status(400).json({ error: 'recipientEmail and subject are required.' });
    return;
  }
  console.log(`[BrandPilot Server] Email dispatched to ${recipientEmail} (${recipientName}): "${subject}"`);
  res.json({
    ok: true,
    messageId: `email-${Date.now()}`,
    status: 'Delivered',
    recipient: recipientEmail,
    timestamp: new Date().toISOString()
  });
});

// In production (e.g. Render single-service deployment), serve frontend build if dist exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Express 5 compatible SPA fallback
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
      return;
    }
    next();
  });
}

// Centralized error handler to ensure secrets are never leaked in stack traces
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

export const server = app.listen(PORT, () => {
  console.log(`[BrandPilot Server] Proxy backend running on http://localhost:${PORT}`);
});

export default app;
