// Signal-derived, navigation-driven barrier state (docs/ARCHITECTURE.md §7,
// ADR-1). Holds no state of its own: every read re-derives from the current
// query params via url-state.ts, and every write navigates rather than
// mutates (D2, ARCHITECTURE.md §8). `replaceUrl: true` on every method here —
// step navigation (a different concern, built with the app shell in slice 3)
// is the only thing that pushes (ARCHITECTURE.md §10).
//
// Deviation from the ARCHITECTURE.md §7 sketch: methods take the `Scenario`
// explicitly instead of the service inferring "the current scenario" from
// the route tree. This service is `providedIn: 'root'`, so the `ActivatedRoute`
// it injects is the *root* route — its queryParamMap is shared across the
// whole tree (query params aren't nested, so that part of the sketch holds
// exactly), but its path params/data are not, and routing (slice 3) has not
// yet defined a contract for exposing "current scenario" through route data.
// Taking the scenario explicitly also matches the precedent already set by
// ScenarioRegistry, whose lookups all take an explicit `scenarioPath` rather
// than inferring one (core/scenario-registry.service.ts).
//
// Coverage note: no `?.`/`??` in this file either, same reasoning as
// url-state.ts.
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import type { Barrier, Scenario } from '../models/domain.model';
import {
  RESOLVE_ALL_KEY,
  combinedBarrierPartUrlKeys,
  explanationUrlKeys,
  parseExplainedKey,
  parseResolvedKeys,
  serialiseResolvedKeys,
} from './url-state';

@Injectable({ providedIn: 'root' })
export class BarrierStateService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });

  private frei(): string | null {
    return this.queryParamMap().get('frei');
  }

  private erklaerung(): string | null {
    return this.queryParamMap().get('erklaerung');
  }

  /** Leaf urlKeys (combined-barrier parts, not the parent sugar key) resolved to the accessible variant. */
  resolvedKeys(scenario: Scenario): ReadonlySet<string> {
    return parseResolvedKeys(this.frei(), scenario.barriers);
  }

  isResolved(scenario: Scenario, urlKey: string): boolean {
    return this.resolvedKeys(scenario).has(urlKey);
  }

  /** A combined barrier is resolved only once every one of its parts is (ARCHITECTURE.md §6). */
  isBarrierResolved(scenario: Scenario, barrier: Barrier): boolean {
    const partKeys = combinedBarrierPartUrlKeys(barrier);
    if (partKeys) {
      const resolved = this.resolvedKeys(scenario);
      return partKeys.every((key) => resolved.has(key));
    }
    return this.isResolved(scenario, barrier.urlKey);
  }

  /**
   * How many of the scenario's barriers still stand. A combined barrier with
   * one part repaired counts as active, because it does still stand — that is
   * the whole didactic point of the combined case (docs/UX-COPY.md §5.6), and
   * it is a judgement call a later refactor could silently invert. It lives
   * here rather than in the simulation bar because two callers now need the
   * same number: the bar renders it, and the panel speaks it in the
   * announcements of docs/UX-COPY.md §5.7. Two independent counts would be
   * one refactor away from disagreeing on screen.
   *
   * This is not a second counter. There is exactly one counter in the
   * application, in the simulation bar (CLAUDE.md rule 17); the panel renders
   * no number of its own.
   */
  activeBarrierCount(scenario: Scenario): number {
    return scenario.barriers.filter((barrier) => !this.isBarrierResolved(scenario, barrier)).length;
  }

  /** urlKey currently shown in the explanation view; `undefined` for the empty state. */
  explainedUrlKey(scenario: Scenario): string | undefined {
    return parseExplainedKey(this.erklaerung(), scenario.barriers);
  }

  /**
   * Toggles one urlKey. A combined barrier's own urlKey toggles every part
   * together, in lockstep (resolves all if any is active, activates all if
   * all are resolved); any other key — a simple barrier, or a single part —
   * toggles alone, which is the same lockstep rule applied to a one-key list.
   * Also selects the toggled key for the explanation view: implicit
   * selection (ARCHITECTURE.md §8) — only when the key is a genuine
   * explanation target for this scenario, the same guarantee `frei` gets
   * from serialiseResolvedKeys (url-state.ts: "a stale or foreign key can
   * never leak into a freshly written URL").
   *
   * Returns the navigation's promise so a caller can act on the state the
   * write produced rather than on a prediction of it — the barrier panel
   * awaits it before announcing, which keeps the toggle rule in this one
   * place (docs/UX-COPY.md §5.7).
   */
  toggle(scenario: Scenario, urlKey: string): Promise<boolean> {
    const partKeys = this.combinedBarrierPartKeys(scenario, urlKey);
    const keys = partKeys ? partKeys : [urlKey];
    const resolved = new Set(this.resolvedKeys(scenario));

    const allResolved = keys.every((key) => resolved.has(key));
    for (const key of keys) {
      if (allResolved) {
        resolved.delete(key);
      } else {
        resolved.add(key);
      }
    }

    const serialised = serialiseResolvedKeys(resolved, scenario.barriers);
    const queryParams: Record<string, string | null> = {
      frei: serialised === '' ? null : serialised,
    };
    if (explanationUrlKeys(scenario.barriers).has(urlKey)) {
      queryParams['erklaerung'] = urlKey;
    }
    return this.navigate(queryParams);
  }

  /**
   * `panel.resolveAll` — every barrier becomes accessible. Takes no scenario:
   * `alle` is a scenario-agnostic sentinel in the `frei` grammar itself
   * (ARCHITECTURE.md §8), resolved against whichever scenario's barriers a
   * later `parseResolvedKeys` call is given. Clears `erklaerung`: a bulk
   * action is not "about" any one barrier, so leaving a previous explanation
   * selected in the URL would misrepresent it as the reason for the change.
   */
  resolveAll(): Promise<boolean> {
    return this.navigate({ frei: RESOLVE_ALL_KEY, erklaerung: null });
  }

  /** `panel.activateAll` — every barrier becomes active again (absent `frei`); also clears `erklaerung`. */
  resetAll(): Promise<boolean> {
    return this.navigate({ frei: null, erklaerung: null });
  }

  private combinedBarrierPartKeys(
    scenario: Scenario,
    urlKey: string,
  ): readonly string[] | undefined {
    for (const barrier of scenario.barriers) {
      if (barrier.urlKey === urlKey) {
        return combinedBarrierPartUrlKeys(barrier);
      }
    }
    return undefined;
  }

  private navigate(queryParams: Record<string, string | null>): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
