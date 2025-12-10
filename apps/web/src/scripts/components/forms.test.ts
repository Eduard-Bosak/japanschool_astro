/* =============================================
   Forms Component Tests
   Тесты компонента форм
   ============================================= */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupFormPage, typeText, click, nextTick, mockFetch } from '../../tests/utils';

describe('Forms Component', () => {
  beforeEach(() => {
    vi.resetModules();
    setupFormPage();
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const form = document.getElementById('contactForm') as HTMLFormElement;
      const nameInput = document.getElementById('name') as HTMLInputElement;

      // Empty input should be invalid
      expect(nameInput.validity.valid).toBe(false);
    });

    it('should validate email format - invalid email', async () => {
      const emailInput = document.getElementById('email') as HTMLInputElement;

      typeText(emailInput, 'invalid-email');
      await nextTick();

      expect(emailInput.validity.typeMismatch).toBe(true);
    });

    it('should validate email format - valid email', async () => {
      const emailInput = document.getElementById('email') as HTMLInputElement;

      typeText(emailInput, 'test@example.com');
      await nextTick();

      expect(emailInput.validity.typeMismatch).toBe(false);
    });

    it('should validate phone format', async () => {
      const phoneInput = document.getElementById('phone') as HTMLInputElement;

      typeText(phoneInput, '+79001234567');
      await nextTick();

      expect(phoneInput.validity.patternMismatch).toBe(false);
    });
  });

  describe('Form Structure', () => {
    it('should have submit button', () => {
      const form = document.getElementById('contactForm') as HTMLFormElement;
      const submitBtn = form.querySelector('button[type="submit"]');

      expect(submitBtn).not.toBeNull();
    });

    it('should have required inputs', () => {
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');

      expect(nameInput).not.toBeNull();
      expect(emailInput).not.toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-live region for status', () => {
      const statusRegion = document.getElementById('formStatus');
      expect(statusRegion?.getAttribute('aria-live')).toBe('polite');
    });

    it('should have labels for all inputs', () => {
      const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');

      inputs.forEach((input) => {
        const id = input.getAttribute('id');
        const label = document.querySelector(`label[for="${id}"]`);
        expect(label).not.toBeNull();
      });
    });

    it('should have proper form role', () => {
      const form = document.getElementById('contactForm');
      expect(form?.tagName.toLowerCase()).toBe('form');
    });
  });
});
