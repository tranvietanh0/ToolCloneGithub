import { Octokit } from '@octokit/rest';
import type { RepoInfo } from './types.js';
import { logger } from './logger.js';

export class GitHubClient {
  private octokit: Octokit;
  private org: string;
  private username: string;

  constructor(token: string, org: string) {
    this.octokit = new Octokit({ auth: token });
    this.org = org;
    this.username = '';
  }

  async getUsername(): Promise<string> {
    if (!this.username) {
      const { data } = await this.octokit.users.getAuthenticated();
      this.username = data.login;
    }
    return this.username;
  }

  async listOrgRepos(options: { includePrivate?: boolean; includePublic?: boolean } = {}): Promise<RepoInfo[]> {
    const { includePrivate = true, includePublic = true } = options;
    const repos: RepoInfo[] = [];
    const perPage = 100;

    logger.info(`Fetching repositories from organization: ${this.org}`);

    try {
      for await (const response of this.octokit.paginate.iterator({
        method: 'GET',
        url: '/orgs/{org}/repos',
        org: this.org,
        per_page: perPage,
        type: 'all',
      })) {
        const data = response.data as Array<{
          name: string;
          clone_url: string;
          private: boolean;
          default_branch: string;
          size: number;
        }>;

        for (const repo of data) {
          if (repo.private && !includePrivate) continue;
          if (!repo.private && !includePublic) continue;

          repos.push({
            name: repo.name,
            cloneUrl: repo.clone_url,
            private: repo.private,
            defaultBranch: repo.default_branch,
            size: repo.size,
          });
        }

        logger.info(`Fetched ${repos.length} repositories...`);
      }

      logger.success(`Total repositories found: ${repos.length}`);
      return repos;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Not Found')) {
          throw new Error(`Organization "${this.org}" not found. Please check the organization name.`);
        }
        if (error.message.includes('Bad credentials')) {
          throw new Error('Invalid GitHub token. Please check your Personal Access Token.');
        }
      }
      throw error;
    }
  }

  async checkRateLimit(): Promise<{ remaining: number; limit: number; reset: Date }> {
    const { data } = await this.octokit.rateLimit.get();
    return {
      remaining: data.rate.remaining,
      limit: data.rate.limit,
      reset: new Date(data.rate.reset * 1000),
    };
  }

  async createRepoIfNotExists(repoName: string, isPrivate: boolean): Promise<boolean> {
    const username = await this.getUsername();
    
    try {
      await this.octokit.repos.get({
        owner: username,
        repo: repoName,
      });
      logger.info(`Repo ${repoName} already exists, skipping creation`);
      return false;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        logger.progress(`Creating repo: ${repoName}`);
        await this.octokit.repos.createForAuthenticatedUser({
          name: repoName,
          private: isPrivate,
          auto_init: false,
        });
        logger.success(`Created repo: ${repoName}`);
        return true;
      }
      throw error;
    }
  }
}
