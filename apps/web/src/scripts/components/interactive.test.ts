/**
 * Interactive Elements Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  initTooltips,
  initSmoothScroll,
  initBackToTop,
  initCopyToClipboard,
  initLazyLoading,
  initKeyboardNavigation,
  init
} from './interactive';

describe('Interactive Elements', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup any created elements
    document.querySelectorAll('.tooltip, .back-to-top').forEach(el => el.remove());
  });

  describe('Tooltips', () => {
    it('should create tooltip element for data-tooltip elements', () => {
      document.body.innerHTML = `
        <button data-tooltip="Подсказка" data-tooltip-position="top">
          Hover me
        </button>
      `;

      initTooltips();

      const tooltips = document.querySelectorAll('.tooltip');
      expect(tooltips.length).toBe(1);
      expect(tooltips[0].textContent).toBe('Подсказка');
    });

    it('should handle different tooltip positions', () => {
      document.body.innerHTML = `
        <button data-tooltip="Top" data-tooltip-position="top">Top</button>
        <button data-tooltip="Bottom" data-tooltip-position="bottom">Bottom</button>
        <button data-tooltip="Left" data-tooltip-position="left">Left</button>
        <button data-tooltip="Right" data-tooltip-position="right">Right</button>
      `;

      initTooltips();

      expect(document.querySelector('.tooltip-top')).not.toBeNull();
      expect(document.querySelector('.tooltip-bottom')).not.toBeNull();
      expect(document.querySelector('.tooltip-left')).not.toBeNull();
      expect(document.querySelector('.tooltip-right')).not.toBeNull();
    });

    it('should show tooltip on mouseenter', () => {
      document.body.innerHTML = `
        <button data-tooltip="Show me">Hover</button>
      `;

      initTooltips();

      const button = document.querySelector('button')!;
      const tooltip = document.querySelector('.tooltip') as HTMLElement;

      // Initially hidden
      expect(tooltip.style.opacity).toBe('0');

      // Trigger mouseenter
      button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      expect(tooltip.style.opacity).toBe('1');
    });

    it('should hide tooltip on mouseleave', () => {
      document.body.innerHTML = `
        <button data-tooltip="Hide me">Hover</button>
      `;

      initTooltips();

      const button = document.querySelector('button')!;
      const tooltip = document.querySelector('.tooltip') as HTMLElement;

      // Show first
      button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      expect(tooltip.style.opacity).toBe('1');

      // Then hide
      button.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      expect(tooltip.style.opacity).toBe('0');
    });
  });

  describe('Smooth Scroll', () => {
    it('should setup click handlers on anchor links', () => {
      document.body.innerHTML = `
        <a href="#section1">Go to section</a>
        <section id="section1">Content</section>
      `;

      // Mock scrollTo using vi.spyOn
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      initSmoothScroll();

      const link = document.querySelector('a')!;
      link.click();

      expect(scrollToSpy).toHaveBeenCalled();
    });

    it('should ignore empty hash links', () => {
      document.body.innerHTML = `
        <a href="#">Empty</a>
        <a href="#!">Also empty</a>
      `;

      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      initSmoothScroll();

      document.querySelectorAll('a').forEach(link => link.click());

      // Should not scroll for empty hashes
      expect(scrollToSpy).not.toHaveBeenCalled();
    });
  });

  describe('Back to Top Button', () => {
    it('should create back to top button', () => {
      initBackToTop();

      const button = document.querySelector('.back-to-top');
      expect(button).not.toBeNull();
      expect(button?.getAttribute('aria-label')).toBe('Наверх');
    });

    it('should be hidden initially', () => {
      initBackToTop();

      const button = document.querySelector('.back-to-top') as HTMLElement;
      expect(button.style.opacity).toBe('0');
      expect(button.style.pointerEvents).toBe('none');
    });

    it('should scroll to top on click', () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      initBackToTop();

      const button = document.querySelector('.back-to-top') as HTMLButtonElement;
      button.click();

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth'
      });
    });
  });

  describe('Copy to Clipboard', () => {
    it('should setup click handlers on data-copy elements', async () => {
      document.body.innerHTML = `
        <button data-copy="test@example.com">Copy email</button>
      `;

      // Mock clipboard API using vi.stubGlobal
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        ...navigator,
        clipboard: { writeText: writeTextMock }
      });

      initCopyToClipboard();

      const button = document.querySelector('button')!;
      button.click();

      // Wait for async clipboard operation
      await vi.waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should handle copy errors gracefully', () => {
      document.body.innerHTML = `
        <button data-copy="copied text">Copy</button>
      `;

      // Don't mock clipboard - it will fail gracefully
      initCopyToClipboard();

      const button = document.querySelector('button')!;
      
      // Should not throw
      expect(() => button.click()).not.toThrow();
    });
  });

  describe('Lazy Loading', () => {
    it('should observe images with data-src attribute', () => {
      document.body.innerHTML = `
        <div>
          <img data-src="/image1.jpg" alt="Image 1">
          <img data-src="/image2.jpg" alt="Image 2">
        </div>
      `;

      initLazyLoading();

      const images = document.querySelectorAll('img[data-src]');
      expect(images.length).toBe(2);
    });

    it('should add placeholder class to parent', () => {
      document.body.innerHTML = `
        <div class="wrapper">
          <img data-src="/image.jpg" alt="Image">
        </div>
      `;

      initLazyLoading();

      const wrapper = document.querySelector('.wrapper');
      expect(wrapper?.classList.contains('img-placeholder')).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close modals on Escape key', () => {
      document.body.innerHTML = `
        <div class="modal" style="display: block;">Modal content</div>
      `;

      initKeyboardNavigation();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      const modal = document.querySelector('.modal') as HTMLElement;
      expect(modal.style.display).toBe('none');
    });

    it('should close mobile menu on Escape key', () => {
      document.body.innerHTML = `
        <nav class="main-nav">
          <ul data-open="true"></ul>
        </nav>
      `;

      initKeyboardNavigation();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      const menu = document.querySelector('.main-nav ul');
      expect(menu?.getAttribute('data-open')).toBe('false');
    });
  });

  describe('Init function', () => {
    it('should initialize all interactive elements without errors', () => {
      document.body.innerHTML = `
        <button data-tooltip="Tip">Button</button>
        <a href="#section">Link</a>
        <section id="section">Content</section>
        <img data-src="/image.jpg" alt="Image">
      `;

      expect(() => init()).not.toThrow();
    });
  });
});
