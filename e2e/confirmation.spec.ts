// Step 4 of the application process — the confirmation and its three barriers
// (docs/SPEC_v1.md slice 10), and the walk from step 1 to step 4 that the
// slice's last acceptance criterion asks for.
//
// The five tested states are the n + 2 set of docs/TESTING.md §4: all three
// barriers active, all three resolved, and each resolved on its own. Runs 1
// and 3 must be clean in all five; run 2 must find `image-alt` in exactly the
// three where `bestaetigung` is still active.
//
// Only that one barrier has a run 2. The other two are organisational
// (`organisational: true`, empty `standards`): they violate no success
// criterion, and there is nothing for any checker to report while they are
// active. Their coverage is structural and lives in
// confirmation-step.component.spec.ts. The gap is the lesson of this step, not
// an omission in this file — a page can pass every automated run and still
// leave a person with no way to ask for what they need.
import { expect, test, type Page } from '@playwright/test';
import { barrierAssertion, expectedRuleFor, frameGate, pageLevelRules } from './support/axe-runs';
import { gotoRendered } from './support/goto';

const PATH = '/szenario/bewerbung/rueckmeldung';
const POSTING_PATH = '/szenario/bewerbung/stellenanzeige';
const UPLOAD_PATH = '/szenario/bewerbung/dokumente';

/** docs/TESTING.md §4 — n + 2 for the three barriers of this step. */
const STATES: Array<{ name: string; query: string; confirmationResolved: boolean }> = [
  { name: 'all barriers active (default)', query: '', confirmationResolved: false },
  { name: 'all barriers resolved', query: '?frei=alle', confirmationResolved: true },
  { name: 'only `bestaetigung` resolved', query: '?frei=bestaetigung', confirmationResolved: true },
  {
    name: 'only `ansprechperson` resolved',
    query: '?frei=ansprechperson',
    confirmationResolved: false,
  },
  {
    name: 'only `inklusionshinweis` resolved',
    query: '?frei=inklusionshinweis',
    confirmationResolved: false,
  },
];

/** The rule id comes from the fixture, never from a literal (docs/TESTING.md §5). */
const SIGNATURE_RULE = expectedRuleFor('bewerbung', 'bestaetigung');

function ruleIds(violations: Array<{ id: string }>): string[] {
  return violations.map((violation) => violation.id);
}

/** The signature graphic as the DOM actually exposes it. */
function signatureAlt(page: Page): Promise<string | null> {
  return page.locator('[data-simulation-region] .confirm-signature').getAttribute('alt');
}

for (const { name, query, confirmationResolved } of STATES) {
  test.describe(`Confirmation — ${name}`, () => {
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

    test(`run 2: reports ${confirmationResolved ? 'no' : 'a'} ${SIGNATURE_RULE} violation in the region`, async ({
      page,
    }) => {
      await gotoRendered(page, `${PATH}${query}`);
      const results = await barrierAssertion(page).analyze();

      if (confirmationResolved) {
        expect(ruleIds(results.violations)).not.toContain(SIGNATURE_RULE);
      } else {
        expect(ruleIds(results.violations)).toContain(SIGNATURE_RULE);
      }
    });
  });
}

// The two organisational barriers, seen from the outside. With `bestaetigung`
// resolved, the one rule that ever fires on this page is gone — and both other
// barriers are still standing: no name to ask for, and no word that an
// adjustment is possible. This is as close as an automated suite gets to them,
// and stating it here is what keeps a green run 2 from reading as "this page
// is fine" (docs/TESTING.md §2).
test.describe('The barriers no run can see (docs/PRD.md §6.1)', () => {
  test('run 2 is clean while two of the three barriers are still active', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=bestaetigung`);

    const results = await barrierAssertion(page).analyze();
    expect(ruleIds(results.violations)).not.toContain(SIGNATURE_RULE);

    await expect(page.locator('[data-simulation-region]').getByText('Miriam Kessler')).toHaveCount(
      0,
    );
    await expect(page.locator('[data-simulation-region] .inclusion')).toHaveCount(0);
  });
});

// docs/TESTING.md §12: reach a state through the panel, read the URL, open it
// in a fresh page, and assert the DOM matches.
test.describe('Deep link (docs/TESTING.md §12)', () => {
  test('a state reached by toggling reproduces exactly from its URL', async ({ page }) => {
    await gotoRendered(page, PATH);

    await page.getByRole('checkbox', { name: /Bestätigung in verständlicher Sprache/ }).click();

    // Web-first, and on something the toggle actually changes: the graphic
    // goes from having no `alt` at all to being explicitly decorative.
    await expect(page.locator('[data-simulation-region] .confirm-signature')).toHaveAttribute(
      'alt',
      '',
    );

    const url = new URL(page.url());
    expect(url.searchParams.get('frei')).toBe('bestaetigung');

    const reopened = await page.context().newPage();
    await gotoRendered(reopened, `${url.pathname}${url.search}`);

    expect(await signatureAlt(reopened)).toBe('');
    await expect(
      reopened.locator('[data-simulation-region]').getByText('Ihr Aktenzeichen: BW-2026-0417'),
    ).toBeVisible();

    // The two organisational barriers are untouched, and their state is
    // visible only as the absence of two sections.
    await expect(reopened.locator('[data-simulation-region] .contact-mailbox')).toHaveCount(1);
    await expect(reopened.locator('[data-simulation-region] .inclusion')).toHaveCount(0);

    await expect(
      reopened.getByRole('checkbox', { name: /Bestätigung in verständlicher Sprache/ }),
    ).toBeChecked();
    await expect(
      reopened.getByRole('checkbox', { name: /Ansprechperson mit Namen und Kontakt genannt/ }),
    ).not.toBeChecked();

    await reopened.close();
  });

  test('every one of the five states reproduces from its URL', async ({ page }) => {
    for (const { query } of STATES) {
      await gotoRendered(page, `${PATH}${query}`);

      const resolved = (urlKey: string) =>
        query === '?frei=alle' || query === `?frei=${urlKey}` ? 1 : 0;

      await expect(page.locator('[data-simulation-region] .next-steps')).toHaveCount(
        resolved('bestaetigung'),
      );
      await expect(page.locator('[data-simulation-region] .contact')).toHaveCount(
        resolved('ansprechperson'),
      );
      await expect(page.locator('[data-simulation-region] .inclusion')).toHaveCount(
        resolved('inklusionshinweis'),
      );
    }
  });
});

// docs/SPEC_v1.md slice 10 acceptance: "The flow is completable end to end from
// step 1 to step 4 with state carried through." One key per step, so every
// stage of the walk has something to show — and the last step proves the keys
// of the first three survived it.
test.describe('The full flow, step 1 to step 4', () => {
  test('walks all four steps through the frame and carries `frei` along', async ({ page }) => {
    const keys = 'grafik,labels,pdf,bestaetigung';
    await gotoRendered(page, `${POSTING_PATH}?frei=${keys}`);

    // Step 1: the benefits graphic is decorative, its figures are text.
    await expect(page.locator('[data-simulation-region] .benefits-graphic')).toHaveAttribute(
      'alt',
      '',
    );

    await page.getByRole('link', { name: 'Weiter zu: Bewerbungsformular' }).click();
    await expect(page.locator('.step-indicator')).toHaveText(
      'Schritt 2 von 4 — Bewerbungsformular',
    );
    // Step 2: every field is labelled.
    await expect(page.locator('[data-simulation-region] label')).toHaveCount(8);

    await page.getByRole('link', { name: 'Weiter zu: Unterlagen hochladen' }).click();
    await expect(page.locator('.step-indicator')).toHaveText(
      'Schritt 3 von 4 — Unterlagen hochladen',
    );
    // Step 3: the posting stands as text beside the download.
    await expect(page.locator('[data-simulation-region] h5').first()).toBeVisible();

    await page.getByRole('link', { name: 'Weiter zu: Rückmeldung' }).click();
    await expect(page.locator('.step-indicator')).toHaveText('Schritt 4 von 4 — Rückmeldung');
    expect(new URL(page.url()).pathname).toBe(PATH);
    expect(new URL(page.url()).searchParams.get('frei')).toBe(keys);

    // Step 4: the last key in the list is in effect here, three steps after it
    // was set — barrier state is scoped to the scenario, not the step
    // (docs/ARCHITECTURE.md §8).
    expect(await signatureAlt(page)).toBe('');
    await expect(
      page.locator('[data-simulation-region]').getByText('Ihr Aktenzeichen: BW-2026-0417'),
    ).toBeVisible();

    // And the walk was a push, not a replace: Back is the way out of a step.
    await page.goBack();
    expect(new URL(page.url()).pathname).toBe(UPLOAD_PATH);
    expect(new URL(page.url()).searchParams.get('frei')).toBe(keys);
  });

  test('step 4 is the end of the flow: back only, no forward link', async ({ page }) => {
    await gotoRendered(page, PATH);

    await expect(page.getByRole('link', { name: 'Zurück zu: Unterlagen hochladen' })).toHaveCount(
      1,
    );
    await expect(page.locator('.step-nav a')).toHaveCount(1);
  });
});
