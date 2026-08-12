// The simulation bar — docs/DESIGN.md §6's signature element. Frame code, on
// a navy surface, immediately above the region: chip, fictional address, and
// the barrier counter.
//
// Three things about it are load-bearing rather than cosmetic:
//
//  - **It is the only counter in the application** (docs/UX-COPY.md §5.6), and
//    it counts *active* barriers, so the number falls as the user resolves
//    them. The panel (slice 5) deliberately gets no progress figure of its own.
//  - **A partially resolved combined barrier counts as active.** That is a
//    judgement call a later refactor could silently invert, so it is asserted
//    in the spec file rather than left to the reading of `isBarrierResolved`.
//  - **It owns the static description** the region's `aria-describedby` points
//    at (docs/ARCHITECTURE.md §5.1). The text never changes with barrier
//    state: a description orients, it does not recite what is currently broken.
//
// Reading barrier state here is the narrow exception in docs/ARCHITECTURE.md
// §5.2 — state is read to render *text*, and nothing about this component's
// own semantics, labelling or focusability changes because a barrier is active.
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { BarrierStateService } from '../../../core/barrier-state.service';
import type { Scenario } from '../../../models/domain.model';

/**
 * `id` of the frame-owned sentence the simulation region references with
 * `aria-describedby` (docs/ARCHITECTURE.md §5.1). Exported so
 * SimulationRegionComponent binds the same value rather than repeating the
 * literal — the two live in different components and would otherwise drift
 * apart silently, leaving a dangling reference no test would notice.
 *
 * No `sim-` prefix: this element is part of the frame and sits outside the
 * region, so the prefix rule (docs/ARCHITECTURE.md §5.6, rule 2) does not
 * apply to it.
 */
export const SIMULATION_DESCRIPTION_ID = 'simulation-description';

@Component({
  selector: 'app-simulation-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './simulation-bar.component.html',
  styleUrl: './simulation-bar.component.scss',
})
export class SimulationBarComponent {
  private readonly barrierState = inject(BarrierStateService);

  readonly scenario = input.required<Scenario>();

  /**
   * The fictional path shown after `elbwerk.de` (docs/UX-COPY.md §5.4
   * `simBar.url`). Simulation content, so it is supplied by whoever renders
   * the step — the scenario step components of slices 7–10. Until those
   * exist the bar shows the bare domain, which is accurate for an empty
   * region and does not require the frame to invent an Elbwerk URL.
   */
  readonly simulatedPath = input('');

  /**
   * Notes about barriers a system preference has overridden
   * (docs/UX-COPY.md §5.9, docs/ARCHITECTURE.md §5.5). The slot exists from
   * this slice on; the first barrier that needs it is the CSR carousel, whose
   * component will pass the matching `suppressed.*` string. Detection belongs
   * to the barrier that is suppressed, not to the bar — the bar only has to
   * be the one place such a note appears.
   */
  readonly suppressionNotes = input<readonly string[]>([]);

  protected readonly descriptionId = SIMULATION_DESCRIPTION_ID;

  protected readonly address = computed(() => `elbwerk.de${this.simulatedPath()}`);

  /**
   * Barriers that are not *fully* resolved. A combined barrier with one part
   * repaired still stands, so it still counts — the partial state shows on
   * the panel entry and stays out of the counter (docs/UX-COPY.md §5.6). The
   * rule lives in BarrierStateService because the panel's announcements name
   * the same number (docs/UX-COPY.md §5.7); this component is still the only
   * place it is *rendered*.
   */
  protected readonly activeCount = computed(() =>
    this.barrierState.activeBarrierCount(this.scenario()),
  );

  /** docs/UX-COPY.md §5.4 `simBar.counter.none` / `.all` / `.some`. */
  protected readonly counterLabel = computed(() => {
    const total = this.scenario().barriers.length;
    const active = this.activeCount();

    if (active === 0) {
      return 'Keine Barriere aktiv';
    }
    if (active === total) {
      return `Alle ${total} Barrieren aktiv`;
    }
    return `${active} von ${total} Barrieren aktiv`;
  });
}
