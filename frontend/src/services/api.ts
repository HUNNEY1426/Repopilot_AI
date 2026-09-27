import type {
  Repository,
  Analysis,
  Issue,
  Suggestion,
  PullRequest,
  DemoRepoSummary,
  AppSettings,
} from '../types/index.js';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const err = await res.json();
      if (err.error) errorMsg = err.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Demo Repos
  getDemoRepos: () => fetchJson<DemoRepoSummary[]>('/demo-repos'),

  // Repositories
  listRepositories: () => fetchJson<Repository[]>('/repositories'),
  getRepository: (id: string) => fetchJson<Repository & { latestAnalysis?: Analysis }>(`/repositories/${id}`),
  connectRepository: (payload: { url?: string; demoId?: string }) =>
    fetchJson<{ repository: Repository; latestAnalysis?: Analysis; alreadyConnected: boolean }>('/repositories/connect', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteRepository: (id: string) =>
    fetchJson<{ success: boolean; message: string }>(`/repositories/${id}`, { method: 'DELETE' }),

  // Analysis
  triggerAnalysis: (repoId: string) =>
    fetchJson<{ analysis: Analysis; issuesCount: number; tree: any[] }>(`/repositories/${repoId}/analyze`, {
      method: 'POST',
    }),
  getAnalysis: (id: string) => fetchJson<Analysis>(`/analyses/${id}`),
  getAnalysisIssues: (id: string, params?: { category?: string; severity?: string; q?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== 'all') searchParams.set('category', params.category);
    if (params?.severity && params.severity !== 'all') searchParams.set('severity', params.severity);
    if (params?.q) searchParams.set('q', params.q);
    const qs = searchParams.toString();
    return fetchJson<Issue[]>(`/analyses/${id}/issues${qs ? `?${qs}` : ''}`);
  },
  getRepoHistory: (repoId: string) => fetchJson<Analysis[]>(`/repositories/${repoId}/history`),

  // Issues & Fixes
  getIssue: (id: string) => fetchJson<Issue>(`/issues/${id}`),
  generateFix: (issueId: string) =>
    fetchJson<{
      suggestion: Suggestion;
      validation: { isValid: boolean; syntaxValid: boolean; error?: string };
    }>(`/issues/${issueId}/fix`, { method: 'POST' }),
  approveFix: (issueId: string) =>
    fetchJson<{ success: boolean; status: string }>(`/issues/${issueId}/approve`, { method: 'POST' }),
  rejectFix: (issueId: string) =>
    fetchJson<{ success: boolean; status: string }>(`/issues/${issueId}/reject`, { method: 'POST' }),

  // Pull Requests
  createPullRequest: (analysisId: string, payload: { issueId: string; branchName?: string }) =>
    fetchJson<{ success: boolean; pullRequest: PullRequest }>(`/analyses/${analysisId}/pull-request`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listPullRequests: (repoId: string) => fetchJson<PullRequest[]>(`/repositories/${repoId}/pull-requests`),

  // Settings
  getSettings: () => fetchJson<AppSettings>('/settings'),
  updateSettings: (settings: Partial<AppSettings> & { geminiApiKey?: string; openaiApiKey?: string; githubToken?: string }) =>
    fetchJson<{ success: boolean; message: string }>('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),
};
