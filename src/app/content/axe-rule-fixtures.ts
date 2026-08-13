// Maps `automatedDetection: 'axe'` barriers to the axe-core rule id that
// proves the barrier is genuinely detectable (docs/TESTING.md §5, run 2).
//
// docs/TESTING.md §5 documents this fixture at `e2e/fixtures/expected-
// violations.ts`, owned by the Playwright suite. It lives here instead, keyed
// by `Barrier.id`, so that it sits with the content it maps to and so the data
// contract test (docs/TESTING.md §8, "every axe barrier has a fixture entry")
// can run as a Karma unit test. The Playwright suite reads it from here —
// `expectedRuleFor()` in e2e/support/axe-runs.ts is the only way run 2 gets a
// rule id, so there is exactly one copy and no way for the two layers to
// disagree about which rule proves which barrier.
export const AXE_RULE_FIXTURES: Record<string, string> = {
  // Step 1: salary/benefits as an unlabelled image (docs/SPEC_v1.md slice 7).
  grafik: 'image-alt',
  // Step 2: form fields whose visible label is not associated (slice 8).
  labels: 'label',
  // Step 4: confirmation details trapped in an image signature with no alt
  // text (docs/SPEC_v1.md slice 10 — 'axe' when the image lacks alt).
  bestaetigung: 'image-alt',
};
