// The CSR campaign page and its first barrier (docs/SPEC_v2.md slice 14).
//
// The barrier is `automatedDetection: 'manual'`: axe sees a `<div>` with a
// click handler as ordinary text, so run 2 has nothing to assert here. What
// proves this barrier is the keyboard — real `Tab` and `Enter` presses,
// reading `document.activeElement` (docs/TESTING.md §9). A navigation that a
// test reaches with `.focus()` is not being tested.
//
// The safety-critical path (docs/TESTING.md §7) is not repeated here: the two
// campaign states are rows in e2e/exit-link.spec.ts, where the trap detector
// runs against every tested state of every scenario. This suite covers what is
// particular to the campaign page.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { frameGate, pageLevelRules } from './support/axe-runs';
import { gotoRendered } from './support/goto';

const PATH = '/szenario/csr-kampagne';

/** docs/TESTING.md §4 — the tested states of this page. Grows with the barriers. */
const STATES: Array<{ name: string; url: string }> = [
  { name: 'all barriers active (default)', url: PATH },
  { name: 'all barriers resolved', url: `${PATH}?frei=alle` },
  { name: 'only `navigation` resolved', url: `${PATH}?frei=navigation` },
];

/** The five sections of docs/UX-COPY.md §9, in page order. */
const SECTIONS = [
  { anchorId: 'sim-kampagne', heading: 'Inklusiv. Nachhaltig. Sichtbar.' },
  { anchorId: 'sim-texte', heading: 'Unser Ziel' },
  { anchorId: 'sim-medien', heading: 'Aus unserem Instagram-Feed' },
  { anchorId: 'sim-event', heading: 'Podiumsdiskussion „Inklusiv. Nachhaltig. Sichtbar."' },
  { anchorId: 'sim-spende', heading: 'Jetzt spenden' },
];

const EXIT_LINK = '.exit-link';

/** The id, tag and text of whatever currently has focus. */
function focused(page: Page): Promise<{ tag: string; text: string; id: string }> {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    return {
      tag: active === null ? '' : active.tagName,
      text: active === null ? '' : (active.textContent ?? '').trim(),
      id: active === null ? '' : active.id,
    };
  });
}

for (const { name, url } of STATES) {
  test.describe(`axe — CSR campaign, ${name}`, () => {
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

test.describe('The campaign page (docs/UX-COPY.md §9)', () => {
  test('is reachable at its own route and shows the Elbwerk address', async ({ page }) => {
    await gotoRendered(page, PATH);

    await expect(page.locator('main h1')).toHaveText('CSR-Kampagne');
    await expect(page.locator('.address')).toContainText(
      'elbwerk.de/engagement/inklusiv-nachhaltig-sichtbar',
    );
    // One page, one step — no step indicator and no step navigation
    // (docs/UX-COPY.md §5.3: „Schritt 1 von 1" is not information).
    await expect(page.locator('.step-indicator')).toHaveCount(0);
    await expect(page.locator('.step-nav')).toHaveCount(0);
  });

  test('renders five sections, all h3, in page order (docs/ARCHITECTURE.md §5.6 rule 1)', async ({
    page,
  }) => {
    await gotoRendered(page, PATH);

    const headings = await page.evaluate(() => {
      const region = document.querySelector('[data-simulation-region]')!;
      return Array.from(region.querySelectorAll('h3'), (heading) => ({
        id: heading.id,
        text: (heading.textContent ?? '').trim(),
      }));
    });

    expect(headings).toEqual(
      SECTIONS.map(({ anchorId, heading }) => ({ id: anchorId, text: heading })),
    );
  });

  test('contains no h1 in the region, and its first heading is an h2 (rule 1)', async ({
    page,
  }) => {
    await gotoRendered(page, PATH);

    const headings = await page.evaluate(() => {
      const region = document.querySelector('[data-simulation-region]')!;
      return Array.from(region.querySelectorAll('h1, h2, h3, h4, h5, h6'), (h) => h.tagName);
    });

    expect(headings).not.toContain('H1');
    expect(headings[0]).toBe('H2');
  });

  // CLAUDE.md rule 2, in both barrier states. The section ids are also the
  // panel's jump targets, so a collision with a frame id would steal an
  // `aria-labelledby` reference across the boundary.
  test('prefixes every id inside the region with sim- (rule 2)', async ({ page }) => {
    for (const { url } of STATES) {
      await gotoRendered(page, url);

      const unprefixed = await page.evaluate(() => {
        const region = document.querySelector('[data-simulation-region]')!;
        return Array.from(region.querySelectorAll('[id]'), (element) => element.id).filter(
          (id) => !id.startsWith('sim-'),
        );
      });

      expect(unprefixed).toEqual([]);
    }
  });
});

// docs/SPEC_v2.md slice 14: „Home page lists the campaign as available;
// procurement still shows as planned."
test.describe('The campaign on the home page', () => {
  test('is listed as available while procurement stays in preparation', async ({ page }) => {
    await gotoRendered(page, '/');

    const campaign = page.locator('.scenario-card', { hasText: 'CSR-Kampagne' });
    await expect(campaign.getByRole('link', { name: 'Szenario öffnen' })).toHaveAttribute(
      'href',
      PATH,
    );
    await expect(campaign.locator('.planned-badge')).toHaveCount(0);
    // The video was dropped for want of material (docs/PRD.md §6.2); the
    // summary must not advertise one (docs/UX-COPY.md §5.2).
    await expect(campaign).not.toContainText('Video');

    const procurement = page.locator('.scenario-card', { hasText: 'Softwarebeschaffung' });
    await expect(procurement.locator('.planned-badge')).toHaveText('In Vorbereitung');
  });
});

test.describe('Barrier `navigation` — active (docs/UX-COPY.md §9.1)', () => {
  // The barrier itself. Everything in the construct is a `<div>` with a click
  // handler, so nothing in it can take focus — and nothing in it fights the
  // user agent to achieve that (CLAUDE.md rule 6).
  test('is never reached by Tab, from anywhere on the page', async ({ page }) => {
    await gotoRendered(page, PATH);
    await page.locator(EXIT_LINK).focus();

    const visited: string[] = [];
    for (let press = 0; press < 30; press++) {
      await page.keyboard.press('Tab');
      const inNav = await page.evaluate(() => {
        const nav = document.querySelector('.section-nav');
        const active = document.activeElement;
        return nav !== null && active !== null && nav.contains(active);
      });
      expect(inNav).toBe(false);

      const stop = await focused(page);
      visited.push(`${stop.tag}:${stop.id}:${stop.text.slice(0, 30)}`);
    }

    // Not a vacuous pass. Focus has to have reached several *different*
    // elements: on a page where Tab moved nothing at all, every reading would
    // be `<body>` — and `body.textContent` is the whole document, so a check
    // for non-empty text would pass while proving nothing.
    expect(new Set(visited).size).toBeGreaterThan(2);
  });

  test('is a div construct — no nav element, no links, no button', async ({ page }) => {
    await gotoRendered(page, PATH);

    const nav = page.locator('.section-nav');
    await expect(nav).toHaveCount(1);
    await expect(nav.locator('nav, a, button')).toHaveCount(0);
    await expect(nav.locator('.nav-item')).toHaveCount(5);
  });
});

test.describe('Barrier `navigation` — resolved', () => {
  const RESOLVED = `${PATH}?frei=navigation`;

  test('is the first stop after the exit link, and opens on focus', async ({ page }) => {
    await gotoRendered(page, RESOLVED);

    await page.locator(EXIT_LINK).focus();
    await page.keyboard.press('Tab');

    const trigger = await focused(page);
    expect(trigger.tag).toBe('BUTTON');
    expect(trigger.text).toBe('Bereiche dieser Seite');

    // docs/UX-COPY.md §9.1: the menu opens on focus as well as on pointer
    // contact, and it says so in `aria-expanded`.
    await expect(page.locator('.nav-trigger')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#sim-nav-menu')).toBeVisible();
  });

  // The pointer must not be able to take the menu away from someone using the
  // keyboard. Without the guard in `onPointerLeave`, a mouse crossing the bar
  // hides the `<ul>` while `document.activeElement` is still the link inside
  // it: no focus indicator anywhere on screen, and the next Tab starts over at
  // the top of the document.
  test('keeps the menu open when the pointer leaves while focus is inside it', async ({ page }) => {
    await gotoRendered(page, RESOLVED);

    await page.locator(EXIT_LINK).focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#sim-nav-menu')).toBeVisible();
    await page.keyboard.press('Tab');
    expect((await focused(page)).text).toBe('Die Aktion');

    await page.locator('nav.section-nav').dispatchEvent('mouseleave');

    await expect(page.locator('#sim-nav-menu')).toBeVisible();
    expect((await focused(page)).text).toBe('Die Aktion');
    // The element focus sits on is the one the user can see.
    expect(
      await page.evaluate(() => (document.activeElement as HTMLElement).checkVisibility()),
    ).toBe(true);
  });

  test('carries a visible focus indicator (CLAUDE.md rule 8)', async ({ page }) => {
    await gotoRendered(page, RESOLVED);

    await page.locator(EXIT_LINK).focus();
    await page.keyboard.press('Tab');

    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement as HTMLElement);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThanOrEqual(1);
  });

  test('offers all five destinations as real links, in order', async ({ page }) => {
    await gotoRendered(page, RESOLVED);
    await page.locator('.nav-trigger').click();

    const links = page.locator('#sim-nav-menu a');
    await expect(links).toHaveText([
      'Die Aktion',
      'Unser Ziel',
      'Stimmen',
      'Mitmachen',
      'Veranstaltung',
    ]);

    // docs/UX-COPY.md §9.1 — the entry order is the campaign's, so the last
    // two do not follow page order. Each still has to hit a real section.
    for (const anchorId of ['sim-kampagne', 'sim-texte', 'sim-medien', 'sim-spende', 'sim-event']) {
      await expect(page.locator(`#sim-nav-menu a[href$="#${anchorId}"]`)).toHaveCount(1);
      await expect(page.locator(`#${anchorId}`)).toHaveCount(1);
    }
  });

  // The whole point of the resolved state: a keyboard user can operate it, and
  // following an entry takes the focus with it. A jump that only scrolls
  // leaves a screen reader exactly where it was.
  test('follows an entry with Enter and moves focus to the section heading', async ({ page }) => {
    await gotoRendered(page, RESOLVED);

    await page.locator(EXIT_LINK).focus();
    await page.keyboard.press('Tab'); // the trigger — opens the menu

    // Focus opens the menu through a signal, so the entries reach the tab
    // order on the next change-detection pass. Waiting for the open state is
    // not a `waitForTimeout` in disguise (docs/TESTING.md §10): it is the
    // assertion that focus opened the menu, and pressing Tab before it lands
    // would test the frame budget rather than the navigation.
    await expect(page.locator('#sim-nav-menu')).toBeVisible();

    await page.keyboard.press('Tab'); // first entry
    expect((await focused(page)).text).toBe('Die Aktion');
    await page.keyboard.press('Enter');

    expect((await focused(page)).id).toBe('sim-kampagne');

    // A jump, not a trap (docs/TESTING.md §7): Tab moves on from the target.
    await page.keyboard.press('Tab');
    expect((await focused(page)).id).not.toBe('sim-kampagne');
  });
});

// The anchors exist so that a user who resolves a barrier can reach the part
// of the page that changed (docs/ARCHITECTURE.md §12.1.1). For the campaign
// page that is a claim about *order*: the group's only barrier is the section
// navigation, so the landing point has to sit in front of it. It did not while
// the navigation stood above the hero heading — focus landed past it and,
// with nothing focusable after the heading, the next Tab went to the top of
// the document.
//
// The generated suite in e2e/barrier-panel.spec.ts proves the anchor hits a
// section inside the region; this proves it hits a *useful* place in it.
test.describe('The panel anchor of the campaign-page group', () => {
  test('lands in front of the barrier the group is about', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=navigation`);

    await page.locator('#barrier-group-kampagnenseite-anchor').focus();
    await page.keyboard.press('Enter');
    expect((await focused(page)).id).toBe('sim-kampagne');

    // Forward from the landing point, not backwards: the repaired navigation
    // is the very next stop.
    await page.keyboard.press('Tab');
    const stop = await focused(page);
    expect(stop.tag).toBe('BUTTON');
    expect(stop.text).toBe('Bereiche dieser Seite');
  });
});

// docs/SPEC_v2.md slice 14: „Deep link reproduces state."
test.describe('Deep links into the campaign', () => {
  test('reproduce the barrier state the URL names', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=navigation`);
    await expect(page.locator('nav.section-nav')).toHaveCount(1);
    await expect(page.locator('.counter')).toHaveText('Keine Barriere aktiv');
    await expect(page.locator('.panel input[type="checkbox"]:checked')).toHaveCount(1);

    await gotoRendered(page, PATH);
    await expect(page.locator('nav.section-nav')).toHaveCount(0);
    await expect(page.locator('.panel input[type="checkbox"]:checked')).toHaveCount(0);
  });
});
