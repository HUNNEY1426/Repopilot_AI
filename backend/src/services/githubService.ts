import { shouldIgnorePath, isSupportedSourceFile } from '../utils/fileFilter.js';
import { DEMO_REPOSITORIES, type DemoRepo } from './demoRepositories.js';
import type { RepoFile, RepoTreeNode } from '../types/index.js';
import { repoDb } from '../db/database.js';

export interface ParsedRepoUrl {
  owner: string;
  repo: string;
}

export function parseGitHubUrl(input: string): ParsedRepoUrl | null {
  if (!input) return null;
  let cleaned = input.trim();

  // Strip trailing slashes and .git
  cleaned = cleaned.replace(/\.git$/i, '').replace(/\/$/, '');

  // Format: https://github.com/owner/repo or github.com/owner/repo
  const match = cleaned.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  // Format: owner/repo
  const simpleMatch = cleaned.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (simpleMatch) {
    return { owner: simpleMatch[1], repo: simpleMatch[2] };
  }

  return null;
}

export class GitHubService {
  private getToken(): string | undefined {
    return repoDb.getSetting('github_token') || process.env.GITHUB_TOKEN || undefined;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'RepoPilot-AI-Reviewer',
      Accept: 'application/vnd.github.v3+json',
    };
    const token = this.getToken();
    if (token) {
      headers.Authorization = `token ${token}`;
    }
    return headers;
  }

  async getRepositoryDetails(owner: string, repo: string) {
    // Check if it's a demo repo
    const demo = DEMO_REPOSITORIES.find(
      (d) => d.owner.toLowerCase() === owner.toLowerCase() && d.name.toLowerCase() === repo.toLowerCase()
    );
    if (demo) {
      return {
        id: demo.id,
        owner: demo.owner,
        name: demo.name,
        description: demo.description,
        default_branch: demo.defaultBranch,
        language: demo.language,
        url: demo.url,
        isDemo: true,
      };
    }

    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found or is private.`);
      }
      if (response.status === 403) {
        throw new Error(
          'GitHub API rate limit exceeded. Please configure a GitHub Token in settings or try one of the Demo Repositories.'
        );
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return {
      id: String(data.id),
      owner: data.owner.login,
      name: data.name,
      description: data.description || '',
      default_branch: data.default_branch || 'main',
      language: data.language || 'JavaScript',
      url: data.html_url,
      isDemo: false,
    };
  }

  async fetchRepositoryFiles(owner: string, repo: string, defaultBranch = 'main'): Promise<{
    files: RepoFile[];
    tree: RepoTreeNode[];
    commitSha: string;
    totalFiles: number;
    totalDirectories: number;
  }> {
    // 1. Check demo repo
    const demo = DEMO_REPOSITORIES.find(
      (d) => d.owner.toLowerCase() === owner.toLowerCase() && d.name.toLowerCase() === repo.toLowerCase()
    );
    if (demo) {
      const tree: RepoTreeNode[] = demo.files.map((f) => ({
        path: f.path,
        type: 'file',
        size: f.size,
      }));
      return {
        files: demo.files,
        tree,
        commitSha: 'a83f92d-demo',
        totalFiles: demo.files.length,
        totalDirectories: 3,
      };
    }

    // 2. Fetch live repo git tree
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    const treeRes = await fetch(treeUrl, { headers: this.getHeaders() });

    if (!treeRes.ok) {
      throw new Error(`Failed to fetch file tree: ${treeRes.status} ${treeRes.statusText}`);
    }

    const treeData = (await treeRes.json()) as any;
    const treeItems: Array<{ path: string; type: string; size?: number; sha: string }> = treeData.tree || [];
    const commitSha = treeData.sha ? treeData.sha.substring(0, 7) : 'head';

    let totalFiles = 0;
    let totalDirectories = 0;

    const filteredFilesToFetch: Array<{ path: string; size: number }> = [];
    const treeNodes: RepoTreeNode[] = [];

    for (const item of treeItems) {
      if (item.type === 'tree') {
        totalDirectories++;
        continue;
      }
      totalFiles++;

      if (shouldIgnorePath(item.path)) {
        continue;
      }

      treeNodes.push({
        path: item.path,
        type: 'file',
        size: item.size,
      });

      if (isSupportedSourceFile(item.path)) {
        // Enforce max individual file limit to prevent huge downloads
        if (!item.size || item.size <= 250000) {
          filteredFilesToFetch.push({ path: item.path, size: item.size || 0 });
        }
      }
    }

    // Prioritize high-signal files (package manifests, config, entry points, src files)
    const prioritized = filteredFilesToFetch.sort((a, b) => {
      const priorityNames = ['package.json', 'readme.md', 'server.js', 'index.js', 'index.ts', 'app.js', 'app.ts'];
      const aName = a.path.split('/').pop()?.toLowerCase() || '';
      const bName = b.path.split('/').pop()?.toLowerCase() || '';
      const aP = priorityNames.indexOf(aName);
      const bP = priorityNames.indexOf(bName);
      if (aP !== -1 && bP !== -1) return aP - bP;
      if (aP !== -1) return -1;
      if (bP !== -1) return 1;
      return 0;
    });

    // Cap at 40 key files per scan for rate limits and performance
    const targetFiles = prioritized.slice(0, 40);

    const files: RepoFile[] = [];

    // Fetch contents concurrently in batches of 5
    const batchSize = 5;
    for (let i = 0; i < targetFiles.length; i += batchSize) {
      const batch = targetFiles.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (item) => {
          try {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${item.path}`;
            const res = await fetch(rawUrl, { headers: this.getHeaders() });
            if (res.ok) {
              const text = await res.text();
              files.push({
                path: item.path,
                content: text,
                size: item.size || text.length,
              });
            }
          } catch (e) {
            console.error(`Failed to fetch file content for ${item.path}:`, e);
          }
        })
      );
    }

    return {
      files,
      tree: treeNodes,
      commitSha,
      totalFiles,
      totalDirectories,
    };
  }

  async createPullRequest(params: {
    owner: string;
    repo: string;
    branchName: string;
    title: string;
    description: string;
    filePath: string;
    newContent: string;
    baseBranch?: string;
  }) {
    const token = this.getToken();
    const isDemo = DEMO_REPOSITORIES.some(
      (d) => d.owner.toLowerCase() === params.owner.toLowerCase() && d.name.toLowerCase() === params.repo.toLowerCase()
    );

    // If demo or token is not provided, simulate successful PR creation
    if (!token || isDemo) {
      const mockPrNumber = Math.floor(Math.random() * 800) + 100;
      return {
        simulated: true,
        prNumber: mockPrNumber,
        branchName: params.branchName,
        prUrl: `https://github.com/${params.owner}/${params.repo}/pull/${mockPrNumber}`,
        title: params.title,
      };
    }

    // Real GitHub API workflow
    const baseBranch = params.baseBranch || 'main';

    // 1. Get base branch SHA
    const refRes = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/git/ref/heads/${baseBranch}`, {
      headers: this.getHeaders(),
    });
    if (!refRes.ok) {
      throw new Error(`Failed to get base branch reference: ${refRes.status}`);
    }
    const refData = (await refRes.json()) as any;
    const baseSha = refData.object.sha;

    // 2. Create branch
    const branchRes = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/git/refs`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ref: `refs/heads/${params.branchName}`,
        sha: baseSha,
      }),
    });
    if (!branchRes.ok && branchRes.status !== 422) {
      // 422 may mean branch already exists
      throw new Error(`Failed to create branch: ${branchRes.status}`);
    }

    // 3. Get existing file SHA if updating
    let fileSha: string | undefined;
    const fileRes = await fetch(
      `https://api.github.com/repos/${params.owner}/${params.repo}/contents/${params.filePath}?ref=${params.branchName}`,
      { headers: this.getHeaders() }
    );
    if (fileRes.ok) {
      const fileData = (await fileRes.json()) as any;
      fileSha = fileData.sha;
    }

    // 4. Update file
    const contentBase64 = Buffer.from(params.newContent).toString('base64');
    const updateRes = await fetch(
      `https://api.github.com/repos/${params.owner}/${params.repo}/contents/${params.filePath}`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          message: params.title,
          content: contentBase64,
          branch: params.branchName,
          sha: fileSha,
        }),
      }
    );
    if (!updateRes.ok) {
      throw new Error(`Failed to commit file change: ${updateRes.status}`);
    }

    // 5. Create Pull Request
    const prRes = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/pulls`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        title: params.title,
        body: params.description,
        head: params.branchName,
        base: baseBranch,
      }),
    });

    if (!prRes.ok) {
      const err = await prRes.json();
      throw new Error(`Failed to open Pull Request: ${JSON.stringify(err)}`);
    }

    const prData = (await prRes.json()) as any;
    return {
      simulated: false,
      prNumber: prData.number,
      branchName: params.branchName,
      prUrl: prData.html_url,
      title: prData.title,
    };
  }
}

export const githubService = new GitHubService();
