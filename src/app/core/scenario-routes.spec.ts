import type { Scenario } from '../models/domain.model';
import { buildScenarioRoutes, stepIndicator, stepPageTitle } from './scenario-routes';

function scenario(overrides: Partial<Scenario>): Scenario {
  return {
    id: 'id',
    path: 'pfad',
    title: 'Titel',
    summary: 'Zusammenfassung',
    status: 'available',
    steps: [],
    barriers: [],
    ...overrides,
  };
}

describe('buildScenarioRoutes (docs/ARCHITECTURE.md §9)', () => {
  it('omits the step segment for a single-step scenario', () => {
    const csr = scenario({
      path: 'csr-kampagne',
      steps: [{ id: 'landing', path: 'landing', title: 'Landing', barrierIds: [] }],
    });

    const routes = buildScenarioRoutes([csr]);

    expect(routes.length).toBe(1);
    expect(routes[0].path).toBe('szenario/csr-kampagne');
    expect(routes[0].data).toEqual({
      scenarioPath: 'csr-kampagne',
      stepPath: 'landing',
      hasPanel: true,
    });
  });

  it('adds the step segment for a multi-step scenario, one route per step', () => {
    const bewerbung = scenario({
      path: 'bewerbung',
      steps: [
        { id: 'stellenanzeige', path: 'stellenanzeige', title: 'Stellenanzeige', barrierIds: [] },
        { id: 'formular', path: 'formular', title: 'Bewerbungsformular', barrierIds: [] },
      ],
    });

    const routes = buildScenarioRoutes([bewerbung]);

    expect(routes.map((r) => r.path)).toEqual([
      'szenario/bewerbung/stellenanzeige',
      'szenario/bewerbung/formular',
    ]);
  });

  it('skips planned scenarios entirely', () => {
    const planned = scenario({ path: 'softwarebeschaffung', status: 'planned', steps: [] });

    expect(buildScenarioRoutes([planned])).toEqual([]);
  });

  it('every generated route lazy-loads a component', () => {
    const bewerbung = scenario({
      path: 'bewerbung',
      steps: [{ id: 'a', path: 'a', title: 'A', barrierIds: [] }],
    });

    const routes = buildScenarioRoutes([bewerbung]);

    expect(typeof routes[0].loadComponent).toBe('function');
  });
});

// docs/UX-COPY.md §5.3. Both formats live here so the visible indicator, the
// document title and the page-change announcement (§5.7) are composed once
// and cannot drift apart.
describe('step naming (docs/UX-COPY.md §5.3)', () => {
  const bewerbung = scenario({
    path: 'bewerbung',
    title: 'Bewerbungsprozess',
    steps: [
      { id: 'stellenanzeige', path: 'stellenanzeige', title: 'Stellenanzeige', barrierIds: [] },
      { id: 'formular', path: 'formular', title: 'Bewerbungsformular', barrierIds: [] },
      { id: 'dokumente', path: 'dokumente', title: 'Unterlagen hochladen', barrierIds: [] },
    ],
  });

  const csr = scenario({
    path: 'csr-kampagne',
    title: 'CSR-Kampagne',
    steps: [{ id: 'landing', path: 'landing', title: 'Landing', barrierIds: [] }],
  });

  describe('stepIndicator', () => {
    it('counts the step and names it', () => {
      expect(stepIndicator(bewerbung, bewerbung.steps[1])).toBe(
        'Schritt 2 von 3 — Bewerbungsformular',
      );
    });

    it('leaves the scenario name out — the h1 above it already says that', () => {
      expect(stepIndicator(bewerbung, bewerbung.steps[0])).not.toContain('Bewerbungsprozess');
    });
  });

  describe('stepPageTitle', () => {
    // Four steps sharing one document title made four open tabs of the same
    // scenario indistinguishable (WCAG 2.4.2).
    it('distinguishes the steps of one scenario', () => {
      const titles = bewerbung.steps.map((step) => stepPageTitle(bewerbung, step));

      expect(titles).toEqual([
        'Bewerbungsprozess, Schritt 1 von 3 — Stellenanzeige',
        'Bewerbungsprozess, Schritt 2 von 3 — Bewerbungsformular',
        'Bewerbungsprozess, Schritt 3 von 3 — Unterlagen hochladen',
      ]);
      expect(new Set(titles).size).toBe(titles.length);
    });

    it('names the scenario first, because tab strips truncate at the end', () => {
      expect(
        stepPageTitle(bewerbung, bewerbung.steps[0]).startsWith('Bewerbungsprozess'),
      ).toBeTrue();
    });

    // "Schritt 1 von 1" is not information.
    it('drops the count for a single-step scenario', () => {
      expect(stepPageTitle(csr, csr.steps[0])).toBe('CSR-Kampagne');
    });
  });
});
