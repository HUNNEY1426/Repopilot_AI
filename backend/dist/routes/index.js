"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const repositoryController_js_1 = require("../controllers/repositoryController.js");
const analysisController_js_1 = require("../controllers/analysisController.js");
const issueController_js_1 = require("../controllers/issueController.js");
const pullRequestController_js_1 = require("../controllers/pullRequestController.js");
const settingsController_js_1 = require("../controllers/settingsController.js");
exports.apiRouter = (0, express_1.Router)();
// Demo repositories
exports.apiRouter.get('/demo-repos', repositoryController_js_1.repositoryController.getDemoRepos);
// Repositories
exports.apiRouter.get('/repositories', repositoryController_js_1.repositoryController.listRepositories);
exports.apiRouter.post('/repositories/connect', repositoryController_js_1.repositoryController.connectRepository);
exports.apiRouter.get('/repositories/:id', repositoryController_js_1.repositoryController.getRepository);
exports.apiRouter.delete('/repositories/:id', repositoryController_js_1.repositoryController.deleteRepository);
exports.apiRouter.get('/repositories/:id/history', analysisController_js_1.analysisController.getRepoHistory);
exports.apiRouter.get('/repositories/:id/pull-requests', pullRequestController_js_1.pullRequestController.listPullRequests);
// Analysis
exports.apiRouter.post('/repositories/:id/analyze', analysisController_js_1.analysisController.triggerAnalysis);
exports.apiRouter.get('/analyses/:id', analysisController_js_1.analysisController.getAnalysis);
exports.apiRouter.get('/analyses/:id/issues', analysisController_js_1.analysisController.getAnalysisIssues);
exports.apiRouter.get('/analyses/:id/metrics', analysisController_js_1.analysisController.getAnalysisMetrics);
exports.apiRouter.post('/analyses/:id/pull-request', pullRequestController_js_1.pullRequestController.createPullRequest);
// Issues & Diff remediation
exports.apiRouter.get('/issues/:id', issueController_js_1.issueController.getIssue);
exports.apiRouter.post('/issues/:id/fix', issueController_js_1.issueController.generateFix);
exports.apiRouter.post('/issues/:id/regenerate', issueController_js_1.issueController.generateFix);
exports.apiRouter.post('/issues/:id/approve', issueController_js_1.issueController.approveFix);
exports.apiRouter.post('/issues/:id/reject', issueController_js_1.issueController.rejectFix);
// Settings
exports.apiRouter.get('/settings', settingsController_js_1.settingsController.getSettings);
exports.apiRouter.post('/settings', settingsController_js_1.settingsController.updateSettings);
