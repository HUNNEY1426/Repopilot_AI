"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repositoryController = void 0;
const githubService_js_1 = require("../services/githubService.js");
const demoRepositories_js_1 = require("../services/demoRepositories.js");
const database_js_1 = require("../db/database.js");
exports.repositoryController = {
    getDemoRepos(req, res) {
        const list = demoRepositories_js_1.DEMO_REPOSITORIES.map((d) => ({
            id: d.id,
            name: d.name,
            owner: d.owner,
            url: d.url,
            language: d.language,
            description: d.description,
            filesCount: d.files.length,
        }));
        res.json(list);
    },
    listRepositories(req, res) {
        const repos = database_js_1.repoDb.listRepositories();
        res.json(repos);
    },
    getRepository(req, res) {
        const id = req.params.id;
        const repo = database_js_1.repoDb.getRepository(id);
        if (!repo) {
            return res.status(404).json({ error: 'Repository not found' });
        }
        const latestAnalysis = database_js_1.repoDb.getLatestAnalysisForRepo(id);
        res.json({ ...repo, latestAnalysis });
    },
    async connectRepository(req, res) {
        const { url, demoId } = req.body;
        try {
            let targetOwner = '';
            let targetRepo = '';
            if (demoId) {
                const demo = demoRepositories_js_1.DEMO_REPOSITORIES.find((d) => d.id === demoId);
                if (!demo) {
                    return res.status(404).json({ error: 'Demo repository not found' });
                }
                targetOwner = demo.owner;
                targetRepo = demo.name;
            }
            else if (url) {
                const parsed = (0, githubService_js_1.parseGitHubUrl)(url);
                if (!parsed) {
                    return res.status(400).json({
                        error: 'Invalid GitHub URL format. Please provide https://github.com/owner/repo or owner/repo',
                    });
                }
                targetOwner = parsed.owner;
                targetRepo = parsed.repo;
            }
            else {
                return res.status(400).json({ error: 'Either url or demoId must be provided' });
            }
            // Check if already in DB
            const existing = database_js_1.repoDb.getRepositoryByUrl(`https://github.com/${targetOwner}/${targetRepo}`);
            if (existing) {
                const latestAnalysis = database_js_1.repoDb.getLatestAnalysisForRepo(existing.id);
                return res.json({ repository: existing, latestAnalysis, alreadyConnected: true });
            }
            // Fetch metadata from GitHub or Demo
            const details = await githubService_js_1.githubService.getRepositoryDetails(targetOwner, targetRepo);
            const newRepo = {
                id: `repo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                github_id: String(details.id),
                owner: details.owner,
                name: details.name,
                url: details.url,
                default_branch: details.default_branch,
                language: details.language,
                description: details.description,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            database_js_1.repoDb.createRepository(newRepo);
            res.status(201).json({ repository: newRepo, alreadyConnected: false });
        }
        catch (err) {
            console.error('Error connecting repository:', err);
            res.status(500).json({ error: err.message || 'Failed to connect repository' });
        }
    },
    deleteRepository(req, res) {
        const id = req.params.id;
        database_js_1.repoDb.deleteRepository(id);
        res.json({ success: true, message: 'Repository deleted' });
    },
};
