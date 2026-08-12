// docs/ARCHITECTURE.md §9, docs/SPEC_v1.md Slice 3 acceptance: "Focus lands
// on the h1 after every navigation; page title announced once." The initial
// load is excluded on purpose (src/app/core/focus-manager.service.ts) so a
// keyboard user's first Tab press still reaches the skip links rather than
// being jumped past them — verified here alongside the positive case.
import { expect, test } from '@playwright/test';
import { gotoRendered } from './support/goto';

test.describe('Route-change focus management', () => {
  test('does not steal focus on initial load', async ({ page }) => {
    await gotoRendered(page, '/');
    const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect(activeTag).not.toBe('H1');
  });

  test('focuses the new page h1, via a programmatic tabindex, after a client-side navigation', async ({
    page,
  }) => {
    await gotoRendered(page, '/');
    await page.getByRole('link', { name: 'Bewerbungsprozess' }).click();

    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Bewerbungsprozess');
    await expect(h1).toBeFocused();
    await expect(h1).toHaveAttribute('tabindex', '-1');
  });

  // docs/UX-COPY.md §5.7 "Seitenwechsel": title, then how many barriers are
  // still active. Asserted on a real navigation because the count is read
  // from the router state of the page being *entered* — a service-level test
  // with a fake router cannot show that the two are in step.
  test('announces the new page title and the active barrier count', async ({ page }) => {
    await gotoRendered(page, '/');
    await page.getByRole('link', { name: 'Bewerbungsprozess' }).click();

    await expect(page.locator('[aria-live="polite"]')).toHaveText(
      'Bewerbungsprozess. 11 von 11 Barrieren aktiv.',
    );
  });

  test('announces the count carried in the URL when moving between steps', async ({ page }) => {
    await gotoRendered(page, '/szenario/bewerbung/stellenanzeige?frei=labels,pdf');
    await page.getByRole('link', { name: 'Weiter zu: Bewerbungsformular' }).click();

    await expect(page.locator('[aria-live="polite"]')).toHaveText(
      'Bewerbungsprozess. 9 von 11 Barrieren aktiv.',
    );
  });

  // The home page has no barriers; "0 von 0 Barrieren aktiv" would be noise.
  test('announces the bare title on a page without barriers', async ({ page }) => {
    await gotoRendered(page, '/szenario/bewerbung/stellenanzeige');
    await page.getByRole('link', { name: 'Startseite' }).click();

    await expect(page.locator('[aria-live="polite"]')).toHaveText(
      'AccessIssue: Barrieren sichtbar machen',
    );
  });
});
