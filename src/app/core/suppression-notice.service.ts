// The notes the simulation bar shows when a system preference has overridden a
// barrier (docs/UX-COPY.md §5.9, docs/ARCHITECTURE.md §5.5, CLAUDE.md rule 9).
//
// **Detection belongs to the barrier, rendering belongs to the frame.** Only
// the component that implements a barrier knows what the preference took away
// and what would otherwise be on screen; only the simulation bar may say it,
// because there is exactly one place such a note appears
// (frame/simulation-region/simulation-bar). This service is the seam between
// the two, and it is the whole of it: a keyed set of strings, published by the
// simulation, read by the frame.
//
// This is not the frame reading barrier state (CLAUDE.md rule 4). Nothing about
// the bar's semantics, labelling or focusability changes here — it renders one
// more paragraph, the same way it renders the counter.
//
// **Keyed by scenario path *and* urlKey**, the way every other lookup in this
// application is scoped (ScenarioRegistry.getBarrier, expectedRuleFor,
// AXE_RULE_FIXTURES). A `urlKey` is unique within its scenario and nowhere
// else: `sprache` already exists in both the application process and the
// campaign, and docs/PRD.md §6.3 has a second contrast barrier coming in the
// procurement scenario, which will quite reasonably want the key `kontrast`
// that the campaign already uses. Keyed on the bare urlKey, that barrier's note
// would overwrite this one's, and — worse — one component's retraction on
// destroy would silently clear the other's note. Slice 15 fixed exactly this
// shape in content/axe-rule-fixtures.ts; there is no reason to rebuild it here.
//
// The pairing is also what lets the frame ask a scoped question: ScenarioPage
// renders the notes *of its own scenario*, so a note left behind by any future
// bug cannot surface on a page whose barriers it does not describe.
//
// One note per barrier is the most the copy allows for (docs/UX-COPY.md §5.9
// has one string per preference, each about one barrier).
//
// The first user is the campaign's `kontrast` barrier under `forced-colors`
// (docs/SPEC_v2.md slice 16); the carousel's `prefers-reduced-motion` note
// (slice 18) plugs into the same seam.
import { Injectable, computed, signal } from '@angular/core';

/** One published note, with the barrier it is about. */
export interface SuppressionNotice {
  scenarioPath: string;
  urlKey: string;
  note: string;
}

/**
 * Map key for the pair. Both halves match `/^[a-z0-9-]+$/`
 * (content/data-contract.spec.ts asserts it for urlKeys and group ids, and
 * scenario paths are route segments of the same shape), so a `/` separator
 * cannot be ambiguous — no scenario path or urlKey can contain one.
 */
function keyOf(scenarioPath: string, urlKey: string): string {
  return `${scenarioPath}/${urlKey}`;
}

@Injectable({ providedIn: 'root' })
export class SuppressionNoticeService {
  private readonly byKey = signal<ReadonlyMap<string, SuppressionNotice>>(new Map());

  /** Every published note, in publication order. */
  readonly all = computed<readonly SuppressionNotice[]>(() => [...this.byKey().values()]);

  /**
   * Publish a note for one barrier of one scenario, or retract it by passing
   * `undefined`.
   *
   * Retraction is not optional housekeeping. The service is root-provided and
   * outlives every scenario component: a note left behind by a page the user
   * has navigated away from would claim a barrier is suppressed on a page that
   * does not have that barrier — and a lecturer would take the screenshot.
   */
  publish(scenarioPath: string, urlKey: string, note: string | undefined): void {
    const key = keyOf(scenarioPath, urlKey);

    // `update`, deliberately, and not `set` over a value read with `byKey()`.
    // The only caller is a component effect, and reading the signal there would
    // make the effect depend on the very signal it writes: publish → signal
    // changes → effect re-runs → publish. That loop is not theoretical; it hung
    // the page in the first Playwright run of the forced-colors note. A write
    // creates no dependency, so `update` is the shape that cannot do it.
    this.byKey.update((current) => {
      const existing = current.get(key);
      // The same reference back means no change and no notification — a
      // component that publishes the same note on every change-detection pass
      // must not wake the frame each time.
      if (existing === undefined ? note === undefined : existing.note === note) {
        return current;
      }

      const next = new Map(current);
      if (note === undefined) {
        next.delete(key);
      } else {
        next.set(key, { scenarioPath, urlKey, note });
      }
      return next;
    });
  }
}
