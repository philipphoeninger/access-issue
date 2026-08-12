// docs/ARCHITECTURE.md §9, docs/SPEC_v1.md Slice 3 acceptance: "Focus lands
// on the h1 after every navigation; page title announced once." The initial
// load is excluded on purpose (src/app/core/focus-manager.service.ts) so a
// keyboard user's first Tab press still reaches the skip links rather than
// being jumped past them — verified here alongside the positive case.
import { expect, test } from '@playwright/test';

test.describe('Route-change focus management', () => {
  test('does not steal focus on initial load', async ({ page }) => {
    await page.goto('/');
    const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect(activeTag).not.toBe('H1');
  });

  test('focuses the new page h1, via a programmatic tabindex, after a client-side navigation', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Bewerbungsprozess' }).click();

    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Bewerbungsprozess');
    await expect(h1).toBeFocused();
    await expect(h1).toHaveAttribute('tabindex', '-1');
  });

  test('announces the new page title through the frame live region', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Bewerbungsprozess' }).click();

    await expect(page.locator('[aria-live="polite"]')).toHaveText('Bewerbungsprozess');
  });
});
