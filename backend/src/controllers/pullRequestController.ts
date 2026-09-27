import type { Request, Response } from 'express';
import { pullRequestService } from '../services/pullRequestService.js';
import { repoDb } from '../db/database.js';

export const pullRequestController = {
  async createPullRequest(req: Request, res: Response) {
    const { id: analysisId } = req.params;
    const { issueId, branchName } = req.body;

    const analysis = repoDb.getAnalysis(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    if (!issueId) {
      return res.status(400).json({ error: 'issueId is required to create a Pull Request' });
    }

    const issue = repoDb.getIssue(issueId);
    if (!issue || !issue.suggestion) {
      return res.status(400).json({ error: 'Issue has no generated code fix' });
    }

    try {
      const pr = await pullRequestService.createPullRequestForIssue({
        repositoryId: analysis.repository_id,
        analysisId: analysis.id,
        issue,
        suggestion: issue.suggestion,
        customBranch: branchName,
      });

      repoDb.updateIssueStatus(issue.id, 'applied');

      res.status(201).json({
        success: true,
        pullRequest: pr,
      });
    } catch (err: any) {
      console.error('Error creating Pull Request:', err);
      res.status(500).json({ error: err.message || 'Failed to create Pull Request' });
    }
  },

  listPullRequests(req: Request, res: Response) {
    const { id: repoId } = req.params;
    const prs = repoDb.listPullRequestsForRepo(repoId);
    res.json(prs);
  },
};
