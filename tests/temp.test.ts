import { describe, it, expect, beforeEach } from 'vitest';
import { TempDirectory, createTempDir } from '../src/temp.js';
import { existsSync, rmSync } from 'fs';

describe('TempDirectory', () => {
  describe('constructor and getPath', () => {
    it('should create temp directory and return valid path', () => {
      const tempDir = new TempDirectory();
      const path = tempDir.getPath();
      
      expect(path).toContain('github-cloner-');
      expect(path.length).toBeGreaterThan(0);
      expect(existsSync(path)).toBe(true);
      
      tempDir.cleanup();
    });

    it('should create unique temp directories for multiple instances', () => {
      const tempDir1 = new TempDirectory();
      const tempDir2 = new TempDirectory();
      
      expect(tempDir1.getPath()).not.toBe(tempDir2.getPath());
      
      tempDir1.cleanup();
      tempDir2.cleanup();
    });
  });

  describe('getPath', () => {
    it('should return consistent path across multiple calls', () => {
      const tempDir = new TempDirectory();
      const path1 = tempDir.getPath();
      const path2 = tempDir.getPath();
      
      expect(path1).toBe(path2);
      
      tempDir.cleanup();
    });
  });

  describe('cleanup', () => {
    it('should remove temp directory after cleanup', () => {
      const tempDir = new TempDirectory();
      const path = tempDir.getPath();
      
      expect(existsSync(path)).toBe(true);
      
      tempDir.cleanup();
      
      expect(existsSync(path)).toBe(false);
    });
  });
});

describe('createTempDir', () => {
  it('should return a TempDirectory instance', () => {
    const tempDir = createTempDir();
    
    expect(tempDir).toBeInstanceOf(TempDirectory);
    expect(typeof tempDir.getPath()).toBe('string');
    expect(tempDir.getPath()).toContain('github-cloner-');
    
    tempDir.cleanup();
  });
});
