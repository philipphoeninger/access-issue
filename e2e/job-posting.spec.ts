// Step 1 of the application process — the first two barriers in the
// application (docs/SPEC_v1.md slice 7).
//
// The four tested states are the n + 2 set of docs/TESTING.md §4: every
// barrier active, every barrier resolved, and each of the two resolved on its
// own. Runs 1 and 3 must be clean in all four; run 2 must find `image-alt`
// in exactly the two where `grafik` is still active.
//
// Structural assertions for both barriers live in the component spec
// (src/app/scenarios/application-process/job-posting-step/…spec.ts) where they
// run in milliseconds. What is here is what only a real browser can answer:
// what axe sees, what a deep link reproduces, and what survives a step change.
import { expect, test, type Page } from '@playwright/test';
import { barrierAssertion, expectedRuleFor, frameGate, pageLevelRules } from './support/axe-runs';
import { gotoRendered } from './support/goto';

const PATH = '/szenario/bewerbung/stellenanzeige';
const FORM_PATH = '/szenario/bewerbung/formular';

/** docs/TESTING.md §4 — n + 2 for the two barriers of this step. */
const STATES: Array<{ name: string; query: string; graphicResolved: boolean }> = [
  { name: 'both barriers active (default)', query: '', graphicResolved: false },
  { name: 'both barriers resolved', query: '?frei=alle', graphicResolved: true },
  { name: 'only `grafik` resolved', query: '?frei=grafik', graphicResolved: true },
  { name: 'only `sprache` resolved', query: '?frei=sprache', graphicResolved: false },
];

/** The rule id comes from the fixture, never from a literal (docs/TESTING.md §5). */
const GRAPHIC_RULE = expectedRuleFor('bewerbung', 'grafik');

function ruleIds(violations: Array<{ id: string }>): string[] {
  return violations.map((violation) => violation.id);
}

/** The benefits graphic as the DOM actually exposes it. */
function graphicAlt(page: Page): Promise<string | null> {
  return page.locator('[data-simulation-region] .benefits-graphic').getAttribute('alt');
}

for (const { name, query, graphicResolved } of STATES) {
  test.describe(`Job posting — ${name}`, () => {
    test('run 1: frame gate reports zero violations', async ({ page }) => {
      await gotoRendered(page, `${PATH}${query}`);
      const results = await frameGate(page).analyze();
      expect(results.violations).toEqual([]);
    });

    test('run 3: page-level rules report zero violations', async ({ page }) => {
      await gotoRendered(page, `${PATH}${query}`);
      const results = await pageLevelRules(page).analyze();
      expect(results.violations).toEqual([]);
    });

    // Run 2, with opposite expectations by state. This is the assertion that
    // the barrier is genuinely there while it is switched on — a simulation
    // that only *looks* broken would pass every other test in this file.
    test(`run 2: reports ${graphicResolved ? 'no' : 'a'} ${GRAPHIC_RULE} violation in the region`, async ({
      page,
    }) => {
      await gotoRendered(page, `${PATH}${query}`);
      const results = await barrierAssertion(page).analyze();

      if (graphicResolved) {
        expect(ruleIds(results.violations)).not.toContain(GRAPHIC_RULE);
      } else {
        expect(ruleIds(results.violations)).toContain(GRAPHIC_RULE);
      }
    });
  });
}

// docs/TESTING.md §12: reach a state through the panel, read the URL, open it
// in a fresh page, and assert the DOM matches. Toggling and deep-linking have
// to produce the same page or the URL is not the state (docs/ARCHITECTURE.md
// §8) — and a lecturer's link in a slide deck opens something else than what
// they saw.
test.describe('Deep link (docs/TESTING.md §12)', () => {
  test('a state reached by toggling reproduces exactly from its URL', async ({ page }) => {
    await gotoRendered(page, PATH);

    // Reached through the control, not through the address bar.
    await page.getByRole('checkbox', { name: /Gehalt und Leistungen als Text/ }).click();

    // Web-first, and on something the toggle actually changes. An assertion on
    // the language variant would read the same before and after this click —
    // `sprache` stays active here — so it would pass instantly and synchronise
    // nothing, leaving the one-shot reads below racing the navigation that the
    // toggle starts. `toHaveAttribute` retries until the re-render lands.
    await expect(page.locator('[data-simulation-region] .benefits-graphic')).toHaveAttribute(
      'alt',
      '',
    );

    // Only now is the URL settled: the toggle navigates (replaceUrl), and
    // `page.url()` is a one-shot read with no retry of its own.
    const url = new URL(page.url());
    expect(url.searchParams.get('frei')).toBe('grafik');

    const reopened = await page.context().newPage();
    await gotoRendered(reopened, `${url.pathname}${url.search}`);

    // Same rendered variant …
    expect(await graphicAlt(reopened)).toBe('');
    await expect(
      reopened.locator('[data-simulation-region]').getByText('Was wir bieten'),
    ).toBeVisible();
    await expect(
      reopened.locator('[data-simulation-region]').getByText(/Im Rahmen der Ihnen obliegenden/),
    ).toBeVisible();

    // … and the same toggle positions.
    await expect(
      reopened.getByRole('checkbox', { name: /Gehalt und Leistungen als Text/ }),
    ).toBeChecked();
    await expect(
      reopened.getByRole('checkbox', { name: /Stellenbeschreibung in klarer Sprache/ }),
    ).not.toBeChecked();

    await reopened.close();
  });

  test('an unknown key falls back to the default state without an error', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=gibtesnicht`);

    expect(await graphicAlt(page)).toBeNull();
    await expect(page.locator('main h1')).toHaveText('Bewerbungsprozess');
  });
});

// docs/SPEC_v1.md slice 7: "Step navigation preserves toggle state and pushes
// history." Barrier state is scoped to the *scenario*, not the step — `frei`
// lists barriers from all four steps and the counter counts all of them — so
// walking on must carry it, and Back must come back to what was there.
test.describe('Step navigation (docs/ARCHITECTURE.md §10)', () => {
  test('carries `frei` to step 2 and returns with it on Back', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=sprache`);

    await page.getByRole('link', { name: 'Weiter zu: Bewerbungsformular' }).click();
    await expect(page.locator('.step-indicator')).toHaveText(
      'Schritt 2 von 4 — Bewerbungsformular',
    );
    expect(new URL(page.url()).pathname).toBe(FORM_PATH);
    expect(new URL(page.url()).searchParams.get('frei')).toBe('sprache');

    // A push, not a replace: the step is a place, and Back is the way out of
    // it. Toggling is the opposite (replaceUrl) — 40 presses of Back after
    // playing with the panel is not navigation.
    await page.goBack();
    expect(new URL(page.url()).pathname).toBe(PATH);
    expect(new URL(page.url()).searchParams.get('frei')).toBe('sprache');

    await expect(
      page.getByRole('checkbox', { name: /Stellenbeschreibung in klarer Sprache/ }),
    ).toBeChecked();
    await expect(
      page.locator('[data-simulation-region]').getByText(/Sie leiten unsere IT-Projekte/),
    ).toBeVisible();
  });
});
