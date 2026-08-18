// The CSR campaign page and its barriers (docs/SPEC_v2.md slices 14 to 18).
//
// The first two sections are `automatedDetection: 'manual'` throughout: axe
// sees a `<div>` with a click handler as ordinary text, and no tool judges
// whether a sentence is comprehensible or notices that an easy-language version
// is missing. What proves the navigation is the keyboard — real `Tab` and
// `Enter` presses, reading `document.activeElement` (docs/TESTING.md §9); what
// proves the language barrier is that its four states are four different pages
// and that its disclosure is a real one.
//
// The media section of slice 16 is the first place on this page where run 2 has
// something to say: `alt` plants an `image-alt` violation and `kontrast` a
// `color-contrast` one, and both have to disappear when the barrier is
// resolved.
//
// The donation section of slice 18 brings the only two barriers in the project
// that do something while nobody touches them. They are driven by
// `page.clock`, never by waiting (docs/TESTING.md §10), and the reduced-motion
// run has its negative control beside it — without one, a bug that stops the
// carousel unconditionally would pass the preference test and take a barrier
// out of the module unnoticed (docs/TESTING.md §11).
//
// The safety-critical path (docs/TESTING.md §7) is not repeated here: the
// campaign states are rows in e2e/exit-link.spec.ts, where the trap detector
// runs against every tested state of every scenario. This suite covers what is
// particular to the campaign page.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { barrierAssertion, expectedRuleFor, frameGate, pageLevelRules } from './support/axe-runs';
import { gotoRendered } from './support/goto';
// The tested states of docs/TESTING.md §4, shared with e2e/csr-integration.spec.ts
// since docs/SPEC_v2.md slice 19 — declared once so the two suites cannot run
// different matrices (support/campaign-states.ts).
import { CAMPAIGN_PATH as PATH, MEDIA_STATES, STATES } from './support/campaign-states';
import { CSR_CAMPAIGN_SCENARIO } from '../src/app/content/csr-campaign/csr-campaign.scenario';

/**
 * The rule ids come from the fixture, never from a literal (docs/TESTING.md §5).
 * Named here for the media section's eight-state loop, which reads both of them
 * in one test; the per-barrier run 2 further down looks each one up as it goes.
 */
const ALT_RULE = expectedRuleFor('csr-kampagne', 'alt');
const CONTRAST_RULE = expectedRuleFor('csr-kampagne', 'kontrast');

/**
 * The two sections whose barriers axe can see, as selectors.
 *
 * Run 2 is scoped to one of them rather than to the whole region, because
 * `alt` and `fortschritt` plant the same rule id in two different sections
 * (content/axe-rule-fixtures.ts). Over the whole region neither assertion could
 * tell whose finding it was looking at, and both would have gone on passing
 * while one of the two barriers was quietly gone.
 */
const FEED = '[data-simulation-region] .feed';
const PROGRESS = '[data-simulation-region] .progress';

/**
 * Where each axe-detectable barrier plants its finding — the second half of what
 * run 2 needs, beside the rule id the fixture owns.
 *
 * Keyed by `Barrier.id`, and **read through `sectionFor` so a missing entry
 * throws**, the same way `expectedRuleFor` throws for a missing fixture. A
 * barrier marked `automatedDetection: 'axe'` that nobody scoped would otherwise
 * arrive with a fixture entry, no run 2, and nothing anywhere saying so.
 */
const RUN_2_SECTIONS: Record<string, string> = {
  alt: FEED,
  kontrast: FEED,
  fortschritt: PROGRESS,
};

function sectionFor(barrierId: string): string {
  const within = RUN_2_SECTIONS[barrierId];
  if (within === undefined) {
    throw new Error(
      `No run-2 section selector for barrier "csr-kampagne/${barrierId}". Add one to ` +
        `RUN_2_SECTIONS in this file — see docs/TESTING.md §5, run 2.`,
    );
  }
  return within;
}

/**
 * The barriers run 2 has to cover, taken from the content rather than from a
 * list kept by hand (docs/SPEC_v2.md slice 19: „Every axe-detectable barrier
 * passes run 2 in both directions"). Add a barrier with
 * `automatedDetection: 'axe'` and its two cases appear below; the only way to
 * remove them is to change what the content claims about it.
 */
const AXE_BARRIERS = CSR_CAMPAIGN_SCENARIO.barriers.filter(
  (barrier) => barrier.automatedDetection === 'axe',
);

/**
 * The campaign's two Simulationshinweise, each scoped to the section it belongs
 * to. Since slice 18 there are two of them on this page
 * (`csr.social.disclaimer` and `csr.donate.simulationNote`), so a bare
 * `.simulation-note` matches both — and the component selector is the one
 * handle that says *which* section is meant without depending on document
 * order.
 */
const MEDIA_NOTE = '[data-simulation-region] app-campaign-media .simulation-note';
const DONATE_NOTE = '[data-simulation-region] app-campaign-donation .simulation-note';

/** The five sections of docs/UX-COPY.md §9, in page order. */
const SECTIONS = [
  { anchorId: 'sim-kampagne', heading: 'Inklusiv. Nachhaltig. Sichtbar.' },
  { anchorId: 'sim-texte', heading: 'Unser Ziel' },
  { anchorId: 'sim-medien', heading: 'Aus unserem Instagram-Feed' },
  { anchorId: 'sim-event', heading: 'Podiumsdiskussion „Inklusiv. Nachhaltig. Sichtbar."' },
  { anchorId: 'sim-spende', heading: 'Jetzt spenden' },
];

const EXIT_LINK = '.exit-link';

/**
 * The checkbox belonging to a panel entry, found through the label span the
 * panel keys off `urlKey` (frame/barrier-panel: `barrier-{urlKey}-label`).
 * Material renders the `<input>` as a sibling of its `<label>`, so the hop
 * goes through `mat-checkbox` rather than through the label itself.
 */
function boxFor(page: Page, urlKey: string) {
  return page.locator(`.panel mat-checkbox:has(#barrier-${urlKey}-label) input[type="checkbox"]`);
}

function isIndeterminate(page: Page, urlKey: string): Promise<boolean> {
  return boxFor(page, urlKey).evaluate((box) => (box as HTMLInputElement).indeterminate);
}

/**
 * One combined barrier's fieldset in the panel, keyed by its parent `urlKey`.
 *
 * Scoped through the parent's label id rather than by position or by text:
 * since docs/SPEC_v2.md slice 17 the campaign has **two** combined barriers,
 * and a bare `.panel fieldset.combined` now matches both. Every assertion that
 * used to read „the combined fieldset" would silently have become „whichever
 * one Playwright found first".
 */
function combinedFieldset(page: Page, parentUrlKey: string) {
  return page.locator(`.panel fieldset.combined:has(#barrier-${parentUrlKey}-label)`);
}

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

// Run 2, over the media section's own eight states (docs/SPEC_v2.md slice 16).
// Both directions for both rules, in one loop: this is the assertion that the
// barriers are genuinely there while they are switched on, and genuinely gone
// once they are not. A simulation that only *looks* broken passes every other
// test in this file.
//
// The other barriers of the page stay active throughout, which is the point of
// running the section's matrix rather than the page's: `alt` has to plant its
// violation whether or not `kontrast` is repaired, and nothing about the
// navigation may change what axe finds here.
//
// **Scoped to the feed, not to the region**, since slice 18. The donation
// section's `fortschritt` barrier plants the *same* rule id — a progress bar as
// a graphic with no `alt` is `image-alt` too — so a region-wide run cannot tell
// the two apart: `not.toContain(ALT_RULE)` would fail here for a finding that
// belongs to another section, and, once `fortschritt` were repaired,
// `toContain` would pass on a finding this section no longer plants. axe does
// the scoping through `within`, for the reason given in support/axe-runs.ts.
for (const { resolved, url } of MEDIA_STATES) {
  const label = resolved.length === 0 ? 'none resolved' : `${resolved.join(' + ')} resolved`;
  const altResolved = resolved.includes('alt');
  const contrastResolved = resolved.includes('kontrast');

  test.describe(`axe run 2 — media section, ${label}`, () => {
    test(`reports ${altResolved ? 'no' : 'an'} ${ALT_RULE} and ${
      contrastResolved ? 'no' : 'a'
    } ${CONTRAST_RULE} violation`, async ({ page }) => {
      await gotoRendered(page, url);
      const results = await barrierAssertion(page, FEED).analyze();
      const ids = results.violations.map((violation) => violation.id);

      if (altResolved) {
        expect(ids).not.toContain(ALT_RULE);
      } else {
        expect(ids).toContain(ALT_RULE);
      }

      if (contrastResolved) {
        expect(ids).not.toContain(CONTRAST_RULE);
      } else {
        expect(ids).toContain(CONTRAST_RULE);
      }
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

// The combined barrier of docs/SPEC_v2.md slice 15. The panel side of the
// combined shape — indeterminate parent, `fieldset`/`legend`, one checkbox per
// part — is covered against fixtures in
// src/app/frame/barrier-panel/barrier-panel.component.spec.ts. What is asserted
// here is that shipped content produces it, on a real page, together with the
// counter rule that only holds across the two of them
// (docs/UX-COPY.md §5.6).
test.describe('Barrier `sprache` — the combined language barrier (docs/UX-COPY.md §9.2)', () => {
  const PARENT = 'sprache';
  const JARGON = 'jargon';
  const EASY = 'leichte-sprache';

  test('renders as a fieldset with a legend, a parent and two parts', async ({ page }) => {
    await gotoRendered(page, PATH);

    const combined = combinedFieldset(page, PARENT);
    await expect(combined).toHaveCount(1);
    await expect(combined.locator('legend')).toHaveText('Texte verständlich');
    await expect(combined.locator('input[type="checkbox"]')).toHaveCount(3);

    // docs/UX-COPY.md §5.6 `panel.combinedHint`, the two-part wording — and
    // the sentence has to make clear that resolving one part is not enough.
    await expect(combined.locator('.hint')).toHaveText(
      'Diese Barriere hat zwei Teile. Erst wenn beide behoben sind, ist der Inhalt barrierefrei.',
    );
  });

  test('shows the parent as indeterminate while exactly one part is resolved', async ({ page }) => {
    for (const key of [JARGON, EASY]) {
      await gotoRendered(page, `${PATH}?frei=${key}`);

      expect(await isIndeterminate(page, PARENT)).toBe(true);
      await expect(boxFor(page, PARENT)).not.toBeChecked();
      await expect(boxFor(page, key)).toBeChecked();

      // The state badge says the same thing in words, never in a symbol or a
      // colour alone (docs/DESIGN.md §3.3).
      await expect(combinedFieldset(page, PARENT).locator('> .meta .state')).toHaveText(
        'Teilweise behoben',
      );
    }
  });

  test('resolves the parent only once both parts are (docs/ARCHITECTURE.md §6)', async ({
    page,
  }) => {
    await gotoRendered(page, `${PATH}?frei=jargon,leichte-sprache`);

    await expect(boxFor(page, PARENT)).toBeChecked();
    expect(await isIndeterminate(page, PARENT)).toBe(false);
    await expect(combinedFieldset(page, PARENT).locator('> .meta .state')).toHaveText(
      'Barrierefrei',
    );
  });

  // The counter rule of docs/UX-COPY.md §5.6, and the reason the combined case
  // exists at all: a barrier that half stands is a barrier that stands.
  test('counts a partially resolved barrier as active', async ({ page }) => {
    await gotoRendered(page, PATH);
    await expect(page.locator('.counter')).toHaveText('Alle 10 Barrieren aktiv');

    await gotoRendered(page, `${PATH}?frei=jargon`);
    await expect(page.locator('.counter')).toHaveText('Alle 10 Barrieren aktiv');

    await gotoRendered(page, `${PATH}?frei=sprache`);
    await expect(page.locator('.counter')).toHaveText('9 von 10 Barrieren aktiv');

    await gotoRendered(page, `${PATH}?frei=alle`);
    await expect(page.locator('.counter')).toHaveText('Keine Barriere aktiv');
  });

  // Toggling the parent moves both parts in lockstep (core/url-state.ts), with
  // real key events rather than `.check()` (docs/TESTING.md §9).
  test('toggles both parts from the parent checkbox, by keyboard', async ({ page }) => {
    await gotoRendered(page, PATH);

    await boxFor(page, PARENT).focus();
    await page.keyboard.press('Space');

    await expect(boxFor(page, JARGON)).toBeChecked();
    await expect(boxFor(page, EASY)).toBeChecked();
    await expect(page.locator('.counter')).toHaveText('9 von 10 Barrieren aktiv');
    // Focus stays where the user put it (docs/ARCHITECTURE.md §12.2).
    expect((await focused(page)).id).toBe(await boxFor(page, PARENT).getAttribute('id'));
  });
});

test.describe('The texts section in the simulation (docs/UX-COPY.md §9.2)', () => {
  const MAIN_TEXT = '[data-simulation-region] .body';
  const TOGGLE = '[data-simulation-region] .easy-toggle';

  test('is jargon with no easy-language version while both parts are active', async ({ page }) => {
    await gotoRendered(page, PATH);

    await expect(page.locator(MAIN_TEXT)).toContainText('Purpose-driven Impact-Programm');
    await expect(page.locator(TOGGLE)).toHaveCount(0);
  });

  // The state the coupling is about: comprehensible German is a real
  // improvement and still not easy language (docs/PRD.md §6.2).
  test('resolving `jargon` alone leaves no easy-language version', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=jargon`);

    await expect(page.locator(MAIN_TEXT)).toContainText('Nachbarschaftstreff an der Veringstraße');
    await expect(page.locator(MAIN_TEXT)).not.toContainText('Stakeholder-Value');
    await expect(page.locator(TOGGLE)).toHaveCount(0);
  });

  // The mirror image: easy language offered as a side door next to a main text
  // nobody can read.
  test('resolving `leichte-sprache` alone leaves the jargon main text', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=leichte-sprache`);

    await expect(page.locator(MAIN_TEXT)).toContainText('Purpose-driven Impact-Programm');
    await expect(page.locator(TOGGLE)).toHaveCount(1);
  });

  // A real disclosure, operated the way a keyboard user operates one: reached
  // by Tab, opened with Enter, reporting its state in `aria-expanded`. A
  // CSS-only toggle would look identical and announce nothing.
  test('opens the easy-language version by keyboard and reports its state', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=leichte-sprache`);

    const toggle = page.locator(TOGGLE);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#sim-leichte-sprache')).toBeHidden();

    await page.locator(EXIT_LINK).focus();
    await page.keyboard.press('Tab');

    const stop = await focused(page);
    expect(stop.tag).toBe('BUTTON');
    expect(stop.text).toBe('Diesen Text in Leichter Sprache lesen');

    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#sim-leichte-sprache')).toBeVisible();
    await expect(page.locator('#sim-leichte-sprache h4')).toHaveText(
      'Die Aktion in Leichter Sprache',
    );

    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#sim-leichte-sprache')).toBeHidden();
  });

  // Collapsed means collapsed: `[hidden]` keeps the version out of the
  // accessibility tree and out of the tab order, so the page is not read twice.
  //
  // Asserted with real key presses reading `document.activeElement`
  // (docs/TESTING.md §9), not with a visibility check: a collapse that leaves
  // the content in the layout — `visibility: hidden`, an off-screen position,
  // `aria-hidden` over a still-focusable subtree — is exactly the mistake this
  // has to catch, and only Tab can see it. The visibility assertion stays as
  // the second half, because being unreachable while still on screen would be
  // its own defect.
  test('keeps the collapsed version out of the tab order', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=leichte-sprache`);

    await page.locator(EXIT_LINK).focus();
    await page.keyboard.press('Tab');
    expect((await focused(page)).text).toBe('Diesen Text in Leichter Sprache lesen');

    // Twenty presses is well past the end of this page; nothing inside the
    // collapsed panel may take focus at any point along the way.
    for (let press = 0; press < 20; press++) {
      await page.keyboard.press('Tab');

      const insidePanel = await page.evaluate(() => {
        const panel = document.getElementById('sim-leichte-sprache')!;
        const active = document.activeElement;
        return active !== null && panel.contains(active);
      });
      expect(insidePanel).toBe(false);
    }

    expect(
      await page.evaluate(() => document.getElementById('sim-leichte-sprache')!.checkVisibility()),
    ).toBe(false);
  });
});

// Same claim as for the campaign-page group (see above): the anchor has to land
// in front of the barrier its group is about, not behind it.
test.describe('The panel anchor of the texts group', () => {
  test('lands in front of the disclosure the group is about', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=leichte-sprache`);

    await page.locator('#barrier-group-texte-anchor').focus();
    await page.keyboard.press('Enter');
    expect((await focused(page)).id).toBe('sim-texte');

    await page.keyboard.press('Tab');
    const stop = await focused(page);
    expect(stop.tag).toBe('BUTTON');
    expect(stop.text).toBe('Diesen Text in Leichter Sprache lesen');
  });
});

// docs/SPEC_v2.md slice 14: „Deep link reproduces state."
test.describe('Deep links into the campaign', () => {
  test('reproduce the barrier state the URL names', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=navigation`);
    await expect(page.locator('nav.section-nav')).toHaveCount(1);
    await expect(page.locator('.counter')).toHaveText('9 von 10 Barrieren aktiv');
    await expect(page.locator('.panel input[type="checkbox"]:checked')).toHaveCount(1);

    await gotoRendered(page, PATH);
    await expect(page.locator('nav.section-nav')).toHaveCount(0);
    await expect(page.locator('.panel input[type="checkbox"]:checked')).toHaveCount(0);
  });

  // A part is a deep link in its own right, and the parent key is sugar for
  // both parts (docs/ARCHITECTURE.md §8). Both appear on slides, so both are
  // locked in content/data-contract.spec.ts.
  test('reproduce a partial state from a part key', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=leichte-sprache`);

    await expect(page.locator('[data-simulation-region] .easy-toggle')).toHaveCount(1);
    await expect(page.locator('[data-simulation-region] .body')).toContainText(
      'Purpose-driven Impact-Programm',
    );
    await expect(page.locator('.panel input[type="checkbox"]:checked')).toHaveCount(1);
  });
});

// The media section of docs/SPEC_v2.md slice 16. Its structural assertions live
// in the component spec
// (src/app/scenarios/csr-campaign/campaign-media/…spec.ts) where they run in
// milliseconds; what is here is what only a real browser can answer — what axe
// computes, what the network does, and what a system preference overrides.
test.describe('The media section (docs/UX-COPY.md §9.3 to §9.5)', () => {
  test('is a local reproduction, not an embed', async ({ page }) => {
    await gotoRendered(page, PATH);

    await expect(page.locator(`${FEED} .post`)).toHaveCount(4);
    await expect(page.locator(`${FEED} iframe`)).toHaveCount(0);
    // docs/UX-COPY.md §9.3 `csr.social.disclaimer` — a Simulationshinweis, so
    // it stands in every state and is never made into a barrier
    // (docs/UX-COPY.md §8.4, CLAUDE.md rule 5).
    //
    // Scoped to this section since slice 18: the donation form carries the
    // campaign's second note (`csr.donate.simulationNote`), and an unscoped
    // `.simulation-note` now matches both.
    await expect(page.locator(`${MEDIA_NOTE}`)).toHaveText(
      'Nachbildung einer Social-Media-Einbettung. Es werden keine Daten an Dritte übertragen.',
    );
  });

  // docs/SPEC_v2.md slice 16: „No network request leaves the page in any
  // state." A third-party embed is the one thing a social-media reproduction
  // is most likely to smuggle in, and it would leak the reader of a teaching
  // page to a platform that never asked them (docs/ARCHITECTURE.md §16).
  //
  // Asserted on the requests the browser actually makes, not on the markup:
  // a script, a font, a tracking pixel and a preconnect all reach the network
  // without an `iframe` ever appearing in the DOM.
  test('makes no request to a third party in any state', async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const foreign: string[] = [];
    page.on('request', (request) => {
      if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) {
        foreign.push(request.url());
      }
    });

    for (const { url } of MEDIA_STATES) {
      await gotoRendered(page, url);
      // The images are part of the section, so waiting for them is part of the
      // claim: a request that only happens once an image loads would otherwise
      // be made after the assertion.
      await expect(page.locator(`${FEED} img`)).toHaveCount(3);
    }

    expect(foreign).toEqual([]);
  });

  // The images actually load. This looks like a test of nothing until you have
  // shipped a broken one: an `img` whose source 404s or whose SVG will not
  // parse still has no `alt` attribute, so run 2 keeps finding its `image-alt`
  // violation, the alt assertions keep passing, and the suite stays green over
  // three placeholder icons. That is exactly what happened while this slice was
  // being built — a comment in one of the SVGs contained a double hyphen, which
  // XML forbids, and nothing said so.
  test('serves all three post images', async ({ page }) => {
    await gotoRendered(page, PATH);

    // `expect.poll`, not a bare `evaluateAll`: `gotoRendered` waits for the
    // routed component, and the images are created *after* the document load
    // event by a lazily loaded chunk — their fetch and decode are still in
    // flight at that moment. A one-shot read would report `naturalWidth: 0` on
    // a cold server or a loaded CI worker and fail on three perfectly good
    // files, which is the kind of red that teaches people to re-run the suite
    // instead of reading it.
    await expect
      .poll(() =>
        page
          .locator(`${FEED} img`)
          .evaluateAll((images) => images.map((image) => (image as HTMLImageElement).naturalWidth)),
      )
      .toEqual([600, 600, 600]);
  });

  test('shows the three post images without alt while `alt` is active', async ({ page }) => {
    await gotoRendered(page, PATH);

    const alts = await page
      .locator(`${FEED} img`)
      .evaluateAll((images) => images.map((image) => image.getAttribute('alt')));
    expect(alts).toEqual([null, null, null]);
  });

  test('carries the reviewed alternative texts once `alt` is resolved', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=alt`);

    await expect(page.locator(`${FEED} img`).first()).toHaveAttribute(
      'alt',
      'Zwölf Mitarbeitende von Elbwerk stehen mit Malerrollen vor der frisch gestrichenen Wand des Nachbarschaftstreffs.',
    );
    const alts = await page
      .locator(`${FEED} img`)
      .evaluateAll((images) => images.map((image) => image.getAttribute('alt')));
    expect(alts.filter((alt) => alt === null)).toEqual([]);
  });

  // The claim the copy makes about the contrast ratios (docs/UX-COPY.md §9.5),
  // read off the rendered page rather than off the stylesheet: 2.92:1 active,
  // 11.48:1 resolved. axe's verdict is run 2 above; this is the number itself,
  // and it is what would catch a token whose value drifted.
  test('renders the overlay caption at the contrast ratio the copy names', async ({ page }) => {
    /**
     * The three channels of a computed colour — and a hard failure on anything
     * this arithmetic cannot honestly handle.
     *
     * **Translucency is thrown, not dropped.** A ratio is only defined against
     * a known backdrop, and the shape this has to refuse is the one
     * docs/UX-COPY.md §9.5 asks for in words: a gradient scrim instead of a
     * solid band. Set `background-image` and drop `background-color`, and
     * `backgroundColor` computes to `rgba(0, 0, 0, 0)` — an alpha-blind parser
     * reads that as pure black, reports 21:1 for the white caption and passes,
     * while the caption is really white text on whatever the picture shows
     * (the light wall of post 1, about 1.1:1). Nothing else would catch it
     * either: axe returns *incomplete* over a gradient rather than a violation,
     * so run 2's `not.toContain` above passes vacuously too. This is the only
     * assertion standing between that change and a barrier that is repaired in
     * name only.
     */
    const channels = (value: string): [number, number, number] => {
      const parts = /^rgba?\(([^)]+)\)$/.exec(value);
      if (parts === null) {
        throw new Error(`Kein rgb()/rgba()-Wert, Kontrast nicht berechenbar: "${value}"`);
      }
      const numbers = parts[1].split(/[,/\s]+/).filter((part) => part.length > 0);
      if (numbers.length < 3) {
        throw new Error(`Unvollständiger Farbwert: "${value}"`);
      }
      if (numbers.length > 3 && Number(numbers[3]) !== 1) {
        throw new Error(
          `Durchscheinende Fläche (Alpha ${numbers[3]}) in "${value}": Über einer ` +
            'teiltransparenten Fläche ist kein Kontrastverhältnis bestimmbar. Die ' +
            'Bildunterschrift braucht eine deckende Fläche (docs/UX-COPY.md §9.5).',
        );
      }
      return [Number(numbers[0]), Number(numbers[1]), Number(numbers[2])];
    };

    const ratio = (colours: { color: string; background: string }): number => {
      const luminance = (value: string): number => {
        const [red, green, blue] = channels(value).map((part) => {
          const channel = part / 255;
          return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      };
      const first = luminance(colours.color) + 0.05;
      const second = luminance(colours.background) + 0.05;
      return Math.max(first, second) / Math.min(first, second);
    };

    const read = async (url: string): Promise<{ color: string; background: string }> => {
      await gotoRendered(page, url);
      return page
        .locator(`${FEED} .post-overlay`)
        .first()
        .evaluate((caption) => {
          const style = getComputedStyle(caption);
          return { color: style.color, background: style.backgroundColor };
        });
    };

    expect(ratio(await read(PATH))).toBeLessThan(3);
    expect(ratio(await read(`${PATH}?frei=kontrast`))).toBeGreaterThanOrEqual(4.5);
  });

  test('writes the information out instead of into emojis once `emoji` is resolved', async ({
    page,
  }) => {
    await gotoRendered(page, PATH);
    await expect(page.locator(`${FEED} .post-text`)).toContainText('🎉🎉🎉');

    await gotoRendered(page, `${PATH}?frei=emoji`);
    const resolved = page.locator(`${FEED} .post-text`);
    await expect(resolved).toContainText('80 Prozent');
    await expect(resolved).not.toContainText('♿');
  });

  // CLAUDE.md rule 9: the system preference wins, and the frame says what it
  // took away. Without the note a lecturer with high contrast switched on sees
  // a barrier that is not there and reports it as broken.
  // `page.emulateMedia` rather than the `forcedColors` context option: the
  // context option leaves `matchMedia('(forced-colors: active)')` reporting
  // `false` in this Chromium, so a test written on it would assert against a
  // preference the page never saw — and would have passed for the wrong reason
  // if the note were shown unconditionally.
  test.describe('under forced colors', () => {
    const NOTE =
      'Dein System erzwingt eigene Farben. Diese Einstellung hat Vorrang: Die Kontrast-Barriere wird nicht dargestellt. Ohne diese Einstellung wäre der Text auf den Bildern kaum lesbar.';

    test('names the suppressed contrast barrier in the simulation bar', async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' });
      await gotoRendered(page, PATH);

      await expect(page.locator('.suppression p')).toHaveText(NOTE);
      // Exactly one note, and it is the only thing in the bar that changed:
      // the counter still counts the barrier, because it is still switched on
      // (docs/UX-COPY.md §5.6). A suppressed barrier is not a resolved one.
      await expect(page.locator('.suppression p')).toHaveCount(1);
      await expect(page.locator('.counter')).toHaveText('Alle 10 Barrieren aktiv');
    });

    // Nothing is being overridden once the barrier is repaired, so there is
    // nothing to report. A note that stood in every state would be furniture.
    test('says nothing once the barrier is resolved', async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' });
      await gotoRendered(page, `${PATH}?frei=kontrast`);

      await expect(page.locator('.suppression')).toHaveCount(0);
    });

    // The preference can change while the page is open — a lecturer switching
    // high contrast on mid-session is the case this exists for. A note read
    // once at startup would be wrong from that moment on and would stay wrong
    // until a reload.
    test('follows the preference while the page is open', async ({ page }) => {
      await gotoRendered(page, PATH);
      await expect(page.locator('.suppression')).toHaveCount(0);

      await page.emulateMedia({ forcedColors: 'active' });
      await expect(page.locator('.suppression p')).toHaveText(NOTE);

      await page.emulateMedia({ forcedColors: 'none' });
      await expect(page.locator('.suppression')).toHaveCount(0);
    });
  });
});

// Same claim as for the two groups before it: the anchor has to land in front
// of the part of the section its group is about.
test.describe('The panel anchor of the media group', () => {
  test('lands on the section heading, above the feed', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=alt`);

    await page.locator('#barrier-group-medien-anchor').focus();
    await page.keyboard.press('Enter');
    expect((await focused(page)).id).toBe('sim-medien');

    // The section has no control of its own, so the assertion is about
    // position rather than about the next tab stop: everything the group
    // switches is below the landing point.
    const feedBelow = await page.evaluate(() => {
      const heading = document.getElementById('sim-medien')!;
      const feed = document.querySelector('[data-simulation-region] .feed')!;
      return (heading.compareDocumentPosition(feed) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    expect(feedBelow).toBe(true);
  });
});

// The three-part combined barrier of docs/SPEC_v2.md slice 17 — the strongest
// teaching artefact in the tool, and the only one with a physical half.
//
// The panel shape itself (indeterminate parent, `fieldset`/`legend`, one
// checkbox per part) is covered against fixtures in
// src/app/frame/barrier-panel/barrier-panel.component.spec.ts. What is asserted
// here is that shipped content produces it for a barrier with *three* parts —
// the shape the two-part wording of `panel.combinedHint` does not fit, and the
// first one to exercise `panel.combinedHint.many` (docs/UX-COPY.md §5.6).
test.describe('Barrier `event` — the three-part combined barrier (docs/UX-COPY.md §9.6)', () => {
  const PARENT = 'event';
  const PARTS = ['einladung', 'dolmetschung', 'zugang'] as const;

  test('renders as a fieldset with a legend, a parent and three parts', async ({ page }) => {
    await gotoRendered(page, PATH);

    const combined = combinedFieldset(page, PARENT);
    await expect(combined).toHaveCount(1);
    await expect(combined.locator('legend')).toHaveText('Veranstaltung für alle zugänglich');
    await expect(combined.locator('input[type="checkbox"]')).toHaveCount(4);

    // `panel.combinedHint.many`, not the reviewed two-part wording: three
    // checkboxes under a sentence claiming there are two would be the panel
    // contradicting itself (docs/UX-COPY.md §5.6).
    await expect(combined.locator('.hint')).toHaveText(
      'Diese Barriere hat 3 Teile. Erst wenn alle behoben sind, ist der Inhalt barrierefrei.',
    );

    // The campaign's second combined barrier, and the panel now has to keep
    // them apart — both in the DOM and for anyone reading this file.
    await expect(page.locator('.panel fieldset.combined')).toHaveCount(2);
  });

  // docs/SPEC_v2.md slice 17: „Parent shows `indeterminate` for any one or two
  // resolved parts." All six of those states, not a sample.
  test('shows the parent as indeterminate for any one or two resolved parts', async ({ page }) => {
    const partial = [
      ['einladung'],
      ['dolmetschung'],
      ['zugang'],
      ['einladung', 'dolmetschung'],
      ['einladung', 'zugang'],
      ['dolmetschung', 'zugang'],
    ];

    for (const keys of partial) {
      await gotoRendered(page, `${PATH}?frei=${keys.join(',')}`);

      expect(await isIndeterminate(page, PARENT)).toBe(true);
      await expect(boxFor(page, PARENT)).not.toBeChecked();
      for (const key of keys) {
        await expect(boxFor(page, key)).toBeChecked();
      }
      await expect(combinedFieldset(page, PARENT).locator('> .meta .state')).toHaveText(
        'Teilweise behoben',
      );
    }
  });

  test('resolves the parent only once all three parts are', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=${PARTS.join(',')}`);

    await expect(boxFor(page, PARENT)).toBeChecked();
    expect(await isIndeterminate(page, PARENT)).toBe(false);
    await expect(combinedFieldset(page, PARENT).locator('> .meta .state')).toHaveText(
      'Barrierefrei',
    );
  });

  // The first barrier in the project assigned to the `csr` area, which is why
  // the area summary can name it at all (docs/UX-COPY.md §5.6 `area.csr`).
  test('names CSR as its area, and the summary counts three areas', async ({ page }) => {
    await gotoRendered(page, PATH);

    await expect(combinedFieldset(page, PARENT).locator('> .meta .area')).toHaveText(
      'Zuständiger Bereich: CSR',
    );
    await expect(page.locator('.area-summary')).toHaveText(
      'Diese 10 Barrieren stammen aus 3 Bereichen: IT, Kommunikation, CSR.',
    );
  });

  // docs/SPEC_v2.md slice 17: „Explanation view renders `explanation.noStandard`
  // for `dolmetschung` and `zugang`." The claim is the point of the whole
  // barrier — a page that breaks no criterion and still excludes people
  // (CLAUDE.md rule 19) — so it is asserted on the shipped page, not only in the
  // component test.
  test('answers the standards rubric for both organisational parts', async ({ page }) => {
    for (const key of ['dolmetschung', 'zugang']) {
      await gotoRendered(page, `${PATH}?erklaerung=${key}`);

      await expect(page.locator('.explanation .standards')).toHaveCount(0);
      await expect(page.locator('.explanation .no-standard')).toContainText(
        'Sie verstößt gegen keine Norm',
      );
    }

    // And the third part, in the same barrier, does cite criteria. Both halves
    // in one test on purpose: what has to hold is the *difference* between
    // them, which is why `organisational` had to move onto `BarrierPart`.
    await gotoRendered(page, `${PATH}?erklaerung=einladung`);
    await expect(page.locator('.explanation .no-standard')).toHaveCount(0);
    await expect(page.locator('.explanation .standards li')).toHaveCount(2);
  });

  // docs/SPEC_v2.md §4.3 and slice 17: „The explanation names the digital/
  // physical distinction … explicitly." Asserted as a requirement on the
  // *content*, not on a wording: the prose is scaffolding and WERTE.IT will
  // replace it (docs/UX-COPY.md §10), but a replacement that drops the
  // distinction turns the tool into one that claims a sentence on a web page
  // fixes a staircase.
  test('names the digital and the physical barrier as two different things', async ({ page }) => {
    await gotoRendered(page, `${PATH}?erklaerung=zugang`);

    const explanation = (await page.locator('.explanation').textContent())!.toLowerCase();
    expect(explanation).toContain('digitale barriere');
    expect(explanation).toContain('physische');
    expect(explanation).toContain('rampe');
  });
});

test.describe('The event section in the simulation (docs/UX-COPY.md §9.6)', () => {
  const SECTION = '[data-simulation-region] .venue';
  const INVITATION = '[data-simulation-region] .invitation';
  const DOWNLOAD = `${INVITATION} a`;

  // The date, the venue and the registration address belong to no part of the
  // barrier. A page that hid those would be broken in a way nobody explained
  // (CLAUDE.md rule 18).
  test('states the basics in every state of the barrier', async ({ page }) => {
    for (const query of ['', '?frei=event', '?frei=zugang', '?frei=alle']) {
      await gotoRendered(page, `${PATH}${query}`);
      await expect(page.locator('[data-simulation-region] .event-basics')).toContainText(
        'Donnerstag, 24. September 2026, 18 Uhr',
      );
      await expect(page.locator('[data-simulation-region] .event-registration')).toContainText(
        'event@elbwerk.de',
      );
    }
  });

  // The download link is retained when the part is resolved — „auch als Text",
  // not „PDF entfernt" (docs/UX-COPY.md §9.6) — and it has to lead somewhere.
  //
  // The fetch is the lesson of the media section's image test, applied one
  // section further on: a link to a file that is not deployed still has the
  // right text, the right href and the right position, and every assertion
  // about the barrier keeps passing while the only thing the active state
  // offers is a 404.
  test('serves the invitation PDF in both states of `einladung`', async ({ page }) => {
    for (const query of ['', '?frei=einladung']) {
      await gotoRendered(page, `${PATH}${query}`);

      // The attribute is relative and carries no leading slash — the rule that
      // keeps the download working under a configured `base href`
      // (docs/ARCHITECTURE.md §16).
      const href = await page.locator(DOWNLOAD).getAttribute('href');
      expect(href).toBe('simulation/Einladung_Podiumsdiskussion_Sept2026_final.pdf');

      // Fetched at the address the **browser** resolved, read off the element's
      // `href` property, not at one this test composes from `baseURL`. That
      // difference is the whole point of the rule above: composing it here
      // always yields `<origin>/simulation/…` and would keep passing while the
      // real link resolved somewhere else — against a subpath `base href`, or
      // against `/szenario/` if the base element were ever dropped. The failure
      // the relative URL exists to prevent is exactly the one the shortcut
      // cannot see.
      const resolved = await page
        .locator(DOWNLOAD)
        .evaluate((link) => (link as HTMLAnchorElement).href);
      expect(new URL(resolved).pathname).toBe(
        '/simulation/Einladung_Podiumsdiskussion_Sept2026_final.pdf',
      );

      const response = await page.request.get(resolved);
      expect(response.status()).toBe(200);
      expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
    }
  });

  test('offers the details only as a download while `einladung` is active', async ({ page }) => {
    await gotoRendered(page, PATH);

    await expect(page.locator(INVITATION)).toContainText(
      'Alle Einzelheiten entnehmen Sie bitte der Einladung.',
    );
    await expect(page.locator(`${INVITATION} .programme`)).toHaveCount(0);
    await expect(page.locator('[data-simulation-region]')).not.toContainText('18:15 Uhr');
  });

  test('puts the programme on the page once `einladung` is resolved', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=einladung`);

    await expect(page.locator(`${INVITATION} h4`)).toHaveText('Programm');
    await expect(page.locator(`${INVITATION} .programme li`)).toHaveText([
      '18:00 Uhr Begrüßung durch die Geschäftsführung',
      '18:15 Uhr Podiumsdiskussion mit Gästen aus dem Stadtteil',
      '19:30 Uhr Ausklang bei Getränken',
    ]);
  });

  test('says nothing about interpreting until `dolmetschung` is resolved', async ({ page }) => {
    await gotoRendered(page, PATH);
    await expect(page.locator('[data-simulation-region]')).not.toContainText('Gebärdensprache');

    await gotoRendered(page, `${PATH}?frei=dolmetschung`);
    await expect(page.locator('[data-simulation-region] .sign-language')).toContainText(
      'durchgehend in Deutsche Gebärdensprache gedolmetscht',
    );
  });

  test('shows the ramp and the access list only once `zugang` is resolved', async ({ page }) => {
    await gotoRendered(page, PATH);
    await expect(page.locator(`${SECTION} svg .ramp`)).toHaveCount(0);
    await expect(page.locator(`${SECTION} .access`)).toHaveCount(0);

    await gotoRendered(page, `${PATH}?frei=zugang`);
    await expect(page.locator(`${SECTION} svg .ramp`)).toHaveCount(1);
    await expect(page.locator(`${SECTION} .access li`)).toHaveCount(4);
    // The named person with a telephone number, which is what the list cannot
    // do: it says what was thought of, she says the rest is possible too.
    await expect(page.locator(`${SECTION} .access-contact`)).toContainText(
      'Torben Kruse, Telefon 040 555 0188',
    );
  });

  // The drawing is really drawn. Same reasoning as „serves all three post
  // images" in the media section: an `svg` that failed to render still has the
  // right classes and the right absence of a `<title>`, so every other
  // assertion here would pass over an empty box.
  test('renders the drawing with a real size in both variants', async ({ page }) => {
    for (const query of ['', '?frei=zugang']) {
      await gotoRendered(page, `${PATH}${query}`);

      const box = await page.locator(`${SECTION} svg`).boundingBox();
      expect(box!.width).toBeGreaterThan(100);
      expect(box!.height).toBeGreaterThan(60);
    }
  });

  // docs/SPEC_v2.md slice 17: „SVG illustrations use `--sim-*` tokens only and
  // render correctly under `forced-colors`."
  //
  // Asserted structurally rather than against a palette: every stroke resolves
  // to the element's own `color`, and no shape carries a fill. That is exactly
  // the property that makes the drawing survive a forced palette — the system
  // replaces `color`, and the whole drawing follows. A hard-coded stroke would
  // pass a screenshot in both themes and disappear on a black background.
  test('draws in currentColor only, in normal and in forced colors', async ({ page }) => {
    for (const forcedColors of ['none', 'active'] as const) {
      await page.emulateMedia({ forcedColors });
      await gotoRendered(page, `${PATH}?frei=zugang`);

      const paint = await page.locator(`${SECTION} svg`).evaluate((drawing) => {
        const own = getComputedStyle(drawing).color;
        const shapes = Array.from(drawing.querySelectorAll('rect, circle, path'));
        return {
          own,
          strokes: [...new Set(shapes.map((shape) => getComputedStyle(shape).stroke))],
          fills: [...new Set(shapes.map((shape) => getComputedStyle(shape).fill))],
        };
      });

      expect(paint.strokes).toEqual([paint.own]);
      expect(paint.fills).toEqual(['none']);
    }
    await page.emulateMedia({ forcedColors: 'none' });
  });

  // The alternative text of the drawing hangs off the barrier `alt`, not off
  // `zugang` — the reasoning is in
  // src/app/scenarios/csr-campaign/campaign-event/campaign-event.component.ts.
  // What is asserted here is the consequence: which of the two texts is on the
  // drawing depends on `zugang`, and whether there is one at all depends on
  // `alt`.
  test('names the drawing only while `alt` is resolved, and names the right one', async ({
    page,
  }) => {
    const name = () =>
      page.locator(`${SECTION} svg`).evaluate((drawing) => ({
        role: drawing.getAttribute('role'),
        title: drawing.querySelector('title')?.textContent?.trim() ?? null,
      }));

    // Active: no role, no title. Omitted, not replaced by `aria-hidden`
    // (CLAUDE.md rule 6).
    for (const query of ['', '?frei=zugang']) {
      await gotoRendered(page, `${PATH}${query}`);
      expect(await name()).toEqual({ role: null, title: null });
      await expect(page.locator(`${SECTION} svg`)).not.toHaveAttribute('aria-hidden', /.*/);
    }

    await gotoRendered(page, `${PATH}?frei=alt`);
    expect(await name()).toEqual({
      role: 'img',
      title:
        'Der Eingang des Nachbarschaftstreffs. Drei Stufen führen zur Eingangstür, ein Handlauf ist nicht vorhanden.',
    });

    await gotoRendered(page, `${PATH}?frei=alt,zugang`);
    expect(await name()).toEqual({
      role: 'img',
      title:
        'Der Eingang des Nachbarschaftstreffs. Neben drei Stufen führt eine Rampe mit Handlauf zur Eingangstür.',
    });
  });

  // Run 2's rules must not start firing from this section. `image-alt` does not
  // apply to an inline `svg`, and `svg-img-alt` only applies to one that
  // declares a role — which the drawing does exactly when it also carries a
  // title. The section therefore plants no automated finding in either state,
  // which is what `automatedDetection: 'manual'` claims about it.
  //
  // axe does the scoping, through the `within` argument. Running over the whole
  // region and filtering the results by the markup of the offending node does
  // not work: axe names the node the rule applies to, which for anything inside
  // the drawing is a descendant of the `svg` — its markup does not carry the
  // class the section is recognised by, so the finding would be dropped and the
  // test would pass on a section that really does plant one.
  test('plants no axe violation of its own in any state', async ({ page }) => {
    for (const query of ['', '?frei=zugang', '?frei=alt', '?frei=alt,zugang']) {
      await gotoRendered(page, `${PATH}${query}`);

      const results = await barrierAssertion(page, `${SECTION} svg`).analyze();
      expect(results.violations.map((violation) => violation.id)).toEqual([]);
    }
  });
});

// Same claim as for the three groups before it: the anchor has to land in front
// of the part of the section its group is about — here the download link, which
// is the section's only control and the thing `einladung` is about.
test.describe('The panel anchor of the event group', () => {
  test('lands in front of the download link the group is about', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=alle`);

    await page.locator('#barrier-group-event-anchor').focus();
    await page.keyboard.press('Enter');
    expect((await focused(page)).id).toBe('sim-event');

    await page.keyboard.press('Tab');
    const stop = await focused(page);
    expect(stop.tag).toBe('A');
    expect(stop.text).toContain('Einladung_Podiumsdiskussion_Sept2026_final.pdf');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The donation section (docs/SPEC_v2.md slice 18, docs/UX-COPY.md §9.7 to §9.10)
//
// The two time-dependent barriers of the project live here, and they are the
// reason docs/TESTING.md §10 exists: **the clock is set, never waited on.** A
// test that sleeps for the carousel interval fails on a loaded CI runner, gets
// marked flaky, then skipped, then deleted.
//
// `page.clock.install` runs before the navigation and lets the page load at its
// own pace; `pauseAt` freezes time once it is up, and every advance after that
// is a `runFor`. `runFor` rather than `fastForward`, deliberately: fastForward
// fires a due timer at most once, which for a four-second interval means one
// advance no matter how far the clock jumps — an assertion about *how often*
// something happens could not be written on it.
// ─────────────────────────────────────────────────────────────────────────────

const DONATION = '[data-simulation-region] app-campaign-donation';
const CAROUSEL = '[data-simulation-region] app-campaign-carousel';
const LIVE_REGION = '[data-simulation-region] [aria-live]';

/** docs/UX-COPY.md §9.10: „Wechsel alle vier Sekunden". */
const ADVANCE_MS = 4000;

/**
 * Where the clock starts, and where it is frozen once the page is up.
 *
 * The pause point is five seconds past the minute on purpose. The campaign ends
 * at a whole minute, so the countdown's own minute boundary is 55 seconds
 * away — far enough that the „nothing changes for 30 seconds" assertion below
 * cannot be decided by however long the page happened to take to load, and
 * close enough that one further minute crosses it for certain.
 */
const CLOCK_START = new Date('2026-09-01T09:00:00');
const CLOCK_PAUSED = new Date('2026-09-01T10:00:05');

/**
 * **A paused clock pauses rendering, not only the barriers.**
 *
 * The application is zoneless: a signal write marks the view dirty and Angular
 * then schedules the change-detection pass through `requestAnimationFrame`
 * racing `setTimeout` — both of which the fake clock owns. While time stands
 * still, a click, a hover and a fired interval all *happen*, and none of them
 * reaches the DOM. Every assertion in this file would then be reading the page
 * as it was before the interaction, which is a failure mode that looks exactly
 * like a broken component.
 *
 * So the clock is nudged after every interaction. Fifty milliseconds is far
 * inside the carousel's four-second interval, so it can never advance a slide
 * by itself, and far inside the countdown's second — this buys the frame its
 * tick and nothing else. It is not a wait: no real time passes, and
 * docs/TESTING.md §10's ban on `waitForTimeout` is about waiting for something
 * to *become* true, which is the opposite of this.
 */
const SETTLE_MS = 50;

async function settle(page: Page): Promise<void> {
  await page.clock.runFor(SETTLE_MS);
}

/**
 * **Once per test.** The clock is paused when this returns, and a paused clock
 * means a page that cannot render (see `SETTLE_MS`) — a second navigation under
 * it never gets past the router's own chunk, and the failure surfaces inside
 * `gotoRendered` as a step view stuck on `pending`. A test that needs two states
 * is two tests.
 *
 * The hour between `CLOCK_START` and `CLOCK_PAUSED` is jumped, and the jump
 * fires every due timer once — so the carousel is one slide further on when this
 * returns. Nothing here should assume which slide that is; the assertions below
 * are written against what changes, not against an index.
 */
async function gotoWithClock(page: Page, url: string): Promise<void> {
  await page.clock.install({ time: CLOCK_START });
  await gotoRendered(page, url);
  await page.clock.pauseAt(CLOCK_PAUSED);
  // The jump itself is a change the page has not drawn yet — the countdown
  // recomputed an hour of elapsed time and is still showing the old one.
  await settle(page);
}

// Run 2 per axe-detectable barrier, generated from the content — both
// directions each, every one scoped to the section that barrier belongs to.
//
// It replaces a pair of hand-written cases for `fortschritt` and a claim in
// e2e/csr-integration.spec.ts that the hand-written set was complete. That
// claim was checked against a literal list in a third file, so deleting a case
// left it green (code review of slice 19). Generating the cases is the version
// that cannot drift: the set comes from `automatedDetection`, the rule id from
// the fixture, and a barrier nobody scoped throws in `sectionFor` before a
// single test runs.
//
// The four media cases overlap with the eight-state loop above, which is worth
// the four page loads: that loop proves the combinations, this one proves that
// *every* barrier the content calls machine-detectable is actually asserted.
for (const barrier of AXE_BARRIERS) {
  const rule = expectedRuleFor('csr-kampagne', barrier.id);
  const within = sectionFor(barrier.id);

  test.describe(`axe run 2 — \`${barrier.urlKey}\``, () => {
    test(`plants a ${rule} violation in its own section while active`, async ({ page }) => {
      await gotoRendered(page, PATH);
      const results = await barrierAssertion(page, within).analyze();
      expect(results.violations.map((violation) => violation.id)).toContain(rule);
    });

    test(`plants no ${rule} violation there once it is resolved`, async ({ page }) => {
      await gotoRendered(page, `${PATH}?frei=${barrier.urlKey}`);

      const results = await barrierAssertion(page, within).analyze();
      expect(results.violations.map((violation) => violation.id)).not.toContain(rule);

      // …while every other axe barrier, still active, still plants its own.
      // Two of the three share the rule id `image-alt` in two different
      // sections, which is exactly the confusion a region-wide run 2 could not
      // resolve: without this half, a repair that silenced the whole page would
      // read the same as one that repaired this barrier.
      for (const other of AXE_BARRIERS.filter((entry) => entry.id !== barrier.id)) {
        const stillThere = await barrierAssertion(page, sectionFor(other.id)).analyze();
        expect(stillThere.violations.map((violation) => violation.id)).toContain(
          expectedRuleFor('csr-kampagne', other.id),
        );
      }
    });
  });
}

// The control for the generator above (the pattern of e2e/barrier-panel.spec.ts):
// a content file that stopped marking anything `'axe'` would empty the loop and
// remove run 2 from this scenario entirely, with every remaining test green.
// The other direction needs no test — a barrier marked `'axe'` without a
// section throws in `sectionFor` while the file is being read, so the shard
// fails before it runs.
test('run 2 has cases to run (docs/TESTING.md §5)', () => {
  expect(AXE_BARRIERS.length).toBeGreaterThan(0);
});

test.describe('Barrier `fortschritt` — the donation total (docs/UX-COPY.md §9.7)', () => {
  // The graphic really renders. Same reasoning as „serves all three post
  // images" in the media section: a file that 404s or will not parse still has
  // no `alt`, so run 2 keeps finding its violation and every assertion here
  // keeps passing over an empty box.
  test('serves the bar graphic', async ({ page }) => {
    await gotoRendered(page, PATH);

    await expect
      .poll(() =>
        page
          .locator(`${DONATION} img.progress-graphic`)
          .evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBe(600);
  });

  test('states the figures nowhere but inside the graphic while active', async ({ page }) => {
    await gotoRendered(page, PATH);

    const graphic = page.locator(`${DONATION} img.progress-graphic`);
    await expect(graphic).not.toHaveAttribute('alt', /.*/);
    await expect(graphic).not.toHaveAttribute('aria-hidden', /.*/);
    await expect(page.locator('[data-simulation-region]')).not.toContainText('70 Prozent');
  });

  test('puts the figures beside the bar once resolved', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=fortschritt`);

    await expect(page.locator(`${DONATION} .progress-text`)).toHaveText(
      '8.400 € von 12.000 € erreicht — 70 Prozent',
    );
    await expect(page.locator(`${DONATION} .progress-remaining`)).toHaveText(
      'Noch 3.600 € bis zum Ziel',
    );
    await expect(page.locator(`${DONATION} img.progress-graphic`)).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});

test.describe('Barrier `countdown` — the live region (docs/UX-COPY.md §9.8)', () => {
  test('has no live region at all while active', async ({ page }) => {
    await gotoWithClock(page, PATH);

    await expect(page.locator(LIVE_REGION)).toHaveCount(0);
    // The visible display is the same in both states — the three blocks of
    // `csr.countdown.units`. What the barrier removes is the announcement, not
    // the countdown.
    await expect(page.locator(`${DONATION} .countdown-unit`)).toHaveText([
      'Tage',
      'Stunden',
      'Minuten',
    ]);
  });

  // docs/SPEC_v2.md slice 18: „Exactly one live region in the frame plus at
  // most one in the simulation" (docs/ARCHITECTURE.md §12.2). The frame's is
  // the announcer's and is never removed; the simulation's exists only while
  // this barrier is resolved.
  test('adds exactly one polite live region, beside the frame’s own', async ({ page }) => {
    await gotoWithClock(page, `${PATH}?frei=countdown`);

    await expect(page.locator(LIVE_REGION)).toHaveCount(1);
    await expect(page.locator(LIVE_REGION)).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('[aria-live]')).toHaveCount(2);
  });

  // **The lesson of this barrier** (docs/UX-COPY.md §9.8): building a live
  // region is not enough, it has to have the right cadence. A per-second region
  // would talk over every toggle confirmation the frame makes, and both
  // announcements would be worthless.
  test('changes its announcement once a minute and never once a second', async ({ page }) => {
    await gotoWithClock(page, `${PATH}?frei=countdown`);
    const live = page.locator(LIVE_REGION);

    const before = await live.textContent();
    expect(before).toMatch(/^\d+ Tage, \d+ Stunden, \d+ Minuten$/);

    // Thirty seconds, one tick at a time — the visible display recomputes in
    // every one of them, and the announcement may not change in any.
    await page.clock.runFor(30_000);
    expect(await live.textContent()).toBe(before);

    // And then, with the minute, exactly once.
    await page.clock.runFor(60_000);
    expect(await live.textContent()).not.toBe(before);
  });
});

test.describe('Barrier `slider` — the donation amount (docs/UX-COPY.md §9.9)', () => {
  test('offers no control at all while active, and Tab never reaches one', async ({ page }) => {
    await gotoRendered(page, PATH);

    await expect(page.locator(`${DONATION} .drag-slider`)).toHaveCount(1);
    await expect(page.locator(`${DONATION} input`)).toHaveCount(0);
    await expect(page.locator(`${DONATION} label`)).toHaveCount(0);

    // Real key events, reading `document.activeElement` (docs/TESTING.md §9).
    // The drag surface has no `tabindex` and nothing anywhere fights the Tab
    // key — it simply is not a control (CLAUDE.md rule 6).
    await page.locator(EXIT_LINK).focus();
    for (let press = 0; press < 30; press++) {
      await page.keyboard.press('Tab');
      const inSlider = await page.evaluate(() => {
        const slider = document.querySelector('.drag-slider');
        const active = document.activeElement;
        return slider !== null && active !== null && slider.contains(active);
      });
      expect(inSlider).toBe(false);
    }
  });

  // „Was per Ziehen geht, muss auch ohne Ziehen gehen" (SC 2.5.7) — and the
  // slider stays, rather than the repair consisting of taking a control away.
  test('changes the amount with the arrow keys once resolved', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=slider`);

    const range = page.locator(`${DONATION} input[type="range"]`);
    const number = page.locator(`${DONATION} input[type="number"]`);

    const before = await range.inputValue();
    await range.focus();
    await page.keyboard.press('ArrowRight');

    const after = await range.inputValue();
    expect(Number(after)).toBeGreaterThan(Number(before));

    // The two controls are one amount, not two — and asserted with the
    // retrying matcher rather than a bare read. The range moves in the browser
    // the moment the key lands; the number field follows on the next
    // change-detection pass, which is a frame later. A one-shot read is a race
    // that passes on a warm machine and fails on a busy one.
    await expect(number).toHaveValue(after);
  });

  // **Der Betrag lässt sich wirklich eintippen**, Ziffer für Ziffer, mit echten
  // Tastenanschlägen — und das ist der Test, der einen Fehler gefunden hat, den
  // keine der übrigen Prüfungen sah: Das Feld ist an das Signal gebunden, und
  // solange jede Tasteneingabe sofort auf den kleinsten Betrag gehoben und
  // zurückgeschrieben wurde, wurde aus „40" die 50 und aus „100" die 500. Jeder
  // Betrag mit einer führenden Ziffer unter 5 war unerreichbar — in der
  // behobenen Fassung einer Barriere über die Eingabe von Beträgen.
  //
  // Mit `type()` und nicht mit `fill()`: `fill()` setzt den Wert in einem Zug
  // und löst ein einziges `input`-Ereignis aus. Der Fehler steckte zwischen den
  // Tastenanschlägen.
  test('accepts an amount typed digit by digit', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=slider`);
    const number = page.locator(`${DONATION} input[type="number"]`);

    for (const amount of ['40', '100']) {
      await number.click();
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Delete');
      await page.keyboard.type(amount);

      await expect(number).toHaveValue(amount);
    }

    // Gültig gemacht wird der Betrag beim Verlassen des Feldes — und dann
    // zeigen beide Bedienelemente denselben.
    await number.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('7');
    await page.locator(`${DONATION} input[type="range"]`).focus();

    await expect(number).toHaveValue('5');
    await expect(page.locator(`${DONATION} input[type="range"]`)).toHaveValue('5');
  });

  test('gives the number field an associated label', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=slider`);

    const labels = await page.locator(`${DONATION} label`).evaluateAll((elements) =>
      elements.map((element) => ({
        text: (element.textContent ?? '').trim(),
        controls: (element as HTMLLabelElement).control?.getAttribute('type') ?? null,
      })),
    );
    expect(labels).toEqual([
      { text: 'Betrag in Euro', controls: 'range' },
      { text: 'Anderer Betrag', controls: 'number' },
    ]);

    // The four preset buttons of `csr.donate.presets`, and the pressed state in
    // words rather than in colour alone.
    await expect(page.locator(`${DONATION} .preset`)).toHaveText(['10 €', '25 €', '50 €', '100 €']);
    await expect(page.locator(`${DONATION} .preset[aria-pressed="true"]`)).toHaveText('25 €');
  });

  // docs/SPEC_v2.md slice 18: „Simulation note present in all states, never
  // subject to a barrier" (docs/UX-COPY.md §8.4, CLAUDE.md rule 5).
  test('keeps the simulation note in every state', async ({ page }) => {
    for (const query of ['', '?frei=slider', '?frei=fortschritt,countdown', '?frei=alle']) {
      await gotoRendered(page, `${PATH}${query}`);
      await expect(page.locator(DONATE_NOTE)).toHaveText(
        'Es wird keine Spende ausgelöst. Dies ist eine Nachbildung.',
      );
    }
  });
});

test.describe('Barrier `karussell` — the testimonials (docs/UX-COPY.md §9.10)', () => {
  const QUOTE = `${CAROUSEL} .carousel-quote`;

  // The negative control docs/TESTING.md §11 asks for by name, and it comes
  // first: without it, a bug that stops the carousel unconditionally would pass
  // the reduced-motion test below and quietly remove a barrier from the module.
  test('advances on its own while active, with no preference set', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await gotoWithClock(page, PATH);

    const first = await page.locator(QUOTE).textContent();
    await page.clock.runFor(ADVANCE_MS);
    const second = await page.locator(QUOTE).textContent();
    expect(second).not.toBe(first);

    // Three quotes, and back to the first: it really cycles rather than
    // stopping at the end.
    await page.clock.runFor(2 * ADVANCE_MS);
    expect(await page.locator(QUOTE).textContent()).toBe(first);

    // Nothing to pause it with, and no position to orient by — omitted, not
    // disabled (CLAUDE.md rule 6).
    await expect(page.locator(`${CAROUSEL} button`)).toHaveCount(0);
    await expect(page.locator(`${CAROUSEL} .carousel-position`)).toHaveCount(0);
  });

  test('stops on the pause control once resolved, and says where it is', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await gotoWithClock(page, `${PATH}?frei=karussell`);

    const toggle = page.locator(`${CAROUSEL} .carousel-toggle`);
    await expect(toggle).toHaveText('Automatischen Wechsel anhalten');

    // `csr.carousel.position`, and the number is whichever slide is up — the
    // clock jumped past a turn on the way in. What the indicator has to do is
    // say where the reader is, and *keep* saying it as the slide changes; that
    // it starts at one is a property of the jump, not of the component.
    const position = page.locator(`${CAROUSEL} .carousel-position`);
    await expect(position).toHaveText(/^Beitrag [1-3] von 3$/);
    const before = await position.textContent();
    await page.clock.runFor(ADVANCE_MS);
    expect(await position.textContent()).not.toBe(before);

    // Operated by keyboard, the way the control exists to be operated.
    await toggle.focus();
    await page.keyboard.press('Enter');
    await settle(page);
    await expect(toggle).toHaveText('Automatischen Wechsel fortsetzen');

    // Focus then leaves the group, and *that* is what makes this a test of the
    // pause rather than of the focus rule below: while the focus sits on the
    // control, the rotation would be stopped either way, and a broken pause
    // button would pass.
    await page.locator(EXIT_LINK).focus();
    await settle(page);

    const held = await page.locator(QUOTE).textContent();
    await page.clock.runFor(3 * ADVANCE_MS);
    expect(await page.locator(QUOTE).textContent()).toBe(held);
  });

  // „Wechsel stoppt bei Fokus oder Zeigerkontakt" (docs/UX-COPY.md §9.10): who
  // is reading should be able to finish reading, without first hunting for a
  // control.
  test('holds the quote while the pointer is inside', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await gotoWithClock(page, `${PATH}?frei=karussell`);

    await page.locator(`${CAROUSEL} .carousel`).hover();
    await settle(page);
    const held = await page.locator(QUOTE).textContent();
    await page.clock.runFor(2 * ADVANCE_MS);
    expect(await page.locator(QUOTE).textContent()).toBe(held);

    await page.mouse.move(0, 0);
    await settle(page);
    await page.clock.runFor(ADVANCE_MS);
    expect(await page.locator(QUOTE).textContent()).not.toBe(held);
  });

  // Die andere Hälfte derselben Regel: der Fokus. Er landet hier über die
  // Tastatur, nicht über `.focus()` — ein Halt, den ein Test nur mit einem
  // programmatischen Fokus auslösen kann, hält für niemanden an
  // (docs/TESTING.md §9).
  test('holds the quote while the focus is inside', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await gotoWithClock(page, `${PATH}?frei=karussell`);

    await page.locator(`${CAROUSEL} .carousel-toggle`).focus();
    await settle(page);
    const held = await page.locator(QUOTE).textContent();
    await page.clock.runFor(2 * ADVANCE_MS);
    expect(await page.locator(QUOTE).textContent()).toBe(held);

    await page.locator(EXIT_LINK).focus();
    await settle(page);
    await page.clock.runFor(ADVANCE_MS);
    expect(await page.locator(QUOTE).textContent()).not.toBe(held);
  });

  // CLAUDE.md rule 9 and docs/TESTING.md §11. The preference wins in *both*
  // states, and while the barrier stands the frame says what it took away —
  // without that note a lecturer with reduced motion switched on sees a barrier
  // that is not there and reports it as broken.
  test.describe('under reduced motion', () => {
    const NOTE =
      'Dein System fordert reduzierte Bewegung an. Diese Einstellung hat Vorrang: Das Karussell wechselt die Beiträge nicht automatisch. Ohne diese Einstellung würde es alle vier Sekunden weiterspringen, ohne dass du es anhalten kannst.';

    // One test per state rather than a loop: `gotoWithClock` may only run once
    // per page, and both halves of „in either state" are worth failing
    // separately anyway — the active one is the barrier being overruled, the
    // resolved one is the accessible variant respecting the preference by
    // itself.
    for (const { name, query } of [
      { name: 'while the barrier is active', query: '' },
      { name: 'once the barrier is resolved', query: '?frei=karussell' },
    ]) {
      test(`does not advance ${name}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await gotoWithClock(page, `${PATH}${query}`);

        const first = await page.locator(QUOTE).textContent();
        await page.clock.runFor(5 * ADVANCE_MS);
        expect(await page.locator(QUOTE).textContent()).toBe(first);
      });
    }

    test('names the suppressed barrier in the simulation bar', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await gotoRendered(page, PATH);

      await expect(page.locator('.suppression p')).toHaveText(NOTE);
      await expect(page.locator('.suppression p')).toHaveCount(1);
      // A suppressed barrier is still an active barrier: the counter counts it,
      // and the panel checkbox stays unchecked (docs/UX-COPY.md §5.6).
      await expect(page.locator('.counter')).toHaveText('Alle 10 Barrieren aktiv');
    });

    // Nothing is being overridden once the barrier is repaired: the accessible
    // variant respects the preference by itself, and it keeps its control — so
    // the note, whose last clause is „ohne dass du es anhalten kannst", would
    // be describing a barrier that is not there. The reasoning is in
    // scenarios/csr-campaign/campaign-carousel/campaign-carousel.component.ts.
    test('says nothing once the barrier is resolved, and keeps the control usable', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await gotoWithClock(page, `${PATH}?frei=karussell`);

      await expect(page.locator('.suppression')).toHaveCount(0);

      const toggle = page.locator(`${CAROUSEL} .carousel-toggle`);
      await expect(toggle).toHaveText('Automatischen Wechsel fortsetzen');

      const first = await page.locator(QUOTE).textContent();
      await toggle.click();
      // Pointer and focus both leave the group afterwards: a click puts the
      // focus on the button and the pointer over it, and either of those would
      // hold the rotation for a reason that has nothing to do with the
      // preference.
      await page.mouse.move(0, 0);
      await page.locator(EXIT_LINK).focus();
      await settle(page);

      await page.clock.runFor(ADVANCE_MS);
      expect(await page.locator(QUOTE).textContent()).not.toBe(first);
    });
  });
});

// Same claim as for the four groups before it: the anchor has to land in front
// of the part of the section its group is about — here the amount controls,
// which are what the section's only barriers with a control are about.
test.describe('The panel anchor of the donation group', () => {
  test('lands in front of the controls the group is about', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=alle`);

    await page.locator('#barrier-group-spende-anchor').focus();
    await page.keyboard.press('Enter');
    expect((await focused(page)).id).toBe('sim-spende');

    await page.keyboard.press('Tab');
    const stop = await focused(page);
    expect(stop.tag).toBe('INPUT');
    expect(stop.id).toBe('sim-donate-slider');
  });
});
