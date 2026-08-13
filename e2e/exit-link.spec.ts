// docs/TESTING.md §7 — the safety-critical path, and the only suite in this
// project whose failure would mean the tool had trapped someone. It runs the
// four steps of §7 verbatim, with real key events: a trap that a test can
// bypass with `.focus()` is not being tested at all.
//
// Slice 7 filled the region with real content, so from here the suite runs
// against the n + 2 states of step 1 rather than against an empty region. Each
// later step slice adds its own rows: the promise is that the exit works in
// *every* barrier state, and a state nobody runs it in is a state where nobody
// knows.
//
// Slice 8 added step 2 — and with it the simulated keyboard trap, which is the
// state this suite exists for. `tastatur` makes one control unreachable; if it
// ever held the user inside the region instead, step 4 below is what says so.
//
// Slice 9 added step 3, whose resolved `pdf` state puts a link inside the
// region for the first time. A download link is the one element that can take
// the browser somewhere else entirely, so the four steps below are worth
// running there too.
//
// Slice 10 completes the set with step 4. Its region has no interactive
// element at all in any state, which makes it the one page where the exit link
// is the *only* stop inside the region — the case where a first-focusable-
// element guarantee is easiest to lose by accident and most obvious to a
// participant when it is gone.
import { expect, test, type Page } from '@playwright/test';
import { gotoRendered } from './support/goto';

const CAMPAIGN_PATH = '/szenario/csr-kampagne';
const POSTING_PATH = '/szenario/bewerbung/stellenanzeige';
const FORM_PATH = '/szenario/bewerbung/formular';
const UPLOAD_PATH = '/szenario/bewerbung/dokumente';
const CONFIRM_PATH = '/szenario/bewerbung/rueckmeldung';

/** docs/TESTING.md §4: the tested states. Grows with the barriers. */
const STATES: Array<{ name: string; path: string; query: string }> = [
  { name: 'step 1 — all barriers active (default)', path: POSTING_PATH, query: '' },
  { name: 'step 1 — all barriers resolved', path: POSTING_PATH, query: '?frei=alle' },
  { name: 'step 1 — only `grafik` resolved', path: POSTING_PATH, query: '?frei=grafik' },
  { name: 'step 1 — only `sprache` resolved', path: POSTING_PATH, query: '?frei=sprache' },
  { name: 'step 2 — all barriers active (default)', path: FORM_PATH, query: '' },
  { name: 'step 2 — all barriers resolved', path: FORM_PATH, query: '?frei=alle' },
  { name: 'step 2 — only `labels` resolved', path: FORM_PATH, query: '?frei=labels' },
  { name: 'step 2 — only `tastatur` resolved', path: FORM_PATH, query: '?frei=tastatur' },
  { name: 'step 2 — only `pflichtfeld` resolved', path: FORM_PATH, query: '?frei=pflichtfeld' },
  { name: 'step 2 — only `fehler` resolved', path: FORM_PATH, query: '?frei=fehler' },
  { name: 'step 3 — all barriers active (default)', path: UPLOAD_PATH, query: '' },
  { name: 'step 3 — all barriers resolved', path: UPLOAD_PATH, query: '?frei=alle' },
  { name: 'step 3 — only `pdf` resolved', path: UPLOAD_PATH, query: '?frei=pdf' },
  { name: 'step 3 — only `upload` resolved', path: UPLOAD_PATH, query: '?frei=upload' },
  { name: 'step 4 — all barriers active (default)', path: CONFIRM_PATH, query: '' },
  { name: 'step 4 — all barriers resolved', path: CONFIRM_PATH, query: '?frei=alle' },
  {
    name: 'step 4 — only `bestaetigung` resolved',
    path: CONFIRM_PATH,
    query: '?frei=bestaetigung',
  },
  {
    name: 'step 4 — only `ansprechperson` resolved',
    path: CONFIRM_PATH,
    query: '?frei=ansprechperson',
  },
  {
    name: 'step 4 — only `inklusionshinweis` resolved',
    path: CONFIRM_PATH,
    query: '?frei=inklusionshinweis',
  },
  // The CSR campaign (docs/SPEC_v2.md slice 14). Its first barrier is a
  // navigation that is unreachable by keyboard while it is active, which makes
  // this the state the trap detector in step 4 below exists for: a navigation
  // nobody can Tab into must still be a page anybody can Tab out of.
  { name: 'campaign — all barriers active (default)', path: CAMPAIGN_PATH, query: '' },
  { name: 'campaign — all barriers resolved', path: CAMPAIGN_PATH, query: '?frei=alle' },
  // Slice 15's combined barrier. Its resolved half puts a disclosure button
  // into the region — a control that hides and shows content underneath the
  // exit link, which is exactly the shape that can leave focus on an element
  // that is no longer visible.
  {
    name: 'campaign — only `leichte-sprache` resolved',
    path: CAMPAIGN_PATH,
    query: '?frei=leichte-sprache',
  },
  { name: 'campaign — only `jargon` resolved', path: CAMPAIGN_PATH, query: '?frei=jargon' },
  // Slice 16's media section adds no row, and the omission is a decision rather
  // than an oversight: `alt`, `emoji` and `kontrast` change no tab stop in any
  // of their eight combinations — the section has no focusable element at all.
  // The two rows above already cover the section switched fully off and fully
  // on. A barrier that ever puts a control into that section brings its own row.
];

const EXIT_LINK_TEXT = 'Simulation verlassen — zurück zum Barriere-Panel';

/** True while focus sits inside the simulation region. */
function focusIsInsideRegion(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const region = document.querySelector('[data-simulation-region]');
    const active = document.activeElement;
    return region !== null && active !== null && region.contains(active);
  });
}

for (const { name, path, query } of STATES) {
  test.describe(`Exit link — ${name}`, () => {
    test('is reached by a single Tab from the element preceding the region', async ({ page }) => {
      await gotoRendered(page, `${path}${query}`);

      // Step 1 of §7. The element preceding the region is the
      // "Simulationsbereich überspringen" link; focusing it is setup, the
      // assertion is what the Tab press does.
      await page.locator('a[href$="#simulation-end"]').focus();
      await page.keyboard.press('Tab');

      await expect(page.locator(':focus')).toHaveText(EXIT_LINK_TEXT);
    });

    test('carries a visible focus indicator and is neither clipped nor overlapped', async ({
      page,
    }) => {
      await gotoRendered(page, `${path}${query}`);
      const exitLink = page.locator('.exit-link');
      await exitLink.focus();

      // Visible: on screen, at a usable size, and actually the topmost
      // element at its own centre — "reachable but invisible is only half an
      // exit" (docs/TESTING.md §7).
      await expect(exitLink).toBeInViewport();
      const box = (await exitLink.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);

      const isTopmost = await exitLink.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return hit !== null && (element === hit || element.contains(hit));
      });
      expect(isTopmost).toBe(true);

      // The ring is --sim-focus-ring, never absent: a missing focus indicator
      // is not an admissible barrier (docs/DESIGN.md §5).
      const outline = await exitLink.evaluate((element) => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      expect(outline.style).not.toBe('none');
      expect(outline.width).toBeGreaterThanOrEqual(1);
    });

    test('leads back to the barrier panel and moves focus there', async ({ page }) => {
      await gotoRendered(page, `${path}${query}`);
      await page.locator('.exit-link').focus();

      // Step 3 of §7 — a real Enter press, and focus has to *land*, not just
      // scroll: a fragment link whose target is not focusable leaves
      // document.activeElement on <body>.
      await page.keyboard.press('Enter');

      const landedInPanel = await page.evaluate(() => {
        const panel = document.querySelector('#panel');
        const active = document.activeElement;
        return panel !== null && active !== null && (panel === active || panel.contains(active));
      });
      expect(landedInPanel).toBe(true);
      expect(await focusIsInsideRegion(page)).toBe(false);
    });

    // Step 4 of §7 — the trap detector. Barriers are implemented by omission,
    // never by interception (docs/ARCHITECTURE.md §5.3): a simulated trap may
    // make one control unreachable, never hold the user inside the region.
    test('Tab leaves the region within 50 presses and never cycles inside it', async ({ page }) => {
      await gotoRendered(page, `${path}${query}`);
      await page.locator('.exit-link').focus();

      let left = false;
      for (let press = 0; press < 50; press++) {
        await page.keyboard.press('Tab');
        if (!(await focusIsInsideRegion(page))) {
          left = true;
          break;
        }
      }

      expect(left).toBe(true);
    });
  });
}
