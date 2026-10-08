"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pullRequestController = void 0;
const pullRequestService_js_1 = require("../services/pullRequestService.js");
const database_js_1 = require("../db/database.js");
exports.pullRequestController = {
    async createPullRequest(req, res) {
        const analysisId = req.params.id;
        const { issueId, branchName } = req.body;
        const analysis = database_js_1.repoDb.getAnalysis(analysisId);
        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }
        if (!issueId) {
            return res.status(400).json({ error: 'issueId is required to create a Pull Request' });
        }
        const issue = database_js_1.repoDb.getIssue(issueId);
        if (!issue || !issue.suggestion) {
            return res.status(400).json({ error: 'Issue has no generated code fix' });
        }
        try {
            const pr = await pullRequestService_js_1.pullRequestService.createPullRequestForIssue({
                repositoryId: analysis.repository_id,
                analysisId: analysis.id,
                issue,
                suggestion: issue.suggestion,
                customBranch: branchName,
            });
            database_js_1.repoDb.updateIssueStatus(issue.id, 'applied');
            res.status(201).json({
                success: true,
                pullRequest: pr,
            });
        }
        catch (err) {
            console.error('Error creating Pull Request:', err);
            res.status(500).json({ error: err.message || 'Failed to create Pull Request' });
        }
    },
    listPullRequests(req, res) {
        const repoId = req.params.id;
        const prs = database_js_1.repoDb.listPullRequestsForRepo(repoId);
        res.json(prs);
    },
};
