// The boundary rules that span the frame/simulation split
// (docs/ARCHITECTURE.md §5.6) plus the simulation bar's own promises
// (docs/UX-COPY.md §5.4, §5.6), asserted on the rendered page rather than on
// one component's DOM. Rules 1 and 2 exist because the axe strategy in
// docs/TESTING.md §5 cannot see violations of them; the rest of this file is
// what "the counter is the only counter in the document" means in practice.
import { expect, test } from '@playwright/test';
import { frameGate, pageLevelRules } from './support/axe-runs';

const PATH = '/szenario/bewerbung/stellenanzeige';

/** Matches every form of the counter in docs/UX-COPY.md §5.4. */
const COUNTER_PATTERN =
  /^(Keine Barriere aktiv|Alle \d+ Barrieren aktiv|\d+ von \d+ Barrieren aktiv)$/;

test.describe('The simulation region on the page', () => {
  test('renders exactly one region, labelled and described from the frame', async ({ page }) => {
    await page.goto(PATH);

    const region = page.locator('[data-simulation-region]');
    await expect(region).toHaveCount(1);
    await expect(region).toHaveAttribute('role', 'region');

    const describedBy = await region.getAttribute('aria-describedby');
    const description = page.locator(`#${describedBy}`);
    await expect(description).toHaveText(/Nachbau der Website der fiktiven Elbwerk GmbH/);

    // The description is frame-owned and static — it must not live inside the
    // region it describes (docs/ARCHITECTURE.md §5.1).
    const insideRegion = await page.evaluate((id) => {
      const region = document.querySelector('[data-simulation-region]');
      const element = document.getElementById(id!);
      return region !== null && element !== null && region.contains(element);
    }, describedBy);
    expect(insideRegion).toBe(false);
  });

  test('contains no h1, and its first heading is an h2 (rule 1)', async ({ page }) => {
    await page.goto(PATH);

    const headings = await page.evaluate(() => {
      const region = document.querySelector('[data-simulation-region]')!;
      return Array.from(region.querySelectorAll('h1, h2, h3, h4, h5, h6'), (h) => h.tagName);
    });

    expect(headings).not.toContain('H1');
    expect(headings[0]).toBe('H2');
  });

  test('prefixes every id inside the region with sim- (rule 2)', async ({ page }) => {
    await page.goto(PATH);

    const unprefixed = await page.evaluate(() => {
      const region = document.querySelector('[data-simulation-region]')!;
      return Array.from(region.querySelectorAll('[id]'), (element) => element.id).filter(
        (id) => !id.startsWith('sim-'),
      );
    });

    expect(unprefixed).toEqual([]);
  });

  test('declares no lang of its own (rule 3)', async ({ page }) => {
    await page.goto(PATH);

    const langs = await page.evaluate(() => {
      const region = document.querySelector('[data-simulation-region]')!;
      const own = region.getAttribute('lang');
      const inside = Array.from(region.querySelectorAll('[lang]'), (el) => el.getAttribute('lang'));
      return own === null ? inside : [own, ...inside];
    });

    expect(langs).toEqual([]);
  });
});

test.describe('The simulation bar (docs/DESIGN.md §6)', () => {
  test('holds the only counter in the document, counting active barriers', async ({ page }) => {
    await page.goto(PATH);

    const counters = await page.evaluate((source) => {
      const pattern = new RegExp(source);
      // Leaf elements only: every ancestor of the counter also "contains" its
      // text, and counting those would make the assertion meaningless.
      return Array.from(document.querySelectorAll('*'))
        .filter((element) => element.children.length === 0)
        .map((element) => (element.textContent ?? '').trim())
        .filter((text) => pattern.test(text));
    }, COUNTER_PATTERN.source);

    // The literal is deliberate, and it is the second half of the assertion:
    // eleven is the *scenario's* barrier count, not this step's two. A bar
    // that counted only the current step would still produce exactly one
    // counter and pass a pattern-only check. When a barrier is added to the
    // application process, update the number here — but check first that the
    // new number is the scenario total.
    expect(counters).toEqual(['Alle 11 Barrieren aktiv']);
  });

  test('reflects the resolved state carried in the URL', async ({ page }) => {
    await page.goto(`${PATH}?frei=alle`);
    await expect(page.locator('.counter')).toHaveText('Keine Barriere aktiv');

    await page.goto(`${PATH}?frei=grafik,sprache`);
    await expect(page.locator('.counter')).toHaveText('9 von 11 Barrieren aktiv');
  });

  test('writes the chip as "Simulation" and uppercases it in CSS only', async ({ page }) => {
    await page.goto(PATH);

    const chip = page.locator('.chip');
    await expect(chip).toHaveText('Simulation');
    await expect(chip).toHaveCSS('text-transform', 'uppercase');
  });
});

test.describe('Skipping the simulation region (docs/UX-COPY.md §5.1)', () => {
  test('the skip link sits immediately before the region and moves focus past it', async ({
    page,
  }) => {
    await page.goto(PATH);

    const skipLink = page.locator('a[href$="#simulation-end"]');
    await expect(skipLink).toHaveText('Simulationsbereich überspringen');

    await skipLink.focus();
    await expect(skipLink).toBeInViewport();
    await page.keyboard.press('Enter');

    const landedAfterRegion = await page.evaluate(() => {
      const region = document.querySelector('[data-simulation-region]')!;
      const active = document.activeElement;
      return (
        active !== null &&
        active.id === 'simulation-end' &&
        !region.contains(active) &&
        (region.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
      );
    });
    expect(landedAfterRegion).toBe(true);
  });
});

// docs/SPEC_v1.md slice 4 acceptance: "axe run 3 green with the region present
// and empty". The bare route is already covered by e2e/frame-gate.spec.ts;
// this adds the resolved-state URL, so the region is exercised in both of the
// states that exist before the first barrier lands.
test.describe('axe — scenario route with every barrier resolved', () => {
  test('run 1: frame gate reports zero violations', async ({ page }) => {
    await page.goto(`${PATH}?frei=alle`);
    const results = await frameGate(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test('run 3: page-level rules report zero violations', async ({ page }) => {
    await page.goto(`${PATH}?frei=alle`);
    const results = await pageLevelRules(page).analyze();
    expect(results.violations).toEqual([]);
  });
});
