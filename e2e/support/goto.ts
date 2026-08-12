// Navigate, then wait for the routed page to actually exist.
//
// `page.goto` resolves on the document load event, and every route in this
// application is lazily loaded (docs/ARCHITECTURE.md §9): at that moment the
// DOM holds the header and the first skip link, and nothing else. A test that
// presses a key or reads the DOM synchronously after `goto` is racing the
// router — it passes while the chunk is small and starts failing when it
// grows, which reads as "an unrelated change made this flaky" rather than as
// the missing wait it is. Slice 5 made the scenario chunk large enough to
// turn that race into a reliable failure in the skip-link and boundary
// suites; this is the fix.
//
// It matters beyond flakiness for the axe runs: analysing a page whose routed
// component has not rendered yet reports zero violations because there is
// nothing on it. A frame gate that passes vacuously is worse than no gate.
//
// This is a condition, not a sleep — docs/TESTING.md §10's ban on
// `waitForTimeout` stands.
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function gotoRendered(page: Page, url: string): Promise<void> {
  await page.goto(url);

  // Every route renders exactly one `h1` inside `main` (docs/ARCHITECTURE.md §9).
  await expect(page.locator('main h1')).toHaveCount(1);

  // A scenario step additionally renders both halves of the layout.
  if (url.startsWith('/szenario')) {
    await expect(page.locator('#panel .panel')).toHaveCount(1);
    await expect(page.locator('[data-simulation-region]')).toHaveCount(1);
  }
}
