// The frame shell around a scenario step: h1, step indicator, step
// navigation, and the two-column layout from docs/DESIGN.md §5 — panel column
// first in the DOM and on the left, so visual order matches reading order.
// It composes the parts and owns none of them: BarrierPanelComponent renders
// the controls, SimulationRegionComponent the boundary and the projected
// scenario content, ExplanationViewComponent the textual channel underneath
// both.
//
// Loading the step's simulation component is the one asynchronous thing this
// component does; the lookup itself lives in scenarios/scenario-step-views.ts
// so the frame never imports a scenario component directly. That is the
// one-way dependency of docs/ARCHITECTURE.md §5.2 in file form: the frame
// knows *that* a step has a view, never what is in it.
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  type Type,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ScenarioRegistry } from '../../core/scenario-registry.service';
import { SuppressionNoticeService } from '../../core/suppression-notice.service';
import {
  scenarioStepPath,
  stepIndicator,
  type ScenarioRouteData,
} from '../../core/scenario-routes';
import type { Scenario, ScenarioStep } from '../../models/domain.model';
import { SCENARIO_STEP_VIEWS, stepViewKey } from '../../scenarios/scenario-step-views';
import { BarrierPanelComponent } from '../barrier-panel/barrier-panel.component';
import { ExplanationViewComponent } from '../explanation-view/explanation-view.component';
import { SimulationRegionComponent } from '../simulation-region/simulation-region.component';

@Component({
  selector: 'app-scenario-page',
  imports: [
    RouterLink,
    NgComponentOutlet,
    MatButtonModule,
    BarrierPanelComponent,
    ExplanationViewComponent,
    SimulationRegionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scenario-page.component.html',
  styleUrl: './scenario-page.component.scss',
})
export class ScenarioPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly registry = inject(ScenarioRegistry);

  private readonly notices = inject(SuppressionNoticeService);

  private readonly routeData = toSignal(this.route.data, { requireSync: true });

  readonly scenario = computed<Scenario>(() => {
    const { scenarioPath } = this.routeData() as ScenarioRouteData;
    const scenario = this.registry.getScenario(scenarioPath);
    if (!scenario) {
      throw new Error(`ScenarioPageComponent: unknown scenario path "${scenarioPath}"`);
    }
    return scenario;
  });

  /**
   * Notes about barriers a system preference has overridden (docs/UX-COPY.md
   * §5.9, CLAUDE.md rule 9). Published by the scenario component that
   * implements the suppressed barrier, rendered by the simulation bar, passed
   * through here because the bar's input already runs down this path.
   *
   * **Filtered to this scenario**, the same way every other lookup in this
   * application is scoped: a `urlKey` is unique within its scenario and nowhere
   * else (core/suppression-notice.service.ts). Without the filter a note about
   * the campaign's contrast barrier could describe the procurement page, which
   * has a contrast barrier of its own with the same key and a different story.
   *
   * Text, and nothing else: this component's own semantics do not change
   * because a note exists (CLAUDE.md rule 4).
   */
  protected readonly suppressionNotes = computed<readonly string[]>(() => {
    const path = this.scenario().path;
    return this.notices
      .all()
      .filter((notice) => notice.scenarioPath === path)
      .map((notice) => notice.note);
  });

  readonly step = computed<ScenarioStep>(() => {
    const { scenarioPath, stepPath } = this.routeData() as ScenarioRouteData;
    const step = this.registry.getStep(scenarioPath, stepPath);
    if (!step) {
      throw new Error(
        `ScenarioPageComponent: unknown step path "${stepPath}" in scenario "${scenarioPath}"`,
      );
    }
    return step;
  });

  private readonly stepIndex = computed(() =>
    this.scenario().steps.findIndex((step) => step.id === this.step().id),
  );

  readonly hasMultipleSteps = computed(() => this.scenario().steps.length > 1);

  /**
   * docs/UX-COPY.md §5.3 `scenario.stepIndicator`, composed by
   * core/scenario-routes.ts so the visible line, the document title and the
   * page-change announcement cannot disagree about what this step is called.
   * Rendered only for multi-step scenarios — see the template.
   */
  readonly stepIndicator = computed(() => stepIndicator(this.scenario(), this.step()));

  readonly previousStep = computed<ScenarioStep | undefined>(() => {
    const index = this.stepIndex();
    return index > 0 ? this.scenario().steps[index - 1] : undefined;
  });

  readonly nextStep = computed<ScenarioStep | undefined>(() => {
    const steps = this.scenario().steps;
    const index = this.stepIndex();
    return index < steps.length - 1 ? steps[index + 1] : undefined;
  });

  stepLink(step: ScenarioStep): string[] {
    return scenarioStepPath(this.scenario(), step);
  }

  private readonly stepView = computed(() =>
    // `Record` lookups are typed as always present; a step without an entry is
    // a defined state here, not an error (see scenario-step-views.ts).
    Object.hasOwn(SCENARIO_STEP_VIEWS, this.viewKey())
      ? SCENARIO_STEP_VIEWS[this.viewKey()]
      : undefined,
  );

  private viewKey(): string {
    return stepViewKey(this.scenario().id, this.step().id);
  }

  /**
   * The fictional Elbwerk address shown in the simulation bar. Empty for a
   * step with no view yet, which is what the bar's `simulatedPath` default
   * already expects — it then shows the bare domain rather than inventing a
   * path for an empty region.
   */
  readonly simulatedPath = computed(() => {
    const view = this.stepView();
    return view === undefined ? '' : view.simulatedPath;
  });

  /**
   * The step's simulation component once its chunk has arrived. `null` until
   * then, and again immediately on every step change: leaving the previous
   * step's component up while the next one loads would show step 1's posting
   * under step 2's heading for as long as the network takes.
   */
  protected readonly stepComponent = signal<Type<unknown> | null>(null);

  /**
   * Set when the step's chunk could not be fetched — a network blip, or a page
   * still pointing at a hashed chunk a redeploy has removed. Without it the
   * region would simply stay empty for good, beside a panel announcing eleven
   * active barriers and nothing saying why none of them are visible
   * (docs/ARCHITECTURE.md §17: every non-happy path has a defined state).
   */
  protected readonly loadFailed = signal(false);

  /** docs/UX-COPY.md §5.10 `simulation.loadFailed`. */
  protected readonly loadFailedNote =
    'Die Simulation konnte nicht geladen werden. Bitte lade die Seite neu. ' +
    'Das Barriere-Panel und die Erklärungen funktionieren weiter.';

  /**
   * Rendered as `data-step-view` on the simulation column, and the reason it
   * exists is the test suite (docs/ARCHITECTURE.md §15, the same role
   * `[data-simulation-region]` plays for the axe runs). A Playwright test that
   * reads the region before the chunk lands sees an empty region: assertions
   * about a barrier would fail intermittently, and an axe run scoped to the
   * region would report zero violations and *pass* — a barrier assertion that
   * proves nothing is worse than a flaky one. Everything except `'pending'` is
   * a settled state; only `'pending'` means "come back later".
   */
  protected readonly stepViewState = computed<'none' | 'pending' | 'ready' | 'failed'>(() => {
    if (this.stepView() === undefined) {
      return 'none';
    }
    if (this.loadFailed()) {
      return 'failed';
    }
    return this.stepComponent() === null ? 'pending' : 'ready';
  });

  constructor() {
    effect((onCleanup) => {
      const view = this.stepView();
      this.stepComponent.set(null);
      this.loadFailed.set(false);

      if (view === undefined) {
        return;
      }

      // Navigating on before the chunk resolves must not let a late promise
      // overwrite the newer step's component — the classic out-of-order
      // async render, and it would put the wrong simulation in the region.
      // The same guard keeps a stale *failure* from raising a note about a
      // step the user has already left.
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });

      void view.load().then(
        (component) => {
          if (!cancelled) {
            this.stepComponent.set(component);
          }
        },
        (error: unknown) => {
          if (!cancelled) {
            this.loadFailed.set(true);
          }
          // Reported rather than swallowed: `void promise.then(…)` with no
          // rejection handler turns this into an unhandled rejection that no
          // error handler sees and no log records.
          console.error('Failed to load the simulation for this step.', error);
        },
      );
    });
  }
}
