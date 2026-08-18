// The CSR campaign's tested state matrix (docs/TESTING.md §4), as data.
//
// It lived inside e2e/csr-campaign.spec.ts while the sections were being
// built, one slice at a time. Slice 19 (docs/SPEC_v2.md) is the point where the
// matrix stops being one file's private list: the integration suite runs deep
// links and the whole-scenario claims over the same states the axe runs use,
// and e2e/csr-integration.spec.ts asserts that this list still covers every
// barrier the content declares. Two copies of a state matrix would let one of
// them fall behind the content silently, which is the failure this file exists
// to prevent — so it is declared once, here, and imported.
//
// **The matrix may grow, never shrink** (docs/SPEC_v2.md §9, and the
// maintainer's instruction for this slice): if the suite outgrows its budget,
// the answer is to shard it across CI jobs, not to test fewer states.
const PATH = '/szenario/csr-kampagne';

export const CAMPAIGN_PATH = PATH;

/**
 * The media section's own matrix: **all eight combinations** of its three
 * barriers, which docs/SPEC_v2.md slice 16 asks for by name („All eight tested
 * states of this section pass runs 1 and 3").
 *
 * That is more than the n + 2 of docs/TESTING.md §4, which puts this section at
 * five. The two documents disagree, and this file follows the spec: eight
 * states of a three-barrier section cost three extra page loads, and the three
 * barriers share a component and a stylesheet — the one situation §4's
 * „barriers are implemented independently" argument does not cover on its face.
 * §4's rule stands everywhere else; do not read this as a licence to power-set
 * the donation section's four.
 */
export const MEDIA_KEYS = ['alt', 'emoji', 'kontrast'] as const;

export const MEDIA_STATES: Array<{ resolved: readonly string[]; url: string }> = [];
for (let mask = 0; mask < 8; mask++) {
  const resolved = MEDIA_KEYS.filter((_key, index) => (mask & (1 << index)) !== 0);
  MEDIA_STATES.push({
    resolved,
    url: resolved.length === 0 ? PATH : `${PATH}?frei=${resolved.join(',')}`,
  });
}

/**
 * docs/TESTING.md §4 — the tested states of this page. Grows with the
 * barriers, and a combined barrier contributes its partial-repair states as
 * well: those are where the teaching happens, and they are the states a
 * repair-layer implementation could not produce at all.
 *
 * The media section contributes its eight (see `MEDIA_STATES`). Its
 * „nothing resolved" state is the page default and already the first row, so
 * seven are added. `?frei=alt,emoji,kontrast` is not the same URL as
 * `?frei=alle` and stays a row of its own: the media section is repaired while
 * the navigation and the language barrier still stand.
 */
export const STATES: Array<{ name: string; url: string }> = [
  { name: 'all barriers active (default)', url: PATH },
  { name: 'all barriers resolved', url: `${PATH}?frei=alle` },
  { name: 'only `navigation` resolved', url: `${PATH}?frei=navigation` },
  { name: 'only `sprache` resolved (both parts)', url: `${PATH}?frei=sprache` },
  { name: 'partial — only `jargon` resolved', url: `${PATH}?frei=jargon` },
  { name: 'partial — only `leichte-sprache` resolved', url: `${PATH}?frei=leichte-sprache` },
  ...MEDIA_STATES.filter(({ resolved }) => resolved.length > 0).map(({ resolved, url }) => ({
    name: `media — ${resolved.join(' + ')} resolved`,
    url,
  })),
  // The event section of slice 17 — three parts, and therefore **all six**
  // partial-repair states, which is what docs/TESTING.md §4 budgets for it
  // („5 + 6 partial"). They are not a power set of the section: the fully
  // resolved and fully active states are the two rows at the top of this list,
  // and the six below are exactly the one- and two-part repairs. §4 spends them
  // here on purpose — „a three-part combined barrier has six of them, and they
  // are where the teaching happens".
  { name: 'only `event` resolved (all three parts)', url: `${PATH}?frei=event` },
  { name: 'partial — only `einladung` resolved', url: `${PATH}?frei=einladung` },
  { name: 'partial — only `dolmetschung` resolved', url: `${PATH}?frei=dolmetschung` },
  { name: 'partial — only `zugang` resolved', url: `${PATH}?frei=zugang` },
  {
    name: 'partial — `einladung` + `dolmetschung` resolved',
    url: `${PATH}?frei=einladung,dolmetschung`,
  },
  // The state docs/UX-COPY.md §9.6 names as the argument for coupling the three:
  // a readable invitation to a building nobody can enter.
  {
    name: 'partial — `einladung` + `zugang` resolved',
    url: `${PATH}?frei=einladung,zugang`,
  },
  {
    name: 'partial — `dolmetschung` + `zugang` resolved',
    url: `${PATH}?frei=dolmetschung,zugang`,
  },
  // The one crossing between two sections, and the only state in which the
  // venue drawing carries a name at all: `alt` is what gives it `role="img"`
  // and a `<title>` (scenarios/csr-campaign/campaign-event).
  { name: '`zugang` resolved with alternative texts', url: `${PATH}?frei=zugang,alt` },
  // The donation section of slice 18 — four independent barriers, so exactly
  // the n + 2 of docs/TESTING.md §4: each one resolved on its own, with the
  // fully active and fully resolved rows already at the top of this list. Not a
  // power set, and §4 says so in as many words: sixteen states of four barriers
  // that genuinely do not touch each other buy nothing the four rows below do
  // not already buy.
  { name: 'only `fortschritt` resolved', url: `${PATH}?frei=fortschritt` },
  { name: 'only `countdown` resolved', url: `${PATH}?frei=countdown` },
  { name: 'only `slider` resolved', url: `${PATH}?frei=slider` },
  { name: 'only `karussell` resolved', url: `${PATH}?frei=karussell` },
];
