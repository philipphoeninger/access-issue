import { Injectable } from '@angular/core';
import { APPLICATION_PROCESS_SCENARIO } from '../content/application-process/application-process.scenario';
import { CSR_CAMPAIGN_SCENARIO } from '../content/csr-campaign/csr-campaign.scenario';
import { SOFTWARE_PROCUREMENT_SCENARIO } from '../content/software-procurement/software-procurement.scenario';
import type { Barrier, Scenario, ScenarioStep } from '../models/domain.model';

/**
 * All scenarios known to the application — available and planned alike.
 * Exported (not just wrapped by the service below) because route generation
 * (core/scenario-routes.ts) needs the list before the router — and therefore
 * DI — exists.
 */
export const SCENARIOS: readonly Scenario[] = [
  APPLICATION_PROCESS_SCENARIO,
  CSR_CAMPAIGN_SCENARIO,
  SOFTWARE_PROCUREMENT_SCENARIO,
];

/**
 * Read-only lookup over the scenario/content data (docs/ARCHITECTURE.md §13).
 * Holds no application state — that is `BarrierStateService` (§7), built in
 * slice 2. This service only ever reads the compiled-in content.
 */
@Injectable({ providedIn: 'root' })
export class ScenarioRegistry {
  getAll(): readonly Scenario[] {
    return SCENARIOS;
  }

  getScenario(path: string): Scenario | undefined {
    return SCENARIOS.find((scenario) => scenario.path === path);
  }

  // These three deliberately use an explicit `if` instead of
  // `getScenario(...)?.x.find(...)`: this project's coverage instrumenter
  // does not register `?.` as a branch at all (BRF:0 in the lcov output for
  // this file even with the optional-chaining form), which made the ≥95%
  // branch-coverage gate on this file (docs/TESTING.md §14) a no-op — it
  // could never fail no matter how little of the "not found" path was
  // tested. An explicit `if` produces a branch this toolchain actually
  // counts, so the gate protects something real.

  getStep(scenarioPath: string, stepPath: string): ScenarioStep | undefined {
    const scenario = this.getScenario(scenarioPath);
    if (!scenario) {
      return undefined;
    }
    return scenario.steps.find((step) => step.path === stepPath);
  }

  getBarrier(scenarioPath: string, barrierId: string): Barrier | undefined {
    const scenario = this.getScenario(scenarioPath);
    if (!scenario) {
      return undefined;
    }
    return scenario.barriers.find((barrier) => barrier.id === barrierId);
  }

  getBarrierByUrlKey(scenarioPath: string, urlKey: string): Barrier | undefined {
    const scenario = this.getScenario(scenarioPath);
    if (!scenario) {
      return undefined;
    }
    return scenario.barriers.find((barrier) => barrier.urlKey === urlKey);
  }

  // A part-level lookup (for combined barriers, ARCHITECTURE.md §6) belongs
  // here once a scenario actually has one — currently none does, the CSR
  // video barrier is still a `status: 'planned'` stub (SPEC_v1.md §3). Adding
  // it now would mean a branch no real content can exercise, which is worse
  // than adding it later alongside the CSR content and a real test.
}
