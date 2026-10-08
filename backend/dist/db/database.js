"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.repoDb = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
// In-Memory Data Stores (used as primary or fallback)
const memoryRepositories = new Map();
const memoryAnalyses = new Map();
const memoryIssues = new Map();
const memorySuggestions = new Map();
const memoryPullRequests = new Map();
const memorySettings = new Map();
let db = null;
try {
    const isServerless = Boolean(process.env.VERCEL ||
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env.NOW_REGION);
    // In Serverless environments like Vercel, the root directory is strictly read-only.
    // Use os.tmpdir() (/tmp) where writing files is permitted.
    const dbDir = isServerless ? node_os_1.default.tmpdir() : node_path_1.default.resolve(process.cwd(), 'data');
    if (!node_fs_1.default.existsSync(dbDir)) {
        try {
            node_fs_1.default.mkdirSync(dbDir, { recursive: true });
        }
        catch {
            // Ignore if cannot create
        }
    }
    const dbPath = node_path_1.default.join(dbDir, 'repopilot.db');
    // Dynamically require node:sqlite so environments without it won't fail at import time
    let DatabaseSyncClass = null;
    try {
        const sqliteModule = require('node:sqlite');
        DatabaseSyncClass = sqliteModule?.DatabaseSync;
    }
    catch {
        // node:sqlite not supported in this runtime
    }
    if (DatabaseSyncClass) {
        db = new DatabaseSyncClass(dbPath);
        try {
            db.exec('PRAGMA journal_mode = WAL;');
        }
        catch {
            // Ignore pragma error
        }
        // Initialize schema
        db.exec(`
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
    }
}
catch (err) {
    console.warn('SQLite init warning (operating in resilient In-Memory mode):', err);
    db = null;
}
exports.repoDb = {
    // Repositories
    createRepository(repo) {
        memoryRepositories.set(repo.id, { ...repo });
        if (!db)
            return;
        try {
            const stmt = db.prepare(`
        INSERT OR REPLACE INTO repositories (id, github_id, owner, name, url, default_branch, language, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(repo.id, repo.github_id, repo.owner, repo.name, repo.url, repo.default_branch, repo.language, repo.description, repo.created_at, repo.updated_at);
        }
        catch (err) {
            console.warn('SQLite createRepository error:', err);
        }
    },
    getRepository(id) {
        if (db) {
            try {
                const stmt = db.prepare('SELECT * FROM repositories WHERE id = ?');
                const row = stmt.get(id);
                if (row)
                    return row;
            }
            catch (err) {
                console.warn('SQLite getRepository error:', err);
            }
        }
        return memoryRepositories.get(id) || null;
    },
    getRepositoryByUrl(url) {
        const normalized = url.toLowerCase().replace(/\/$/, '');
        if (db) {
            try {
                const stmt = db.prepare('SELECT * FROM repositories WHERE LOWER(url) = ? OR LOWER(url) = ?');
                const row = stmt.get(normalized, `${normalized}.git`);
                if (row)
                    return row;
            }
            catch (err) {
                console.warn('SQLite getRepositoryByUrl error:', err);
            }
        }
        for (const r of memoryRepositories.values()) {
            const u = r.url.toLowerCase().replace(/\/$/, '');
            if (u === normalized || `${u}.git` === normalized || u === `${normalized}.git`) {
                return r;
            }
        }
        return null;
    },
    listRepositories() {
        if (db) {
            try {
                const stmt = db.prepare('SELECT * FROM repositories ORDER BY updated_at DESC');
                const rows = stmt.all();
                if (rows && rows.length > 0)
                    return rows;
            }
            catch (err) {
                console.warn('SQLite listRepositories error:', err);
            }
        }
        return Array.from(memoryRepositories.values()).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    },
    deleteRepository(id) {
        memoryRepositories.delete(id);
        if (!db)
            return;
        try {
            const stmt = db.prepare('DELETE FROM repositories WHERE id = ?');
            stmt.run(id);
        }
        catch (err) {
            console.warn('SQLite deleteRepository error:', err);
        }
    },
    // Analyses
    createAnalysis(analysis) {
        memoryAnalyses.set(analysis.id, { ...analysis });
        if (!db)
            return;
        try {
            const stmt = db.prepare(`
        INSERT INTO analyses (id, repository_id, commit_sha, status, overall_score, scores_json, summary, metrics_json, error_message, created_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(analysis.id, analysis.repository_id, analysis.commit_sha, analysis.status, analysis.overall_score, JSON.stringify(analysis.scores), analysis.summary, JSON.stringify({ ...analysis.metrics, ai_insights: analysis.ai_insights }), analysis.error_message || null, analysis.created_at, analysis.completed_at || null);
        }
        catch (err) {
            console.warn('SQLite createAnalysis error:', err);
        }
    },
    updateAnalysis(analysis) {
        memoryAnalyses.set(analysis.id, { ...analysis });
        if (!db)
            return;
        try {
            const stmt = db.prepare(`
        UPDATE analyses
        SET status = ?, overall_score = ?, scores_json = ?, summary = ?, metrics_json = ?, error_message = ?, completed_at = ?
        WHERE id = ?
      `);
            stmt.run(analysis.status, analysis.overall_score, JSON.stringify(analysis.scores), analysis.summary, JSON.stringify({ ...analysis.metrics, ai_insights: analysis.ai_insights }), analysis.error_message || null, analysis.completed_at || null, analysis.id);
        }
        catch (err) {
            console.warn('SQLite updateAnalysis error:', err);
        }
    },
    getAnalysis(id) {
        if (db) {
            try {
                const stmt = db.prepare('SELECT * FROM analyses WHERE id = ?');
                const row = stmt.get(id);
                if (row) {
                    const metricsRaw = JSON.parse(row.metrics_json || '{}');
                    const ai_insights = metricsRaw.ai_insights;
                    delete metricsRaw.ai_insights;
                    return {
                        id: row.id,
                        repository_id: row.repository_id,
                        commit_sha: row.commit_sha,
                        status: row.status,
                        overall_score: row.overall_score,
                        scores: JSON.parse(row.scores_json || '{}'),
                        summary: row.summary || '',
                        metrics: metricsRaw,
                        ai_insights,
                        error_message: row.error_message,
                        created_at: row.created_at,
                        completed_at: row.completed_at,
                    };
                }
            }
            catch (err) {
                console.warn('SQLite getAnalysis error:', err);
            }
        }
        return memoryAnalyses.get(id) || null;
    },
    getLatestAnalysisForRepo(repoId) {
        if (db) {
            try {
                const stmt = db.prepare('SELECT * FROM analyses WHERE repository_id = ? ORDER BY created_at DESC LIMIT 1');
                const row = stmt.get(repoId);
                if (row) {
                    const metricsRaw = JSON.parse(row.metrics_json || '{}');
                    const ai_insights = metricsRaw.ai_insights;
                    delete metricsRaw.ai_insights;
                    return {
                        id: row.id,
                        repository_id: row.repository_id,
                        commit_sha: row.commit_sha,
                        status: row.status,
                        overall_score: row.overall_score,
                        scores: JSON.parse(row.scores_json || '{}'),
                        summary: row.summary || '',
                        metrics: metricsRaw,
                        ai_insights,
                        error_message: row.error_message,
                        created_at: row.created_at,
                        completed_at: row.completed_at,
                    };
                }
            }
            catch (err) {
                console.warn('SQLite getLatestAnalysisForRepo error:', err);
            }
        }
        const repoAnalyses = Array.from(memoryAnalyses.values())
            .filter((a) => a.repository_id === repoId)
            .sort((a, b) => b.created_at.localeCompare(a.created_at));
        return repoAnalyses[0] || null;
    },
    listAnalysesForRepo(repoId) {
        if (db) {
            try {
                const stmt = db.prepare('SELECT * FROM analyses WHERE repository_id = ? ORDER BY created_at DESC');
                const rows = stmt.all(repoId);
                if (rows && rows.length > 0) {
                    return rows.map((row) => {
                        const metricsRaw = JSON.parse(row.metrics_json || '{}');
                        const ai_insights = metricsRaw.ai_insights;
                        delete metricsRaw.ai_insights;
                        return {
                            id: row.id,
                            repository_id: row.repository_id,
                            commit_sha: row.commit_sha,
                            status: row.status,
                            overall_score: row.overall_score,
                            scores: JSON.parse(row.scores_json || '{}'),
                            summary: row.summary || '',
                            metrics: metricsRaw,
                            ai_insights,
                            error_message: row.error_message,
                            created_at: row.created_at,
                            completed_at: row.completed_at,
                        };
                    });
                }
            }
            catch (err) {
                console.warn('SQLite listAnalysesForRepo error:', err);
            }
        }
        return Array.from(memoryAnalyses.values())
            .filter((a) => a.repository_id === repoId)
            .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    // Issues
    createIssues(issues) {
        for (const issue of issues) {
            memoryIssues.set(issue.id, { ...issue });
        }
        if (!db)
            return;
        try {
            const stmt = db.prepare(`
        INSERT INTO issues (id, analysis_id, category, severity, title, description, file_path, line_number, code_snippet, recommendation, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            for (const issue of issues) {
                stmt.run(issue.id, issue.analysis_id, issue.category, issue.severity, issue.title, issue.description, issue.file_path, issue.line_number, issue.code_snippet, issue.recommendation, issue.status, issue.created_at);
            }
        }
        catch (err) {
            console.warn('SQLite createIssues error:', err);
        }
    },
    getIssue(id) {
        if (db) {
            try {
                const stmt = db.prepare('SELECT * FROM issues WHERE id = ?');
                const row = stmt.get(id);
                if (row) {
                    const issue = row;
                    const sugStmt = db.prepare('SELECT * FROM suggestions WHERE issue_id = ?');
                    const sugRow = sugStmt.get(id);
                    if (sugRow) {
                        issue.suggestion = sugRow;
                    }
                    return issue;
                }
            }
            catch (err) {
                console.warn('SQLite getIssue error:', err);
            }
        }
        const issue = memoryIssues.get(id);
        if (!issue)
            return null;
        const cloned = { ...issue };
        for (const s of memorySuggestions.values()) {
            if (s.issue_id === id) {
                cloned.suggestion = s;
                break;
            }
        }
        return cloned;
    },
    listIssuesForAnalysis(analysisId, category, severity, query) {
        if (db) {
            try {
                let sql = 'SELECT * FROM issues WHERE analysis_id = ?';
                const params = [analysisId];
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
                const rows = stmt.all(...params);
                return rows.map((row) => {
                    const issue = row;
                    const sugStmt = db.prepare('SELECT * FROM suggestions WHERE issue_id = ?');
                    const sugRow = sugStmt.get(issue.id);
                    if (sugRow) {
                        issue.suggestion = sugRow;
                    }
                    return issue;
                });
            }
            catch (err) {
                console.warn('SQLite listIssuesForAnalysis error:', err);
            }
        }
        const severityWeight = {
            critical: 1,
            high: 2,
            medium: 3,
            low: 4,
        };
        let issues = Array.from(memoryIssues.values()).filter((i) => i.analysis_id === analysisId);
        if (category && category !== 'all') {
            issues = issues.filter((i) => i.category === category);
        }
        if (severity && severity !== 'all') {
            issues = issues.filter((i) => i.severity === severity);
        }
        if (query) {
            const q = query.toLowerCase();
            issues = issues.filter((i) => i.title.toLowerCase().includes(q) ||
                i.description.toLowerCase().includes(q) ||
                i.file_path.toLowerCase().includes(q));
        }
        issues.sort((a, b) => {
            const wA = severityWeight[a.severity] || 5;
            const wB = severityWeight[b.severity] || 5;
            if (wA !== wB)
                return wA - wB;
            return a.line_number - b.line_number;
        });
        return issues.map((issue) => {
            const cloned = { ...issue };
            for (const s of memorySuggestions.values()) {
                if (s.issue_id === issue.id) {
                    cloned.suggestion = s;
                    break;
                }
            }
            return cloned;
        });
    },
    updateIssueStatus(id, status) {
        const existing = memoryIssues.get(id);
        if (existing) {
            existing.status = status;
        }
        if (!db)
            return;
        try {
            const stmt = db.prepare('UPDATE issues SET status = ? WHERE id = ?');
            stmt.run(status, id);
        }
        catch (err) {
            console.warn('SQLite updateIssueStatus error:', err);
        }
    },
    // Suggestions
    saveSuggestion(suggestion) {
        memorySuggestions.set(suggestion.id, { ...suggestion });
        if (!db)
            return;
        try {
            const stmt = db.prepare(`
        INSERT OR REPLACE INTO suggestions (id, issue_id, original_code, suggested_code, diff, explanation, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(suggestion.id, suggestion.issue_id, suggestion.original_code, suggestion.suggested_code, suggestion.diff, suggestion.explanation, suggestion.status, suggestion.created_at);
        }
        catch (err) {
            console.warn('SQLite saveSuggestion error:', err);
        }
    },
    updateSuggestionStatus(id, status) {
        const existing = memorySuggestions.get(id);
        if (existing) {
            existing.status = status;
        }
        if (!db)
            return;
        try {
            const stmt = db.prepare('UPDATE suggestions SET status = ? WHERE id = ?');
            stmt.run(status, id);
        }
        catch (err) {
            console.warn('SQLite updateSuggestionStatus error:', err);
        }
    },
    // Pull Requests
    createPullRequest(pr) {
        memoryPullRequests.set(pr.id, { ...pr });
        if (!db)
            return;
        try {
            const stmt = db.prepare(`
        INSERT INTO pull_requests (id, repository_id, analysis_id, github_pr_number, branch_name, title, description, status, pr_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(pr.id, pr.repository_id, pr.analysis_id, pr.github_pr_number || null, pr.branch_name, pr.title, pr.description, pr.status, pr.pr_url || null, pr.created_at);
        }
        catch (err) {
            console.warn('SQLite createPullRequest error:', err);
        }
    },
    listPullRequestsForRepo(repoId) {
        if (db) {
            try {
                const stmt = db.prepare('SELECT * FROM pull_requests WHERE repository_id = ? ORDER BY created_at DESC');
                const rows = stmt.all(repoId);
                if (rows && rows.length > 0)
                    return rows;
            }
            catch (err) {
                console.warn('SQLite listPullRequestsForRepo error:', err);
            }
        }
        return Array.from(memoryPullRequests.values())
            .filter((p) => p.repository_id === repoId)
            .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    // Settings
    getSetting(key) {
        if (db) {
            try {
                const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
                const row = stmt.get(key);
                if (row)
                    return row.value;
            }
            catch (err) {
                console.warn('SQLite getSetting error:', err);
            }
        }
        return memorySettings.get(key) || null;
    },
    setSetting(key, value) {
        memorySettings.set(key, value);
        if (!db)
            return;
        try {
            const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
            stmt.run(key, value);
        }
        catch (err) {
            console.warn('SQLite setSetting error:', err);
        }
    },
    getAllSettings() {
        if (db) {
            try {
                const stmt = db.prepare('SELECT key, value FROM settings');
                const rows = stmt.all();
                if (rows && rows.length > 0) {
                    const result = {};
                    for (const row of rows) {
                        result[row.key] = row.value;
                    }
                    return result;
                }
            }
            catch (err) {
                console.warn('SQLite getAllSettings error:', err);
            }
        }
        const result = {};
        for (const [k, v] of memorySettings.entries()) {
            result[k] = v;
        }
        return result;
    },
};
