import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/index.js';
import { repoDb } from './db/database.js';
import { DEMO_REPOSITORIES } from './services/demoRepositories.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/health')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Root endpoint: Status dashboard & frontend redirect
app.get('/', (req: Request, res: Response) => {
  if (req.accepts('html')) {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RepoPilot AI — Backend API Status</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
      padding: 36px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
      margin-bottom: 20px;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.9); }
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 28px;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #0284c7, #4f46e5);
      color: white;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 20px;
      border-radius: 10px;
      transition: opacity 0.2s, transform 0.2s;
    }
    .btn-primary:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #1e293b;
      color: #e2e8f0;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 18px;
      border-radius: 10px;
      border: 1px solid #334155;
      transition: background 0.2s;
    }
    .btn-secondary:hover {
      background: #334155;
    }
    .endpoints {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 16px 20px;
    }
    .endpoints-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .endpoint-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      padding: 6px 0;
      border-bottom: 1px solid #0f172a;
    }
    .endpoint-item:last-child {
      border-bottom: none;
    }
    .endpoint-item a {
      color: #38bdf8;
      text-decoration: none;
    }
    .endpoint-item a:hover {
      text-decoration: underline;
    }
    .method {
      background: #0369a1;
      color: #e0f2fe;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="dot"></span>
      Backend Server Active & Healthy
    </div>
    <h1>RepoPilot AI API Engine</h1>
    <p>
      Aapka Express backend <strong>port 5000</strong> par sahi tarah se chal raha hai!
      Ye backend ek REST API service hai. User interface dekhne ke liye frontend open karein:
    </p>

    <div class="actions">
      <a href="/" class="btn-primary">
        🚀 Open Frontend App
      </a>
      <a href="/health" class="btn-secondary">
        🩺 Health Check API
      </a>
    </div>

    <div class="endpoints">
      <div class="endpoints-title">Available REST API Endpoints</div>
      <div class="endpoint-item">
        <span class="method">GET</span>
        <a href="/api/health">/api/health</a>
      </div>
      <div class="endpoint-item">
        <span class="method">GET</span>
        <a href="/api/demo-repos">/api/demo-repos</a>
      </div>
      <div class="endpoint-item">
        <span class="method">GET</span>
        <a href="/api/repositories">/api/repositories</a>
      </div>
      <div class="endpoint-item">
        <span class="method">GET</span>
        <a href="/api/settings">/api/settings</a>
      </div>
    </div>
  </div>
</body>
</html>`);
    return;
  }

  res.json({
    status: 'ok',
    service: 'RepoPilot AI Backend',
    message: 'Backend API is running.',
    version: '1.0.0',
    endpoints: [
      '/health',
      '/api/health',
      '/api/demo-repos',
      '/api/repositories',
      '/api/settings',
    ],
  });
});

// Health endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'RepoPilot AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'RepoPilot AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Pre-seed demo repositories if database is fresh
function seedInitialData() {
  const existing = repoDb.listRepositories();
  if (existing.length === 0) {
    console.log('Seeding initial demo repositories...');
    for (const demo of DEMO_REPOSITORIES) {
      repoDb.createRepository({
        id: demo.id,
        github_id: `gh-${demo.id}`,
        owner: demo.owner,
        name: demo.name,
        url: demo.url,
        default_branch: demo.defaultBranch,
        language: demo.language,
        description: demo.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }
}

seedInitialData();

// Only start listening when not running on Vercel (serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 RepoPilot Backend running on http://localhost:${PORT}`);
    console.log(`📡 Ready to scan repositories and orchestrate AI reviews`);
  });
}

// Export for Vercel serverless adapter
export default app;
