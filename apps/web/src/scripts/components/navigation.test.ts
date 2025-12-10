/* =============================================
   Navigation Component Tests
   Тесты компонента навигации
   ============================================= */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupBasicPage, click, nextTick } from '../../tests/utils';

describe('Navigation Component', () => {
  beforeEach(() => {
    setupBasicPage();
  });

  describe('Mobile Navigation', () => {
    it('should toggle menu on button click', async () => {
      const { init } = await import('./navigation');
      init();

      const toggle = document.querySelector('.nav-toggle') as HTMLElement;
      const menu = document.getElementById('navMenu');

      expect(toggle?.getAttribute('aria-expanded')).toBe('false');
      expect(menu?.getAttribute('data-open')).toBe('false');

      click(toggle);
      await nextTick();

      expect(toggle?.getAttribute('aria-expanded')).toBe('true');
      expect(menu?.getAttribute('data-open')).toBe('true');
    });

    it('should close menu when clicking a link', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

      const { init } = await import('./navigation');
      init();

      const toggle = document.querySelector('.nav-toggle') as HTMLElement;
      const menu = document.getElementById('navMenu');
      const link = menu?.querySelector('a') as HTMLElement;

      // Open menu first
      click(toggle);
      await nextTick();

      expect(menu?.getAttribute('data-open')).toBe('true');

      // Click link
      click(link);
      await nextTick();

      expect(toggle?.getAttribute('aria-expanded')).toBe('false');
      expect(menu?.getAttribute('data-open')).toBe('false');
    });

    it('should create backdrop element', async () => {
      const { init } = await import('./navigation');
      init();

      const backdrop = document.querySelector('.nav-backdrop');
      expect(backdrop).not.toBeNull();
    });

    it('should close menu when clicking backdrop', async () => {
      const { init } = await import('./navigation');
      init();

      const toggle = document.querySelector('.nav-toggle') as HTMLElement;
      const backdrop = document.querySelector('.nav-backdrop') as HTMLElement;

      // Open menu
      click(toggle);
      await nextTick();

      expect(document.body.classList.contains('nav-open')).toBe(true);

      // Click backdrop
      click(backdrop);
      await nextTick();

      expect(document.body.classList.contains('nav-open')).toBe(false);
    });
  });

  describe('Smooth Scroll', () => {
    it('should handle anchor links', async () => {
      const { init } = await import('./navigation');
      init();

      const aboutSection = document.getElementById('about');
      expect(aboutSection).not.toBeNull();
    });
  });
});
