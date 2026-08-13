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

  // A scenario step additionally renders both halves of the layout. Decided
  // by what is on the page rather than by the shape of the URL: a planned
  // scenario's "in Vorbereitung" page (slice 11) sits under `/szenario` and
  // has neither half, so a path-prefix test would wait forever for a panel
  // that is correctly absent.
  //
  // The marker is `[data-step-view]`, which exists for the test suite and is
  // documented as such (docs/ARCHITECTURE.md §15, the same standing
  // `[data-simulation-region]` has) — deliberately not a styling class. A
  // class carries no such promise: renaming one is an ordinary CSS
  // refactoring, and it would turn the three waits below off *silently*,
  // leaving every scenario suite racing the step's chunk and an axe run 2
  // analysing a region that may still be empty. A vacuous pass is worse than
  // a flaky failure, which is the whole reason this helper exists.
  //
  // Not a race: the element carrying the attribute and the `h1` above come
  // from the same component template and therefore appear in the same
  // change-detection pass.
  const stepView = page.locator('[data-step-view]');

  if ((await stepView.count()) > 0) {
    await expect(page.locator('#panel .panel')).toHaveCount(1);
    await expect(page.locator('[data-simulation-region]')).toHaveCount(1);

    // The step's simulation component arrives in its own chunk (slice 7,
    // src/app/scenarios/scenario-step-views.ts), so the region is briefly
    // present and empty. `'none'` (no view built for this step yet) and
    // `'ready'` are both settled states; `'pending'` is the one to wait out.
    // Without this, an axe run scoped to the region would analyse an empty
    // region and report zero violations — passing vacuously, which is exactly
    // what run 2 exists to prevent.
    await expect(stepView).not.toHaveAttribute('data-step-view', 'pending');
  }
}
