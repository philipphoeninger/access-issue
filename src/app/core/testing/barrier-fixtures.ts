// Minimal, valid Barrier/Scenario fixtures for core/ unit tests
// (docs/TESTING.md §9). Deliberately generic rather than reusing the real
// application-process content, so these tests do not couple to editorial
// data that changes independently — and so a combined barrier is available
// to test, since no shipped scenario has one yet (the CSR video barrier is
// still a `status: 'planned'` stub, docs/SPEC_v1.md §3).
import type { Barrier, Scenario } from '../../models/domain.model';

/**
 * The group every fixture barrier belongs to unless a test says otherwise.
 * `makeScenario` declares a matching `BarrierGroup`, so a fixture scenario is
 * always contract-valid: every `groupId` resolves, and the panel finds its
 * barriers where the group says they are.
 */
export const FIXTURE_GROUP_ID = 'kampagne';

export function simpleBarrier(urlKey: string): Barrier {
  return {
    id: urlKey,
    urlKey,
    title: urlKey,
    shortTitle: urlKey,
    categories: ['visual'],
    affectedGroups: [],
    responsibleArea: 'it',
    groupId: FIXTURE_GROUP_ID,
    organisational: false,
    standards: [{ standard: 'WCAG_2_2', criterion: '1.1.1', title: urlKey }],
    explanation: { problem: 'Problem', affected: 'Betroffene', solution: 'Lösung' },
    automatedDetection: 'manual',
    contentStatus: 'placeholder',
  };
}

/** A combined barrier — ARCHITECTURE.md §8's own example: video / video-ut / video-transkript. */
export function combinedBarrier(urlKey: string, partUrlKeys: readonly string[]): Barrier {
  return {
    ...simpleBarrier(urlKey),
    parts: partUrlKeys.map((partUrlKey) => ({
      id: partUrlKey,
      urlKey: partUrlKey,
      title: partUrlKey,
      organisational: false,
      standards: [{ standard: 'WCAG_2_2', criterion: '1.1.1', title: partUrlKey }],
      explanation: { problem: 'Problem', affected: 'Betroffene', solution: 'Lösung' },
      contentStatus: 'placeholder',
    })),
  };
}

export function makeScenario(
  barriers: readonly Barrier[],
  overrides: Partial<Scenario> = {},
): Scenario {
  return {
    id: 'test-scenario',
    path: 'test',
    title: 'Testszenario',
    summary: '',
    status: 'available',
    steps: [],
    // docs/UX-COPY.md §5.6 `panel.groupLabel`. A one-group scenario names its
    // group rather than repeating the page `h1`, which is what a step title
    // would amount to when there is only one step.
    groups: [{ id: FIXTURE_GROUP_ID, title: 'Barrieren in diesem Schritt' }],
    barriers: [...barriers],
    ...overrides,
  };
}

// A fixed, representative set of simple barrier keys for the scenario-agnostic
// parser tests (docs/TESTING.md §9). These five are all still real
// application-process urlKeys, but this fixture deliberately does NOT track the
// scenario's full barrier list — the file header explains why it stays
// decoupled from editorial content. The application process now has eleven
// barriers (docs/PRD.md §6.1); the parser does not care how many, so this
// stays a small subset rather than growing with the content.
export const BEWERBUNG_BARRIERS: Barrier[] = ['pdf', 'sprache', 'labels', 'tastatur', 'fehler'].map(
  simpleBarrier,
);

export const VIDEO_BARRIERS: Barrier[] = [
  ...BEWERBUNG_BARRIERS,
  combinedBarrier('video', ['video-ut', 'video-transkript']),
];
