# Phase 07: Testing

## Context
Quality assurance - unit tests for core logic, integration tests for full flow.

## Overview
Create comprehensive test suite with Vitest covering all major components.

## Key Insights
- Vitest is faster than Jest with V8-based engine
- Use mocking for GitHub API calls (nock or MSW)
- Test cleanup handlers by simulating process exit
- Integration tests need real git - use test git server or mock simple-git

## Requirements
- Unit tests for CLI parsing, error handling, retry logic
- Integration tests for GitCloner (mock simple-git)
- Test cleanup handlers with SIGINT simulation
- Run tests in CI with `npm test`

## Architecture
```
tests/
├── unit/
│   ├── cli.test.ts
│   ├── errors.test.ts
│   ├── retry.test.ts
│   └── temp.test.ts
└── integration/
    └── cloner.test.ts
```

## Implementation Steps

### 7.1 Configure Vitest
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

### 7.2 Test CLI parsing
```typescript
// tests/unit/cli.test.ts
import { describe, it, expect } from 'vitest';
import { parseCli } from '../../src/cli/index.js';

describe('CLI Parsing', () => {
  it('parses valid arguments', () => {
    const opts = parseCli([
      'node', 'test',
      '--org', 'my-org',
      '--token', 'ghp_test',
      '--target', 'my-user'
    ]);
    
    expect(opts.org).toBe('my-org');
    expect(opts.token).toBe('ghp_test');
    expect(opts.target).toBe('my-user');
    expect(opts.parallel).toBe(3);
  });

  it('throws on missing required arguments', () => {
    expect(() => parseCli(['node', 'test', '--org', 'my-org']))
      .toThrow();
  });
});
```

### 7.3 Test retry logic
```typescript
// tests/unit/retry.test.ts
import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../../src/utils/retry.js';

describe('withRetry', () => {
  it('returns result on success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn, { maxRetries: 3 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    
    const result = await withRetry(fn, { maxRetries: 2, baseDelayMs: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fail'));
    
    await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 10 }))
      .rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
```

### 7.4 Test temp cleanup
```typescript
// tests/unit/temp.test.ts
import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import { TempDir } from '../../src/utils/temp.js';
import { Logger } from '../../src/utils/logger.js';

describe('TempDir', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    progress: vi.fn(),
  } as any;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates temp directory', () => {
    const temp = new TempDir('test-cloner');
    temp.create(mockLogger);
    expect(fs.existsSync(temp.path)).toBe(true);
    temp.cleanup(mockLogger);
  });

  it('cleans up directory', () => {
    const temp = new TempDir('test-cloner');
    temp.create(mockLogger);
    temp.cleanup(mockLogger);
    expect(fs.existsSync(temp.path)).toBe(false);
  });

  it('registers SIGINT handler', () => {
    const temp = new TempDir('test-cloner');
    temp.create(mockLogger);
    temp.registerCleanupHandlers(mockLogger);
    
    const handlers = process.listeners('SIGINT');
    expect(handlers.length).toBeGreaterThan(0);
    
    temp.cleanup(mockLogger);
  });
});
```

### 7.5 Test error summary
```typescript
// tests/unit/errors.test.ts
import { describe, it, expect } from 'vitest';
import { ClonerError } from '../../src/utils/errors.js';

describe('ClonerError', () => {
  it('creates error with context', () => {
    const error = new ClonerError('Clone failed', 'my-repo', 'clone');
    expect(error.message).toBe('Clone failed');
    expect(error.repo).toBe('my-repo');
    expect(error.operation).toBe('clone');
  });

  it('is retryable for network errors', () => {
    const error = new ClonerError('Network timeout', 'my-repo', 'clone', true);
    expect(error.retryable).toBe(true);
  });
});
```

### 7.6 Add npm test script
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## Todo List
- [ ] Configure Vitest in `vitest.config.ts`
- [ ] Create `tests/unit/` directory
- [ ] Write CLI parsing tests
- [ ] Write retry logic tests
- [ ] Write temp cleanup tests
- [ ] Write error handling tests
- [ ] Add `npm test` to package.json scripts
- [ ] Verify all tests pass

## Success Criteria
- All unit tests pass
- `npm test` exits with code 0
- Coverage includes all utility functions
- Tests are fast (<10s for unit tests)

## Risk Assessment
- **Low**: Vitest is well-established and stable
- **Medium**: Mocking simple-git may be complex - use interface testing
- **Low**: Integration tests need actual git - use skip tag for CI
