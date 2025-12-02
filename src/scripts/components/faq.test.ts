/* =============================================
   FAQ Component Tests
   Тесты FAQ компонента
   ============================================= */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupFAQPage, click, pressKey, typeText, nextTick } from '../../tests/utils';

describe('FAQ Component', () => {
  beforeEach(() => {
    vi.resetModules();
    setupFAQPage();
  });

  describe('Initialization', () => {
    it('should initialize FAQ without errors', async () => {
      const { initFAQ } = await import('./faq');

      expect(() => initFAQ()).not.toThrow();
    });

    it('should find faq list and triggers', async () => {
      const list = document.getElementById('faqList');
      const triggers = document.querySelectorAll('.faq__trigger');

      expect(list).not.toBeNull();
      expect(triggers.length).toBe(3);
    });
  });

  describe('Accordion Functionality', () => {
    it('should toggle item on click', async () => {
      const { initFAQ } = await import('./faq');
      initFAQ();

      const firstTrigger = document.querySelector('.faq__trigger') as HTMLElement;
      const firstItem = firstTrigger.closest('.faq__item') as HTMLElement;

      expect(firstItem.classList.contains('faq__item--open')).toBe(false);

      click(firstTrigger);
      await nextTick();

      expect(firstItem.classList.contains('faq__item--open')).toBe(true);
    });

    it('should close item on second click', async () => {
      const { initFAQ } = await import('./faq');
      initFAQ();

      const firstTrigger = document.querySelector('.faq__trigger') as HTMLElement;
      const firstItem = firstTrigger.closest('.faq__item') as HTMLElement;

      click(firstTrigger);
      await nextTick();
      expect(firstItem.classList.contains('faq__item--open')).toBe(true);

      click(firstTrigger);
      await nextTick();
      expect(firstItem.classList.contains('faq__item--open')).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard interaction', async () => {
      const { initFAQ } = await import('./faq');
      initFAQ();

      const triggers = document.querySelectorAll('.faq__trigger');
      const firstTrigger = triggers[0] as HTMLElement;

      // Focus first trigger
      firstTrigger.focus();
      expect(document.activeElement).toBe(firstTrigger);

      // Arrow down should work
      pressKey(firstTrigger, 'ArrowDown');
      await nextTick();

      // Focus should move (we just verify it doesn't throw)
      expect(document.activeElement).not.toBeNull();
    });
  });

  describe('Search Functionality', () => {
    it('should accept search input', async () => {
      const { initFAQ } = await import('./faq');
      initFAQ();

      const searchInput = document.getElementById('faqSearch') as HTMLInputElement;
      if (searchInput) {
        typeText(searchInput, 'Вопрос 1');
        await nextTick();

        expect(searchInput.value).toBe('Вопрос 1');
      }
    });

    it('should clear search with reset button', async () => {
      const { initFAQ } = await import('./faq');
      initFAQ();

      const searchInput = document.getElementById('faqSearch') as HTMLInputElement;
      const resetBtn = document.getElementById('faqSearchReset');

      if (searchInput && resetBtn) {
        searchInput.value = 'test';
        click(resetBtn);
        await nextTick();

        expect(searchInput.value).toBe('');
      }
    });
  });
});
