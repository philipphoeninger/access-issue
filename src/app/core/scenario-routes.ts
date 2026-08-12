// Generates the scenario routes from ARCHITECTURE.md §9 out of the
// registry data instead of hand-listing them, so a new available scenario
// gets its routes for free (ARCHITECTURE.md §2.2 "New scenarios and
// barriers addable without touching core").
//
// Path grammar (ARCHITECTURE.md §9):
//   scenario with exactly one step  → szenario/{scenario.path}
//   scenario with several steps     → szenario/{scenario.path}/{step.path}
// A single-page scenario (e.g. the CSR campaign) is modelled as one step
// (docs/ARCHITECTURE.md §6 notes on the domain model); its route therefore
// has no trailing step segment.
//
// Only 'available' scenarios get routes. A 'planned' scenario (no steps, no
// barriers) is reachable only from the home page's "in Vorbereitung" entry,
// never by a real route — building that page is Slice 9's job
// (docs/SPEC_v1.md §3, §5 Slice 9).
import type { Route } from '@angular/router';
import type { Scenario, ScenarioStep } from '../models/domain.model';

/** Route `data` shape read back by ScenarioPageComponent. */
export interface ScenarioRouteData {
  scenarioPath: string;
  stepPath: string;
  /** Tells SkipLinksComponent a `#panel` target exists on this page. */
  hasPanel: true;
}

/**
 * The `routerLink` segments for one step of a scenario, following the same
 * grammar `buildScenarioRoutes` uses to register the route. Shared so a link
 * to a step (the home page's "Szenario öffnen", the step-navigation's
 * previous/next links) can never drift out of sync with the route that
 * actually exists.
 */
export function scenarioStepPath(scenario: Scenario, step: ScenarioStep): string[] {
  return scenario.steps.length === 1
    ? ['/szenario', scenario.path]
    : ['/szenario', scenario.path, step.path];
}

/**
 * The `routerLink` for a scenario's first step — what "Szenario öffnen"
 * (home page) and the header nav link to. An 'available' scenario always
 * has at least one step by construction (docs/ARCHITECTURE.md §6: a
 * single-page scenario is modelled as one step), and the data contract test
 * "every available scenario has at least one step"
 * (content/data-contract.spec.ts) protects that invariant — so callers here
 * do not need to re-check it themselves.
 */
export function firstStepPath(scenario: Scenario): string[] {
  return scenarioStepPath(scenario, scenario.steps[0]);
}

export function buildScenarioRoutes(scenarios: readonly Scenario[]): Route[] {
  const routes: Route[] = [];

  for (const scenario of scenarios) {
    if (scenario.status !== 'available') {
      continue;
    }

    for (const step of scenario.steps) {
      const data: ScenarioRouteData = {
        scenarioPath: scenario.path,
        stepPath: step.path,
        hasPanel: true,
      };

      const [firstSegment, ...restSegments] = scenarioStepPath(scenario, step);

      routes.push({
        // scenarioStepPath returns an absolute routerLink array
        // (`['/szenario', ...]`); an Angular route `path` is the same
        // segments joined without the leading slash.
        path: [firstSegment.replace(/^\//, ''), ...restSegments].join('/'),
        loadComponent: () =>
          import('../frame/scenario-page/scenario-page.component').then(
            (m) => m.ScenarioPageComponent,
          ),
        data,
      });
    }
  }

  return routes;
}
