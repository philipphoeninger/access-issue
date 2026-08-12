// docs/UX-COPY.md §5.1, docs/SPEC_v1.md Slice 3 acceptance: "skip links are
// the first two focusable elements and both work." Real key events, not
// `.focus()` (docs/TESTING.md §6) — that is the whole point of testing this
// at all.
import { expect, test } from '@playwright/test';

test.describe('Skip links', () => {
  test('home page: the content skip link is the first focusable element and jumps to #content', async ({
    page,
  }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    const active = page.locator(':focus');
    await expect(active).toHaveText('Zum Inhalt springen');
    await expect(active).toHaveAttribute('href', '#content');

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#content$/);
  });

  test('home page: there is no barrier-panel skip link (no panel on this page)', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('a[href="#panel"]')).toHaveCount(0);
  });

  test('scenario page: both skip links are the first two focusable elements, in order', async ({
    page,
  }) => {
    await page.goto('/szenario/bewerbung/stellenanzeige');

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Zum Inhalt springen');

    await page.keyboard.press('Tab');
    const second = page.locator(':focus');
    await expect(second).toHaveText('Zum Barriere-Panel springen');
    await expect(second).toHaveAttribute('href', '#panel');
  });

  test('scenario page: the panel skip link jumps to the panel column', async ({ page }) => {
    await page.goto('/szenario/bewerbung/stellenanzeige');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#panel$/);
  });
});
