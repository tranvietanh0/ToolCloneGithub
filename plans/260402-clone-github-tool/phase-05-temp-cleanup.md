# Phase 05: Temp Cleanup

## Context
Critical for reliability - ensure temp files don't accumulate on disk.

## Overview
Manage temporary directory lifecycle with auto-cleanup on success, failure, and process termination.

## Key Insights
- Use Node.js `os.tmpdir()` for platform-appropriate temp location
- Create unique subdirectory per run to allow cleanup tracking
- Use `process.on('exit')` and `process.on('SIGINT')` handlers
- `fs.rmSync()` with `recursive: true` for guaranteed cleanup
- Cleanup AFTER successful push, not after clone

## Requirements
- Create temp dir at `{os.tmpdir()}/github-cloner-{timestamp}/`
- Delete temp dir after successful push of ALL repos
- Delete temp dir on process exit (SIGINT, SIGTERM)
- Handle cleanup errors gracefully (log, don't throw)

## Architecture
```typescript
// src/utils/temp.ts
import fs from 'fs';
import os from 'os';
import path from 'path';

export class TempDir {
  private dirPath: string;
  private cleaned = false;

  constructor(prefix = 'github-cloner') {
    const timestamp = Date.now();
    this.dirPath = path.join(os.tmpdir(), `${prefix}-${timestamp}`);
  }

  get path(): string {
    return this.dirPath;
  }

  create(): void {
    fs.mkdirSync(this.dirPath, { recursive: true });
  }

  cleanup(): void {
    if (this.cleaned) return;
    
    try {
      fs.rmSync(this.dirPath, { recursive: true, force: true });
      this.cleaned = true;
    } catch (error) {
      console.error(`Failed to cleanup temp dir: ${error}`);
    }
  }

  registerCleanupHandlers(): void {
    const cleanup = () => this.cleanup();
    
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }
}
```

## Implementation Steps

### 5.1 Create TempDir class
```typescript
// src/utils/temp.ts
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Logger } from './logger.js';

export class TempDir {
  private dirPath: string;
  private cleaned = false;

  constructor(prefix = 'github-cloner') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.dirPath = path.join(os.tmpdir(), `${prefix}-${timestamp}`);
  }

  get path(): string {
    return this.dirPath;
  }

  create(logger: Logger): void {
    fs.mkdirSync(this.dirPath, { recursive: true });
    logger.info(`Created temp directory: ${this.dirPath}`);
  }

  cleanup(logger: Logger): void {
    if (this.cleaned) return;

    try {
      if (fs.existsSync(this.dirPath)) {
        fs.rmSync(this.dirPath, { recursive: true, force: true });
        logger.success(`Cleaned up temp directory: ${this.dirPath}`);
      }
      this.cleaned = true;
    } catch (error) {
      logger.error(`Failed to cleanup temp dir: ${error}`);
    }
  }

  registerCleanupHandlers(logger: Logger): void {
    // Cleanup on normal exit
    process.on('exit', () => this.cleanup(logger));
    
    // Cleanup on Ctrl+C
    process.on('SIGINT', () => {
      this.cleanup(logger);
      process.exit(130);
    });
    
    // Cleanup on termination
    process.on('SIGTERM', () => {
      this.cleanup(logger);
      process.exit(143);
    });
  }
}
```

### 5.2 Integrate with main flow
```typescript
// In src/index.ts
const tempDir = new TempDir();
tempDir.create(logger);
tempDir.registerCleanupHandlers(logger);

try {
  // ... clone and push operations
  tempDir.cleanup(logger); // After success
} catch (error) {
  tempDir.cleanup(logger); // After failure
}
```

### 5.3 Create barrel export
```typescript
// src/utils/index.ts
export { Logger } from './logger.js';
export { TempDir } from './temp.js';
```

## Todo List
- [ ] Create `src/utils/temp.ts` with TempDir class
- [ ] Implement `create()`, `cleanup()`, `registerCleanupHandlers()`
- [ ] Integrate cleanup in main index.ts
- [ ] Test cleanup on Ctrl+C (SIGINT)
- [ ] Verify no temp files remain after run

## Success Criteria
- Temp directory created in `os.tmpdir()`
- Temp directory deleted after successful completion
- Temp directory deleted on SIGINT/SIGTERM
- Cleanup errors logged but don't crash

## Risk Assessment
- **Medium**: Some files may be locked during git operations
- **Low**: `rmSync` with `force: true` handles missing files
- **High**: Must test cleanup handlers manually
