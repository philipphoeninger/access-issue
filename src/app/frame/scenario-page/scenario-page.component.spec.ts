import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { ScenarioRouteData } from '../../core/scenario-routes';
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
});
