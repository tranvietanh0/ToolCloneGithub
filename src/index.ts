import { parseCliArgs, printBanner, printUsage } from './cli.js';
import { GitHubClient } from './github.js';
import { GitOperations } from './git.js';
import { createTempDir } from './temp.js';
import { logger } from './logger.js';
import type { CloneSummary, CloneResult } from './types.js';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSequential<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<CloneResult>
): Promise<CloneResult[]> {
  const results: CloneResult[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = fn(item).then((result) => {
      results.push(result);
    });

    if (concurrency <= 1) {
      await promise;
    } else {
      executing.push(promise);
      if (executing.length >= concurrency) {
        await Promise.race(executing);
        const completedIndex = executing.findIndex(
          async (p) => (await Promise.race([p, Promise.resolve()])) === undefined
        );
        if (completedIndex !== -1) {
          executing.splice(completedIndex, 1);
        }
      }
    }
  }

  if (concurrency > 1) {
    await Promise.all(executing);
  }

  return results;
}

async function main(args: string[]) {
  printBanner();

  let options;
  try {
    options = parseCliArgs(args);
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      printUsage();
      process.exit(1);
    }
    throw error;
  }

  const { org, token, targetUsername, parallel = 2, includePrivate = true, includePublic = true } = options;

  logger.header('Configuration');
  logger.info(`Organization: ${org}`);
  logger.info(`Target user: ${targetUsername}`);
  logger.info(`Parallel clones: ${parallel}`);
  logger.info(`Include private: ${includePrivate}`);
  logger.info(`Include public: ${includePublic}`);

  const githubClient = new GitHubClient(token, org);

  logger.header('Step 1: Fetching Repositories');
  let repos;
  try {
    repos = await githubClient.listOrgRepos({ includePrivate, includePublic });
  } catch (error) {
    logger.error(`Failed to fetch repositories: ${error}`);
    process.exit(1);
  }

  if (repos.length === 0) {
    logger.warn('No repositories found matching the criteria.');
    process.exit(0);
  }

  logger.header(`Step 2: Cloning ${repos.length} Repositories`);
  
  const tempDir = createTempDir();
  const gitOps = new GitOperations(token, targetUsername);

  const startTime = Date.now();

  const results: CloneResult[] = [];
  let completed = 0;

  const cloneWithProgress = async (repo: typeof repos[0]): Promise<CloneResult> => {
    try {
      await githubClient.createRepoIfNotExists(repo.name, repo.private);
      const result = await gitOps.cloneAndPush(repo, tempDir.getPath());
      completed++;
      logger.progress(`Progress: ${completed}/${repos.length}`);
      return result;
    } catch (error) {
      completed++;
      logger.progress(`Progress: ${completed}/${repos.length}`);
      return {
        repo: repo.name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  try {
    for (let i = 0; i < repos.length; i += parallel) {
      const batch = repos.slice(i, i + parallel);
      const batchResults = await Promise.all(batch.map(cloneWithProgress));
      results.push(...batchResults);
    }
  } finally {
    tempDir.cleanup();
  }

  const totalDuration = Date.now() - startTime;

  const summary: CloneSummary = {
    total: repos.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
    totalDuration,
  };

  logger.header('Summary');
  logger.info(`Total repositories: ${summary.total}`);
  logger.success(`Succeeded: ${summary.succeeded}`);
  if (summary.failed > 0) {
    logger.error(`Failed: ${summary.failed}`);
  }
  logger.info(`Total time: ${(totalDuration / 1000).toFixed(1)}s`);

  if (summary.failed > 0) {
    logger.subHeader('Failed Repositories');
    for (const result of results.filter((r) => !r.success)) {
      logger.error(`  - ${result.repo}: ${result.error}`);
    }
  }

  if (summary.failed > 0 && summary.succeeded === 0) {
    process.exit(1);
  }
}

main(process.argv).catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
