# Phase 03: GitHub API Integration

## Context
GitHub API integration - authenticate, list org repos, handle pagination.

## Overview
Use Octokit to list all repositories from the organization with proper pagination, rate limit handling, and error recovery.

## Key Insights
- Octokit v21 is the latest stable version
- Use `paginate()` for automatic pagination
- Check rate limit with `rateLimit.get()` before heavy operations
- Filter by `visibility` to get all repos (public/private/internal)
- Use `X-GitHub-Api-Version: 2022-11-28` header for latest features

## Requirements
- Authenticate with PAT using Octokit
- List ALL org repos (handle pagination automatically)
- Respect rate limits with `octokit.rateLimit.get()`
- Handle 403/429 errors with exponential backoff

## Architecture
```typescript
// src/github/client.ts
import { Octokit } from '@octokit/rest';

export interface RepoInfo {
  name: string;
  cloneUrl: string;
  visibility: 'public' | 'private' | 'internal';
  defaultBranch: string;
}

export class GitHubClient {
  constructor(private token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async listOrgRepos(org: string): Promise<RepoInfo[]> {
    const repos: RepoInfo[] = [];
    for await (const response of this.octokit.paginate(
      this.octokit.repos.listForOrg,
      { org, per_page: 100, type: 'all' }
    )) {
      repos.push({
        name: response.name,
        cloneUrl: response.clone_url,
        visibility: response.visibility,
        defaultBranch: response.default_branch,
      });
    }
    return repos;
  }
}
```

## Implementation Steps

### 3.1 Create GitHub client
```typescript
// src/github/client.ts
import { Octokit } from '@octokit/rest';
import { Logger } from '../utils/logger.js';

export interface RepoInfo {
  name: string;
  cloneUrl: string;
  visibility: 'public' | 'private' | 'internal';
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
      userAgent: 'github-org-cloner v1.0.0',
    });
  }

  async listOrgRepos(org: string, logger: Logger): Promise<RepoInfo[]> {
    logger.info(`Fetching repos from organization: ${org}`);
    
    const repos: RepoInfo[] = [];
    for await (const response of this.octokit.paginate(
      this.octokit.repos.listForOrg,
      { org, per_page: 100, type: 'all' }
    )) {
      repos.push({
        name: response.name,
        cloneUrl: response.clone_url,
        visibility: response.visibility as 'public' | 'private' | 'internal',
      });
    }
    
    logger.success(`Found ${repos.length} repositories`);
    return repos;
  }
}
```

### 3.2 Add rate limit handling
```typescript
// In GitHubClient class
async checkRateLimit(): Promise<{ remaining: number; reset: Date }> {
  const { data } = await this.octokit.rateLimit.get();
  return {
    remaining: data.rate.remaining,
    reset: new Date(data.rate.reset * 1000),
  };
}

async waitForRateLimit(): Promise<void> {
  const { reset, remaining } = await this.checkRateLimit();
  if (remaining < 10) {
    const waitMs = reset.getTime() - Date.now();
    logger.info(`Rate limit low, waiting ${Math.ceil(waitMs / 1000)}s...`);
    await new Promise(r => setTimeout(r, waitMs));
  }
}
```

### 3.3 Create index file
```typescript
// src/github/index.ts
export { GitHubClient, RepoInfo } from './client.js';
```

## Todo List
- [ ] Create `src/github/client.ts` with Octokit setup
- [ ] Implement `listOrgRepos()` with pagination
- [ ] Add rate limit checking and waiting
- [ ] Create `src/github/index.ts` barrel export
- [ ] Test with actual GitHub API (need test token)

## Success Criteria
- Lists all repos from an org with correct pagination
- Rate limit check executes before API calls
- Returns `RepoInfo[]` with name, cloneUrl, visibility

## Risk Assessment
- **Medium**: Need valid PAT with `repo` scope for private repos
- GitHub API changes could break - use explicit API version header
- Token exposure in logs - sanitize output
