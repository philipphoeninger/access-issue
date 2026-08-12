// docs/UX-COPY.md §5.1, docs/SPEC_v1.md Slice 3 acceptance: "skip links are
// the first two focusable elements and both work." Real key events, not
// `.focus()` (docs/TESTING.md §6) — that is the whole point of testing this
// at all.
//
// "Both work" is asserted as three things, because the first two alone were
// satisfied by a link that reloaded the application on the home page: the URL
// gains the fragment, the *route* stays put, and focus lands on the target.
// The href is rendered by shared/fragment-link.directive.ts, which explains
// why it carries the current path rather than a bare `#content`.
import { expect, test } from '@playwright/test';
import { gotoRendered } from './support/goto';

const SCENARIO_PATH = '/szenario/bewerbung/stellenanzeige';

test.describe('Skip links', () => {
  test('home page: the content skip link is the first focusable element and jumps to #content', async ({
    page,
  }) => {
    await gotoRendered(page, '/');

    await page.keyboard.press('Tab');
    const active = page.locator(':focus');
    await expect(active).toHaveText('Zum Inhalt springen');
    await expect(active).toHaveAttribute('href', /#content$/);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/#content$/);
    await expect(page.locator(':focus')).toHaveAttribute('id', 'content');
  });

  test('home page: there is no barrier-panel skip link (no panel on this page)', async ({
    page,
  }) => {
    await gotoRendered(page, '/');
    await expect(page.locator('a[href$="#panel"]')).toHaveCount(0);
  });

  test('scenario page: both skip links are the first two focusable elements, in order', async ({
    page,
  }) => {
    await gotoRendered(page, SCENARIO_PATH);

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Zum Inhalt springen');

    await page.keyboard.press('Tab');
    const second = page.locator(':focus');
    await expect(second).toHaveText('Zum Barriere-Panel springen');
    await expect(second).toHaveAttribute('href', /#panel$/);
  });

  test('scenario page: the panel skip link jumps to the panel column without leaving the route', async ({
    page,
  }) => {
    await gotoRendered(page, SCENARIO_PATH);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(`${SCENARIO_PATH}#panel`);
    await expect(page.locator(':focus')).toHaveAttribute('id', 'panel');
  });

  test('scenario page: the panel skip link keeps the barrier state in the URL', async ({
    page,
  }) => {
    await gotoRendered(page, `${SCENARIO_PATH}?frei=alle`);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(`${SCENARIO_PATH}?frei=alle#panel`);
  });
});
