// The barrier panel — the control surface, and the one component that has to
// be exemplary because it teaches by example (docs/SPEC_v1.md slice 5).
//
// The decisions worth knowing before editing this file:
//
//  - **Checkboxes throughout, never slide toggles** (docs/ARCHITECTURE.md
//    §12.1). `role="switch"` does not accept `aria-checked="mixed"`, so the
//    indeterminate parent of a combined barrier would have been an ARIA
//    violation built into the component that must not have one.
//  - **Labels name the accessible state, not the action** (docs/UX-COPY.md
//    §4): „Formularfelder mit Beschriftungen", ticked = that state holds.
//    Buttons are the opposite — „Alle Barrieren beheben" names an action.
//  - **Grouped by step, labelled by area** (docs/ARCHITECTURE.md §12.1.1).
//    Grouping by area instead would scatter the barriers of the screen the
//    user is looking at across four groups. The area message is carried by
//    the summary line under the panel instead. There is deliberately no area
//    filter: hiding other departments' barriers is the exact reflex the
//    module argues against.
//  - **No `<form>`, no submit control, no counter of its own.** Changes apply
//    instantly, and the only counter in the application is the simulation
//    bar's (docs/UX-COPY.md §5.6). Two counters on one screen turn „1 von 5
//    behoben" plus „4 von 5 aktiv" into an arithmetic exercise, for exactly
//    the group whose cognitive load the module is about.
//  - **Every change is announced** through the frame's single live region
//    (docs/UX-COPY.md §5.7) — the mitigation for the one drawback of
//    checkboxes, which read as "pending until submitted" to some users.
//  - **Focus stays where the user put it.** Toggling navigates; the panel
//    re-renders from the URL and the simulation re-renders with it, but
//    nothing here moves focus (docs/ARCHITECTURE.md §12.2). `@for` tracks by
//    barrier id so the activated checkbox is the same DOM element afterwards.
//
// This component reads barrier state, which is the narrow exception in
// docs/ARCHITECTURE.md §5.2: state is read to render *text* and checkbox
// state. Nothing about the panel's own labelling, focusability or styling
// changes because a barrier is active.
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule, type MatCheckbox } from '@angular/material/checkbox';
import { Announcer } from '../../core/announcer.service';
import { BarrierStateService } from '../../core/barrier-state.service';
import { combinedBarrierParts } from '../../core/url-state';
import type { Barrier, BarrierPart, Scenario, ScenarioStep } from '../../models/domain.model';
import { VisuallyHidden } from '../../shared/visually-hidden.directive';
import { AREA_LABELS } from '../area-labels';

/** The three-way state coding of docs/DESIGN.md §3.3 — text, symbol and colour, never colour alone. */
export type BarrierDisplayState = 'active' | 'partial' | 'resolved';

interface PanelGroup {
  id: string;
  legend: string;
  barriers: readonly Barrier[];
}

/** docs/UX-COPY.md §5.6 `panel.stateActive` / `.stateResolved` / `.statePartial`. */
const STATE_LABELS: Record<BarrierDisplayState, string> = {
  active: 'Barriere aktiv',
  partial: 'Teilweise behoben',
  resolved: 'Barrierefrei',
};

@Component({
  selector: 'app-barrier-panel',
  imports: [NgTemplateOutlet, RouterLink, MatButtonModule, MatCheckboxModule, VisuallyHidden],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './barrier-panel.component.html',
  styleUrl: './barrier-panel.component.scss',
})
export class BarrierPanelComponent {
  private readonly barriers = inject(BarrierStateService);
  private readonly announcer = inject(Announcer);

  /** Tail of the write queue — see `enqueue`. */
  private pending: Promise<void> = Promise.resolve();

  readonly scenario = input.required<Scenario>();

  protected readonly headingId = 'barrier-panel-heading';

  /**
   * One group per flow step (docs/ARCHITECTURE.md §12.1.1). A scenario whose
   * steps collapse to one — the CSR campaign — renders a single group whose
   * legend is `panel.groupLabel` rather than the step title, which on a
   * one-step scenario would only repeat the page `h1`.
   *
   * Barriers are looked up by the step's `barrierIds` rather than filtered
   * out of `scenario.barriers`, so the panel's order is the flow's order. A
   * barrier that belongs to no step would therefore not appear at all; that
   * is a content defect, and content/data-contract.spec.ts asserts it cannot
   * happen rather than this component silently papering over it.
   */
  protected readonly groups = computed<PanelGroup[]>(() => {
    const scenario = this.scenario();
    const byId = new Map(scenario.barriers.map((barrier) => [barrier.id, barrier]));
    const singleStep = scenario.steps.length === 1;

    return scenario.steps.map((step: ScenarioStep) => ({
      id: step.id,
      legend: singleStep ? 'Barrieren in diesem Schritt' : step.title,
      barriers: step.barrierIds
        .map((barrierId) => byId.get(barrierId))
        .filter((barrier): barrier is Barrier => barrier !== undefined),
    }));
  });

  /**
   * Whether this scenario has anything to switch. False only for a scenario
   * that is `available` and has steps but no barriers yet — the state this
   * project passes through while content lands incrementally. The area
   * summary and the bulk actions are suppressed then, because both would
   * otherwise be nonsense: a sentence about which areas 0 barriers come from,
   * and two buttons offering to resolve nothing.
   *
   * There is deliberately no empty-state sentence in its place: docs/UX-COPY.md
   * has no string for one, and inventing German copy is not this file's job
   * (CLAUDE.md rule 14). If the state ever becomes reachable in shipped
   * content, ask WERTE.IT for a `panel.empty` string rather than writing one
   * here.
   */
  protected readonly hasBarriers = computed(() => this.scenario().barriers.length > 0);

  /**
   * docs/UX-COPY.md §5.6 `panel.areaSummary` / `.areaSummary.single` — one
   * sentence, always visible, carrying chapter 3's thesis more directly than
   * a grouping ever could. Derived from the data, never written by hand: the
   * whole point is that it reflects what the scenario actually contains.
   */
  protected readonly areaSummary = computed(() => {
    const barriers = this.scenario().barriers;
    const areas = [...new Set(barriers.map((barrier) => barrier.responsibleArea))].map(
      (area) => AREA_LABELS[area],
    );

    if (areas.length === 1) {
      return `Alle ${barriers.length} Barrieren stammen aus einem Bereich: ${areas[0]}.`;
    }
    return `Diese ${barriers.length} Barrieren stammen aus ${areas.length} Bereichen: ${areas.join(', ')}.`;
  });

  protected isResolved(barrier: Barrier): boolean {
    return this.barriers.isBarrierResolved(this.scenario(), barrier);
  }

  protected isPartResolved(part: BarrierPart): boolean {
    return this.barriers.isResolved(this.scenario(), part.urlKey);
  }

  /**
   * A combined barrier's parts, or `undefined` for a simple one — through the
   * shared predicate in url-state.ts, never by reading `barrier.parts` here.
   * That file owns the decision precisely so the panel and the state layer
   * cannot disagree about which barriers are combined (`parts: []` is not).
   */
  protected partsOf(barrier: Barrier): readonly BarrierPart[] | undefined {
    return combinedBarrierParts(barrier);
  }

  /** True while a combined barrier's parts disagree — the parent checkbox's `indeterminate`. */
  protected isPartiallyResolved(barrier: Barrier): boolean {
    return this.displayState(barrier) === 'partial';
  }

  protected displayState(barrier: Barrier): BarrierDisplayState {
    if (this.isResolved(barrier)) {
      return 'resolved';
    }
    const parts = this.partsOf(barrier);
    if (parts && parts.some((part) => this.isPartResolved(part))) {
      return 'partial';
    }
    return 'active';
  }

  /**
   * docs/UX-COPY.md §5.6 `panel.combinedHint` / `.combinedHint.many`. The
   * two-part wording is the reviewed one and stays verbatim for the only
   * shape that exists today; a barrier with more parts gets the general
   * sentence rather than a text claiming there are two of something the user
   * can see three of. The domain model and the data contract both allow more
   * than two (`parts.length >= 2`).
   */
  protected combinedHint(parts: readonly BarrierPart[]): string {
    if (parts.length === 2) {
      return 'Diese Barriere hat zwei Teile. Erst wenn beide behoben sind, ist der Inhalt barrierefrei.';
    }
    return `Diese Barriere hat ${parts.length} Teile. Erst wenn alle behoben sind, ist der Inhalt barrierefrei.`;
  }

  protected partDisplayState(part: BarrierPart): BarrierDisplayState {
    return this.isPartResolved(part) ? 'resolved' : 'active';
  }

  protected stateLabel(state: BarrierDisplayState): string {
    return STATE_LABELS[state];
  }

  protected areaLabel(barrier: Barrier): string {
    return AREA_LABELS[barrier.responsibleArea];
  }

  // DOM ids are keyed off `urlKey`, not `id`: the data contract asserts
  // urlKeys are unique within a scenario across barriers *and* parts and
  // match /^[a-z0-9-]+$/ (content/data-contract.spec.ts), which is exactly
  // what an id needs. No `sim-` prefix — that rule applies inside the
  // simulation region (docs/ARCHITECTURE.md §5.6 rule 2); this is frame code.
  protected labelId(urlKey: string): string {
    return `barrier-${urlKey}-label`;
  }

  protected explainId(urlKey: string): string {
    return `barrier-${urlKey}-explain`;
  }

  protected hintId(urlKey: string): string {
    return `barrier-${urlKey}-hint`;
  }

  /**
   * Accessible name for a „Was bedeutet das?" link: its own text plus the
   * barrier's label, composed with `aria-labelledby` from the two elements
   * that already carry those strings. Eleven links reading „Was bedeutet
   * das?" and nothing else would be indistinguishable in a screen reader's
   * link list (SC 2.4.4), and writing a fuller string into an `aria-label`
   * would invent copy that is not in docs/UX-COPY.md (CLAUDE.md rule 15) and
   * would drop the visible text out of the accessible name (SC 2.5.3). The
   * self-reference is what keeps the visible text first.
   */
  protected explainLabelledBy(urlKey: string): string {
    return `${this.explainId(urlKey)} ${this.labelId(urlKey)}`;
  }

  /** Query params for the explanation link. Slice 6 renders what `erklaerung` selects. */
  protected explanationParams(urlKey: string): Record<string, string> {
    return { erklaerung: urlKey };
  }

  protected onToggle(barrier: Barrier, urlKey: string, source: MatCheckbox): Promise<void> {
    return this.enqueue(async () => {
      // Announce *after* the navigation has landed, so the sentence is read
      // off the state the user is now in rather than off a prediction of it.
      // The alternative — computing the next state here — would duplicate the
      // toggle rule of BarrierStateService, and the two copies would disagree
      // the first time the combined-barrier rule changed.
      await this.barriers.toggle(this.scenario(), urlKey);
      this.resync(barrier, urlKey, source);
      this.announcer.announce(this.announcementFor(barrier, urlKey));
    });
  }

  protected onResolveAll(): Promise<void> {
    return this.enqueue(async () => {
      await this.barriers.resolveAll();
      // One announcement, not one per barrier (docs/UX-COPY.md §5.7 "Alle behoben").
      this.announcer.announce('Alle Barrieren behoben. Die Seite ist jetzt barrierefrei.');
    });
  }

  protected onActivateAll(): Promise<void> {
    return this.enqueue(async () => {
      await this.barriers.resetAll();
      this.announcer.announce(`Alle ${this.scenario().barriers.length} Barrieren aktiv.`);
    });
  }

  /**
   * Runs write actions one after another.
   *
   * Every write re-derives the resolved set from the URL and navigates
   * (docs/ARCHITECTURE.md §7, D2), which is only correct if the previous
   * write has actually landed in the URL first. Two overlapping toggles both
   * read the *old* set, and the second one's `frei` silently drops the first
   * one's barrier — a lost toggle, and worse: the dropped barrier's `checked`
   * binding never changes value, so Angular does not re-write the input and
   * the box stays ticked while the URL, the simulation and the counter say
   * the barrier is active.
   *
   * Real clicks are at least one task apart and did not reach this, but "the
   * event loop happens to save us" is not a property worth relying on in the
   * component that owns the application's only writes.
   *
   * The rejection handler keeps the chain alive: a failed navigation must not
   * wedge every later toggle.
   */
  private enqueue(action: () => Promise<void>): Promise<void> {
    const next = this.pending.then(action, action);
    this.pending = next.catch(() => undefined);
    return next;
  }

  /**
   * Puts a checkbox back in step with the URL after its navigation.
   *
   * `mat-checkbox` flips its own visual state on click, and `[checked]` only
   * re-writes it when the bound expression *changes* value. Any write the URL
   * did not end up making — a cancelled or failed navigation — would
   * therefore leave a ticked box next to an unresolved barrier, which in this
   * application is the one lie the panel must never tell. Assigning the
   * derived value unconditionally costs nothing and closes the whole class.
   */
  private resync(barrier: Barrier, urlKey: string, source: MatCheckbox): void {
    const parts = this.partsOf(barrier);
    const part = parts ? parts.find((candidate) => candidate.urlKey === urlKey) : undefined;

    if (part) {
      source.checked = this.isPartResolved(part);
      return;
    }
    source.checked = this.isResolved(barrier);
    source.indeterminate = this.isPartiallyResolved(barrier);
  }

  /**
   * docs/UX-COPY.md §5.7, one format without exception: *what is now, how
   * many remain*. The barrier is named by its panel label (`shortTitle`), the
   * way the section's own example does („Formularfelder mit Beschriftungen:
   * barrierefrei. Noch 4 von 5 Barrieren aktiv.").
   */
  private announcementFor(barrier: Barrier, urlKey: string): string {
    const resolved = this.isResolved(barrier);
    const togglingPart = urlKey !== barrier.urlKey;

    // A part that leaves its combined barrier incomplete — in either
    // direction. The second sentence says what is still missing instead of a
    // count, because the count did not change: a partially resolved combined
    // barrier stays active in the counter (docs/UX-COPY.md §5.6).
    if (togglingPart && !resolved) {
      const parts = this.partsOf(barrier);
      const part = parts ? parts.find((candidate) => candidate.urlKey === urlKey) : undefined;
      const partName = part ? part.title : barrier.shortTitle;
      const partState = this.barriers.isResolved(this.scenario(), urlKey)
        ? 'barrierefrei'
        : 'Barriere aktiv';
      return `${partName}: ${partState}. ${barrier.shortTitle} ist noch nicht vollständig behoben.`;
    }

    const scenario = this.scenario();
    const active = this.barriers.activeBarrierCount(scenario);
    const total = scenario.barriers.length;

    // Resolving the last part of a combined barrier announces the barrier,
    // not the part — the barrier is what changed state.
    if (resolved) {
      return `${barrier.shortTitle}: barrierefrei. Noch ${active} von ${total} Barrieren aktiv.`;
    }
    return `${barrier.shortTitle}: Barriere aktiv. ${active} von ${total} Barrieren aktiv.`;
  }
}
