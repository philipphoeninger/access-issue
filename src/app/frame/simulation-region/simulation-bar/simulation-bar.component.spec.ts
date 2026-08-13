// docs/TESTING.md §9 ("Barrier count — exactly one counter exists in the
// document, it counts *active* barriers, and a partially resolved combined
// barrier counts as active") and docs/SPEC_v1.md slice 4 acceptance. The
// "exactly one in the document" half is asserted over a real page in
// e2e/simulation-boundary.spec.ts; this file asserts what the bar itself says.
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  BEWERBUNG_BARRIERS,
  VIDEO_BARRIERS,
  makeScenario,
} from '../../../core/testing/barrier-fixtures';
import type { Scenario } from '../../../models/domain.model';
import { SIMULATION_DESCRIPTION_ID, SimulationBarComponent } from './simulation-bar.component';

const SCENARIO = makeScenario(BEWERBUNG_BARRIERS); // five simple barriers
const VIDEO_SCENARIO = makeScenario(VIDEO_BARRIERS); // five simple + one combined

interface Options {
  scenario?: Scenario;
  frei?: string;
  simulatedPath?: string;
  suppressionNotes?: readonly string[];
}

function setup(options: Options = {}): ComponentFixture<SimulationBarComponent> {
  // Explicit reset so a single test can build two fixtures with different
  // query params — the "the description is static" test compares two barrier
  // states and would otherwise hit an already-instantiated TestBed.
  TestBed.resetTestingModule();

  const queryParams = new BehaviorSubject(
    convertToParamMap(options.frei === undefined ? {} : { frei: options.frei }),
  );

  TestBed.configureTestingModule({
    imports: [SimulationBarComponent],
    providers: [
      provideZonelessChangeDetection(),
      { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
      { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
    ],
  });

  const fixture = TestBed.createComponent(SimulationBarComponent);
  fixture.componentRef.setInput('scenario', options.scenario ?? SCENARIO);
  if (options.simulatedPath !== undefined) {
    fixture.componentRef.setInput('simulatedPath', options.simulatedPath);
  }
  if (options.suppressionNotes !== undefined) {
    fixture.componentRef.setInput('suppressionNotes', options.suppressionNotes);
  }
  fixture.detectChanges();
  return fixture;
}

function counterText(fixture: ComponentFixture<SimulationBarComponent>): string {
  return (fixture.nativeElement.querySelector('.counter') as HTMLElement).textContent!.trim();
}

describe('SimulationBarComponent (docs/SPEC_v1.md Slice 4)', () => {
  describe('the counter (docs/UX-COPY.md §5.4, §5.6)', () => {
    it('says all barriers are active in the default state, where `frei` is absent', () => {
      expect(counterText(setup())).toBe('Alle 5 Barrieren aktiv');
    });

    it('counts down as barriers are resolved', () => {
      expect(counterText(setup({ frei: 'labels,fehler' }))).toBe('3 von 5 Barrieren aktiv');
    });

    it('says no barrier is active once every one is resolved', () => {
      expect(counterText(setup({ frei: 'alle' }))).toBe('Keine Barriere aktiv');
    });

    // The judgement call worth protecting: a barrier that still stands, even
    // partly, is still a barrier (docs/UX-COPY.md §5.6). "Teilweise behoben"
    // shows on the panel entry and stays out of the counter.
    it('counts a partially resolved combined barrier as active', () => {
      const fixture = setup({ scenario: VIDEO_SCENARIO, frei: 'video-ut' });
      expect(counterText(fixture)).toBe('Alle 6 Barrieren aktiv');
    });

    it('counts a combined barrier as resolved only once every part is', () => {
      const fixture = setup({ scenario: VIDEO_SCENARIO, frei: 'video-ut,video-transkript' });
      expect(counterText(fixture)).toBe('5 von 6 Barrieren aktiv');
    });
  });

  describe('identity', () => {
    it('writes the chip as "Simulation" — the capitals come from CSS, not the string', () => {
      const chip: HTMLElement = setup().nativeElement.querySelector('.chip');
      expect(chip.textContent!.trim()).toBe('Simulation');
    });

    it('renders the fictional address from the simulated path', () => {
      const fixture = setup({ simulatedPath: '/karriere' });
      const address: HTMLElement = fixture.nativeElement.querySelector('.address');
      expect(address.textContent!.trim()).toBe('elbwerk.de/karriere');
    });

    it('falls back to the bare domain while no step supplies a path', () => {
      const address: HTMLElement = setup().nativeElement.querySelector('.address');
      expect(address.textContent!.trim()).toBe('elbwerk.de');
    });
  });

  describe('the description the region points at (docs/ARCHITECTURE.md §5.1)', () => {
    it('carries the id SimulationRegionComponent references', () => {
      const description: HTMLElement = setup().nativeElement.querySelector('.description');
      expect(description.id).toBe(SIMULATION_DESCRIPTION_ID);
    });

    it('is static — the same sentence whatever the barrier state', () => {
      const read = (frei: string) =>
        (
          setup({ frei }).nativeElement.querySelector('.description') as HTMLElement
        ).textContent!.replace(/\s+/g, ' ');

      expect(read('')).toBe(read('alle'));
      expect(read('')).toContain('Nachbau der Website der fiktiven Elbwerk KG.');
    });
  });

  describe('the suppression note slot (docs/UX-COPY.md §5.9)', () => {
    it('renders nothing while no system preference overrides a barrier', () => {
      expect(setup().nativeElement.querySelector('.suppression')).toBeNull();
    });

    it('renders every note it is given, under the "Hinweis zur Darstellung" label', () => {
      const fixture = setup({ suppressionNotes: ['Erste Anmerkung.', 'Zweite Anmerkung.'] });
      const suppression: HTMLElement = fixture.nativeElement.querySelector('.suppression');

      expect(suppression.getAttribute('aria-label')).toBe('Hinweis zur Darstellung');
      expect(Array.from(suppression.querySelectorAll('p'), (p) => p.textContent!.trim())).toEqual([
        'Erste Anmerkung.',
        'Zweite Anmerkung.',
      ]);
    });
  });
});
