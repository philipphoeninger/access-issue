// docs/SPEC_v1.md Slice 11, docs/ARCHITECTURE.md §17, docs/TESTING.md §12
// (the degenerate half of the deep-link tests).
//
// Everything that is not a happy path: an unknown address, a link to a
// scenario whose content does not exist yet, a `frei` or `erklaerung` value
// that means nothing here, a query string that is not even well-formed, and
// the application loaded with scripting off. Each must land on a *defined*
// state — a page that says what happened and offers a way onwards — and
// never on a stack trace, a blank screen, or a silent redirect that hides
// the address the user actually followed.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { frameGate, pageLevelRules } from './support/axe-runs';
import { gotoRendered } from './support/goto';

const STEP = '/szenario/bewerbung/stellenanzeige';

test.describe('Unknown address (docs/UX-COPY.md §5.10 `notFound.*`)', () => {
  test('renders the not-found page and keeps the address that was followed', async ({ page }) => {
    await gotoRendered(page, '/gibt-es-nicht');

    await expect(page.locator('h1')).toHaveText('Diese Seite gibt es nicht');
    // Not redirected home: a stale slide link that silently becomes the home
    // page is a link nobody ever fixes.
    expect(new URL(page.url()).pathname).toBe('/gibt-es-nicht');
    await expect(page).toHaveTitle('Diese Seite gibt es nicht – AccessIssue');
  });

  test('a deep link into a scenario that does not exist lands there too', async ({ page }) => {
    await gotoRendered(page, '/szenario/gibt-es-nicht/schritt');

    await expect(page.locator('h1')).toHaveText('Diese Seite gibt es nicht');
  });

  test('offers a way back that works', async ({ page }) => {
    await gotoRendered(page, '/gibt-es-nicht');
    await page.getByRole('link', { name: 'Zur Startseite' }).click();

    await expect(page.locator('h1')).toHaveText('AccessIssue: Barrieren sichtbar machen');
  });

  // docs/SPEC_v1.md Slice 11: "Every error page has an h1, receives focus on
  // navigation". Reached by going back rather than by loading the URL
  // directly, because the initial load deliberately leaves focus alone
  // (src/app/core/focus-manager.service.ts) — a client-side navigation is the
  // case that needs proving.
  test('receives focus and is announced on a client-side navigation', async ({ page }) => {
    await gotoRendered(page, '/gibt-es-nicht');
    await page.getByRole('link', { name: 'Zur Startseite' }).click();
    await expect(page.locator('h1')).toHaveText('AccessIssue: Barrieren sichtbar machen');

    await page.goBack();

    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Diese Seite gibt es nicht');
    await expect(h1).toBeFocused();
    // Title only — the page has no barriers, and "0 von 0 Barrieren aktiv" is
    // not a sentence (docs/UX-COPY.md §5.7).
    await expect(page.locator('[aria-live="polite"]')).toHaveText('Diese Seite gibt es nicht');
  });
});

test.describe('Link to a planned scenario (docs/UX-COPY.md §5.10 `planned.*`)', () => {
  // Both shapes the path grammar can produce, and both are already written
  // down in docs/ARCHITECTURE.md §9 for scenarios whose content does not
  // exist yet — which is exactly how one ends up on a slide.
  for (const path of ['/szenario/softwarebeschaffung', '/szenario/softwarebeschaffung/vergabe']) {
    test(`${path} explains that the scenario is not available yet`, async ({ page }) => {
      await gotoRendered(page, path);

      await expect(page.locator('h1')).toHaveText('Dieses Szenario ist noch in Vorbereitung');
      await expect(page.getByText('Wir arbeiten daran.')).toBeVisible();
    });
  }

  test('offers a way to the scenarios that do exist', async ({ page }) => {
    await gotoRendered(page, '/szenario/csr-kampagne');
    await page.getByRole('link', { name: 'Zu den verfügbaren Szenarien' }).click();

    await expect(page.locator('h1')).toHaveText('AccessIssue: Barrieren sichtbar machen');
  });

  test('receives focus on a client-side navigation', async ({ page }) => {
    await gotoRendered(page, '/szenario/softwarebeschaffung');
    await page.getByRole('link', { name: 'Zu den verfügbaren Szenarien' }).click();
    await expect(page.locator('h1')).toHaveText('AccessIssue: Barrieren sichtbar machen');

    await page.goBack();

    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Dieses Szenario ist noch in Vorbereitung');
    await expect(h1).toBeFocused();
  });

  // The page a lecturer reaches has no panel to skip to, so the header must
  // not offer the link (src/app/frame/app-shell/app-shell.component.ts).
  test('offers no skip link to a barrier panel that is not there', async ({ page }) => {
    await gotoRendered(page, '/szenario/softwarebeschaffung');

    await expect(page.getByRole('link', { name: 'Zum Barriere-Panel springen' })).toHaveCount(0);
  });
});

// docs/TESTING.md §12, the degenerate cases: none of these is an error, and
// none of them may produce one. `frei` and `erklaerung` are parsed by
// src/app/core/url-state.ts, which is unit-tested exhaustively; what these
// add is the proof that a *page* built on that parse still renders a defined
// state when the URL is nonsense.
test.describe('Query strings that mean nothing here (docs/ARCHITECTURE.md §17)', () => {
  const counter = (page: Page) => page.locator('.counter');

  test('an unknown frei key is ignored, all barriers stay active', async ({ page }) => {
    await gotoRendered(page, `${STEP}?frei=gibtesnicht`);

    await expect(counter(page)).toHaveText('Alle 11 Barrieren aktiv');
  });

  // docs/TESTING.md §12 also lists "a key from another scenario". That case
  // is not observable here yet, and saying otherwise would be the worse kind
  // of green: the CSR campaign is still a stub with `barriers: []`
  // (src/app/content/csr-campaign/csr-campaign.scenario.ts), so 'video' is
  // simply a key nobody owns and this URL is indistinguishable from the
  // unknown-key test above. What *is* observable — and what this asserts —
  // is that an unusable key costs the valid key beside it nothing.
  //
  // The cross-scenario case itself is covered where it can be stated
  // honestly today: src/app/core/url-state.spec.ts parses `labels` against a
  // second scenario's real barrier set. It moves here once a second scenario
  // ships content (SPEC_v2.md), and 'video' is the key it will then own.
  test('an unusable key costs the valid key beside it nothing', async ({ page }) => {
    await gotoRendered(page, `${STEP}?frei=labels,video`);

    await expect(counter(page)).toHaveText('10 von 11 Barrieren aktiv');
  });

  test('a malformed query string falls back to the default state', async ({ page }) => {
    // `%E0%A4%A` is a truncated percent escape: decodeURIComponent throws on
    // it, and the parse has to survive that rather than take the page down.
    await gotoRendered(page, `${STEP}?frei=%E0%A4%A,,,&erklaerung=%E0%A4%A`);

    await expect(counter(page)).toHaveText('Alle 11 Barrieren aktiv');
    await expect(page.locator('.explanation .empty')).toBeVisible();
  });

  test('an unknown erklaerung key shows the empty state, not an error', async ({ page }) => {
    await gotoRendered(page, `${STEP}?erklaerung=gibtesnicht`);

    await expect(page.locator('.explanation .empty')).toHaveText(
      'Wähle im Barriere-Panel einen Eintrag aus, um zu erfahren, worum es geht.',
    );
  });
});

// docs/SPEC_v1.md Slice 11 acceptance: "axe runs 1 and 3 green on every error
// state". Run 2 has no counterpart here — these pages are frame, and the
// frame is conformant in every state, always.
const AXE_STATES: Array<{ name: string; path: string }> = [
  { name: 'not found', path: '/gibt-es-nicht' },
  { name: 'planned scenario', path: '/szenario/softwarebeschaffung' },
  { name: 'planned scenario, step path', path: '/szenario/softwarebeschaffung/vergabe' },
];

for (const { name, path } of AXE_STATES) {
  test.describe(`axe — ${name}`, () => {
    test('run 1: frame gate reports zero violations (docs/TESTING.md §5)', async ({ page }) => {
      await gotoRendered(page, path);
      const results = await frameGate(page).analyze();
      expect(results.violations).toEqual([]);
    });

    test('run 3: page-level rules report zero violations (docs/TESTING.md §5)', async ({
      page,
    }) => {
      await gotoRendered(page, path);
      const results = await pageLevelRules(page).analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

// docs/ARCHITECTURE.md §17 "JavaScript disabled". The application does not
// run without scripting and is not meant to; what it must not do is stand
// there empty, leaving someone to conclude the page is broken rather than
// that it needs a setting they can change.
test.describe('Scripting disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('the noscript block says why nothing happens, and where the module is', async ({ page }) => {
    await page.goto('/');

    const note = page.locator('.noscript-note');
    await expect(note).toBeVisible();
    await expect(note).toContainText('AccessIssue braucht JavaScript');
    await expect(note).toContainText('vollständig in Moodle zur Verfügung');
  });
});
