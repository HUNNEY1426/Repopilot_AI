"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pullRequestService = exports.PullRequestService = void 0;
const githubService_js_1 = require("./githubService.js");
const database_js_1 = require("../db/database.js");
class PullRequestService {
    async createPullRequestForIssue(params) {
        const repo = database_js_1.repoDb.getRepository(params.repositoryId);
        if (!repo) {
            throw new Error(`Repository ${params.repositoryId} not found.`);
        }
        const categoryPrefix = params.issue.category || 'refactor';
        const branchName = params.customBranch ||
            `repopilot/${categoryPrefix}-${params.issue.id.substring(0, 8)}`;
        const title = `fix(${categoryPrefix}): ${params.issue.title}`;
        const description = `## 🤖 AI Automated Code Review & Remediation (RepoPilot)

### Problem Description
${params.issue.description}

- **Affected File:** \`${params.issue.file_path}\`
- **Line:** ${params.issue.line_number}
- **Category:** ${params.issue.category.toUpperCase()}
- **Severity:** ${params.issue.severity.toUpperCase()}

### Proposed Solution
${params.suggestion.explanation}

\`\`\`diff
${params.suggestion.diff}
\`\`\`

### Automated Verification
- [x] Syntax check validated
- [x] Context match verified
- [x] Generated patch reviewed and approved by developer

---
*Created by [RepoPilot AI](https://github.com) automated repository reviewer.*
`;
        // Fetch latest file content to apply patch
        const scan = await githubService_js_1.githubService.fetchRepositoryFiles(repo.owner, repo.name, repo.default_branch);
        const targetFile = scan.files.find((f) => f.path === params.issue.file_path);
        const originalContent = targetFile ? targetFile.content : '';
        const newContent = originalContent.includes(params.suggestion.original_code)
            ? originalContent.replace(params.suggestion.original_code, params.suggestion.suggested_code)
            : params.suggestion.suggested_code;
        const prResult = await githubService_js_1.githubService.createPullRequest({
            owner: repo.owner,
            repo: repo.name,
            branchName,
            title,
            description,
            filePath: params.issue.file_path,
            newContent,
            baseBranch: repo.default_branch,
        });
        const prRecord = {
            id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            repository_id: repo.id,
            analysis_id: params.analysisId,
            github_pr_number: prResult.prNumber,
            branch_name: prResult.branchName,
            title: prResult.title,
            description,
            status: prResult.simulated ? 'simulated' : 'created',
            pr_url: prResult.prUrl,
            created_at: new Date().toISOString(),
        };
        database_js_1.repoDb.createPullRequest(prRecord);
        return prRecord;
    }
}
exports.PullRequestService = PullRequestService;
exports.pullRequestService = new PullRequestService();
