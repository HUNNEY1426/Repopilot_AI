"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueController = void 0;
const database_js_1 = require("../db/database.js");
const aiService_js_1 = require("../services/aiService.js");
const diffService_js_1 = require("../services/diffService.js");
const githubService_js_1 = require("../services/githubService.js");
exports.issueController = {
    getIssue(req, res) {
        const id = req.params.id;
        const issue = database_js_1.repoDb.getIssue(id);
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        res.json(issue);
    },
    async generateFix(req, res) {
        const id = req.params.id;
        const issue = database_js_1.repoDb.getIssue(id);
        if (!issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        const analysis = database_js_1.repoDb.getAnalysis(issue.analysis_id);
        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }
        const repo = database_js_1.repoDb.getRepository(analysis.repository_id);
        if (!repo) {
            return res.status(404).json({ error: 'Repository not found' });
        }
        try {
            // 1. Fetch file content from repository
            const scan = await githubService_js_1.githubService.fetchRepositoryFiles(repo.owner, repo.name, repo.default_branch);
            const targetFile = scan.files.find((f) => f.path.toLowerCase() === issue.file_path.toLowerCase());
            const fileContent = targetFile ? targetFile.content : issue.code_snippet;
            // 2. Generate fix using AI / Rule Engine
            const fixResult = await aiService_js_1.aiService.generateFix({
                issue,
                fileContent,
                language: repo.language,
            });
            // 3. Validate patch
            const validation = diffService_js_1.diffService.validateAndApplyPatch(fileContent, fixResult.originalCode, fixResult.suggestedCode, issue.file_path);
            const suggestionId = `sug-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const suggestion = {
                id: suggestionId,
                issue_id: issue.id,
                original_code: fixResult.originalCode,
                suggested_code: fixResult.suggestedCode,
                diff: validation.diff || fixResult.diff,
                explanation: fixResult.explanation,
                status: 'pending',
                created_at: new Date().toISOString(),
            };
            database_js_1.repoDb.saveSuggestion(suggestion);
            database_js_1.repoDb.updateIssueStatus(issue.id, 'fixing');
            res.json({
                suggestion,
                validation: {
                    isValid: validation.isValid,
                    syntaxValid: validation.syntaxValid,
                    error: validation.error,
                },
            });
        }
        catch (err) {
            console.error('Error generating fix:', err);
            res.status(500).json({ error: err.message || 'Failed to generate code fix' });
        }
    },
    approveFix(req, res) {
        const id = req.params.id;
        const issue = database_js_1.repoDb.getIssue(id);
        if (!issue)
            return res.status(404).json({ error: 'Issue not found' });
        if (issue.suggestion) {
            database_js_1.repoDb.updateSuggestionStatus(issue.suggestion.id, 'approved');
        }
        database_js_1.repoDb.updateIssueStatus(id, 'approved');
        res.json({ success: true, status: 'approved' });
    },
    rejectFix(req, res) {
        const id = req.params.id;
        const issue = database_js_1.repoDb.getIssue(id);
        if (!issue)
            return res.status(404).json({ error: 'Issue not found' });
        if (issue.suggestion) {
            database_js_1.repoDb.updateSuggestionStatus(issue.suggestion.id, 'rejected');
        }
        database_js_1.repoDb.updateIssueStatus(id, 'rejected');
        res.json({ success: true, status: 'rejected' });
    },
};
