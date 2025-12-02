/* =============================================
   Theme Component Tests
   Тесты компонента темы
   ============================================= */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupBasicPage, click, nextTick } from '../../tests/utils';

describe('Theme Component', () => {
  beforeEach(() => {
    setupBasicPage();
    vi.resetModules();
  });

  describe('initTheme', () => {
    it('should read theme from localStorage', async () => {
      // Store uses JSON.parse, so store as JSON string
      localStorage.setItem('theme', JSON.stringify('dark'));

      const { initTheme } = await import('@scripts/components/theme');
      initTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should default to light theme if no preference and no dark system preference', async () => {
      // When no localStorage and no dark system preference, defaults to light
      vi.mocked(globalThis.matchMedia).mockImplementation((query) => ({
        matches: false, // No dark preference
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }));

      const { initTheme } = await import('@scripts/components/theme');
      initTheme();

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should respect prefers-color-scheme: dark when no localStorage', async () => {
      vi.mocked(globalThis.matchMedia).mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }));

      const { initTheme } = await import('@scripts/components/theme');
      initTheme();

      // Should detect dark preference
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('setupThemeToggle', () => {
    it('should toggle theme on button click', async () => {
      document.documentElement.setAttribute('data-theme', 'light');

      const { setupThemeToggle } = await import('@scripts/components/theme');
      setupThemeToggle();

      const toggleBtn = document.getElementById('themeToggle');
      expect(toggleBtn).not.toBeNull();

      click(toggleBtn!);
      await nextTick();

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should save theme to localStorage on toggle', async () => {
      document.documentElement.setAttribute('data-theme', 'light');

      const { setupThemeToggle } = await import('@scripts/components/theme');
      setupThemeToggle();

      const toggleBtn = document.getElementById('themeToggle');
      click(toggleBtn!);
      await nextTick();

      // Store saves as JSON string
      expect(localStorage.getItem('theme')).toBe(JSON.stringify('dark'));
    });

    it('should update aria-pressed attribute', async () => {
      document.documentElement.setAttribute('data-theme', 'light');

      const { setupThemeToggle } = await import('@scripts/components/theme');
      setupThemeToggle();

      const toggleBtn = document.getElementById('themeToggle');
      click(toggleBtn!);
      await nextTick();

      expect(toggleBtn?.getAttribute('aria-pressed')).toBe('true');
    });
  });
});
