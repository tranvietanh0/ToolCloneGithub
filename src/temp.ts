import { mkdtempSync, rmSync } from 'fs';
import { tmpdir, platform } from 'os';
import { join } from 'path';
import { logger } from './logger.js';

export class TempDirectory {
  private path: string;
  private cleanupHandlers: Array<() => void> = [];

  constructor() {
    const prefix = join(tmpdir(), 'github-cloner-');
    this.path = mkdtempSync(prefix);
    logger.info(`Created temp directory: ${this.path}`);

    this.setupCleanupHandlers();
  }

  getPath(): string {
    return this.path;
  }

  private setupCleanupHandlers() {
    const cleanup = () => {
      this.cleanup();
    };

    const nodeCleanup = () => {
      cleanup();
    };

    process.on('SIGINT', nodeCleanup);
    process.on('SIGTERM', nodeCleanup);
    process.on('exit', nodeCleanup);

    this.cleanupHandlers.push(() => {
      process.off('SIGINT', nodeCleanup);
      process.off('SIGTERM', nodeCleanup);
      process.off('exit', nodeCleanup);
    });
  }

  cleanup() {
    try {
      rmSync(this.path, { recursive: true, force: true });
      logger.info(`Cleaned up temp directory: ${this.path}`);
    } catch (error) {
      logger.warn(`Failed to cleanup temp directory: ${error}`);
    }

    for (const handler of this.cleanupHandlers) {
      try {
        handler();
      } catch {
        // Ignore handler errors
      }
    }
  }
}

export function createTempDir(): TempDirectory {
  return new TempDirectory();
}
