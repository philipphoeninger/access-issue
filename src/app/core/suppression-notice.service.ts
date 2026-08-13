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
// Keyed, so that a component publishing on every change-detection pass replaces
// its own note instead of stacking copies of it, and so that a component can
// retract one when it goes away. The key is the barrier's `urlKey`: one note
// per barrier is the most the copy allows for (docs/UX-COPY.md §5.9 has one
// string per preference, each about one barrier).
//
// The first user is the campaign's `kontrast` barrier under `forced-colors`
// (docs/SPEC_v2.md slice 16); the carousel's `prefers-reduced-motion` note
// (slice 18) plugs into the same seam.
import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SuppressionNoticeService {
  private readonly byKey = signal<ReadonlyMap<string, string>>(new Map());

  /** Publication order, which is the order the bar renders them in. */
  readonly notes = computed<readonly string[]>(() => [...this.byKey().values()]);

  /**
   * Publish a note under `key`, or retract it by passing `undefined`.
   *
   * Retraction is not optional housekeeping. The service is root-provided and
   * outlives every scenario component: a note left behind by a page the user
   * has navigated away from would claim a barrier is suppressed on a page that
   * does not have that barrier — and a lecturer would take the screenshot.
   */
  publish(key: string, note: string | undefined): void {
    // `update`, deliberately, and not `set` over a value read with `byKey()`.
    // The only caller is a component effect, and reading the signal there would
    // make the effect depend on the very signal it writes: publish → signal
    // changes → effect re-runs → publish. That loop is not theoretical; it hung
    // the page in the first Playwright run of the forced-colors note. A write
    // creates no dependency, so `update` is the shape that cannot do it.
    this.byKey.update((current) => {
      // The same reference back means no change and no notification — a
      // component that publishes the same note on every change-detection pass
      // must not wake the frame each time.
      if (current.get(key) === note) {
        return current;
      }

      const next = new Map(current);
      if (note === undefined) {
        next.delete(key);
      } else {
        next.set(key, note);
      }
      return next;
    });
  }
}
