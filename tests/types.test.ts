import { describe, it, expect } from 'vitest';
import type { CliOptions, RepoInfo, CloneResult, CloneSummary } from '../src/types.js';

describe('Types', () => {
  describe('CliOptions', () => {
    it('should have required fields', () => {
      const options: CliOptions = {
        org: 'test-org',
        token: 'ghp_test',
        targetUsername: 'testuser',
      };

      expect(options.org).toBe('test-org');
      expect(options.token).toBe('ghp_test');
      expect(options.targetUsername).toBe('testuser');
      expect(options.parallel).toBeUndefined();
      expect(options.includePrivate).toBeUndefined();
      expect(options.includePublic).toBeUndefined();
    });

    it('should accept optional fields', () => {
      const options: CliOptions = {
        org: 'test-org',
        token: 'ghp_test',
        targetUsername: 'testuser',
        parallel: 4,
        includePrivate: false,
        includePublic: true,
      };

      expect(options.parallel).toBe(4);
      expect(options.includePrivate).toBe(false);
      expect(options.includePublic).toBe(true);
    });
  });

  describe('RepoInfo', () => {
    it('should have required fields', () => {
      const repo: RepoInfo = {
        name: 'test-repo',
        cloneUrl: 'https://github.com/test-org/test-repo.git',
        private: false,
        defaultBranch: 'main',
        size: 1024,
      };

      expect(repo.name).toBe('test-repo');
      expect(repo.cloneUrl).toBe('https://github.com/test-org/test-repo.git');
      expect(repo.private).toBe(false);
      expect(repo.defaultBranch).toBe('main');
      expect(repo.size).toBe(1024);
    });
  });

  describe('CloneResult', () => {
    it('should represent successful result', () => {
      const result: CloneResult = {
        repo: 'test-repo',
        success: true,
        duration: 5000,
      };

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should represent failed result', () => {
      const result: CloneResult = {
        repo: 'test-repo',
        success: false,
        error: 'Repository not found',
        duration: 1000,
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Repository not found');
    });
  });

  describe('CloneSummary', () => {
    it('should aggregate clone results', () => {
      const results: CloneResult[] = [
        { repo: 'repo1', success: true, duration: 1000 },
        { repo: 'repo2', success: true, duration: 2000 },
        { repo: 'repo3', success: false, error: 'Auth failed', duration: 500 },
      ];

      const summary: CloneSummary = {
        total: 3,
        succeeded: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
        totalDuration: 3500,
      };

      expect(summary.total).toBe(3);
      expect(summary.succeeded).toBe(2);
      expect(summary.failed).toBe(1);
      expect(summary.totalDuration).toBe(3500);
    });
  });
});
