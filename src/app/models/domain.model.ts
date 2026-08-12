// Domain model — verbatim from docs/ARCHITECTURE.md §6, plus `contentStatus`
// (docs/SPEC_v1.md §4.1). Do not add fields a component would not read; see
// ARCHITECTURE.md §6 note on the removed `implementation` field for why.

export type DisabilityCategory = 'visual' | 'auditory' | 'motor' | 'cognitive' | 'situational';

/**
 * The business area whose decision created the barrier. Central to the module's
 * message (docs/PRD.md §6.0): barriers arise between departments, not inside one.
 * Rendered in the panel so the user sees that resolving a scenario takes several
 * areas, not one.
 *
 * The five areas are verbatim from docs/ARCHITECTURE.md §6. Note the doc
 * discrepancy for later: docs/UX-COPY.md §5.6 and docs/PRD.md §6.3 introduce a
 * sixth label, `CSR`, for one CSR-campaign barrier. That scenario is still a
 * `status: 'planned'` stub with no barriers, so nothing references it yet; the
 * type stays exactly as ARCHITECTURE.md §6 specifies until CSR content lands and
 * the docs are reconciled.
 *
 * Written as a `const` array with the type derived from it, rather than as the
 * bare union in ARCHITECTURE.md §6. The type is identical; the array is what
 * makes the "every barrier has a valid responsibleArea" contract test
 * (docs/TESTING.md §8) possible at all, since a bare union leaves nothing to
 * check at runtime — and runtime is where it matters if content ever moves to
 * JSON (docs/ARCHITECTURE.md §13 migration path).
 */
export const RESPONSIBLE_AREAS = [
  'personal',
  'kommunikation',
  'it',
  'beschaffung',
  'management',
] as const;

export type ResponsibleArea = (typeof RESPONSIBLE_AREAS)[number];

export type Standard = 'WCAG_2_2' | 'BITV_2_0' | 'EN_301_549' | 'BFSG';

/**
 * Editorial state. 'placeholder' text is written by engineering as scaffolding
 * and must be replaced by WERTE.IT before release (docs/SPEC_v1.md §4.1).
 */
export type ContentStatus = 'placeholder' | 'approved';

export interface StandardReference {
  standard: Standard;
  /** e.g. '1.3.1', '§ 3 Abs. 1' */
  criterion: string;
  level?: 'A' | 'AA' | 'AAA';
  /** German title, editorial */
  title: string;
  url?: string;
}

export interface BarrierExplanation {
  problem: string; // what is wrong
  affected: string; // who it affects and how
  solution: string; // what the accessible implementation looks like
}

/** A sub-aspect of a combined barrier (PRD §6.4). */
export interface BarrierPart {
  id: string;
  urlKey: string;
  title: string;
  standards: StandardReference[];
  explanation: BarrierExplanation;
  contentStatus: ContentStatus;
}

/**
 * Whether an automated tool can detect this barrier when it is active.
 * Consumed by the test layer (docs/TESTING.md §5) to decide which barriers get
 * an axe-based positive assertion and which are manual-only.
 */
export type AutomatedDetection = 'axe' | 'manual';

export interface Barrier {
  id: string;
  /** Short, stable, human-editable key used in the URL. */
  urlKey: string;
  title: string;
  shortTitle: string; // panel label
  categories: DisabilityCategory[];
  affectedGroups: string[];
  responsibleArea: ResponsibleArea;
  /**
   * True when the barrier is an organisational omission rather than a technical
   * defect — no missing labels, no failing contrast, nothing a checker could see.
   * Examples: no named contact person, no note that adjustments are possible,
   * no accessibility criteria in a tender.
   *
   * These barriers legitimately have an EMPTY `standards` array, and that is the
   * point: a WCAG-conformant page can still exclude people. A model that forced
   * every barrier to cite a criterion would quietly teach that accessibility and
   * conformance are the same thing (docs/PRD.md §6.1, docs/ARCHITECTURE.md §6).
   */
  organisational: boolean;
  /** May be empty if and only if `organisational` is true. */
  standards: StandardReference[];
  explanation: BarrierExplanation;
  /** Present only for combined barriers; each part toggles independently. */
  parts?: BarrierPart[];
  automatedDetection: AutomatedDetection;
  contentStatus: ContentStatus;
}

export interface ScenarioStep {
  id: string;
  path: string; // route segment
  title: string;
  barrierIds: string[]; // barriers surfaced in this step
}

export interface Scenario {
  id: string;
  path: string;
  title: string;
  summary: string;
  status: 'available' | 'planned';
  steps: ScenarioStep[]; // single-element array for one-page scenarios
  barriers: Barrier[];
}
