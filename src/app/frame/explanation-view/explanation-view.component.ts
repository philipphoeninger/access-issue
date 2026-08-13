// The explanation view — the dual channel (docs/ARCHITECTURE.md §5.4), and
// the reason a blind participant gets the same learning content as a sighted
// one. A sighted user experiences the barrier in the simulation; everyone
// reads what is broken, whom it excludes, what the norms say and how it is
// done accessibly, here in the frame.
//
// The decisions worth knowing before editing this file:
//
//  - **It lives in the frame, never inside the simulation region.** An
//    explanation rendered next to the barrier would be subject to that same
//    barrier — the failure mode of most "accessibility demo" tools
//    (docs/ARCHITECTURE.md §5.4). It is reachable and readable in every
//    barrier state.
//  - **Four rubrics, as question headings** (docs/UX-COPY.md §5.8). The
//    question form is deliberate: it names what the section answers and reads
//    as a sensible unit in a screen reader's heading list, which „Problem",
//    „Betroffene", „Normbezug", „Lösung" would not.
//  - **The standards rubric is never dropped.** A barrier with no standards
//    reference gets the rubric *answered* — five of the 27 barriers violate no
//    success criterion (docs/PRD.md §6.1, CLAUDE.md rule 19). Omitting the
//    section would read as an editorial oversight; saying so is the learning
//    content.
//  - **Standards render from structured data, never from prose**
//    (docs/PRD.md §8.1 F): criterion, level and title come off the
//    `StandardReference`.
//  - **Driven by the `erklaerung` parameter alone.** No local selection state:
//    the URL is the source of truth (docs/ARCHITECTURE.md §8, D2), so an
//    explanation is linkable — a lecturer can link to „warum das PDF ein
//    Problem ist", not just to the scenario.
//  - **It is the destination of „Was bedeutet das?".** Following that link
//    moves focus here, which scrolls the section into view; a toggle does
//    not, because focus belongs to the checkbox the user activated. See
//    `focusOnSelection` for how the two are told apart.
//
// This component reads barrier state, which is the narrow exception in
// docs/ARCHITECTURE.md §5.2: it reads state to render *text* — which barrier
// is selected, and whether it is currently active. Nothing about its own
// labelling, focusability or styling changes because a barrier is active.
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { BarrierStateService } from '../../core/barrier-state.service';
import { combinedBarrierParts, serialiseResolvedKeys } from '../../core/url-state';
import type {
  Barrier,
  BarrierExplanation,
  Scenario,
  StandardReference,
} from '../../models/domain.model';
import { AREA_LABELS } from '../area-labels';
import { STANDARD_LABELS } from '../standard-labels';

/**
 * What the view renders, flattened from either a `Barrier` or one part of a
 * combined barrier. Parts carry their own title, standards and prose but no
 * `responsibleArea` (docs/ARCHITECTURE.md §6), so a part inherits its
 * parent's area — the department whose decision created the barrier is a
 * property of the barrier, not of the half of it that is missing.
 */
interface Explained {
  name: string;
  area: string;
  resolved: boolean;
  standards: readonly StandardReference[];
  explanation: BarrierExplanation;
}

/** docs/UX-COPY.md §5.8 `explanation.currentlyActive` / `.currentlyResolved`. */
const STATE_LINES = {
  active: 'Diese Barriere ist gerade aktiv.',
  resolved: 'Diese Barriere ist behoben.',
} as const;

@Component({
  selector: 'app-explanation-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './explanation-view.component.html',
  styleUrl: './explanation-view.component.scss',
})
export class ExplanationViewComponent {
  private readonly barriers = inject(BarrierStateService);

  readonly scenario = input.required<Scenario>();

  /** The jump target of „Was bedeutet das?" — see `focusOnSelection`. */
  private readonly section = viewChild<ElementRef<HTMLElement>>('section');

  protected readonly headingId = 'explanation-heading';

  /**
   * Whether this scenario has anything to explain. False only for a scenario
   * that is `available` and has steps but no barriers yet — the state this
   * project passes through while content lands incrementally, and the one
   * BarrierPanelComponent.hasBarriers already guards for the same reason.
   * The empty state names the barrier panel as the place to choose from; on a
   * page whose panel offers nothing, that is an instruction nobody can
   * follow, so the section is suppressed rather than left standing empty.
   */
  protected readonly hasBarriers = computed(() => this.scenario().barriers.length > 0);

  /**
   * The selected barrier or part, or `undefined` for the empty state. An
   * unknown, stale or foreign `erklaerung` value never reaches this: it is
   * filtered by `parseExplainedKey` in core/url-state.ts and arrives here as
   * `undefined`, which is the empty state and not an error
   * (docs/ARCHITECTURE.md §17).
   */
  protected readonly selected = computed<Explained | undefined>(() => {
    const scenario = this.scenario();
    const key = this.barriers.explainedUrlKey(scenario);
    if (key === undefined) {
      return undefined;
    }

    for (const barrier of scenario.barriers) {
      if (barrier.urlKey === key) {
        return this.fromBarrier(scenario, barrier);
      }
      const part = this.partWithKey(barrier, key);
      if (part) {
        return {
          name: part.title,
          area: AREA_LABELS[barrier.responsibleArea],
          resolved: this.barriers.isResolved(scenario, part.urlKey),
          standards: part.standards,
          explanation: part.explanation,
        };
      }
    }
    return undefined;
  });

  /**
   * The resolved set as the `frei` parameter would spell it — a value that
   * changes exactly when a toggle lands. Used only to tell a toggle apart
   * from an explanation selection in `focusOnSelection`; through the shared
   * serialiser, so "did the state change" cannot drift from what the URL says.
   */
  private readonly resolvedSignature = computed(() => {
    const scenario = this.scenario();
    return serialiseResolvedKeys(this.barriers.resolvedKeys(scenario), scenario.barriers);
  });

  private previous: { key: string | undefined; resolved: string } | undefined;

  constructor() {
    effect(() => {
      const key = this.barriers.explainedUrlKey(this.scenario());
      const resolved = this.resolvedSignature();
      untracked(() => this.focusOnSelection(key, resolved));
    });
  }

  protected stateLine(explained: Explained): string {
    return explained.resolved ? STATE_LINES.resolved : STATE_LINES.active;
  }

  /** docs/UX-COPY.md §5.8 `explanation.responsibleArea`. */
  protected areaLine(explained: Explained): string {
    return `Zuständiger Bereich: ${explained.area}`;
  }

  protected standardLabel(standard: StandardReference): string {
    return STANDARD_LABELS[standard.standard];
  }

  /** docs/UX-COPY.md §5.8 `explanation.standardLevel`. Absent for norms that have no levels. */
  protected levelLabel(standard: StandardReference): string | undefined {
    return standard.level ? `Stufe ${standard.level}` : undefined;
  }

  protected standardKey(standard: StandardReference): string {
    return `${standard.standard}-${standard.criterion}`;
  }

  private fromBarrier(scenario: Scenario, barrier: Barrier): Explained {
    return {
      name: barrier.title,
      area: AREA_LABELS[barrier.responsibleArea],
      // A combined barrier with one part repaired reads as active, the same
      // way it counts as active in the simulation bar (docs/UX-COPY.md §5.6).
      // §5.8 has two state lines, not three, and that is the right pair: the
      // barrier does still stand.
      resolved: this.barriers.isBarrierResolved(scenario, barrier),
      standards: barrier.standards,
      explanation: barrier.explanation,
    };
  }

  /** Through the shared predicate in url-state.ts, never by reading `barrier.parts` here. */
  private partWithKey(barrier: Barrier, key: string) {
    const parts = combinedBarrierParts(barrier);
    if (!parts) {
      return undefined;
    }
    return parts.find((part) => part.urlKey === key);
  }

  /**
   * Moves focus to this section when the user has explicitly selected a
   * barrier — the destination behaviour of „Was bedeutet das?".
   *
   * The link has to arrive somewhere. It only merges a query parameter, so
   * without this the router changes the URL and nothing else: no scroll, no
   * focus move (FocusManager deliberately ignores same-path navigations), and
   * the section it opens sits below both columns, well past the fold on a
   * scenario page. A sighted user saw a link that appeared to do nothing; a
   * keyboard user's focus stayed on a link now scrolled off-screen. Focusing
   * the section fixes both at once, because `focus()` scrolls it into view —
   * the same pattern the skip links and the exit link use on `#panel` and
   * `#content`, and the reason this is `tabindex="-1"` rather than a router
   * fragment (a fragment would also have to enter the URL contract, which
   * docs/ARCHITECTURE.md §8 defines as `frei` and `erklaerung`, nothing else).
   *
   * The screen reader then reads the section on arrival, which is why there is
   * no live-region announcement here: focus and a polite region speaking the
   * same event talk over each other (§12.2).
   *
   * Three cases deliberately do not move focus:
   *
   *  - **The first render.** A deep link carrying `erklaerung` has not
   *    *changed* anything, and FocusManager has just put focus on the `h1`
   *    (docs/ARCHITECTURE.md §9). Stealing it from there would skip the page
   *    heading and the panel on every shared link.
   *  - **Anything that also moved a toggle.** Toggling selects the barrier
   *    implicitly (§8), and focus must stay on the checkbox the user
   *    activated (§12.2, docs/SPEC_v1.md slice 6). This is the case the
   *    `resolved` signature exists to recognise.
   *  - **A selection that cleared.** The bulk actions drop `erklaerung`
   *    (core/barrier-state.service.ts); jumping the user to an empty state
   *    they did not ask for would be worse than staying put.
   */
  private focusOnSelection(key: string | undefined, resolved: string): void {
    const previous = this.previous;
    this.previous = { key, resolved };

    if (!previous || previous.resolved !== resolved || key === undefined) {
      return;
    }
    if (key === previous.key) {
      return;
    }

    // Absent only for a scenario with no barriers, where the section is not
    // rendered at all — and then there is no link to have followed either.
    const section = this.section();
    if (section) {
      section.nativeElement.focus();
    }
  }
}
