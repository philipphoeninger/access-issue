// The boundary invariants from docs/ARCHITECTURE.md §5.1 and §5.6, asserted
// on the DOM the component actually produces. Two of them — no `h1` inside
// the region, and the `sim-` id prefix — exist precisely because the axe
// strategy in docs/TESTING.md §5 cannot catch violations of them, so this
// file is their only automated guard until scenario content arrives.
//
// The keyboard behaviour of the exit link (docs/TESTING.md §7) is a real-key
// e2e concern and lives in e2e/exit-link.spec.ts: focus order asserted here
// is DOM order, which is necessary but not sufficient.
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { BEWERBUNG_BARRIERS, makeScenario } from '../../core/testing/barrier-fixtures';
import { SIMULATION_DESCRIPTION_ID } from './simulation-bar/simulation-bar.component';
import { SimulationRegionComponent } from './simulation-region.component';

const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

@Component({
  imports: [SimulationRegionComponent],
  template: `
    <app-simulation-region [scenario]="scenario">
      <h3 id="sim-projected-heading">Offene Stellen</h3>
      <p>Projizierter Szenario-Inhalt.</p>
    </app-simulation-region>
  `,
})
class HostComponent {
  readonly scenario = makeScenario(BEWERBUNG_BARRIERS);
}

function setup(): ComponentFixture<HostComponent> {
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [
      provideZonelessChangeDetection(),
      // A real Router: the exit link and the skip link resolve their hrefs
      // through FragmentLink, which reads `router.url`.
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { queryParamMap: new BehaviorSubject(convertToParamMap({})) },
      },
    ],
  });

  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return fixture;
}

function root(fixture: ComponentFixture<HostComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function region(fixture: ComponentFixture<HostComponent>): HTMLElement {
  return root(fixture).querySelector('[data-simulation-region]')!;
}

describe('SimulationRegionComponent (docs/SPEC_v1.md Slice 4)', () => {
  describe('the region itself (docs/ARCHITECTURE.md §5.1)', () => {
    it('is a region landmark named as a simulation', () => {
      const fixture = setup();
      const element = region(fixture);

      expect(element.getAttribute('role')).toBe('region');

      const heading = element.querySelector(`#${element.getAttribute('aria-labelledby')}`);
      expect(heading!.textContent!.trim()).toBe('Simulation: Website der Elbwerk GmbH & Co. KG');
    });

    it('is described by the frame-owned sentence in the simulation bar, which sits outside it', () => {
      const fixture = setup();
      const describedBy = region(fixture).getAttribute('aria-describedby');
      expect(describedBy).toBe(SIMULATION_DESCRIPTION_ID);

      const description = root(fixture).querySelector(`#${describedBy}`)!;
      expect(description).not.toBeNull();
      expect(region(fixture).contains(description)).toBeFalse();
    });

    it('marks exactly one element as the simulation region', () => {
      expect(root(setup()).querySelectorAll('[data-simulation-region]').length).toBe(1);
    });

    it('projects scenario content into the region', () => {
      const fixture = setup();
      expect(region(fixture).querySelector('#sim-projected-heading')).not.toBeNull();
    });
  });

  describe('heading structure (docs/ARCHITECTURE.md §5.6, rule 1)', () => {
    it('contains no h1', () => {
      expect(region(setup()).querySelector('h1')).toBeNull();
    });

    it("makes its own h2 the region's first heading", () => {
      const headings = region(setup()).querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings[0].tagName).toBe('H2');
    });
  });

  describe('id prefix (docs/ARCHITECTURE.md §5.6, rule 2)', () => {
    it('prefixes every id inside the region with sim-', () => {
      const ids = Array.from(region(setup()).querySelectorAll('[id]'), (element) => element.id);

      expect(ids.length).toBeGreaterThan(0);
      expect(ids.filter((id) => !id.startsWith('sim-'))).toEqual([]);
    });
  });

  describe('the exit link (docs/TESTING.md §7, docs/UX-COPY.md §5.5)', () => {
    it('is the first focusable element inside the region', () => {
      const focusable = region(setup()).querySelectorAll(FOCUSABLE_SELECTOR);
      expect(focusable[0].textContent!.trim()).toBe(
        'Simulation verlassen — zurück zum Barriere-Panel',
      );
    });

    // Not `href="#panel"`: FragmentLink prefixes the current path, or the
    // link would resolve against `<base href>` and leave the page instead of
    // returning to the panel (see shared/fragment-link.directive.ts).
    it('points at the barrier panel', () => {
      const link: HTMLAnchorElement = region(setup()).querySelector('.exit-link')!;
      expect(link.getAttribute('href')).toMatch(/#panel$/);
    });
  });

  describe('skipping the region (docs/UX-COPY.md §5.1, §5.5)', () => {
    it('renders the skip link before the region and outside it', () => {
      const fixture = setup();
      const skipLink: HTMLAnchorElement = root(fixture).querySelector('.skip-simulation')!;

      expect(skipLink.textContent!.trim()).toBe('Simulationsbereich überspringen');
      expect(region(fixture).contains(skipLink)).toBeFalse();
      expect(skipLink.compareDocumentPosition(region(fixture))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('renders a focusable end anchor after the region and outside it', () => {
      const fixture = setup();
      const skipLink: HTMLAnchorElement = root(fixture).querySelector('.skip-simulation')!;
      // Resolved through the skip link's own href, so a renamed anchor id
      // fails here rather than shipping a link to nothing. The href carries
      // the current path as well as the fragment (FragmentLink), so only the
      // fragment is a selector.
      const fragment = skipLink.getAttribute('href')!.replace(/^[^#]*/, '');
      const target: HTMLElement = root(fixture).querySelector(fragment)!;

      expect(target.textContent!.trim()).toBe('Ende des Simulationsbereichs');
      expect(target.getAttribute('tabindex')).toBe('-1');
      expect(region(fixture).contains(target)).toBeFalse();
      expect(region(fixture).compareDocumentPosition(target)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
  });
});
