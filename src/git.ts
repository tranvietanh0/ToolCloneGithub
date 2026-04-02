import simpleGit, { SimpleGit } from 'simple-git';
import { logger } from './logger.js';
import type { RepoInfo, CloneResult } from './types.js';

export class GitOperations {
  private token: string;
  private targetUsername: string;
  private maxRetries: number = 2;

  constructor(token: string, targetUsername: string) {
    this.token = token;
    this.targetUsername = targetUsername;
  }

  private getAuthCloneUrl(repoUrl: string): string {
    const urlObj = new URL(repoUrl);
    urlObj.username = 'x-access-token';
    urlObj.password = this.token;
    return urlObj.toString();
  }

  private getTargetAuthUrl(repoName: string): string {
    return `https://x-access-token:${this.token}@github.com/${this.targetUsername}/${repoName}.git`;
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async cloneAndPush(repo: RepoInfo, tempDir: string): Promise<CloneResult> {
    const startTime = Date.now();
    const result: CloneResult = { repo: repo.name, success: false };

    logger.progress(`Cloning ${repo.name} (${this.formatSize(repo.size * 1024)})...`);

    const git: SimpleGit = simpleGit();
    const authCloneUrl = this.getAuthCloneUrl(repo.cloneUrl);
    const mirrorPath = `${tempDir}/${repo.name}.git`;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.progress(`Retry ${attempt}/${this.maxRetries} for ${repo.name}...`);
        }

        await git.clone(authCloneUrl, mirrorPath, ['--mirror']);

        logger.progress(`Pushing ${repo.name} to ${this.targetUsername}...`);

        const pushGit: SimpleGit = simpleGit(mirrorPath);
        const targetUrl = this.getTargetAuthUrl(repo.name);

        await pushGit.push(targetUrl, '--all', ['--mirror']);

        const duration = Date.now() - startTime;
        result.success = true;
        result.duration = duration;

        logger.success(`✓ ${repo.name} (${(duration / 1000).toFixed(1)}s)`);

        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        if (attempt === this.maxRetries) {
          const duration = Date.now() - startTime;
          result.success = false;
          result.duration = duration;
          result.error = errorMsg;

          logger.error(`✗ ${repo.name}: ${errorMsg}`);
          return result;
        }

        logger.warn(`⚠ ${repo.name}: ${errorMsg} - retrying...`);
        
        try {
          const fs = await import('fs');
          if (fs.existsSync(mirrorPath)) {
            fs.rmSync(mirrorPath, { recursive: true, force: true });
          }
        } catch {}
      }
    }

    return result;
  }
}
