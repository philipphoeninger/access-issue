// Step 2 of the application process — four barriers, and the riskiest slice in
// phase 1 (docs/SPEC_v1.md slice 8).
//
// The six tested states are the n + 2 set of docs/TESTING.md §4: all four
// active, all four resolved, and each of the four resolved on its own. Runs 1
// and 3 must be clean in all six; run 2 must find `label` in exactly the four
// where `labels` is still active.
//
// Structural assertions live in the component spec, where they run in
// milliseconds. What is here is what only a real browser can answer: what axe
// sees, what the Tab key does, where focus lands after a failed submission,
// what a deep link reproduces, and what survives a step change.
import { expect, test, type Page } from '@playwright/test';
import { barrierAssertion, expectedRuleFor, frameGate, pageLevelRules } from './support/axe-runs';
import { gotoRendered } from './support/goto';

const PATH = '/szenario/bewerbung/formular';
const POSTING_PATH = '/szenario/bewerbung/stellenanzeige';

/** docs/TESTING.md §4 — n + 2 for the four barriers of this step. */
const STATES: Array<{ name: string; query: string; labelsResolved: boolean }> = [
  { name: 'all four barriers active (default)', query: '', labelsResolved: false },
  { name: 'all four barriers resolved', query: '?frei=alle', labelsResolved: true },
  { name: 'only `labels` resolved', query: '?frei=labels', labelsResolved: true },
  { name: 'only `tastatur` resolved', query: '?frei=tastatur', labelsResolved: false },
  { name: 'only `pflichtfeld` resolved', query: '?frei=pflichtfeld', labelsResolved: false },
  { name: 'only `fehler` resolved', query: '?frei=fehler', labelsResolved: false },
];

/** The rule id comes from the fixture, never from a literal (docs/TESTING.md §5). */
const LABEL_RULE = expectedRuleFor('labels');

function ruleIds(violations: Array<{ id: string }>): string[] {
  return violations.map((violation) => violation.id);
}

/** True while focus sits inside the simulation region. */
function focusIsInsideRegion(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const region = document.querySelector('[data-simulation-region]');
    const active = document.activeElement;
    return region !== null && active !== null && region.contains(active);
  });
}

for (const { name, query, labelsResolved } of STATES) {
  test.describe(`Application form — ${name}`, () => {
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

    // Run 2, with opposite expectations by state. A form that only *looks*
    // unlabelled would pass every other test in this file.
    test(`run 2: reports ${labelsResolved ? 'no' : 'a'} ${LABEL_RULE} violation in the region`, async ({
      page,
    }) => {
      await gotoRendered(page, `${PATH}${query}`);
      const results = await barrierAssertion(page).analyze();

      if (labelsResolved) {
        expect(ruleIds(results.violations)).not.toContain(LABEL_RULE);
      } else {
        expect(ruleIds(results.violations)).toContain(LABEL_RULE);
      }
    });

    // Runs 1 and 3 again after a failed submission: the error output is the
    // half of this step that only exists after an interaction, and the error
    // summary adds a heading and a set of links to the document. A boundary
    // that holds on load and breaks on submit holds for nobody.
    test('runs 1 and 3 stay clean after a failed submission', async ({ page }) => {
      await gotoRendered(page, `${PATH}${query}`);
      await page.locator('[data-simulation-region] .submit-button').click();
      await expect(
        page.locator(
          '[data-simulation-region] .error-generic, [data-simulation-region] .error-summary',
        ),
      ).toHaveCount(1);

      expect((await frameGate(page).analyze()).violations).toEqual([]);
      expect((await pageLevelRules(page).analyze()).violations).toEqual([]);
    });
  });
}

// docs/SPEC_v1.md slice 8: "Keyboard assertions use real key events, not
// `.focus()`". docs/TESTING.md §6 says the same and gives the reason — a
// simulated trap a test bypasses with `.focus()` is not being tested at all.
test.describe('Barrier `tastatur` (docs/ARCHITECTURE.md §5.3)', () => {
  /**
   * Tabs from the exit link and reports every element focus visited inside the
   * region. Real key presses throughout, and it stops as soon as focus leaves
   * — which is the moment the region's tab order is exhausted.
   */
  async function tabThroughRegion(page: Page, maxPresses = 50): Promise<string[]> {
    await page.locator('.exit-link').focus();
    const visited: string[] = [];

    for (let press = 0; press < maxPresses; press++) {
      await page.keyboard.press('Tab');
      if (!(await focusIsInsideRegion(page))) {
        break;
      }
      visited.push(
        await page.evaluate(() => {
          const active = document.activeElement as HTMLElement;
          return `${active.tagName.toLowerCase()}#${active.id}.${active.className}`;
        }),
      );
    }

    return visited;
  }

  test('active: the submit control is never focused, and Tab still leaves the region', async ({
    page,
  }) => {
    await gotoRendered(page, PATH);

    const visited = await tabThroughRegion(page);

    // The eight fields are reachable — the barrier is one control, not the
    // form. If this ever went to zero the test below would still pass while
    // proving nothing.
    expect(visited.length).toBeGreaterThanOrEqual(8);
    expect(visited.filter((entry) => entry.includes('submit-button'))).toEqual([]);

    // The trap detector of docs/TESTING.md §7, here as well as in
    // e2e/exit-link.spec.ts: making one control unreachable is the barrier,
    // holding the user inside the region never is.
    expect(await focusIsInsideRegion(page)).toBe(false);
  });

  test('active: the control carries no tabindex and no role, and is not a button', async ({
    page,
  }) => {
    await gotoRendered(page, PATH);
    const control = page.locator('[data-simulation-region] .submit-button');

    await expect(control).toHaveJSProperty('tagName', 'DIV');
    await expect(control).not.toHaveAttribute('tabindex');
    await expect(control).not.toHaveAttribute('role');
  });

  test('resolved: the button is reached by Tab and activated by Enter', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=tastatur`);

    const visited = await tabThroughRegion(page);
    expect(visited.filter((entry) => entry.includes('submit-button')).length).toBe(1);

    // Focused with the keyboard, then pressed with the keyboard. Nothing here
    // calls `.focus()` or `.click()`.
    await page.locator('.exit-link').focus();
    for (let press = 0; press < 50; press++) {
      await page.keyboard.press('Tab');
      const onSubmit = await page.evaluate(() =>
        (document.activeElement as HTMLElement).classList.contains('submit-button'),
      );
      if (onSubmit) {
        break;
      }
    }
    await page.keyboard.press('Enter');

    // `fehler` is still active in this state, so the answer is the opaque line.
    await expect(page.locator('[data-simulation-region] .error-generic')).toBeVisible();
  });

  test('resolved: the button is also activated by Space', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=tastatur`);

    await page.locator('[data-simulation-region] .submit-button').focus();
    await page.keyboard.press('Space');

    await expect(page.locator('[data-simulation-region] .error-generic')).toBeVisible();
  });
});

// docs/SPEC_v1.md slice 8: "With `fehler` resolved: invalid submission
// produces `role="alert"`, `aria-invalid`, programmatic association, and focus
// on the first error." The focus move is the part no unit test can prove.
test.describe('Barrier `fehler` (docs/UX-COPY.md §8.5)', () => {
  test('resolved: an invalid submission announces, associates, and moves focus', async ({
    page,
  }) => {
    await gotoRendered(page, `${PATH}?frei=fehler,tastatur`);

    await page.locator('[data-simulation-region] .submit-button').click();

    const summary = page.locator('[data-simulation-region] .error-summary');
    await expect(summary).toHaveAttribute('role', 'alert');
    await expect(summary.getByRole('heading', { level: 4 })).toHaveText(
      'Die Bewerbung konnte nicht abgesendet werden',
    );

    const firstField = page.locator('#sim-first-name');
    await expect(firstField).toHaveAttribute('aria-invalid', 'true');
    await expect(firstField).toBeFocused();

    // The association points at an element that exists and says something.
    const describedBy = await firstField.getAttribute('aria-describedby');
    await expect(page.locator(`#${describedBy}`)).toHaveText('Bitte geben Sie Ihren Vornamen an.');
  });

  test('resolved: a jump link moves focus to the field it names', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=fehler,tastatur`);
    await page.locator('[data-simulation-region] .submit-button').click();

    await page.getByRole('link', { name: 'Bitte geben Sie Ihre E-Mail-Adresse an.' }).click();

    await expect(page.locator('#sim-email')).toBeFocused();
  });

  test('active: nothing is announced, associated, or focused', async ({ page }) => {
    await gotoRendered(page, PATH);

    await page.locator('[data-simulation-region] .submit-button').click();

    await expect(page.locator('[data-simulation-region] .error-generic')).toContainText('Code 422');
    await expect(page.locator('[data-simulation-region] [role="alert"]')).toHaveCount(0);
    await expect(page.locator('[data-simulation-region] [aria-invalid]')).toHaveCount(0);

    // Focus stays where the click left it — the barrier includes not being
    // told where to look.
    //
    // Asserted against the *fields*, not against the submit control: a `<div>`
    // with no tabindex can never hold focus, so a check for it would read
    // `false` whatever the component did. If the `errorFeedback()` guard in
    // `submit()` ever fell away, focus would land on `#sim-first-name` — this
    // is the assertion that says so.
    const focusIsInTheForm = await page.evaluate(() => {
      const form = document.querySelector('.application-form');
      const active = document.activeElement;
      return form !== null && active !== null && form.contains(active);
    });
    expect(focusIsInTheForm).toBe(false);
  });
});

// docs/TESTING.md §12: reach a state through the panel, read the URL, open it
// in a fresh page, and assert the DOM matches.
test.describe('Deep link (docs/TESTING.md §12)', () => {
  test('a state reached by toggling reproduces exactly from its URL', async ({ page }) => {
    await gotoRendered(page, PATH);

    await page.getByRole('checkbox', { name: /Formularfelder mit Beschriftungen/ }).click();

    // Web-first, on something the toggle actually changes: the labels appear.
    await expect(page.locator('[data-simulation-region] label')).toHaveCount(8);

    const url = new URL(page.url());
    expect(url.searchParams.get('frei')).toBe('labels');

    const reopened = await page.context().newPage();
    await gotoRendered(reopened, `${url.pathname}${url.search}`);

    await expect(reopened.locator('[data-simulation-region] label')).toHaveCount(8);
    // The other three are untouched: a div submit, asterisks, Code 422.
    await expect(reopened.locator('[data-simulation-region] .submit-button')).toHaveJSProperty(
      'tagName',
      'DIV',
    );
    await expect(reopened.locator('[data-simulation-region] .required-star')).toHaveCount(4);

    await expect(
      reopened.getByRole('checkbox', { name: /Formularfelder mit Beschriftungen/ }),
    ).toBeChecked();
    await expect(
      reopened.getByRole('checkbox', { name: /Formular per Tastatur bedienbar/ }),
    ).not.toBeChecked();

    await reopened.close();
  });
});

// docs/SPEC_v1.md slice 8: "Toggle state survives navigation between steps in
// both directions." Barrier state is scoped to the scenario, not the step, so
// a key from step 1 has to survive a walk to step 2 and back — and one from
// step 2 the walk the other way.
test.describe('Step navigation (docs/ARCHITECTURE.md §10)', () => {
  test('carries `frei` back to step 1 and forward again', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=labels,sprache`);

    await page.getByRole('link', { name: 'Zurück zu: Stellenanzeige' }).click();
    await expect(page.locator('.step-indicator')).toHaveText('Schritt 1 von 4 — Stellenanzeige');
    expect(new URL(page.url()).pathname).toBe(POSTING_PATH);
    expect(new URL(page.url()).searchParams.get('frei')).toBe('labels,sprache');

    // The step-1 key is in effect there …
    await expect(
      page.locator('[data-simulation-region]').getByText(/Sie leiten unsere IT-Projekte/),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Weiter zu: Bewerbungsformular' }).click();
    expect(new URL(page.url()).pathname).toBe(PATH);
    expect(new URL(page.url()).searchParams.get('frei')).toBe('labels,sprache');

    // … and the step-2 key is still in effect here.
    await expect(page.locator('[data-simulation-region] label')).toHaveCount(8);

    // A push, not a replace, in both directions.
    await page.goBack();
    expect(new URL(page.url()).pathname).toBe(POSTING_PATH);
  });
});
