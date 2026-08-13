// Maps `automatedDetection: 'axe'` barriers to the axe-core rule id that
// proves the barrier is genuinely detectable (docs/TESTING.md §5, run 2).
//
// docs/TESTING.md §5 documents this fixture at `e2e/fixtures/expected-
// violations.ts`, owned by the Playwright suite. It lives here instead so that
// it sits with the content it maps to and so the data contract test
// (docs/TESTING.md §8, "every axe barrier has a fixture entry") can run as a
// Karma unit test. The Playwright suite reads it from here —
// `expectedRuleFor()` in e2e/support/axe-runs.ts is the only way run 2 gets a
// rule id, so there is exactly one copy and no way for the two layers to
// disagree about which rule proves which barrier.
//
// **Keyed by scenario path, then by `Barrier.id`.** It was a flat map on
// `Barrier.id` until docs/SPEC_v2.md slice 15, which added the campaign's
// `sprache` barrier — the first id that exists in two scenarios. Nothing
// guarantees ids are unique across scenarios and nothing should: `id` is
// scoped by the scenario that declares it everywhere else in this application
// (ScenarioRegistry.getBarrier takes a scenario path first). A flat map here
// would have let one entry answer for two different barriers, with the data
// contract's "an entry exists" check passing for both — the wrong rule
// asserted for one of them, and no test saying so.
export const AXE_RULE_FIXTURES: Record<string, Record<string, string>> = {
  bewerbung: {
    // Step 1: salary/benefits as an unlabelled image (docs/SPEC_v1.md slice 7).
    grafik: 'image-alt',
    // Step 2: form fields whose visible label is not associated (slice 8).
    labels: 'label',
    // Step 4: confirmation details trapped in an image signature with no alt
    // text (docs/SPEC_v1.md slice 10 — 'axe' when the image lacks alt).
    bestaetigung: 'image-alt',
  },
  'csr-kampagne': {
    // Media section: the three post images without `alt` (docs/SPEC_v2.md
    // slice 16).
    alt: 'image-alt',
    // Media section: the overlay caption at 2.92:1. axe can only compute a
    // contrast ratio when it knows the background colour, which is why the
    // caption sits on an opaque band rather than directly on the image —
    // scenarios/csr-campaign/campaign-media/ carries the full reasoning.
    kontrast: 'color-contrast',
  },
};
