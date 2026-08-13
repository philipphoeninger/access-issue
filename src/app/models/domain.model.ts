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
 * `csr` is the sixth area and the newest. It was held back deliberately while
 * docs/UX-COPY.md §5.6 and docs/PRD.md §6.2 already named it: an area in the
 * union that no barrier carries is an area the panel's summary line can never
 * name. It arrived with the campaign's event barrier (docs/SPEC_v2.md slice
 * 17), which is the first — and so far only — barrier assigned to it, and
 * docs/ARCHITECTURE.md §6 records it as part of the type from that point on.
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
  'csr',
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
  /**
   * Exactly what it means on `Barrier` below, and it had to be added here for
   * the campaign's event barrier (docs/SPEC_v2.md slice 17): two of its three
   * parts — no sign-language interpreting offered, no access information for a
   * venue with steps — violate no success criterion, while the third (the
   * invitation as a PDF-only download) violates two.
   *
   * **A part carries its own flag; it does not inherit the parent's.** That is
   * the whole shape of this barrier: a combined barrier that is technical in
   * one part and organisational in the others. Inheriting would have forced
   * the choice between claiming a criterion for parts that break none and
   * dropping the references from the part that does.
   *
   * Note what is *not* per part: `responsibleArea`. The department whose
   * decision created a barrier is a property of the barrier, not of the half
   * of it that is missing, and no view renders an area for a part
   * (frame/barrier-panel renders it for barriers only). docs/UX-COPY.md §5.6
   * lists an area per part in its label table, which is editorial context for
   * whoever writes the prose rather than a field to model.
   */
  organisational: boolean;
  /** May be empty if and only if `organisational` is true. */
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
   * Panel grouping key — the `id` of one of the scenario's `groups`
   * (docs/ARCHITECTURE.md §6, §12.1.1). For multi-step scenarios the groups
   * mirror the steps one-to-one; for single-page scenarios they mirror the
   * page's sections. One mechanism, not two: the panel's structure is declared
   * here, not derived from the routing structure, because the two only
   * coincided in the application process (docs/SPEC_v2.md §4.1).
   *
   * A `groupId` that matches no declared group would make the barrier vanish
   * from the panel — a barrier nobody can switch off. content/data-contract.spec.ts
   * asserts that cannot happen.
   */
  groupId: string;
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
}

/**
 * One `fieldset` in the barrier panel (docs/ARCHITECTURE.md §12.1.1). Groups
 * are declared per scenario and referenced by `Barrier.groupId`.
 */
export interface BarrierGroup {
  id: string;
  /** Panel heading and, for single-page scenarios, the section anchor label. */
  title: string;
  /**
   * Anchor target inside the simulation region, single-page scenarios only.
   * Carries the `sim-` prefix like every other id in the region
   * (docs/ARCHITECTURE.md §5.6 rule 2). A multi-step scenario leaves this
   * undefined: its groups are steps, and a step is reached by navigating, not
   * by jumping within the page.
   *
   * **The element it names must carry `tabindex="-1"`.** A heading is not
   * focusable, so a jump to one scrolls the page and leaves focus behind —
   * useless to the screen-reader user the link exists for. e2e/barrier-panel
   * asserts it for every declared anchor.
   */
  anchorId?: string;
}

export interface Scenario {
  id: string;
  path: string;
  title: string;
  summary: string;
  status: 'available' | 'planned';
  steps: ScenarioStep[]; // single-element array for one-page scenarios
  /**
   * Panel groups, in panel order. Empty only for a `planned` stub — an
   * available scenario with barriers must declare the groups they name
   * (content/data-contract.spec.ts).
   */
  groups: BarrierGroup[];
  barriers: Barrier[];
}
