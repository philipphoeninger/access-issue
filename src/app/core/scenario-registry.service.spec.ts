import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScenarioRegistry } from './scenario-registry.service';

describe('ScenarioRegistry', () => {
  let registry: ScenarioRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    registry = TestBed.inject(ScenarioRegistry);
  });

  it('lists every scenario, available and planned', () => {
    const paths = registry.getAll().map((scenario) => scenario.path);
    expect(paths).toEqual(
      jasmine.arrayContaining(['bewerbung', 'csr-kampagne', 'softwarebeschaffung']),
    );
  });

  // The home page renders scenarios in registry order, and that order is the
  // module deck's presentation order — application process, software
  // procurement, CSR campaign (docs/ARCHITECTURE.md §21). Without this
  // assertion, appending or re-sorting SCENARIOS silently puts the home page
  // out of step with the slides lecturers are reading from.
  it('keeps scenarios in the module deck presentation order', () => {
    const paths = registry.getAll().map((scenario) => scenario.path);
    expect(paths).toEqual(['bewerbung', 'softwarebeschaffung', 'csr-kampagne']);
  });

  it('looks up a scenario by path', () => {
    expect(registry.getScenario('bewerbung')?.id).toBe('application-process');
    expect(registry.getScenario('unbekannt')).toBeUndefined();
  });

  it('looks up a step by scenario path and step path', () => {
    const step = registry.getStep('bewerbung', 'formular');
    expect(step?.id).toBe('formular');
    expect(registry.getStep('bewerbung', 'unbekannt')).toBeUndefined();
    expect(registry.getStep('unbekannt', 'formular')).toBeUndefined();
  });

  it('looks up a barrier by id', () => {
    expect(registry.getBarrier('bewerbung', 'labels')?.urlKey).toBe('labels');
    expect(registry.getBarrier('bewerbung', 'unbekannt')).toBeUndefined();
    expect(registry.getBarrier('unbekannt', 'labels')).toBeUndefined();
  });

  it('looks up a barrier by urlKey', () => {
    expect(registry.getBarrierByUrlKey('bewerbung', 'pdf')?.id).toBe('pdf');
    expect(registry.getBarrierByUrlKey('bewerbung', 'unbekannt')).toBeUndefined();
    expect(registry.getBarrierByUrlKey('unbekannt', 'pdf')).toBeUndefined();
  });

  // SPEC_v1.md slice 1 acceptance criterion: "Procurement scenario resolves
  // as planned with no barriers and no route." The "no route" half is not
  // testable yet — routing does not exist until slice 3.
  it('resolves the procurement scenario as planned, with no barriers', () => {
    const procurement = registry.getScenario('softwarebeschaffung');
    expect(procurement?.status).toBe('planned');
    expect(procurement?.barriers).toEqual([]);
  });

  // Available since docs/SPEC_v2.md slice 14, as one page modelled as one step
  // (docs/ARCHITECTURE.md §6). Its barriers arrive section by section in slices
  // 15 to 18, so this asserts the shape rather than a count that would have to
  // be edited four more times.
  it('resolves the CSR campaign scenario as available, with one step and barriers', () => {
    const csr = registry.getScenario('csr-kampagne');
    expect(csr?.status).toBe('available');
    expect(csr?.steps.length).toBe(1);
    expect(csr?.barriers.length).toBeGreaterThan(0);
  });

  it('resolves the application-process scenario as available', () => {
    expect(registry.getScenario('bewerbung')?.status).toBe('available');
  });
});
