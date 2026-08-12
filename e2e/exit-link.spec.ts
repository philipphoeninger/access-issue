// docs/TESTING.md §7 — the safety-critical path, and the only suite in this
// project whose failure would mean the tool had trapped someone. It runs the
// four steps of §7 verbatim, with real key events: a trap that a test can
// bypass with `.focus()` is not being tested at all.
//
// Slice 4 runs it against a region with no scenario content in it. The states
// loop below is where the tested states of docs/TESTING.md §4 enter from
// slice 7 on — the shape is here so adding a barrier means adding a row, not
// rewriting the suite.
import { expect, test, type Page } from '@playwright/test';

const PATH = '/szenario/bewerbung/stellenanzeige';

/** docs/TESTING.md §4: the tested states. Grows with the barriers. */
const STATES: Array<{ name: string; query: string }> = [
  { name: 'all barriers active (default)', query: '' },
  { name: 'all barriers resolved', query: '?frei=alle' },
];

const EXIT_LINK_TEXT = 'Simulation verlassen — zurück zum Barriere-Panel';

/** True while focus sits inside the simulation region. */
function focusIsInsideRegion(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const region = document.querySelector('[data-simulation-region]');
    const active = document.activeElement;
    return region !== null && active !== null && region.contains(active);
  });
}

for (const { name, query } of STATES) {
  test.describe(`Exit link — ${name}`, () => {
    test('is reached by a single Tab from the element preceding the region', async ({ page }) => {
      await page.goto(`${PATH}${query}`);

      // Step 1 of §7. The element preceding the region is the
      // "Simulationsbereich überspringen" link; focusing it is setup, the
      // assertion is what the Tab press does.
      await page.locator('a[href$="#simulation-end"]').focus();
      await page.keyboard.press('Tab');

      await expect(page.locator(':focus')).toHaveText(EXIT_LINK_TEXT);
    });

    test('carries a visible focus indicator and is neither clipped nor overlapped', async ({
      page,
    }) => {
      await page.goto(`${PATH}${query}`);
      const exitLink = page.locator('.exit-link');
      await exitLink.focus();

      // Visible: on screen, at a usable size, and actually the topmost
      // element at its own centre — "reachable but invisible is only half an
      // exit" (docs/TESTING.md §7).
      await expect(exitLink).toBeInViewport();
      const box = (await exitLink.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);

      const isTopmost = await exitLink.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return hit !== null && (element === hit || element.contains(hit));
      });
      expect(isTopmost).toBe(true);

      // The ring is --sim-focus-ring, never absent: a missing focus indicator
      // is not an admissible barrier (docs/DESIGN.md §5).
      const outline = await exitLink.evaluate((element) => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThanOrEqual(1);
    });

    test('leads back to the barrier panel and moves focus there', async ({ page }) => {
      await page.goto(`${PATH}${query}`);
      await page.locator('.exit-link').focus();

      // Step 3 of §7 — a real Enter press, and focus has to *land*, not just
      // scroll: a fragment link whose target is not focusable leaves
      // document.activeElement on <body>.
      await page.keyboard.press('Enter');

      const landedInPanel = await page.evaluate(() => {
        const panel = document.querySelector('#panel');
        const active = document.activeElement;
        return panel !== null && active !== null && (panel === active || panel.contains(active));
      });
      expect(landedInPanel).toBe(true);
      expect(await focusIsInsideRegion(page)).toBe(false);
    });

    // Step 4 of §7 — the trap detector. Barriers are implemented by omission,
    // never by interception (docs/ARCHITECTURE.md §5.3): a simulated trap may
    // make one control unreachable, never hold the user inside the region.
    test('Tab leaves the region within 50 presses and never cycles inside it', async ({ page }) => {
      await page.goto(`${PATH}${query}`);
      await page.locator('.exit-link').focus();

      let left = false;
      for (let press = 0; press < 50; press++) {
        await page.keyboard.press('Tab');
        if (!(await focusIsInsideRegion(page))) {
          left = true;
          break;
        }
      }

      expect(left).toBe(true);
    });
  });
}
