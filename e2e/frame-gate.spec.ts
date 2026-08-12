// docs/SPEC_v1.md Slice 3 acceptance: "axe run 1 (frame gate) and run 3
// (page-level rules) green on home and on a bare scenario route." The frame
// gate must be clean before any barrier exists (docs/TESTING.md §17) —
// keeping it clean from here is far cheaper than cleaning it up later.
import { expect, test } from '@playwright/test';
import { frameGate, pageLevelRules } from './support/axe-runs';
import { gotoRendered } from './support/goto';

const PAGES: Array<{ name: string; path: string }> = [
  { name: 'home', path: '/' },
  {
    name: 'scenario: Bewerbungsprozess step 1 (bare route)',
    path: '/szenario/bewerbung/stellenanzeige',
  },
];

for (const { name, path } of PAGES) {
  test.describe(`axe — ${name}`, () => {
    test('run 1: frame gate reports zero violations (docs/TESTING.md §5)', async ({ page }) => {
      await gotoRendered(page, path);
      const results = await frameGate(page).analyze();
      expect(results.violations).toEqual([]);
    });

    test('run 3: page-level rules report zero violations (docs/TESTING.md §5)', async ({
      page,
    }) => {
      await gotoRendered(page, path);
      const results = await pageLevelRules(page).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}
