import { githubService } from './githubService.js';
import { isTestFile, isDocumentationFile } from '../utils/fileFilter.js';
import type { RepoScanResult } from '../types/index.js';

export class RepositoryScanner {
  async scan(owner: string, repo: string, defaultBranch = 'main'): Promise<RepoScanResult> {
    const details = await githubService.getRepositoryDetails(owner, repo);
    const branch = details.default_branch || defaultBranch;

    const { files, tree, commitSha, totalFiles, totalDirectories } =
      await githubService.fetchRepositoryFiles(owner, repo, branch);

    let testFilesCount = 0;
    let docFilesCount = 0;

    for (const f of files) {
      if (isTestFile(f.path)) testFilesCount++;
      if (isDocumentationFile(f.path)) docFilesCount++;
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

export const repositoryScanner = new RepositoryScanner();
