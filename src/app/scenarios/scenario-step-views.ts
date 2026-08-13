// Which component renders which step inside the simulation region, and under
// which fictional Elbwerk address.
//
// **Why this is not a field on `ScenarioStep`.** The domain model
// (docs/ARCHITECTURE.md §6) describes content: what a step is called, which
// barriers it carries. A component reference is a rendering concern, and the
// content layer is explicitly the part that may one day move to JSON in
// `public/` without the interfaces changing (docs/ARCHITECTURE.md §13). A
// component constructor cannot be expressed in JSON, so putting one there
// would foreclose that path for no gain.
//
// **Why the imports are dynamic.** Every route already loads the same
// `ScenarioPageComponent` (core/scenario-routes.ts), so a static import here
// would pull every scenario's simulation markup into that one chunk and undo
// the per-scenario lazy loading of docs/ARCHITECTURE.md §9. With `import()`,
// each scenario's step components stay in their own chunks and a participant
// who opens the application process never downloads the CSR campaign.
//
// **One entry per step, and no entry is also a defined state.** A step with no
// entry renders the region empty rather than throwing. Every step of every
// available scenario has an entry as of slice 10, so the case is unreachable
// through the router today — it is what the next scenario's first step will
// look like from here until its component lands, and it keeps the frame gate
// meaningful in the meantime.
import type { Type } from '@angular/core';

export interface ScenarioStepView {
  /**
   * The path the simulation bar shows after `elbwerk.de` (docs/UX-COPY.md
   * §5.4 `simBar.url`, §8.1). Simulation content, so it is supplied here with
   * the step it belongs to and never invented by the frame.
   */
  readonly simulatedPath: string;

  /** The component projected into the simulation region for this step. */
  readonly load: () => Promise<Type<unknown>>;
}

/** Key into `SCENARIO_STEP_VIEWS`: `Scenario.id` and `ScenarioStep.id`. */
export function stepViewKey(scenarioId: string, stepId: string): string {
  return `${scenarioId}/${stepId}`;
}

export const SCENARIO_STEP_VIEWS: Readonly<Record<string, ScenarioStepView>> = {
  [stepViewKey('application-process', 'stellenanzeige')]: {
    simulatedPath: '/karriere/it-projektmanager',
    load: () =>
      import('./application-process/job-posting-step/job-posting-step.component').then(
        (m) => m.JobPostingStepComponent,
      ),
  },
  [stepViewKey('application-process', 'formular')]: {
    simulatedPath: '/karriere/it-projektmanager/bewerbung',
    load: () =>
      import('./application-process/application-form-step/application-form-step.component').then(
        (m) => m.ApplicationFormStepComponent,
      ),
  },
  [stepViewKey('application-process', 'dokumente')]: {
    simulatedPath: '/karriere/it-projektmanager/bewerbung/unterlagen',
    load: () =>
      import('./application-process/document-upload-step/document-upload-step.component').then(
        (m) => m.DocumentUploadStepComponent,
      ),
  },
  [stepViewKey('application-process', 'rueckmeldung')]: {
    simulatedPath: '/karriere/it-projektmanager/bewerbung/bestaetigung',
    load: () =>
      import('./application-process/confirmation-step/confirmation-step.component').then(
        (m) => m.ConfirmationStepComponent,
      ),
  },
};
