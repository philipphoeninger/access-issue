// The CSR campaign as one scenario rather than five sections
// (docs/SPEC_v2.md slice 19). Everything here is a claim about the whole page:
// what the tested state matrix has to contain, what `?frei=alle` has to reach,
// what a deep link into each section has to reproduce, and which business areas
// the panel's summary line is allowed to name.
//
// Slices 14 to 18 each proved their own section, and each of them was right
// about the part it could see. What none of them could answer is whether the
// five together still add up: whether a matrix that grew section by section
// still covers every barrier, whether the two combined barriers really do give
// up all of their parts to the reserved `alle` key, and whether a link a
// trainer pastes into a slide lands in the state they left.
//
// **The matrix may grow, never shrink.** The first test in this file is the one
// that says so — it derives the required states from the content and fails when
// a state is missing, which is the failure mode the „shard, do not reduce"
// mitigation in docs/TESTING.md §4 exists to prevent. It is a pure test: no
// page load, no browser, so it costs nothing to keep even when the suite is
// under time pressure.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { CAMPAIGN_PATH as PATH, MEDIA_KEYS, STATES } from './support/campaign-states';
import { gotoRendered } from './support/goto';
import { CSR_CAMPAIGN_SCENARIO } from '../src/app/content/csr-campaign/csr-campaign.scenario';
import { combinedBarrierParts, parseResolvedKeys } from '../src/app/core/url-state';
import { AREA_LABELS } from '../src/app/frame/area-labels';
import type { Barrier } from '../src/app/models/domain.model';

const BARRIERS = CSR_CAMPAIGN_SCENARIO.barriers;
const REGION = '[data-simulation-region]';

/**
 * The leaf urlKeys of one barrier: its parts if it is combined, otherwise its
 * own key. The same distinction core/url-state.ts makes, and made the same way
 * — through `combinedBarrierParts`, so this file cannot disagree with the state
 * layer about which barriers have parts.
 */
function leafKeysOf(barrier: Barrier): string[] {
  const parts = combinedBarrierParts(barrier);
  return parts ? parts.map((part) => part.urlKey) : [barrier.urlKey];
}

/** Every leaf switch on the page, in content order. */
const LEAF_KEYS = BARRIERS.flatMap(leafKeysOf);

/** Only the parts — the keys a combined barrier's parent is sugar for. */
const PART_KEYS = BARRIERS.flatMap((barrier) => {
  const parts = combinedBarrierParts(barrier);
  return parts === undefined ? [] : parts.map((part) => part.urlKey);
});

/**
 * One panel checkbox per barrier **and** one per part, so a combined barrier
 * contributes its parent plus its parts. Derived rather than written down: the
 * number is a consequence of the content, and a literal here would go stale the
 * moment a barrier is added.
 *
 * Three numbers describe this page and they are all different: ten barriers,
 * thirteen leaf switches (five of them parts), fifteen checkboxes. The
 * documents said eleven and fourteen until this slice, which is how the
 * off-by-one recorded in docs/SPEC_v2.md slice 19 came to light — deriving the
 * figure here rather than writing it down is what keeps that from recurring.
 */
const CHECKBOX_COUNT = BARRIERS.length + PART_KEYS.length;

/** The `frei` value of a state URL, as the set of leaf keys the application will resolve. */
function resolvedKeysOf(url: string): ReadonlySet<string> {
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  return parseResolvedKeys(new URLSearchParams(query).get('frei'), BARRIERS);
}

/** A stable, comparable spelling of a set of resolved keys. */
function signature(keys: Iterable<string>): string {
  return [...keys].sort().join(',');
}

/**
 * The panel's checkboxes as data: which barrier or part each one belongs to,
 * and what it currently shows. Keyed by `urlKey` through the label span the
 * panel renders for it (`barrier-{urlKey}-label`), never by position — the
 * order of two page loads agreeing is not the claim; the *state* of the same
 * switch agreeing is.
 */
function panelState(page: Page): Promise<Array<{ key: string; checked: boolean; mixed: boolean }>> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.panel mat-checkbox')].map((box) => {
      const label = box.querySelector('span[id^="barrier-"][id$="-label"]');
      const input = box.querySelector('input[type="checkbox"]') as HTMLInputElement;
      return {
        key: label === null ? '' : label.id.replace(/^barrier-|-label$/g, ''),
        checked: input.checked,
        mixed: input.indeterminate,
      };
    }),
  );
}

/** The checkbox belonging to one barrier or part (the panel keys its ids off `urlKey`). */
function boxFor(page: Page, urlKey: string) {
  return page.locator(`.panel mat-checkbox:has(#barrier-${urlKey}-label) input[type="checkbox"]`);
}

// docs/TESTING.md §4, as an assertion rather than as a comment. The tested
// states are a list a human maintains, one slice at a time; this is what keeps
// that list honest against the content it is supposed to cover.
//
// No browser, no server, no page load — it reads the scenario and the matrix
// and compares them. That matters for the budget question this slice had to
// answer: the guard survives any amount of sharding, because it is not part of
// what makes the suite slow.
test.describe('The tested state matrix (docs/TESTING.md §4)', () => {
  const tested = new Set(STATES.map(({ url }) => signature(resolvedKeysOf(url))));
  const distinct = (entries: Array<{ why: string; keys: readonly string[] }>) => {
    const seen = new Map<string, string>();
    for (const { why, keys } of entries) {
      const key = signature(keys);
      if (!seen.has(key)) {
        seen.set(key, why);
      }
    }
    return seen;
  };

  /**
   * What §4 requires, derived from the content:
   *
   *  - the default state and the fully resolved one — the two a participant
   *    compares first
   *  - each barrier resolved on its own (n + 2, with a combined barrier
   *    resolved through all of its parts)
   *  - every partial repair of every combined barrier — each non-empty proper
   *    subset of its parts. Two parts give two, three parts give six, and §4
   *    spends them here on purpose: „they are where the teaching happens"
   *  - all eight combinations of the media section, which docs/SPEC_v2.md
   *    slice 16 asks for by name
   */
  const required: Array<{ why: string; keys: readonly string[] }> = [
    { why: 'all barriers active', keys: [] },
    { why: 'all barriers resolved', keys: LEAF_KEYS },
    ...BARRIERS.map((barrier) => ({
      why: `only \`${barrier.urlKey}\` resolved`,
      keys: leafKeysOf(barrier),
    })),
    ...BARRIERS.flatMap((barrier) => {
      const parts = combinedBarrierParts(barrier);
      if (parts === undefined) {
        return [];
      }
      const partKeys = parts.map((part) => part.urlKey);
      const subsets: Array<{ why: string; keys: readonly string[] }> = [];
      // Every non-empty proper subset, by bitmask — 2 parts → 2, 3 parts → 6.
      for (let mask = 1; mask < (1 << partKeys.length) - 1; mask++) {
        const keys = partKeys.filter((_key, index) => (mask & (1 << index)) !== 0);
        subsets.push({ why: `partial repair of \`${barrier.urlKey}\`: ${keys.join(' + ')}`, keys });
      }
      return subsets;
    }),
    ...[...Array(8).keys()].map((mask) => {
      const keys = MEDIA_KEYS.filter((_key, index) => (mask & (1 << index)) !== 0);
      return { why: `media combination ${keys.join(' + ') || 'none'}`, keys };
    }),
  ];

  // The required states, deduplicated: a media combination of one barrier is
  // the same state as that barrier resolved on its own, and „nothing resolved"
  // reaches this list twice. One test rather than one per state, because the
  // useful failure output is the *list* of what is missing.
  const REQUIRED = distinct(required);

  test('contains every state docs/TESTING.md §4 requires of this scenario', () => {
    const missing = [...REQUIRED.entries()]
      .filter(([keys]) => !tested.has(keys))
      .map(([, why]) => why);

    expect(missing).toEqual([]);
  });

  // The control for the generator above, in both directions. Without it, a
  // content file that stopped exporting its barriers would empty `REQUIRED`
  // and the test above would pass by having nothing to check; without the last
  // line, a `STATES` reduced to two rows would still satisfy a requirement list
  // that had shrunk with it.
  test('is generated from content that is actually there', () => {
    expect(BARRIERS.length).toBeGreaterThan(0);
    expect(REQUIRED.size).toBeGreaterThanOrEqual(BARRIERS.length + 2);
    expect(STATES.length).toBeGreaterThanOrEqual(REQUIRED.size);
  });
});

// docs/SPEC_v2.md slice 19: „`?frei=alle` resolves all … switches including all
// parts of both combined barriers."
//
// `alle` is the one reserved key of the URL contract (CLAUDE.md rule 12,
// docs/ARCHITECTURE.md §8), and it is the one a trainer types by hand in front
// of a room. What makes it worth a test of its own on this page rather than on
// the application process: this is the first scenario where „every switch" and
// „every barrier" are different sentences. Five of the thirteen leaf switches
// belong to a combined barrier, and a sugar key that resolved parents but not
// parts would leave the page looking repaired in the panel and broken in the
// simulation.
test.describe('`?frei=alle` (CLAUDE.md rule 12)', () => {
  test('resolves every switch on the page, parts included', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=alle`);

    const boxes = await panelState(page);
    expect(boxes.length).toBe(CHECKBOX_COUNT);
    // Every switch the content declares is present, and every one of them is
    // ticked and settled — a parent left `indeterminate` would mean parts it
    // does not own.
    expect(boxes.map(({ key }) => key).sort()).toEqual(
      [...BARRIERS.map((barrier) => barrier.urlKey), ...PART_KEYS].sort(),
    );
    for (const { key, checked, mixed } of boxes) {
      expect(checked, `checkbox \`${key}\` is ticked`).toBe(true);
      expect(mixed, `checkbox \`${key}\` is settled`).toBe(false);
    }

    await expect(page.locator('.counter')).toHaveText('Keine Barriere aktiv');
  });

  // The other half of the same claim, and the one no panel assertion can make:
  // the simulation actually renders the accessible variant of all five
  // sections. One marker per section, each of them something only the resolved
  // variant produces.
  test('leaves every section in its accessible variant', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=alle`);

    // Kampagnenseite — a real nav with real links (`navigation`).
    await expect(page.locator(`${REGION} nav.section-nav`)).toHaveCount(1);
    await expect(page.locator(`${REGION} #sim-nav-menu a`)).toHaveCount(5);

    // Texte — plain German plus the easy-language disclosure (`sprache`, both
    // parts).
    await expect(page.locator(`${REGION} .easy-toggle`)).toHaveCount(1);
    await expect(page.locator(`${REGION} .body`)).not.toContainText('Purpose-driven');

    // Medien — alternative texts on all three post images (`alt`).
    expect(
      await page
        .locator(`${REGION} .post-image`)
        .evaluateAll((images) =>
          images.every((image) => ((image as HTMLImageElement).alt ?? '').trim().length > 0),
        ),
    ).toBe(true);

    // Event — the ramp beside the steps and the access list (`zugang`), the
    // programme as text (`einladung`), the interpreting note (`dolmetschung`).
    await expect(page.locator(`${REGION} .venue .ramp`)).toHaveCount(1);
    await expect(page.locator(`${REGION} ul.access`)).toHaveCount(1);
    await expect(page.locator(`${REGION} ul.programme`)).toHaveCount(1);
    await expect(page.locator(`${REGION} .sign-language`)).toHaveCount(1);

    // Spendenaufruf — the donation total as text (`fortschritt`), the countdown
    // in a live region (`countdown`), the amount as a number field
    // (`slider`), the carousel with its control (`karussell`).
    await expect(page.locator(`${REGION} .progress-text`)).toHaveCount(1);
    await expect(page.locator(`${REGION} .countdown-live`)).toHaveCount(1);
    await expect(page.locator(`${REGION} .amount-number`)).toHaveCount(1);
    await expect(page.locator(`${REGION} .carousel-toggle`)).toHaveCount(1);
  });

  // The bulk action is the same claim reached by pointer instead of by URL, and
  // it is the path most participants take. e2e/barrier-panel.spec.ts runs it on
  // the application process, where every barrier is simple; the parts are what
  // this page adds.
  test('is what the bulk action writes, and it comes back the same way', async ({ page }) => {
    await gotoRendered(page, PATH);

    await page.getByRole('button', { name: 'Alle Barrieren beheben' }).click();

    await expect(page).toHaveURL(/frei=alle/);
    for (const { key, checked, mixed } of await panelState(page)) {
      expect(checked, `checkbox \`${key}\` is ticked`).toBe(true);
      expect(mixed, `checkbox \`${key}\` is settled`).toBe(false);
    }

    await page.getByRole('button', { name: 'Alle Barrieren aktivieren' }).click();

    for (const { key, checked, mixed } of await panelState(page)) {
      expect(checked, `checkbox \`${key}\` is cleared`).toBe(false);
      expect(mixed, `checkbox \`${key}\` is settled`).toBe(false);
    }
    await expect(page.locator('.counter')).toHaveText(`Alle ${BARRIERS.length} Barrieren aktiv`);
  });
});

// docs/SPEC_v2.md slice 19: „Area summary names exactly the areas present in
// this scenario."
//
// CLAUDE.md rule 18 — the summary carries chapter 3's thesis, that barriers
// arise between departments rather than inside one. A sentence that named an
// area no barrier on this page belongs to would be a false claim about a real
// company's org chart; one that dropped an area would understate the point.
test.describe('The area summary (CLAUDE.md rule 18)', () => {
  /** The areas this scenario actually spans, in the order the panel meets them. */
  const areas = [...new Set(BARRIERS.map((barrier) => barrier.responsibleArea))];
  const labels = areas.map((area) => AREA_LABELS[area]);

  test('names every area the campaign spans, and no other', async ({ page }) => {
    await gotoRendered(page, PATH);

    const summary = page.locator('.area-summary');
    await expect(summary).toHaveText(
      `Diese ${BARRIERS.length} Barrieren stammen aus ${labels.length} Bereichen: ${labels.join(', ')}.`,
    );

    // And explicitly not the others: the assertion above would still pass if
    // `Personal` were somehow part of the joined list, but this says what the
    // sentence must not contain.
    const absent = Object.entries(AREA_LABELS)
      .filter(([area]) => !areas.includes(area as (typeof areas)[number]))
      .map(([, label]) => label);
    expect(absent.length).toBeGreaterThan(0);
    for (const label of absent) {
      await expect(summary).not.toContainText(label);
    }
  });

  // Every barrier names its area beside its checkbox, and the areas named there
  // are exactly the ones the summary counts. The two are computed separately in
  // the component, so a barrier whose area label went missing would leave the
  // summary intact.
  test('agrees with the area named on every single barrier', async ({ page }) => {
    await gotoRendered(page, PATH);

    // `.area` is rendered for a barrier and never for a part — the state badge
    // takes a `barrier` only in the two places that stand for a whole barrier
    // (frame/barrier-panel/…component.html) — so one per barrier is the count.
    const named = await page
      .locator('.panel .area')
      .evaluateAll((spans) =>
        spans.map((span) => (span.textContent ?? '').replace('Zuständiger Bereich:', '').trim()),
      );

    expect(named.length).toBe(BARRIERS.length);
    expect([...new Set(named)].sort()).toEqual([...labels].sort());
  });
});

// docs/SPEC_v2.md slice 19: „Deep link reproduces every state at default system
// settings." Every state, not one per section — so this runs the whole matrix,
// one page load each, and asks the panel what it made of the URL.
//
// What it compares against is the URL contract itself (core/url-state.ts), not
// a recorded expectation: a leaf switch is ticked exactly when the `frei` value
// resolves it, a combined parent exactly when all of its parts are resolved,
// and it shows `indeterminate` exactly while some but not all of them are.
// Restating those three rules here is the point — the assertion is what the
// panel is *supposed* to show, derived independently of the component that
// shows it.
//
// The rendered variant of each state is the business of the axe runs and the
// section suites in e2e/csr-campaign.spec.ts, which walk the same list.
test.describe('Deep links reproduce every tested state (docs/TESTING.md §12)', () => {
  for (const { name, url } of STATES) {
    test(`${name}: the panel matches what the URL resolves`, async ({ page }) => {
      await gotoRendered(page, url);
      const resolved = resolvedKeysOf(url);

      const expected = [
        ...BARRIERS.map((barrier) => {
          const keys = leafKeysOf(barrier);
          const settled = keys.filter((key) => resolved.has(key));
          return {
            key: barrier.urlKey,
            checked: settled.length === keys.length,
            mixed: settled.length > 0 && settled.length < keys.length,
          };
        }),
        ...PART_KEYS.map((key) => ({ key, checked: resolved.has(key), mixed: false })),
      ];

      const actual = await panelState(page);
      expect([...actual].sort((a, b) => a.key.localeCompare(b.key))).toEqual(
        [...expected].sort((a, b) => a.key.localeCompare(b.key)),
      );
    });
  }
});

// docs/SPEC_v2.md slice 19's „every axe-detectable barrier passes run 2 in both
// directions" is **not** asserted here. It was, briefly, and the check compared
// the content against a list of barrier keys written down in this file — so
// deleting a run 2 in e2e/csr-campaign.spec.ts left it green (code review of
// this slice). The run-2 cases there are generated from `automatedDetection`
// instead, which makes the coverage structural and this file's copy of it
// redundant.

/**
 * One deep link per section (docs/SPEC_v2.md slice 19: „Deep links across all
 * sections"), each with the marker that only its resolved variant produces.
 *
 * The barrier chosen per section is the one whose repair changes the *markup*
 * most visibly, so a state that failed to reproduce could not hide behind a
 * wording difference.
 */
const SECTION_LINKS: Array<{
  section: string;
  urlKey: string;
  marker: string;
  markerCount: number;
}> = [
  { section: 'Kampagnenseite', urlKey: 'navigation', marker: 'nav.section-nav a', markerCount: 5 },
  {
    section: 'Texte und Inhalte',
    urlKey: 'leichte-sprache',
    marker: '.easy-toggle',
    markerCount: 1,
  },
  { section: 'Medien', urlKey: 'alt', marker: '.post-image[alt]', markerCount: 3 },
  {
    section: 'Event und Podiumsdiskussion',
    urlKey: 'zugang',
    marker: '.venue .ramp',
    markerCount: 1,
  },
  { section: 'Spendenaufruf', urlKey: 'slider', marker: '.amount-number', markerCount: 1 },
];

// docs/TESTING.md §12, run across the five sections: reach the state by
// activating a panel control, read the URL, open it in a fresh page, and assert
// the DOM matches — same toggle positions, same rendered variant.
//
// „At default system settings", per §12's caveat: nothing here emulates a
// preference, and the two time-dependent barriers of the donation section are
// deliberately not the ones the states below toggle. The preference
// interactions are e2e/csr-campaign.spec.ts's business.
test.describe('Deep links into every section (docs/TESTING.md §12)', () => {
  for (const { section, urlKey, marker, markerCount } of SECTION_LINKS) {
    test(`${section}: the state reached by toggling \`${urlKey}\` reproduces from its URL`, async ({
      page,
    }) => {
      await gotoRendered(page, PATH);
      await expect(page.locator(`${REGION} ${marker}`)).toHaveCount(0);

      await boxFor(page, urlKey).click();

      // Web-first, on something the toggle actually changed: the accessible
      // variant of this section is now on the page.
      await expect(page.locator(`${REGION} ${marker}`)).toHaveCount(markerCount);

      const url = new URL(page.url());
      expect(url.searchParams.get('frei')).toBe(urlKey);
      const before = await panelState(page);

      const reopened = await page.context().newPage();
      await gotoRendered(reopened, `${url.pathname}${url.search}`);

      await expect(reopened.locator(`${REGION} ${marker}`)).toHaveCount(markerCount);
      // Same toggle positions, switch by switch — including the ones that must
      // still be *un*ticked, which is the half a „was anything resolved" check
      // would miss.
      expect(await panelState(reopened)).toEqual(before);

      // …and the other four sections are untouched in the reopened page: a
      // deep link that resolved more than its key names would be a state
      // nobody can get back to.
      for (const other of SECTION_LINKS.filter((entry) => entry.urlKey !== urlKey)) {
        await expect(reopened.locator(`${REGION} ${other.marker}`)).toHaveCount(0);
      }

      await reopened.close();
    });
  }
});
