// docs/SPEC_v1.md Slice 3 acceptance: "Reflow at 400% zoom and 320 px width
// without horizontal scrolling." A 320 CSS-pixel-wide viewport is the
// standard equivalent of 400% zoom on a 1280px-wide desktop viewport (WCAG
// 1.4.10 Reflow) — one viewport-width test covers both.
import { expect, test } from '@playwright/test';
import { gotoRendered } from './support/goto';

// The special states are frame pages like any other and are held to the same
// rule (docs/SPEC_v1.md Slice 11): a page added outside the scenario walk is
// exactly the kind that quietly escapes a hand-written list like this one.
const PAGES = [
  '/',
  '/szenario/bewerbung/stellenanzeige',
  '/szenario/bewerbung/formular',
  '/szenario/bewerbung/dokumente',
  '/szenario/bewerbung/rueckmeldung',
  '/gibt-es-nicht',
  '/szenario/softwarebeschaffung',
];

test.describe('Reflow at 320px width (docs/DESIGN.md §5, §8)', () => {
  for (const path of PAGES) {
    test(`no horizontal scrolling on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      await gotoRendered(page, path);

      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalScroll).toBe(false);
    });
  }
});
