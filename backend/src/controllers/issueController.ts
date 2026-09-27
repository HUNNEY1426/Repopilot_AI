import type { Request, Response } from 'express';
import { repoDb } from '../db/database.js';
import { aiService } from '../services/aiService.js';
import { diffService } from '../services/diffService.js';
import { githubService } from '../services/githubService.js';
import type { Suggestion } from '../types/index.js';

export const issueController = {
  getIssue(req: Request, res: Response) {
    const { id } = req.params;
    const issue = repoDb.getIssue(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  },

  async generateFix(req: Request, res: Response) {
    const { id } = req.params;
    const issue = repoDb.getIssue(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const analysis = repoDb.getAnalysis(issue.analysis_id);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const repo = repoDb.getRepository(analysis.repository_id);
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    try {
      // 1. Fetch file content from repository
      const scan = await githubService.fetchRepositoryFiles(repo.owner, repo.name, repo.default_branch);
      const targetFile = scan.files.find((f) => f.path.toLowerCase() === issue.file_path.toLowerCase());
      const fileContent = targetFile ? targetFile.content : issue.code_snippet;

      // 2. Generate fix using AI / Rule Engine
      const fixResult = await aiService.generateFix({
        issue,
        fileContent,
        language: repo.language,
      });

      // 3. Validate patch
      const validation = diffService.validateAndApplyPatch(
        fileContent,
        fixResult.originalCode,
        fixResult.suggestedCode,
        issue.file_path
      );

      const suggestionId = `sug-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const suggestion: Suggestion = {
        id: suggestionId,
        issue_id: issue.id,
        original_code: fixResult.originalCode,
        suggested_code: fixResult.suggestedCode,
        diff: validation.diff || fixResult.diff,
        explanation: fixResult.explanation,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      repoDb.saveSuggestion(suggestion);
      repoDb.updateIssueStatus(issue.id, 'fixing');

      res.json({
        suggestion,
        validation: {
          isValid: validation.isValid,
          syntaxValid: validation.syntaxValid,
          error: validation.error,
        },
      });
    } catch (err: any) {
      console.error('Error generating fix:', err);
      res.status(500).json({ error: err.message || 'Failed to generate code fix' });
    }
  },

  approveFix(req: Request, res: Response) {
    const { id } = req.params;
    const issue = repoDb.getIssue(id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    if (issue.suggestion) {
      repoDb.updateSuggestionStatus(issue.suggestion.id, 'approved');
    }
    repoDb.updateIssueStatus(id, 'approved');
    res.json({ success: true, status: 'approved' });
  },

  rejectFix(req: Request, res: Response) {
    const { id } = req.params;
    const issue = repoDb.getIssue(id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    if (issue.suggestion) {
      repoDb.updateSuggestionStatus(issue.suggestion.id, 'rejected');
    }
    repoDb.updateIssueStatus(id, 'rejected');
    res.json({ success: true, status: 'rejected' });
  },
};
