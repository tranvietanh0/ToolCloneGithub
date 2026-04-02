# Phase 04: Git Operations

## Context
Core functionality - clone repos with mirror flag and push to target account.

## Overview
Implement `git clone --mirror` for full history preservation and `git push --mirror` to target account using simple-git.

## Key Insights
- `git clone --mirror` clones ALL refs (branches, tags, all commits)
- `git push --mirror` pushes all refs to new remote
- simple-git provides promise-based API over git commands
- `--mirror` preserves branches as branches, tags as tags (not just HEAD)
- Use `git push --mirror` with `git remote set-url` to change remote

## Requirements
- Clone with `--mirror` flag for full history
- Push to new remote with `--mirror` to preserve all refs
- Support parallel clone operations with queue management
- Handle large repos (git config for large files)

## Architecture
```typescript
// src/git/cloner.ts
import simpleGit, { SimpleGit } from 'simple-git';
import { Logger } from '../utils/logger.js';

export class GitCloner {
  constructor(private logger: Logger) {}

  async cloneMirror(repoUrl: string, repoName: string, tempDir: string): Promise<void> {
    const git: SimpleGit = simpleGit();
    const repoPath = `${tempDir}/${repoName}`;
    
    this.logger.info(`Cloning ${repoName} to ${repoPath}`);
    
    await git.clone(repoUrl, repoPath, ['--mirror']);
    
    this.logger.success(`Mirrored ${repoName}`);
  }

  async pushMirror(repoPath: string, targetUrl: string): Promise<void> {
    const git: SimpleGit = simpleGit(repoPath);
    
    // Update remote URL to target
    await git.remote(['set-url', 'origin', targetUrl]);
    
    // Push all refs to target
    await git.push('--mirror');
    
    this.logger.success(`Pushed to ${targetUrl}`);
  }
}
```

## Implementation Steps

### 4.1 Create GitCloner class
```typescript
// src/git/cloner.ts
import simpleGit, { SimpleGit } from 'simple-git';
import { Logger } from '../utils/logger.js';
import { RepoInfo } from '../github/client.js';

export class GitCloner {
  constructor(private logger: Logger) {}

  async cloneMirror(repo: RepoInfo, tempDir: string): Promise<string> {
    const git: SimpleGit = simpleGit();
    const repoPath = `${tempDir}/${repo.name}`;
    
    this.logger.progress(`Cloning ${repo.name}...`);
    
    await git.clone(repo.cloneUrl, repoPath, ['--mirror']);
    
    return repoPath;
  }

  async pushMirror(repoPath: string, targetUrl: string, repoName: string): Promise<void> {
    const git: SimpleGit = simpleGit(repoPath);
    
    // Update remote URL to target account
    await git.remote(['set-url', 'origin', targetUrl]);
    
    // Push all refs (branches, tags, commits)
    await git.push('--mirror', '--force');
    
    this.logger.success(`Pushed ${repoName}`);
  }

  async cloneAndPush(
    repo: RepoInfo, 
    tempDir: string, 
    targetUrl: string,
    onProgress: (current: number, total: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    const repoPath = `${tempDir}/${repo.name}`;
    
    try {
      await this.cloneMirror(repo, tempDir);
      await this.pushMirror(repoPath, targetUrl, repo.name);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed ${repo.name}: ${message}`);
      return { success: false, error: message };
    }
  }
}
```

### 4.2 Create parallel execution manager
```typescript
// src/git/queue.ts
export class CloneQueue {
  constructor(
    private cloner: GitCloner,
    private parallel: number = 3
  ) {}

  async processAll(
    repos: RepoInfo[],
    tempDir: string,
    targetUrl: string,
    onProgress: (current: number, total: number, repo: string) => void
  ): Promise<{ succeeded: string[]; failed: { repo: string; error: string }[] }> {
    const succeeded: string[] = [];
    const failed: { repo: string; error: string }[] = [];
    let current = 0;

    // Process in chunks of `parallel` size
    for (let i = 0; i < repos.length; i += this.parallel) {
      const chunk = repos.slice(i, i + this.parallel);
      
      const results = await Promise.all(
        chunk.map(async (repo) => {
          current++;
          onProgress(current, repos.length, repo.name);
          const result = await this.cloner.cloneAndPush(repo, tempDir, targetUrl, onProgress);
          return { repo: repo.name, ...result };
        })
      );

      for (const result of results) {
        if (result.success) {
          succeeded.push(result.repo);
        } else {
          failed.push({ repo: result.repo, error: result.error! });
        }
      }
    }

    return { succeeded, failed };
  }
}
```

### 4.3 Create barrel export
```typescript
// src/git/index.ts
export { GitCloner } from './cloner.js';
export { CloneQueue } from './queue.js';
```

## Todo List
- [ ] Create `src/git/cloner.ts` with clone/push mirror operations
- [ ] Add error handling in `cloneAndPush()`
- [ ] Create `src/git/queue.ts` for parallel processing
- [ ] Implement chunk-based parallel execution
- [ ] Create `src/git/index.ts` barrel export
- [ ] Test with a single small repo

## Success Criteria
- Clones repo with full history (check with `git log --all`)
- Pushes all branches and tags to target
- Parallel processing works correctly
- Failed repos don't stop the queue

## Risk Assessment
- **High**: Large repos may take very long time - add timeout handling
- **Medium**: Git credentials in temp paths - ensure cleanup
- **Medium**: Network failures - add retry logic for push
