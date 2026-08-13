// docs/SPEC_v1.md slice 5 acceptance, over a real page: the axe runs in every
// panel state, real keyboard operation, and the focus guarantee after a
// toggle. The component-level assertions live in
// src/app/frame/barrier-panel/barrier-panel.component.spec.ts; what needs a
// browser is here.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { frameGate, pageLevelRules } from './support/axe-runs';
import { gotoRendered } from './support/goto';
import { SCENARIOS } from '../src/app/core/scenario-registry.service';
import { firstStepPath } from '../src/app/core/scenario-routes';

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

// Barrier state belongs to the scenario, not to the step (docs/ARCHITECTURE.md
// §8): `frei` lists barriers from all four steps and the panel shows all of
// them. Walking through the flow must therefore not reset what the user has
// already resolved — the defect this suite exists to keep out.
test.describe('Barrier state across step navigation', () => {
  test('survives a step change, in both directions', async ({ page }) => {
    await gotoRendered(page, '/szenario/bewerbung/stellenanzeige?frei=labels,pdf');

    await page.getByRole('link', { name: 'Weiter zu: Bewerbungsformular' }).click();
    await expect(page).toHaveURL('/szenario/bewerbung/formular?frei=labels,pdf');
    await expect(page.locator('.counter')).toHaveText('9 von 11 Barrieren aktiv');
    await expect(page.locator('.panel input[type="checkbox"]:checked')).toHaveCount(2);

    await page.getByRole('link', { name: 'Zurück zu: Stellenanzeige' }).click();
    await expect(page).toHaveURL('/szenario/bewerbung/stellenanzeige?frei=labels,pdf');
    await expect(page.locator('.counter')).toHaveText('9 von 11 Barrieren aktiv');
  });

  test('a barrier resolved on one step is still resolved on the next', async ({ page }) => {
    await gotoRendered(page, '/szenario/bewerbung/stellenanzeige');
    await panelCheckboxes(page).first().check();

    await page.getByRole('link', { name: 'Weiter zu: Bewerbungsformular' }).click();

    await expect(page).toHaveURL(/frei=grafik/);
    await expect(panelCheckboxes(page).first()).toBeChecked();
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

// docs/SPEC_v2.md slice 13: „Anchor link moves focus to the section heading
// inside the simulation region and does not trap it."
//
// Nothing but a browser can answer this. The `anchorId` a group declares is a
// string; the id it is supposed to hit lives in a simulation component the
// frame deliberately knows nothing about (docs/ARCHITECTURE.md §5.2), so no
// contract test can pair them up. A typo — `sim-medien` declared against
// `id="sim-media"` rendered — produces a link that scrolls nowhere and moves
// no focus, with every unit test, every contract test and every axe run
// green. That is the failure this suite exists to make impossible.
//
// The cases are generated from the declared groups, so each section of the CSR
// campaign is covered the moment its slice declares it, without anyone
// remembering to come back here. Slice 14 declares the first of the five; the
// negative control below has become a positive one and now asserts that the
// generator produces cases at all.
const ANCHORED_GROUPS = SCENARIOS.filter((scenario) => scenario.status === 'available').flatMap(
  (scenario) =>
    scenario.groups
      .filter((group) => group.anchorId !== undefined)
      // `firstStepPath` returns routerLink segments starting with
      // '/szenario', so joining them yields the route as typed in the URL
      // bar — and it is the same function the home page links with, so this
      // suite cannot drift to a route that does not exist.
      .map((group) => ({ url: firstStepPath(scenario).join('/'), scenario, group })),
);

test.describe('Barrier panel — section anchors (docs/ARCHITECTURE.md §12.1.1)', () => {
  for (const { url, scenario, group } of ANCHORED_GROUPS) {
    test(`${scenario.path} → "${group.title}" reaches its section and leaves focus there`, async ({
      page,
    }) => {
      await gotoRendered(page, url);

      const link = page.locator(`#barrier-group-${group.id}-anchor`);
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute('href', new RegExp(`#${group.anchorId}$`));

      // The target has to exist, and it has to be inside the region: an
      // anchor that lands in the frame would be a link out of the simulation
      // dressed up as a link into it.
      const target = page.locator(`#${group.anchorId}`);
      await expect(target).toHaveCount(1);
      expect(
        await page.evaluate(
          (id) =>
            document
              .querySelector('[data-simulation-region]')!
              .contains(document.getElementById(id)),
          group.anchorId!,
        ),
      ).toBe(true);

      // A real keyboard activation, not `.click()` (docs/TESTING.md §9), and
      // the assertion is on `document.activeElement`: scrolling to a section
      // without taking focus with it is the failure mode of a naive anchor.
      //
      // **This requires the target to carry `tabindex="-1"`.** A heading is
      // not focusable, so a browser jumping to it moves the sequential focus
      // starting point and leaves `document.activeElement` on `body` — the
      // page scrolls and the screen reader stays where it was. Every other
      // in-page target in this application is `tabindex="-1"` for this exact
      // reason (`#content`, `#panel`, the region's end anchor), and a section
      // heading declared as an `anchorId` is no different. Verified in both
      // directions while this suite was written: without the attribute the
      // assertion below fails, with it the whole case passes.
      await link.focus();
      await page.keyboard.press('Enter');
      expect(await page.evaluate(() => document.activeElement?.id)).toBe(group.anchorId);

      // ...and it is a jump, not a trap: Tab moves on from the target
      // (docs/TESTING.md §7).
      const before = await page.evaluate(() => document.activeElement?.id);
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.id)).not.toBe(before);
    });
  }

  // The control for the generator above. Without it, a renamed `groups` field
  // or a filter that stops matching would empty ANCHORED_GROUPS and every case
  // above would silently cease to exist — a suite that quietly stops testing
  // anything is the thing this file cannot afford.
  test('the anchored-group generator produces cases (docs/SPEC_v2.md slice 14)', async () => {
    const declared = SCENARIOS.filter((scenario) => scenario.status === 'available').flatMap(
      (scenario) => scenario.groups,
    );

    expect(declared.length).toBeGreaterThan(0);
    expect(ANCHORED_GROUPS.length).toBeGreaterThan(0);
  });
});
