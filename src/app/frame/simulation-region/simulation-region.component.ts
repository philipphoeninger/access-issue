// The frame/simulation boundary (docs/ARCHITECTURE.md §5.1) — the only
// component allowed to host scenario content, which reaches it through
// `<ng-content>`. There is no route that renders a scenario component
// directly.
//
// What this component guarantees, and what each guarantee costs if it breaks:
//
//  - **The exit link is the first focusable element inside the region**, in
//    every barrier state. This is the one safety-critical path in the
//    application (docs/TESTING.md §7): a training tool about digital
//    participation that traps someone has failed worse than any missing label.
//    It is a real link, not an `Escape` handler — a keyboard shortcut nobody
//    announces is not an escape route (docs/ARCHITECTURE.md §5.1).
//  - **The region's heading is an `h2`, and scenario content starts at `h3`.**
//    Heading structure spans the boundary and cannot be scoped away, so a
//    broken outline is never an admissible barrier (§5.6, rule 1).
//  - **Every `id` inside the region carries the `sim-` prefix** (§5.6, rule 2),
//    including this component's own — duplicate ids across the boundary would
//    break `for` and `aria-labelledby` in the panel.
//  - **The skip link before the region and the end anchor after it are
//    rendered outside the region's DOM subtree**, so neither is subject to a
//    barrier and neither shows up inside `[data-simulation-region]`.
//
// `[data-simulation-region]` is the attribute the axe runs key off
// (docs/TESTING.md §5: run 1 excludes it, run 2 is scoped to it) and the one
// the global focus-ring rules in src/styles.scss use to keep frame and
// simulation tokens apart. It belongs on the region element itself and
// nowhere else.
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Scenario } from '../../models/domain.model';
import { FragmentLink } from '../../shared/fragment-link.directive';
import { VisuallyHidden } from '../../shared/visually-hidden.directive';
import {
  SIMULATION_DESCRIPTION_ID,
  SimulationBarComponent,
} from './simulation-bar/simulation-bar.component';

@Component({
  selector: 'app-simulation-region',
  imports: [SimulationBarComponent, VisuallyHidden, FragmentLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './simulation-region.component.html',
  styleUrl: './simulation-region.component.scss',
})
export class SimulationRegionComponent {
  /** The scenario whose barriers the bar counts. */
  readonly scenario = input.required<Scenario>();

  /** Passed straight through to the bar — see its `simulatedPath` input. */
  readonly simulatedPath = input('');

  /** Passed straight through to the bar — see its `suppressionNotes` input. */
  readonly suppressionNotes = input<readonly string[]>([]);

  protected readonly descriptionId = SIMULATION_DESCRIPTION_ID;

  /**
   * The region's accessible name comes from its own `h2` via
   * `aria-labelledby` rather than from a duplicate `aria-label`. The name is
   * the same string either way (docs/UX-COPY.md §5.5 `simRegion.label`), and
   * a screen reader that announces the region on entry and then reads an
   * identically worded heading straight after has said the same sentence
   * twice — in an application whose subject is exactly that kind of noise.
   */
  protected readonly headingId = 'sim-region-heading';

  /**
   * Target of `skip.afterSimulation` (docs/UX-COPY.md §5.1). Outside the
   * region, hence no `sim-` prefix.
   */
  protected readonly endAnchorId = 'simulation-end';
}
