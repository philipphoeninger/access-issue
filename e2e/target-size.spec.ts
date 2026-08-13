// docs/SPEC_v1.md Slice 3 acceptance: "Every interactive target >= 24 x 24 px,
// asserted over all focusable frame elements" (docs/DESIGN.md §5, WCAG 2.5.8).
//
// Slice 5 added the case docs/DESIGN.md §5 calls out as the easiest to get
// wrong: the indented part checkboxes of a combined barrier, where the
// indentation must reduce the offset and never the target. Form controls were
// not in the original selector because the frame had none; they are now.
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
const MIN_TARGET_PX = 24;

interface UndersizedTarget {
  text: string;
  width: number;
  height: number;
}

test.describe('Interactive target size >= 24x24px', () => {
  for (const path of PAGES) {
    test(`every focusable frame element on ${path}`, async ({ page }) => {
      await gotoRendered(page, path);

      const undersized = await page.evaluate((min): UndersizedTarget[] => {
        // The h1 carries tabindex="-1" for programmatic route-change focus
        // (docs/ARCHITECTURE.md §9) — it is not a user-facing interactive
        // target and 2.5.8 does not apply to it.
        const elements = Array.from(
          document.querySelectorAll<HTMLElement>(
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        );
        return elements
          .map((el) => {
            const rect = el.getBoundingClientRect();
            return {
              text: (el.textContent ?? '').trim().slice(0, 40),
              width: rect.width,
              height: rect.height,
            };
          })
          .filter((el) => el.width > 0 && el.height > 0 && (el.width < min || el.height < min));
      }, MIN_TARGET_PX);

      expect(undersized).toEqual([]);
    });
  }
});
