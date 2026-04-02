import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../src/logger.js';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(output).toContain('[INFO]');
    });
  });

  describe('success', () => {
    it('should log success messages', () => {
      logger.success('Success message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(output).toContain('[SUCCESS]');
    });
  });

  describe('progress', () => {
    it('should log progress messages', () => {
      logger.progress('Progress message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(output).toContain('[PROGRESS]');
    });
  });

  describe('setPrefix', () => {
    it('should set prefix for subsequent logs', () => {
      logger.setPrefix('[TEST]');
      logger.info('Prefixed message');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(output).toContain('[TEST]');
    });
  });

  describe('header', () => {
    it('should call console.log', () => {
      logger.header('Test Header');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('subHeader', () => {
    it('should call console.log', () => {
      logger.subHeader('Test SubHeader');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
