import { defineConfig } from '@playwright/test';

// End-to-end smoke test: opens the *built* site in a real browser.
// Build first (CI uses sample projects so there are stars to test):
//   PROJECTS=sample npm run build && npm run test:e2e
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321/portfolio/',
    // Locally, use the installed Chrome (no big download); CI installs
    // Playwright's Chromium.
    channel: process.env.CI ? undefined : 'chrome',
  },
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321/portfolio/',
    reuseExistingServer: !process.env.CI,
  },
});
