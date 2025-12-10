import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome']
    },
    {
      name: 'firefox',
      use: devices['Desktop Firefox']
    },
    {
      name: 'mobile',
      use: devices['iPhone 13']
    }
  ],

  /* Run local dev server before tests */
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
