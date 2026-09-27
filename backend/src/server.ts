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

app.listen(PORT, () => {
  console.log(`🚀 RepoPilot Backend running on http://localhost:${PORT}`);
  console.log(`📡 Ready to scan repositories and orchestrate AI reviews`);
});
