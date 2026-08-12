// Maps `automatedDetection: 'axe'` barriers to the axe-core rule id that
// proves the barrier is genuinely detectable (docs/TESTING.md §5, run 2).
//
// docs/TESTING.md §5 documents this fixture at `e2e/fixtures/expected-
// violations.ts`, owned by the Playwright suite. That directory does not
// exist yet — Playwright is wired up starting with slice 3/4
// (docs/SPEC_v1.md §17), once the simulation region exists. Keyed by
// `Barrier.id` so it lives with the content it maps to and the data contract
// test (docs/TESTING.md §8, "every axe barrier has a fixture entry") can run
// as a Karma unit test today. When the Playwright suite is wired up, either
// import this map from `e2e/fixtures/expected-violations.ts` or move it
// there outright — do not maintain two copies.
export const AXE_RULE_FIXTURES: Record<string, string> = {
  // Step 1: salary/benefits as an unlabelled image (docs/SPEC_v1.md slice 7).
  grafik: 'image-alt',
  // Step 2: form fields whose visible label is not associated (slice 8).
  labels: 'label',
  // Step 4: confirmation details trapped in an image signature with no alt
  // text (docs/SPEC_v1.md slice 10 — 'axe' when the image lacks alt).
  bestaetigung: 'image-alt',
};
