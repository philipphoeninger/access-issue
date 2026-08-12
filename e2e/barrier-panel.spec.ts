// docs/SPEC_v1.md slice 5 acceptance, over a real page: the axe runs in every
// panel state, real keyboard operation, and the focus guarantee after a
// toggle. The component-level assertions live in
// src/app/frame/barrier-panel/barrier-panel.component.spec.ts; what needs a
// browser is here.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { frameGate, pageLevelRules } from './support/axe-runs';
import { gotoRendered } from './support/goto';

const STEP = '/szenario/bewerbung/formular';

// The three states worth running axe in: nothing resolved (the default a
// participant arrives in), a mixed state, and everything resolved.
const PANEL_STATES: Array<{ name: string; url: string }> = [
  { name: 'all barriers active', url: STEP },
  { name: 'some barriers resolved', url: `${STEP}?frei=labels,pdf` },
  { name: 'all barriers resolved', url: `${STEP}?frei=alle` },
];

function panelCheckboxes(page: Page) {
  return page.locator('.panel input[type="checkbox"]');
}

for (const { name, url } of PANEL_STATES) {
  test.describe(`axe — barrier panel, ${name}`, () => {
    test('run 1: frame gate reports zero violations (docs/TESTING.md §5)', async ({ page }) => {
      await gotoRendered(page, url);
      const results = await frameGate(page).analyze();
      expect(results.violations).toEqual([]);
    });

    test('run 3: page-level rules report zero violations (docs/TESTING.md §5)', async ({
      page,
    }) => {
      await gotoRendered(page, url);
      const results = await pageLevelRules(page).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test.describe('Barrier panel — keyboard operation', () => {
  // Real key events, not `.focus()` and `.check()` (docs/TESTING.md §9): a
  // panel that only works when a test reaches into it is not being tested.
  test('every checkbox is reachable by Tab, in DOM order', async ({ page }) => {
    await gotoRendered(page, STEP);

    const expected = await panelCheckboxes(page).evaluateAll((inputs) =>
      inputs.map((input) => input.id),
    );
    expect(expected.length).toBe(11);

    const reached: string[] = [];
    for (let press = 0; press < 60 && reached.length < expected.length; press++) {
      await page.keyboard.press('Tab');
      const id = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || active.getAttribute('type') !== 'checkbox') {
          return null;
        }
        return active.id;
      });
      if (id) {
        reached.push(id);
      }
    }

    expect(reached).toEqual(expected);
  });

  test('Space toggles a barrier and leaves focus on the checkbox', async ({ page }) => {
    await gotoRendered(page, STEP);

    const first = panelCheckboxes(page).first();
    const id = await first.getAttribute('id');
    await first.focus();
    await page.keyboard.press('Space');

    await expect(page).toHaveURL(/frei=grafik/);
    await expect(first).toBeChecked();
    // The simulation re-renders; focus does not move (docs/ARCHITECTURE.md §12.2).
    expect(await page.evaluate(() => document.activeElement?.id)).toBe(id);
  });
});

test.describe('Barrier panel — effect on the rest of the page', () => {
  test('resolving a barrier counts it out of the simulation bar', async ({ page }) => {
    await gotoRendered(page, STEP);
    await expect(page.locator('.counter')).toHaveText('Alle 11 Barrieren aktiv');

    await panelCheckboxes(page).first().check();

    await expect(page.locator('.counter')).toHaveText('10 von 11 Barrieren aktiv');
    // Still exactly one counter in the document (docs/UX-COPY.md §5.6).
    await expect(page.locator('.counter')).toHaveCount(1);
  });

  test('the bulk actions set every toggle in the scenario', async ({ page }) => {
    await gotoRendered(page, STEP);

    await page.getByRole('button', { name: 'Alle Barrieren beheben' }).click();
    await expect(page).toHaveURL(/frei=alle/);
    await expect(panelCheckboxes(page)).toHaveCount(11);
    for (const box of await panelCheckboxes(page).all()) {
      await expect(box).toBeChecked();
    }
    await expect(page.locator('.counter')).toHaveText('Keine Barriere aktiv');

    await page.getByRole('button', { name: 'Alle Barrieren aktivieren' }).click();
    for (const box of await panelCheckboxes(page).all()) {
      await expect(box).not.toBeChecked();
    }
    await expect(page.locator('.counter')).toHaveText('Alle 11 Barrieren aktiv');
  });

  test("a toggle announces once, through the frame's single live region", async ({ page }) => {
    await gotoRendered(page, STEP);

    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toHaveCount(1);

    await panelCheckboxes(page).nth(2).check(); // step 2's first barrier: labels
    await expect(liveRegion).toHaveText(
      'Formularfelder mit Beschriftungen: barrierefrei. Noch 10 von 11 Barrieren aktiv.',
    );
  });

  test('an explanation link selects a barrier without adding a history entry', async ({ page }) => {
    await gotoRendered(page, STEP);
    const before = await page.evaluate(() => history.length);

    await page.locator('a.explain').first().click();

    await expect(page).toHaveURL(/erklaerung=grafik/);
    // replaceUrl (docs/ARCHITECTURE.md §10): the Back button belongs to step
    // navigation, not to reading an explanation.
    expect(await page.evaluate(() => history.length)).toBe(before);
  });
});
