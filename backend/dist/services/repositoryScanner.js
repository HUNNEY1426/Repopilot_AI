"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repositoryScanner = exports.RepositoryScanner = void 0;
const githubService_js_1 = require("./githubService.js");
const fileFilter_js_1 = require("../utils/fileFilter.js");
class RepositoryScanner {
    async scan(owner, repo, defaultBranch = 'main') {
        const details = await githubService_js_1.githubService.getRepositoryDetails(owner, repo);
        const branch = details.default_branch || defaultBranch;
        const { files, tree, commitSha, totalFiles, totalDirectories } = await githubService_js_1.githubService.fetchRepositoryFiles(owner, repo, branch);
        let testFilesCount = 0;
        let docFilesCount = 0;
        for (const f of files) {
            if ((0, fileFilter_js_1.isTestFile)(f.path))
                testFilesCount++;
            if ((0, fileFilter_js_1.isDocumentationFile)(f.path))
                docFilesCount++;
        }
        return {
            name: details.name,
            owner: details.owner,
            language: details.language,
            defaultBranch: branch,
            commitSha,
            totalFiles,
            totalDirectories,
            testFiles: testFilesCount,
            documentationFiles: docFilesCount,
            files,
            tree,
        };
    }
}
exports.RepositoryScanner = RepositoryScanner;
exports.repositoryScanner = new RepositoryScanner();
