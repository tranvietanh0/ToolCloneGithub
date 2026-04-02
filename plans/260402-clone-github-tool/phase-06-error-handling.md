# Phase 06: Error Handling

## Context
Production reliability - graceful degradation, detailed logging, actionable errors.

## Overview
Implement comprehensive error handling with retry logic, detailed error reporting, and summary output.

## Key Insights
- Individual repo failures should NOT stop entire process
- GitHub API errors need specific handling (401, 403, 404, rate limit)
- Network errors are often transient - implement retry with backoff
- Log EVERYTHING with appropriate levels for debugging
- Final summary shows succeeded/failed with error details

## Requirements
- Retry transient errors (network, 5xx) with exponential backoff
- Distinguish between fatal errors (bad token) and recoverable (repo not found)
- Provide detailed error summary at end
- All errors logged with context (repo name, operation, error message)

## Architecture
```typescript
// src/utils/errors.ts
export class ClonerError extends Error {
  constructor(
    message: string,
    public repo?: string,
    public operation?: 'clone' | 'push' | 'api',
    public retryable = false
  ) {
    super(message);
    this.name = 'ClonerError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) break;
      
      // Only retry on network/5xx errors, not 4xx
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`Retry ${attempt}/${maxRetries} after ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  throw lastError!;
}
```

## Implementation Steps

### 6.1 Create error types
```typescript
// src/utils/errors.ts
export class ClonerError extends Error {
  constructor(
    message: string,
    public repo?: string,
    public operation?: 'clone' | 'push' | 'api' | 'auth',
    public retryable = false
  ) {
    super(message);
    this.name = 'ClonerError';
  }
}

export interface ErrorSummary {
  total: number;
  succeeded: number;
  failed: number;
  errors: { repo: string; error: string }[];
}
```

### 6.2 Add retry logic
```typescript
// src/utils/retry.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; onRetry?: (attempt: number, error: Error) => void } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, onRetry } = options;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (onRetry && attempt < maxRetries) {
        onRetry(attempt, lastError);
      }
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError!;
}
```

### 6.3 Create summary reporter
```typescript
// src/utils/summary.ts
import chalk from 'chalk';
import { ErrorSummary } from './errors.js';

export function printSummary(summary: ErrorSummary): void {
  console.log('\n' + '='.repeat(60));
  console.log(chalk.bold('CLONE SUMMARY'));
  console.log('='.repeat(60));
  
  console.log(chalk.green(`  Succeeded: ${summary.succeeded}/${summary.total}`));
  console.log(chalk.red(`  Failed: ${summary.failed}/${summary.total}`));
  
  if (summary.errors.length > 0) {
    console.log('\n' + chalk.red('ERRORS:'));
    for (const { repo, error } of summary.errors) {
      console.log(chalk.red(`  - ${repo}: ${error}`));
    }
  }
  
  console.log('='.repeat(60) + '\n');
}
```

### 6.4 Update main flow with error handling
```typescript
// In src/index.ts
import { withRetry } from './utils/retry.js';
import { printSummary } from './utils/summary.js';

const summary = { total: repos.length, succeeded: 0, failed: 0, errors: [] };

for (const repo of repos) {
  try {
    await withRetry(
      () => cloner.cloneAndPush(repo, tempDir.path, targetUrl, onProgress),
      { maxRetries: 2 }
    );
    summary.succeeded++;
  } catch (error) {
    summary.failed++;
    summary.errors.push({ repo: repo.name, error: String(error) });
  }
}

printSummary(summary);
```

## Todo List
- [ ] Create `src/utils/errors.ts` with ClonerError class
- [ ] Create `src/utils/retry.ts` with withRetry function
- [ ] Create `src/utils/summary.ts` with printSummary
- [ ] Update main flow with try/catch per repo
- [ ] Test with a failing repo (bad name)
- [ ] Verify retry logic works for transient errors

## Success Criteria
- Individual repo failure shows error but continues
- Final summary shows all successes and failures
- Retry happens for transient errors
- Fatal errors (auth) exit immediately with clear message

## Risk Assessment
- **Medium**: Too many retries may hit rate limits
- **Low**: Error summary formatting should be tested
- **High**: Test Ctrl+C during active clone to verify cleanup
