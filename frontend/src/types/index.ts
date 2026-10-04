export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type IssueCategory =
  | 'security'
  | 'quality'
  | 'testing'
  | 'architecture'
  | 'documentation'
  | 'dependencies';

export interface Repository {
  id: string;
  github_id: string;
  owner: string;
  name: string;
  url: string;
  default_branch: string;
  language: string;
  description: string;
  created_at: string;
  updated_at: string;
  latestAnalysis?: Analysis;
}

export interface DimensionScores {
  overall: number;
  codeQuality: number;
  security: number;
  testing: number;
  architecture: number;
  documentation: number;
  maintainability: number;
  dependencies: number;
}

export interface AnalysisMetrics {
  totalFilesScanned: number;
  totalLinesAnalyzed: number;
  testFilesCount: number;
  estimatedTestCoverage: number;
  functionsAnalyzed: number;
  dependenciesCount: number;
  vulnerabilitiesDetected: number;
  qualityIssuesCount: number;
  untestedAreas: string[];
}

export interface AIReviewInsights {
  provider?: string;
  model?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

export interface Analysis {
  id: string;
  repository_id: string;
  commit_sha: string;
  status: 'pending' | 'scanning' | 'analyzing' | 'completed' | 'failed';
  overall_score: number;
  scores: DimensionScores;
  summary: string;
  metrics: AnalysisMetrics;
  ai_insights?: AIReviewInsights;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface Suggestion {
  id: string;
  issue_id: string;
  original_code: string;
  suggested_code: string;
  diff: string;
  explanation: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Issue {
  id: string;
  analysis_id: string;
  category: IssueCategory;
  severity: Severity;
  title: string;
  description: string;
  file_path: string;
  line_number: number;
  code_snippet: string;
  recommendation: string;
  status: 'open' | 'fixing' | 'approved' | 'rejected' | 'applied';
  created_at: string;
  suggestion?: Suggestion;
}

export interface PullRequest {
  id: string;
  repository_id: string;
  analysis_id: string;
  github_pr_number?: number;
  branch_name: string;
  title: string;
  description: string;
  status: 'created' | 'simulated' | 'merged' | 'closed';
  pr_url?: string;
  created_at: string;
}

export interface DemoRepoSummary {
  id: string;
  name: string;
  owner: string;
  url: string;
  language: string;
  description: string;
  filesCount: number;
}

export interface AppSettings {
  activeProvider: 'gemini' | 'openai' | 'fallback';
  geminiApiKeyConfigured: boolean;
  geminiApiKeyMasked?: string;
  geminiModel: string;
  openaiApiKeyConfigured: boolean;
  openaiApiKeyMasked?: string;
  openaiModel: string;
  githubTokenConfigured: boolean;
  githubTokenMasked?: string;
}
