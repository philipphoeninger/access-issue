// docs/SPEC_v1.md slice 6 acceptance over a real page, and the `erklaerung`
// half of the deep-link suite (docs/TESTING.md §12). The rendering assertions
// live in src/app/frame/explanation-view/explanation-view.component.spec.ts;
// what needs a browser is here — the axe runs, real clicks, and the focus
// guarantee that a component test can only approximate.
import { expect, test } from '@playwright/test';
import { frameGate, pageLevelRules } from './support/axe-runs';
import { gotoRendered } from './support/goto';

const STEP = '/szenario/bewerbung/stellenanzeige';

// The states the explanation view actually has: nothing selected, a selected
// barrier while it is active, the same one after it is resolved, and one of
// the two organisational barriers, which renders the no-standard answer
// instead of a list (docs/PRD.md §6.1).
const EXPLANATION_STATES: Array<{ name: string; url: string }> = [
  { name: 'no barrier selected', url: STEP },
  { name: 'a selected barrier, active', url: `${STEP}?erklaerung=grafik` },
  { name: 'a selected barrier, resolved', url: `${STEP}?frei=grafik&erklaerung=grafik` },
  { name: 'a barrier without a standards reference', url: `${STEP}?erklaerung=ansprechperson` },
];

for (const { name, url } of EXPLANATION_STATES) {
  test.describe(`axe — explanation view, ${name}`, () => {
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

test.describe('Explanation view — deep links (docs/TESTING.md §12)', () => {
  test('opens on the barrier the URL names', async ({ page }) => {
    await gotoRendered(page, `${STEP}?erklaerung=sprache`);

    await expect(page.locator('.explanation .barrier-name')).toHaveText('Komplexe Sprache');
    await expect(page.locator('.explanation h3')).toHaveText([
      'Was ist das Problem?',
      'Wen betrifft es?',
      'Was sagen die Normen?',
      'Wie geht es barrierefrei?',
    ]);
  });

  // docs/ARCHITECTURE.md §17: unknown keys are ignored, never an error page.
  test('falls back to the empty state on an unknown key', async ({ page }) => {
    await gotoRendered(page, `${STEP}?erklaerung=gibtesnicht`);

    await expect(page.locator('.explanation .empty')).toHaveText(
      'Wähle im Barriere-Panel einen Eintrag aus, um zu erfahren, worum es geht.',
    );
    await expect(page.locator('.explanation .barrier-name')).toHaveCount(0);
  });

  // The dual channel has to hold in both states: the same four rubrics are
  // readable whether the barrier stands or has been repaired
  // (docs/ARCHITECTURE.md §5.4, docs/PRD.md §8.1 F).
  test('reads the same explanation whether the barrier is active or resolved', async ({ page }) => {
    await gotoRendered(page, `${STEP}?erklaerung=grafik`);
    await expect(page.locator('.explanation .state')).toHaveText(
      'Diese Barriere ist gerade aktiv.',
    );
    const active = await page.locator('.explanation').innerText();

    await gotoRendered(page, `${STEP}?frei=grafik&erklaerung=grafik`);
    await expect(page.locator('.explanation .state')).toHaveText('Diese Barriere ist behoben.');
    const resolved = await page.locator('.explanation').innerText();

    expect(resolved.replace('Diese Barriere ist behoben.', '')).toBe(
      active.replace('Diese Barriere ist gerade aktiv.', ''),
    );
  });
});

test.describe('Explanation view — selection from the panel', () => {
  test('a toggle selects the barrier and leaves focus on the checkbox', async ({ page }) => {
    await gotoRendered(page, STEP);
    const box = page.locator('.panel input[type="checkbox"]').first();
    const id = await box.getAttribute('id');

    await box.focus();
    await page.keyboard.press('Space');

    await expect(page).toHaveURL(/erklaerung=grafik/);
    await expect(page.locator('.explanation .barrier-name')).toHaveText('Textgrafik');
    await expect(page.locator('.explanation .state')).toHaveText('Diese Barriere ist behoben.');
    // docs/ARCHITECTURE.md §12.2: only the explanation's content changes.
    expect(await page.evaluate(() => document.activeElement?.id)).toBe(id);
  });

  // The link merges a query parameter, which moves neither scroll nor focus
  // by itself — and the section it opens sits below both columns, past the
  // fold. Focusing it is what makes the link a link: the browser scrolls it
  // into view, and the reading cursor goes with it.
  test('an explanation link takes the user to the explanation', async ({ page }) => {
    await gotoRendered(page, `${STEP}?erklaerung=grafik`);

    const link = page.locator('a.explain').nth(1); // "Komplexe Sprache"
    await link.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('.explanation .barrier-name')).toHaveText('Komplexe Sprache');
    expect(await page.evaluate(() => document.activeElement?.className)).toContain('explanation');
    // Scrolled into view, not just focused: the defect this fixes was a link
    // that changed the URL and left the viewport where it was.
    await expect(page.locator('.explanation')).toBeInViewport();
  });

  // Two channels for one event talk over each other: the section is focused,
  // so a screen reader reads it on arrival, and the frame's live region stays
  // free for the panel's own toggle sentences (docs/ARCHITECTURE.md §12.2).
  test('selecting an explanation does not speak into the live region', async ({ page }) => {
    await gotoRendered(page, `${STEP}?erklaerung=grafik`);
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toHaveCount(1);

    await page.locator('a.explain').nth(1).click();

    await expect(page.locator('.explanation .barrier-name')).toHaveText('Komplexe Sprache');
    await expect(liveRegion).toHaveText('');
  });

  // A toggle announces once, through the panel (docs/UX-COPY.md §5.7). The
  // explanation view stays silent then: two sentences into one polite region
  // interleave, and the second cuts off the first.
  test('a toggle announces the toggle, not the explanation', async ({ page }) => {
    await gotoRendered(page, STEP);

    await page.locator('.panel input[type="checkbox"]').first().check();

    await expect(page.locator('[aria-live="polite"]')).toHaveText(
      'Gehalt und Leistungen als Text, nicht als Bild: barrierefrei. Noch 10 von 11 Barrieren aktiv.',
    );
  });
});
