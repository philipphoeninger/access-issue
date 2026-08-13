import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { ScenarioRouteData } from '../../core/scenario-routes';
import {
  SCENARIO_STEP_VIEWS,
  stepViewKey,
  type ScenarioStepView,
} from '../../scenarios/scenario-step-views';
import { ScenarioPageComponent } from './scenario-page.component';

function setup(data: ScenarioRouteData): ComponentFixture<ScenarioPageComponent> {
  TestBed.configureTestingModule({
    imports: [ScenarioPageComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      {
        provide: ActivatedRoute,
        // `queryParamMap` is for BarrierStateService, which the simulation
        // bar inside the region reads the barrier count from (slice 4).
        useValue: { data: of(data), queryParamMap: of(convertToParamMap({})) },
      },
    ],
  });
  const fixture = TestBed.createComponent(ScenarioPageComponent);
  fixture.detectChanges();
  return fixture;
}

describe('ScenarioPageComponent (docs/SPEC_v1.md Slice 3)', () => {
  it('renders the scenario title as the page h1 (docs/ARCHITECTURE.md §5.6)', () => {
    const fixture = setup({
      scenarioPath: 'bewerbung',
      stepPath: 'stellenanzeige',
      hasPanel: true,
    });

    const h1: HTMLHeadingElement = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent?.trim()).toBe('Bewerbungsprozess');
  });

  // The h1 is the scenario title and identical on all four steps, so the
  // indicator is the only place on the page that says *which* step this is —
  // counting alone answered "how far along", never "where" (UX-COPY §5.3).
  it('names the current step in the indicator, not just its number', () => {
    const fixture = setup({ scenarioPath: 'bewerbung', stepPath: 'formular', hasPanel: true });

    const indicator: HTMLElement = fixture.nativeElement.querySelector('.step-indicator');
    expect(indicator.textContent?.trim()).toBe('Schritt 2 von 4 — Bewerbungsformular');
  });

  it('links forward from step 1 and has no back link', () => {
    const fixture = setup({
      scenarioPath: 'bewerbung',
      stepPath: 'stellenanzeige',
      hasPanel: true,
    });

    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.step-nav a'),
    );
    expect(links.length).toBe(1);
    expect(links[0].textContent?.trim()).toBe('Weiter zu: Bewerbungsformular');
  });

  it('links back from the last step and has no forward link', () => {
    const fixture = setup({ scenarioPath: 'bewerbung', stepPath: 'rueckmeldung', hasPanel: true });

    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.step-nav a'),
    );
    expect(links.length).toBe(1);
    expect(links[0].textContent?.trim()).toBe('Zurück zu: Unterlagen hochladen');
  });

  it('renders a panel-column skip target for SkipLinksComponent', () => {
    const fixture = setup({
      scenarioPath: 'bewerbung',
      stepPath: 'stellenanzeige',
      hasPanel: true,
    });

    expect(fixture.nativeElement.querySelector('#panel')).not.toBeNull();
  });

  // docs/SPEC_v1.md Slice 7 — the step's simulation content reaches the page
  // through the region's content projection and through nothing else
  // (docs/ARCHITECTURE.md §5.1: there is no route that renders a scenario
  // component directly). What the projected component *contains* is asserted
  // in its own spec; what matters here is that it cannot arrive outside the
  // boundary.
  describe('the step view (src/app/scenarios/scenario-step-views.ts)', () => {
    it('projects the step component into the simulation region', async () => {
      const fixture = setup({
        scenarioPath: 'bewerbung',
        stepPath: 'stellenanzeige',
        hasPanel: true,
      });

      await settled(fixture);

      const region = fixture.nativeElement.querySelector('[data-simulation-region]');
      const view = fixture.nativeElement.querySelector('app-job-posting-step');
      expect(view).not.toBeNull();
      expect(region.contains(view)).toBeTrue();
    });

    it('shows the step’s fictional address in the simulation bar', async () => {
      const fixture = setup({
        scenarioPath: 'bewerbung',
        stepPath: 'stellenanzeige',
        hasPanel: true,
      });

      await settled(fixture);

      expect(fixture.nativeElement.querySelector('.address').textContent.trim()).toBe(
        'elbwerk.de/karriere/it-projektmanager',
      );
    });

    // docs/ARCHITECTURE.md §17 — every non-happy path has a defined state.
    // The step's markup is fetched as its own chunk, and that fetch can fail:
    // a network blip, or a page still pointing at a hashed chunk a redeploy
    // has removed. Without this the region would stay empty for good, beside a
    // panel announcing eleven active barriers, with nothing saying why none of
    // them are visible.
    it('shows a frame-owned note when the step’s chunk cannot be loaded', async () => {
      // The error is reported rather than swallowed, so the spy is what keeps
      // the expected failure out of the test log — and asserts the reporting.
      const reported = spyOn(console, 'error');

      const key = stepViewKey('application-process', 'stellenanzeige');
      const views = SCENARIO_STEP_VIEWS as Record<string, ScenarioStepView>;
      const realView = views[key];
      views[key] = {
        ...realView,
        load: () => Promise.reject(new Error('chunk missing')),
      };

      try {
        const fixture = setup({
          scenarioPath: 'bewerbung',
          stepPath: 'stellenanzeige',
          hasPanel: true,
        });

        await settled(fixture);

        expect(
          fixture.nativeElement.querySelector('.simulation-column').getAttribute('data-step-view'),
        ).toBe('failed');
        expect(fixture.nativeElement.querySelector('.load-failed').textContent).toContain(
          'Die Simulation konnte nicht geladen werden',
        );
        expect(reported).toHaveBeenCalled();

        // The note explains a frame-level failure, so it belongs to the frame:
        // inside the region it would be subject to whatever the region failed
        // to load (docs/ARCHITECTURE.md §5.4).
        const region = fixture.nativeElement.querySelector('[data-simulation-region]');
        expect(region).not.toBeNull();
        expect(region.contains(fixture.nativeElement.querySelector('.load-failed'))).toBeFalse();

        // And the half of the page that still works keeps working — which is
        // exactly what the note claims (docs/UX-COPY.md §5.10).
        expect(fixture.nativeElement.querySelector('#panel .panel')).not.toBeNull();
      } finally {
        views[key] = realView;
      }
    });

    // Steps 3 and 4 have no view yet (slices 9 and 10). That is a defined
    // state, not an error: the region renders empty and the bar falls back to
    // the bare domain rather than to a path the frame invented.
    it('renders the region empty for a step whose view does not exist yet', async () => {
      const fixture = setup({ scenarioPath: 'bewerbung', stepPath: 'dokumente', hasPanel: true });

      await settled(fixture);

      expect(fixture.nativeElement.querySelector('app-job-posting-step')).toBeNull();
      expect(fixture.nativeElement.querySelector('.address').textContent.trim()).toBe('elbwerk.de');
      expect(
        fixture.nativeElement.querySelector('.simulation-column').getAttribute('data-step-view'),
      ).toBe('none');
    });
  });
});

/**
 * Waits until the step view has settled — `'ready'` once its chunk has
 * arrived, `'none'` for a step that has no view. A condition, not a sleep
 * (docs/TESTING.md §10): the component loads through a dynamic `import()`,
 * which is not a task Angular's `whenStable` tracks, so there is nothing else
 * to await.
 */
async function settled(fixture: ComponentFixture<ScenarioPageComponent>): Promise<void> {
  // Generous on purpose. The loop exits as soon as the state settles, so the
  // deadline costs nothing in the passing case — but the chunk is fetched over
  // HTTP from the Karma server, and on a CI runner with several jobs in
  // parallel a tight cap turns a slow fetch into three specs failing with
  // "never left the pending state", which reads as a broken projection rather
  // than as a slow machine.
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    fixture.detectChanges();
    const state = fixture.nativeElement
      .querySelector('.simulation-column')
      .getAttribute('data-step-view');

    if (state !== 'pending') {
      fixture.detectChanges();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  throw new Error('The step view never left the pending state.');
}
