/* =============================================
   Logger Utility Tests
   Тесты утилиты логгера
   ============================================= */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Logger Utility', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('log functions', () => {
    it('should log info messages', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { info } = await import('./logger');

      info('Test message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log errors with console.error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { error } = await import('./logger');

      error('Error message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log warnings with console.warn', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { warn } = await import('./logger');

      warn('Warning message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('safeInit function', () => {
    it('should execute function without throwing', async () => {
      const { safeInit } = await import('./logger');

      const mockFn = vi.fn();
      safeInit('Test', mockFn);

      expect(mockFn).toHaveBeenCalled();
    });

    it('should catch and log errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { safeInit } = await import('./logger');

      const errorFn = () => {
        throw new Error('Test error');
      };

      // Should not throw
      expect(() => safeInit('Test', errorFn)).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('withErrorBoundary function', () => {
    it('should wrap function safely', async () => {
      const { withErrorBoundary } = await import('./logger');

      const mockFn = vi.fn().mockReturnValue(42);
      const wrapped = withErrorBoundary(mockFn, 'Test');

      const result = wrapped();
      expect(result).toBe(42);
    });

    it('should log and rethrow errors in wrapped function', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { withErrorBoundary } = await import('./logger');

      const errorFn = () => {
        throw new Error('Test error');
      };
      const wrapped = withErrorBoundary(errorFn, 'Test');

      // Should rethrow the error after logging it
      expect(() => wrapped()).toThrow('Test error');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getRecentLogs function', () => {
    it('should return array of logs', async () => {
      const { getRecentLogs, info } = await import('./logger');

      info('Test log');
      const logs = getRecentLogs();

      expect(Array.isArray(logs)).toBe(true);
    });
  });
});
