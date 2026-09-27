import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import type {
  Repository,
  Analysis,
  Issue,
  Suggestion,
  PullRequest,
  DimensionScores,
  AnalysisMetrics,
} from '../types/index.js';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'repopilot.db');
const db = new DatabaseSync(DB_PATH);

// Initialize schema
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    github_id TEXT,
    username TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS repositories (
    id TEXT PRIMARY KEY,
    github_id TEXT,
    owner TEXT,
    name TEXT,
    url TEXT,
    default_branch TEXT,
    language TEXT,
    description TEXT,
    created_at TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    repository_id TEXT,
    commit_sha TEXT,
    status TEXT,
    overall_score REAL,
    scores_json TEXT,
    summary TEXT,
    metrics_json TEXT,
    error_message TEXT,
    created_at TEXT,
    completed_at TEXT,
    FOREIGN KEY(repository_id) REFERENCES repositories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    analysis_id TEXT,
    category TEXT,
    severity TEXT,
    title TEXT,
    description TEXT,
    file_path TEXT,
    line_number INTEGER,
    code_snippet TEXT,
    recommendation TEXT,
    status TEXT,
    created_at TEXT,
    FOREIGN KEY(analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS suggestions (
    id TEXT PRIMARY KEY,
    issue_id TEXT,
    original_code TEXT,
    suggested_code TEXT,
    diff TEXT,
    explanation TEXT,
    status TEXT,
    created_at TEXT,
    FOREIGN KEY(issue_id) REFERENCES issues(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS pull_requests (
    id TEXT PRIMARY KEY,
    repository_id TEXT,
    analysis_id TEXT,
    github_pr_number INTEGER,
    branch_name TEXT,
    title TEXT,
    description TEXT,
    status TEXT,
    pr_url TEXT,
    created_at TEXT,
    FOREIGN KEY(repository_id) REFERENCES repositories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

export const repoDb = {
  // Repositories
  createRepository(repo: Repository): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO repositories (id, github_id, owner, name, url, default_branch, language, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      repo.id,
      repo.github_id,
      repo.owner,
      repo.name,
      repo.url,
      repo.default_branch,
      repo.language,
      repo.description,
      repo.created_at,
      repo.updated_at
    );
  },

  getRepository(id: string): Repository | null {
    const stmt = db.prepare('SELECT * FROM repositories WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return row as unknown as Repository;
  },

  getRepositoryByUrl(url: string): Repository | null {
    const normalized = url.toLowerCase().replace(/\/$/, '');
    const stmt = db.prepare('SELECT * FROM repositories WHERE LOWER(url) = ? OR LOWER(url) = ?');
    const row = stmt.get(normalized, `${normalized}.git`) as Record<string, unknown> | undefined;
    if (!row) return null;
    return row as unknown as Repository;
  },

  listRepositories(): Repository[] {
    const stmt = db.prepare('SELECT * FROM repositories ORDER BY updated_at DESC');
    return stmt.all() as unknown as Repository[];
  },

  deleteRepository(id: string): void {
    const stmt = db.prepare('DELETE FROM repositories WHERE id = ?');
    stmt.run(id);
  },

  // Analyses
  createAnalysis(analysis: Analysis): void {
    const stmt = db.prepare(`
      INSERT INTO analyses (id, repository_id, commit_sha, status, overall_score, scores_json, summary, metrics_json, error_message, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      analysis.id,
      analysis.repository_id,
      analysis.commit_sha,
      analysis.status,
      analysis.overall_score,
      JSON.stringify(analysis.scores),
      analysis.summary,
      JSON.stringify(analysis.metrics),
      analysis.error_message || null,
      analysis.created_at,
      analysis.completed_at || null
    );
  },

  updateAnalysis(analysis: Analysis): void {
    const stmt = db.prepare(`
      UPDATE analyses
      SET status = ?, overall_score = ?, scores_json = ?, summary = ?, metrics_json = ?, error_message = ?, completed_at = ?
      WHERE id = ?
    `);
    stmt.run(
      analysis.status,
      analysis.overall_score,
      JSON.stringify(analysis.scores),
      analysis.summary,
      JSON.stringify(analysis.metrics),
      analysis.error_message || null,
      analysis.completed_at || null,
      analysis.id
    );
  },

  getAnalysis(id: string): Analysis | null {
    const stmt = db.prepare('SELECT * FROM analyses WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return null;

    return {
      id: row.id as string,
      repository_id: row.repository_id as string,
      commit_sha: row.commit_sha as string,
      status: row.status as Analysis['status'],
      overall_score: row.overall_score as number,
      scores: JSON.parse((row.scores_json as string) || '{}') as DimensionScores,
      summary: (row.summary as string) || '',
      metrics: JSON.parse((row.metrics_json as string) || '{}') as AnalysisMetrics,
      error_message: row.error_message as string | undefined,
      created_at: row.created_at as string,
      completed_at: row.completed_at as string | undefined,
    };
  },

  getLatestAnalysisForRepo(repoId: string): Analysis | null {
    const stmt = db.prepare('SELECT * FROM analyses WHERE repository_id = ? ORDER BY created_at DESC LIMIT 1');
    const row = stmt.get(repoId) as Record<string, unknown> | undefined;
    if (!row) return null;

    return {
      id: row.id as string,
      repository_id: row.repository_id as string,
      commit_sha: row.commit_sha as string,
      status: row.status as Analysis['status'],
      overall_score: row.overall_score as number,
      scores: JSON.parse((row.scores_json as string) || '{}') as DimensionScores,
      summary: (row.summary as string) || '',
      metrics: JSON.parse((row.metrics_json as string) || '{}') as AnalysisMetrics,
      error_message: row.error_message as string | undefined,
      created_at: row.created_at as string,
      completed_at: row.completed_at as string | undefined,
    };
  },

  listAnalysesForRepo(repoId: string): Analysis[] {
    const stmt = db.prepare('SELECT * FROM analyses WHERE repository_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(repoId) as Record<string, unknown>[];
    return rows.map((row) => ({
      id: row.id as string,
      repository_id: row.repository_id as string,
      commit_sha: row.commit_sha as string,
      status: row.status as Analysis['status'],
      overall_score: row.overall_score as number,
      scores: JSON.parse((row.scores_json as string) || '{}') as DimensionScores,
      summary: (row.summary as string) || '',
      metrics: JSON.parse((row.metrics_json as string) || '{}') as AnalysisMetrics,
      error_message: row.error_message as string | undefined,
      created_at: row.created_at as string,
      completed_at: row.completed_at as string | undefined,
    }));
  },

  // Issues
  createIssues(issues: Issue[]): void {
    const stmt = db.prepare(`
      INSERT INTO issues (id, analysis_id, category, severity, title, description, file_path, line_number, code_snippet, recommendation, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const issue of issues) {
      stmt.run(
        issue.id,
        issue.analysis_id,
        issue.category,
        issue.severity,
        issue.title,
        issue.description,
        issue.file_path,
        issue.line_number,
        issue.code_snippet,
        issue.recommendation,
        issue.status,
        issue.created_at
      );
    }
  },

  getIssue(id: string): Issue | null {
    const stmt = db.prepare('SELECT * FROM issues WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return null;

    const issue = row as unknown as Issue;
    // Check for suggestion
    const sugStmt = db.prepare('SELECT * FROM suggestions WHERE issue_id = ?');
    const sugRow = sugStmt.get(id) as Record<string, unknown> | undefined;
    if (sugRow) {
      issue.suggestion = sugRow as unknown as Suggestion;
    }
    return issue;
  },

  listIssuesForAnalysis(analysisId: string, category?: string, severity?: string, query?: string): Issue[] {
    let sql = 'SELECT * FROM issues WHERE analysis_id = ?';
    const params: (string | number)[] = [analysisId];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (severity && severity !== 'all') {
      sql += ' AND severity = ?';
      params.push(severity);
    }

    if (query) {
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(file_path) LIKE ?)';
      const q = `%${query.toLowerCase()}%`;
      params.push(q, q, q);
    }

    sql += " ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END, line_number ASC";

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as Record<string, unknown>[];

    return rows.map((row) => {
      const issue = row as unknown as Issue;
      const sugStmt = db.prepare('SELECT * FROM suggestions WHERE issue_id = ?');
      const sugRow = sugStmt.get(issue.id) as Record<string, unknown> | undefined;
      if (sugRow) {
        issue.suggestion = sugRow as unknown as Suggestion;
      }
      return issue;
    });
  },

  updateIssueStatus(id: string, status: Issue['status']): void {
    const stmt = db.prepare('UPDATE issues SET status = ? WHERE id = ?');
    stmt.run(status, id);
  },

  // Suggestions
  saveSuggestion(suggestion: Suggestion): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO suggestions (id, issue_id, original_code, suggested_code, diff, explanation, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      suggestion.id,
      suggestion.issue_id,
      suggestion.original_code,
      suggestion.suggested_code,
      suggestion.diff,
      suggestion.explanation,
      suggestion.status,
      suggestion.created_at
    );
  },

  updateSuggestionStatus(id: string, status: Suggestion['status']): void {
    const stmt = db.prepare('UPDATE suggestions SET status = ? WHERE id = ?');
    stmt.run(status, id);
  },

  // Pull Requests
  createPullRequest(pr: PullRequest): void {
    const stmt = db.prepare(`
      INSERT INTO pull_requests (id, repository_id, analysis_id, github_pr_number, branch_name, title, description, status, pr_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      pr.id,
      pr.repository_id,
      pr.analysis_id,
      pr.github_pr_number || null,
      pr.branch_name,
      pr.title,
      pr.description,
      pr.status,
      pr.pr_url || null,
      pr.created_at
    );
  },

  listPullRequestsForRepo(repoId: string): PullRequest[] {
    const stmt = db.prepare('SELECT * FROM pull_requests WHERE repository_id = ? ORDER BY created_at DESC');
    return stmt.all(repoId) as unknown as PullRequest[];
  },

  // Settings
  getSetting(key: string): string | null {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  },

  setSetting(key: string, value: string): void {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run(key, value);
  },

  getAllSettings(): Record<string, string> {
    const stmt = db.prepare('SELECT key, value FROM settings');
    const rows = stmt.all() as { key: string; value: string }[];
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  },
};
