// Minimal, valid Barrier/Scenario fixtures for core/ unit tests
// (docs/TESTING.md §9). Deliberately generic rather than reusing the real
// application-process content, so these tests do not couple to editorial
// data that changes independently — and so a combined barrier is available
// to test, since no shipped scenario has one yet (the CSR video barrier is
// still a `status: 'planned'` stub, docs/SPEC_v1.md §3).
import type { Barrier, Scenario } from '../../models/domain.model';

export function simpleBarrier(urlKey: string): Barrier {
  return {
    id: urlKey,
    urlKey,
    title: urlKey,
    shortTitle: urlKey,
    categories: ['visual'],
    affectedGroups: [],
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
    barriers: [...barriers],
    ...overrides,
  };
}

/** Mirrors the real application-process scenario's five simple barriers (urlKeys only). */
export const BEWERBUNG_BARRIERS: Barrier[] = ['pdf', 'sprache', 'labels', 'tastatur', 'fehler'].map(
  simpleBarrier,
);

export const VIDEO_BARRIERS: Barrier[] = [
  ...BEWERBUNG_BARRIERS,
  combinedBarrier('video', ['video-ut', 'video-transkript']),
];
