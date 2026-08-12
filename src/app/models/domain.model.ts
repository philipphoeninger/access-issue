// Domain model — verbatim from docs/ARCHITECTURE.md §6, plus `contentStatus`
// (docs/SPEC_v1.md §4.1). Do not add fields a component would not read; see
// ARCHITECTURE.md §6 note on the removed `implementation` field for why.

export type DisabilityCategory = 'visual' | 'auditory' | 'motor' | 'cognitive' | 'situational';

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
