import type { AIProvider, AIAnalyzeResult, AIFixResult } from '../providers/aiProvider.js';
import { geminiProvider } from '../providers/geminiProvider.js';
import { openAIProvider } from '../providers/openaiProvider.js';
import { fallbackProvider } from '../providers/fallbackProvider.js';
import { repoDb } from '../db/database.js';
import type { RepoFile, StaticFinding, Issue } from '../types/index.js';

export class AIService {
  getActiveProvider(): AIProvider {
    const configured = repoDb.getSetting('active_ai_provider');

    if (configured === 'gemini' && geminiProvider.isAvailable()) {
      return geminiProvider;
    }
    if (configured === 'openai' && openAIProvider.isAvailable()) {
      return openAIProvider;
    }

    // Auto-detect based on available keys
    if (geminiProvider.isAvailable()) {
      return geminiProvider;
    }
    if (openAIProvider.isAvailable()) {
      return openAIProvider;
    }

    return fallbackProvider;
  }

  async reviewRepository(params: {
    repoName: string;
    language: string;
    files: RepoFile[];
    staticFindings: StaticFinding[];
  }): Promise<{ summary: string; issues: Omit<Issue, 'id' | 'analysis_id' | 'created_at' | 'status'>[] }> {
    const provider = this.getActiveProvider();

    // Prepare files summary (truncate large files for token safety)
    const filesSummary = params.files
      .slice(0, 15)
      .map((f) => {
        const preview = f.content.length > 2500 ? f.content.substring(0, 2500) + '\n... [truncated]' : f.content;
        return `--- File: ${f.path} ---\n${preview}`;
      })
      .join('\n\n');

    let aiResult: AIAnalyzeResult;
    try {
      aiResult = await provider.analyzeRepository({
        repoName: params.repoName,
        language: params.language,
        filesSummary,
        staticFindings: params.staticFindings,
      });
    } catch (err) {
      console.warn(`Primary AI provider (${provider.name}) failed, falling back to Intelligent Rule Engine:`, err);
      aiResult = await fallbackProvider.analyzeRepository({
        repoName: params.repoName,
        language: params.language,
        filesSummary,
        staticFindings: params.staticFindings,
      });
    }

    // Combine static findings and AI findings, applying Hallucination Protection
    const validIssues: Omit<Issue, 'id' | 'analysis_id' | 'created_at' | 'status'>[] = [];
    const filesMap = new Map<string, RepoFile>();
    for (const f of params.files) {
      filesMap.set(f.path.toLowerCase(), f);
    }

    // 1. First add validated static findings
    for (const sf of params.staticFindings) {
      validIssues.push({
        category: sf.category,
        severity: sf.severity,
        title: sf.title,
        description: sf.description,
        file_path: sf.file,
        line_number: sf.line,
        code_snippet: sf.codeSnippet,
        recommendation: sf.recommendation,
      });
    }

    // 2. Add AI issues if they pass hallucination checks
    for (const aiIssue of aiResult.issues || []) {
      const lowerPath = (aiIssue.file_path || '').toLowerCase();
      // Hallucination check 1: File must exist in repo (or be a recognized project file like README)
      const matchedFile = filesMap.get(lowerPath);
      if (!matchedFile && lowerPath !== 'readme.md' && lowerPath !== '.gitignore' && lowerPath !== 'package.json') {
        console.warn(`AI Hallucination rejected: File ${aiIssue.file_path} does not exist in repo.`);
        continue;
      }

      // Hallucination check 2: Deduplicate if static analyzer already found the same problem on the same file/line
      const isDuplicate = validIssues.some(
        (v) =>
          v.file_path.toLowerCase() === lowerPath &&
          (Math.abs(v.line_number - (aiIssue.line_number || 1)) <= 3 || v.title.toLowerCase() === aiIssue.title.toLowerCase())
      );

      if (!isDuplicate) {
        validIssues.push({
          category: aiIssue.category || 'quality',
          severity: aiIssue.severity || 'medium',
          title: aiIssue.title,
          description: aiIssue.description,
          file_path: aiIssue.file_path,
          line_number: Math.max(1, aiIssue.line_number || 1),
          code_snippet: aiIssue.code_snippet || '',
          recommendation: aiIssue.recommendation,
        });
      }
    }

    return {
      summary: aiResult.summary,
      issues: validIssues,
    };
  }

  async generateFix(params: {
    issue: Issue;
    fileContent: string;
    language: string;
  }): Promise<AIFixResult> {
    const provider = this.getActiveProvider();

    try {
      return await provider.generateFix({
        issue: params.issue,
        fileContent: params.fileContent,
        language: params.language,
      });
    } catch (err) {
      console.warn(`Primary fix provider failed, using fallback:`, err);
      return await fallbackProvider.generateFix({
        issue: params.issue,
        fileContent: params.fileContent,
        language: params.language,
      });
    }
  }
}

export const aiService = new AIService();
