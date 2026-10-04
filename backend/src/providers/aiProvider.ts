import type { IssueCategory, Severity, DimensionScores } from '../types/index.js';

export interface AIReviewIssue {
  category: IssueCategory;
  severity: Severity;
  title: string;
  description: string;
  file_path: string;
  line_number: number;
  code_snippet: string;
  recommendation: string;
}

export interface AIAnalyzeResult {
  summary: string;
  scores?: DimensionScores;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  issues: AIReviewIssue[];
}

export interface AIFixResult {
  originalCode: string;
  suggestedCode: string;
  diff: string;
  explanation: string;
}

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  analyzeRepository(context: {
    repoName: string;
    language: string;
    filesSummary: string;
    staticFindings: any[];
  }): Promise<AIAnalyzeResult>;
  generateFix(params: {
    issue: any;
    fileContent: string;
    language: string;
  }): Promise<AIFixResult>;
}
