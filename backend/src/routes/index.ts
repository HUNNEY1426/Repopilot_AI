import { Router } from 'express';
import { repositoryController } from '../controllers/repositoryController.js';
import { analysisController } from '../controllers/analysisController.js';
import { issueController } from '../controllers/issueController.js';
import { pullRequestController } from '../controllers/pullRequestController.js';
import { settingsController } from '../controllers/settingsController.js';

export const apiRouter = Router();

// Demo repositories
apiRouter.get('/demo-repos', repositoryController.getDemoRepos);

// Repositories
apiRouter.get('/repositories', repositoryController.listRepositories);
apiRouter.post('/repositories/connect', repositoryController.connectRepository);
apiRouter.get('/repositories/:id', repositoryController.getRepository);
apiRouter.delete('/repositories/:id', repositoryController.deleteRepository);
apiRouter.get('/repositories/:id/history', analysisController.getRepoHistory);
apiRouter.get('/repositories/:id/pull-requests', pullRequestController.listPullRequests);

// Analysis
apiRouter.post('/repositories/:id/analyze', analysisController.triggerAnalysis);
apiRouter.get('/analyses/:id', analysisController.getAnalysis);
apiRouter.get('/analyses/:id/issues', analysisController.getAnalysisIssues);
apiRouter.get('/analyses/:id/metrics', analysisController.getAnalysisMetrics);
apiRouter.post('/analyses/:id/pull-request', pullRequestController.createPullRequest);

// Issues & Diff remediation
apiRouter.get('/issues/:id', issueController.getIssue);
apiRouter.post('/issues/:id/fix', issueController.generateFix);
apiRouter.post('/issues/:id/regenerate', issueController.generateFix);
apiRouter.post('/issues/:id/approve', issueController.approveFix);
apiRouter.post('/issues/:id/reject', issueController.rejectFix);

// Settings
apiRouter.get('/settings', settingsController.getSettings);
apiRouter.post('/settings', settingsController.updateSettings);
