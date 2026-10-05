import type { Request, Response } from 'express';
import { repositoryScanner } from '../services/repositoryScanner.js';
import { staticAnalyzer } from '../services/staticAnalyzer.js';
import { aiService } from '../services/aiService.js';
import { repoDb } from '../db/database.js';
import type { Analysis, Issue } from '../types/index.js';

export const analysisController = {
  async triggerAnalysis(req: Request, res: Response) {
    const repoId = req.params.id as string;

    const repo = repoDb.getRepository(repoId);
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    const analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Create initial pending record
    const initialAnalysis: Analysis = {
      id: analysisId,
      repository_id: repo.id,
      commit_sha: 'head',
      status: 'scanning',
      overall_score: 0,
      scores: {
        overall: 0,
        codeQuality: 0,
        security: 0,
        testing: 0,
        architecture: 0,
        documentation: 0,
        maintainability: 0,
        dependencies: 0,
      },
      summary: 'Repository scan initiated...',
      metrics: {
        totalFilesScanned: 0,
        totalLinesAnalyzed: 0,
        testFilesCount: 0,
        estimatedTestCoverage: 0,
        functionsAnalyzed: 0,
        dependenciesCount: 0,
        vulnerabilitiesDetected: 0,
        qualityIssuesCount: 0,
        untestedAreas: [],
      },
      created_at: new Date().toISOString(),
    };

    repoDb.createAnalysis(initialAnalysis);

    try {
      // 1. Scan repository files
      const scanResult = await repositoryScanner.scan(repo.owner, repo.name, repo.default_branch);

      // 2. Run static analysis
      const staticResult = staticAnalyzer.analyze(scanResult.files, scanResult.tree);

      // 3. Run AI Review Engine with Hallucination Protection
      const aiResult = await aiService.reviewRepository({
        repoName: repo.name,
        language: repo.language,
        files: scanResult.files,
        staticFindings: staticResult.findings,
      });

      // 4. Transform and save issues
      const issueRecords: Issue[] = aiResult.issues.map((iss, idx) => ({
        id: `issue-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        analysis_id: analysisId,
        category: iss.category,
        severity: iss.severity,
        title: iss.title,
        description: iss.description,
        file_path: iss.file_path,
        line_number: iss.line_number,
        code_snippet: iss.code_snippet,
        recommendation: iss.recommendation,
        status: 'open',
        created_at: new Date().toISOString(),
      }));

      repoDb.createIssues(issueRecords);

      // 5. Update completed analysis record
      const finalScores = aiResult.scores && typeof aiResult.scores.overall === 'number'
        ? {
            overall: Math.min(100, Math.max(0, Math.round(aiResult.scores.overall))),
            security: Math.min(100, Math.max(0, Math.round(aiResult.scores.security ?? staticResult.scores.security))),
            codeQuality: Math.min(100, Math.max(0, Math.round(aiResult.scores.codeQuality ?? staticResult.scores.codeQuality))),
            testing: Math.min(100, Math.max(0, Math.round(aiResult.scores.testing ?? staticResult.scores.testing))),
            architecture: Math.min(100, Math.max(0, Math.round(aiResult.scores.architecture ?? staticResult.scores.architecture))),
            documentation: Math.min(100, Math.max(0, Math.round(aiResult.scores.documentation ?? staticResult.scores.documentation))),
            maintainability: Math.min(100, Math.max(0, Math.round(aiResult.scores.maintainability ?? staticResult.scores.maintainability))),
            dependencies: Math.min(100, Math.max(0, Math.round(aiResult.scores.dependencies ?? staticResult.scores.dependencies))),
          }
        : staticResult.scores;

      const completedAnalysis: Analysis = {
        id: analysisId,
        repository_id: repo.id,
        commit_sha: scanResult.commitSha,
        status: 'completed',
        overall_score: finalScores.overall,
        scores: finalScores,
        summary: aiResult.summary,
        ai_insights: {
          provider: aiResult.providerName,
          model: repoDb.getSetting('gemini_model') || 'gemini-2.5-flash',
          strengths: aiResult.strengths || [],
          weaknesses: aiResult.weaknesses || [],
          recommendations: aiResult.recommendations || [],
        },
        metrics: {
          ...staticResult.metrics,
          totalFilesScanned: scanResult.totalFiles,
        },
        created_at: initialAnalysis.created_at,
        completed_at: new Date().toISOString(),
      };

      repoDb.updateAnalysis(completedAnalysis);

      res.json({
        analysis: completedAnalysis,
        issuesCount: issueRecords.length,
        tree: scanResult.tree,
      });
    } catch (err: any) {
      console.error('Analysis failed:', err);
      const failedAnalysis: Analysis = {
        ...initialAnalysis,
        status: 'failed',
        error_message: err.message || 'Unknown analysis error',
        completed_at: new Date().toISOString(),
      };
      repoDb.updateAnalysis(failedAnalysis);
      res.status(500).json({ error: err.message || 'Analysis pipeline failed', analysis: failedAnalysis });
    }
  },

  getAnalysis(req: Request, res: Response) {
    const id = req.params.id as string;
    const analysis = repoDb.getAnalysis(id);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    res.json(analysis);
  },

  getAnalysisIssues(req: Request, res: Response) {
    const id = req.params.id as string;
    const category = req.query.category as string | undefined;
    const severity = req.query.severity as string | undefined;
    const q = req.query.q as string | undefined;

    const issues = repoDb.listIssuesForAnalysis(id, category, severity, q);
    res.json(issues);
  },

  getAnalysisMetrics(req: Request, res: Response) {
    const id = req.params.id as string;
    const analysis = repoDb.getAnalysis(id);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    res.json({
      overall_score: analysis.overall_score,
      scores: analysis.scores,
      metrics: analysis.metrics,
      status: analysis.status,
    });
  },

  getRepoHistory(req: Request, res: Response) {
    const id = req.params.id as string;
    const history = repoDb.listAnalysesForRepo(id);
    res.json(history);
  },
};
