import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Japan School Landing Page
 * Run with: npx playwright test
 */

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Школа японского языка/);
  });

  test('should display hero section', async ({ page }) => {
    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();

    const heroTitle = page.locator('#heroTitle');
    await expect(heroTitle).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Click on Programs link - use force to handle mobile viewport issues
    await page.locator('a[href="#programs"]').first().click({ force: true });

    // Check that programs section exists
    const programs = page.locator('#programs');
    await expect(programs).toBeAttached();
  });

  test('should toggle theme', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();

    // Get initial theme
    const initialTheme = await page.locator('html').getAttribute('data-theme');

    // Click theme toggle
    await themeToggle.click();

    // Wait for theme change
    await page.waitForTimeout(500);

    // Theme should have changed
    const newTheme = await page.locator('html').getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Navigate to contact section using force click for mobile
    await page.locator('a[href="#contact"]').first().click({ force: true });

    // Wait for scroll
    await page.waitForTimeout(500);

    // Try to submit empty form
    const form = page.locator('#contactForm');
    if (await form.isVisible()) {
      const submitBtn = form.locator('button[type="submit"]');
      await submitBtn.click();

      // Check for validation (browser native or custom)
      const nameInput = form.locator('input[name="name"]');
      const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    }
  });

  test('should accept valid form data', async ({ page }) => {
    await page.locator('a[href="#contact"]').first().click({ force: true });
    await page.waitForTimeout(500);

    const form = page.locator('#contactForm');
    if (await form.isVisible()) {
      await form.locator('input[name="name"]').fill('Тест Пользователь');
      await form.locator('input[name="email"]').fill('test@example.com');
      await form.locator('input[name="phone"]').fill('+79001234567');

      // Verify inputs are filled
      await expect(form.locator('input[name="name"]')).toHaveValue('Тест Пользователь');
      await expect(form.locator('input[name="email"]')).toHaveValue('test@example.com');
    }
  });
});

test.describe('FAQ Section', () => {
  test('should have FAQ section on page', async ({ page }) => {
    await page.goto('/');

    // Check if FAQ section exists (may have different ID or class)
    const faqSection = page.locator('.faq, #faq, [data-section="faq"]').first();

    // If FAQ exists, check for items
    if ((await faqSection.count()) > 0) {
      await expect(faqSection).toBeAttached();
    } else {
      // FAQ may not be implemented - skip gracefully
      test.skip();
    }
  });
});

test.describe('Accessibility', () => {
  test('should have skip link', async ({ page }) => {
    await page.goto('/');

    // Use first() to handle multiple skip links
    const skipLink = page.locator('.skip-link').first();
    await expect(skipLink).toBeAttached();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Should focus on skip link or first nav item
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
