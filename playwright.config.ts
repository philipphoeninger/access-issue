// docs/TESTING.md §15: Chromium on every pull request; Firefox and WebKit are
// a weekly/release-tag job, not a merge gate (docs/SPEC_v1.md §3 "Out of
// Scope for v1" — cross-browser suite is Phase 4). Only the chromium project
// is declared here for that reason; add the other two engines when that
// phase starts.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4310;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  // The HTML report is the "full axe JSON for every failure" artefact
  // docs/TESTING.md §15 asks CI to retain — traces and attachments included.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx ng serve --port ${PORT} --configuration development`,
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
