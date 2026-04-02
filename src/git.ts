import simpleGit, { SimpleGit } from 'simple-git';
import { logger } from './logger.js';
import type { RepoInfo, CloneResult } from './types.js';

export class GitOperations {
  private token: string;
  private targetUsername: string;

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

  async cloneAndPush(repo: RepoInfo, tempDir: string): Promise<CloneResult> {
    const startTime = Date.now();
    const result: CloneResult = { repo: repo.name, success: false };

    try {
      logger.progress(`Cloning ${repo.name}...`);

      const git: SimpleGit = simpleGit();
      const authCloneUrl = this.getAuthCloneUrl(repo.cloneUrl);
      const mirrorPath = `${tempDir}/${repo.name}.git`;

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
      const duration = Date.now() - startTime;
      result.success = false;
      result.duration = duration;
      result.error = error instanceof Error ? error.message : String(error);

      logger.error(`✗ ${repo.name}: ${result.error}`);

      return result;
    }
  }
}
