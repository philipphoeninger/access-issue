// The frame shell around a scenario step: h1, step indicator, step
// navigation, and the two-column layout from docs/DESIGN.md §5. Slice 4 fills
// the simulation column with SimulationRegionComponent; the panel column
// stays empty until BarrierPanelComponent lands in slice 5, and this
// component does not anticipate its contents beyond leaving the `#panel`
// skip-link target in place.
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ScenarioRegistry } from '../../core/scenario-registry.service';
import { scenarioStepPath, type ScenarioRouteData } from '../../core/scenario-routes';
import type { Scenario, ScenarioStep } from '../../models/domain.model';
import { SimulationRegionComponent } from '../simulation-region/simulation-region.component';

@Component({
  selector: 'app-scenario-page',
  imports: [RouterLink, MatButtonModule, SimulationRegionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scenario-page.component.html',
  styleUrl: './scenario-page.component.scss',
})
export class ScenarioPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly registry = inject(ScenarioRegistry);

  private readonly routeData = toSignal(this.route.data, { requireSync: true });

  readonly scenario = computed<Scenario>(() => {
    const { scenarioPath } = this.routeData() as ScenarioRouteData;
    const scenario = this.registry.getScenario(scenarioPath);
    if (!scenario) {
      throw new Error(`ScenarioPageComponent: unknown scenario path "${scenarioPath}"`);
    }
    return scenario;
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

  readonly stepIndicator = computed(
    () => `Schritt ${this.stepIndex() + 1} von ${this.scenario().steps.length}`,
  );

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
}
