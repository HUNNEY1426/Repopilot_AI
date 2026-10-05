import type { Request, Response } from 'express';
import { githubService, parseGitHubUrl } from '../services/githubService.js';
import { DEMO_REPOSITORIES } from '../services/demoRepositories.js';
import { repoDb } from '../db/database.js';
import type { Repository } from '../types/index.js';

export const repositoryController = {
  getDemoRepos(req: Request, res: Response) {
    const list = DEMO_REPOSITORIES.map((d) => ({
      id: d.id,
      name: d.name,
      owner: d.owner,
      url: d.url,
      language: d.language,
      description: d.description,
      filesCount: d.files.length,
    }));
    res.json(list);
  },

  listRepositories(req: Request, res: Response) {
    const repos = repoDb.listRepositories();
    res.json(repos);
  },

  getRepository(req: Request, res: Response) {
    const id = req.params.id as string;
    const repo = repoDb.getRepository(id);
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    const latestAnalysis = repoDb.getLatestAnalysisForRepo(id);
    res.json({ ...repo, latestAnalysis });
  },

  async connectRepository(req: Request, res: Response) {
    const { url, demoId } = req.body;

    try {
      let targetOwner = '';
      let targetRepo = '';

      if (demoId) {
        const demo = DEMO_REPOSITORIES.find((d) => d.id === demoId);
        if (!demo) {
          return res.status(404).json({ error: 'Demo repository not found' });
        }
        targetOwner = demo.owner;
        targetRepo = demo.name;
      } else if (url) {
        const parsed = parseGitHubUrl(url);
        if (!parsed) {
          return res.status(400).json({
            error: 'Invalid GitHub URL format. Please provide https://github.com/owner/repo or owner/repo',
          });
        }
        targetOwner = parsed.owner;
        targetRepo = parsed.repo;
      } else {
        return res.status(400).json({ error: 'Either url or demoId must be provided' });
      }

      // Check if already in DB
      const existing = repoDb.getRepositoryByUrl(`https://github.com/${targetOwner}/${targetRepo}`);
      if (existing) {
        const latestAnalysis = repoDb.getLatestAnalysisForRepo(existing.id);
        return res.json({ repository: existing, latestAnalysis, alreadyConnected: true });
      }

      // Fetch metadata from GitHub or Demo
      const details = await githubService.getRepositoryDetails(targetOwner, targetRepo);

      const newRepo: Repository = {
        id: `repo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        github_id: String(details.id),
        owner: details.owner,
        name: details.name,
        url: details.url,
        default_branch: details.default_branch,
        language: details.language,
        description: details.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      repoDb.createRepository(newRepo);

      res.status(201).json({ repository: newRepo, alreadyConnected: false });
    } catch (err: any) {
      console.error('Error connecting repository:', err);
      res.status(500).json({ error: err.message || 'Failed to connect repository' });
    }
  },

  deleteRepository(req: Request, res: Response) {
    const id = req.params.id as string;
    repoDb.deleteRepository(id);
    res.json({ success: true, message: 'Repository deleted' });
  },
};
