import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScenarioRegistry } from '../core/scenario-registry.service';
import { AXE_RULE_FIXTURES } from './axe-rule-fixtures';
import type { Barrier, Scenario } from '../models/domain.model';

// Data contract tests, docs/TESTING.md §8. These run over the real scenario
// registry so they scale automatically as barriers and scenarios are added —
// none of this is hand-written per barrier.

const URL_KEY_PATTERN = /^[a-z0-9-]+$/;

function urlKeysOf(barrier: Barrier): string[] {
  return [barrier.urlKey, ...(barrier.parts ?? []).map((part) => part.urlKey)];
}

function forEachBarrier(
  scenarios: readonly Scenario[],
  fn: (scenario: Scenario, barrier: Barrier) => void,
): void {
  for (const scenario of scenarios) {
    for (const barrier of scenario.barriers) {
      fn(scenario, barrier);
    }
  }
}

describe('scenario data contract (docs/TESTING.md §8)', () => {
  let registry: ScenarioRegistry;
  let scenarios: readonly Scenario[];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    registry = TestBed.inject(ScenarioRegistry);
    scenarios = registry.getAll();
  });

  it('gives every barrier non-empty problem, affected and solution prose', () => {
    forEachBarrier(scenarios, (scenario, barrier) => {
      expect(barrier.explanation.problem.trim().length)
        .withContext(`${scenario.path}/${barrier.urlKey} problem`)
        .toBeGreaterThan(0);
      expect(barrier.explanation.affected.trim().length)
        .withContext(`${scenario.path}/${barrier.urlKey} affected`)
        .toBeGreaterThan(0);
      expect(barrier.explanation.solution.trim().length)
        .withContext(`${scenario.path}/${barrier.urlKey} solution`)
        .toBeGreaterThan(0);
    });
  });

  it('gives every barrier at least one StandardReference', () => {
    forEachBarrier(scenarios, (scenario, barrier) => {
      expect(barrier.standards.length)
        .withContext(`${scenario.path}/${barrier.urlKey}`)
        .toBeGreaterThan(0);
    });
  });

  it('keeps urlKey unique within a scenario, across barriers and their parts', () => {
    for (const scenario of scenarios) {
      const allKeys = scenario.barriers.flatMap(urlKeysOf);
      const unique = new Set(allKeys);
      expect(unique.size).withContext(scenario.path).toBe(allKeys.length);
    }
  });

  it('never uses the reserved word "alle" as a urlKey', () => {
    forEachBarrier(scenarios, (_scenario, barrier) => {
      for (const key of urlKeysOf(barrier)) {
        expect(key).not.toBe('alle');
      }
    });
  });

  it('matches every urlKey against /^[a-z0-9-]+$/', () => {
    forEachBarrier(scenarios, (scenario, barrier) => {
      for (const key of urlKeysOf(barrier)) {
        expect(key).withContext(`${scenario.path}/${key}`).toMatch(URL_KEY_PATTERN);
      }
    });
  });

  // Snapshot of every {scenarioPath, urlKey} pair that has ever shipped.
  // urlKeys appear in module slides (docs/ARCHITECTURE.md §8, §18): once
  // printed, they must not be renamed or removed.
  //
  // If this test fails, the correct fix is almost always to RESTORE the
  // missing key in the content file, not to shrink this list. Only remove an
  // entry here if a maintainer has confirmed by hand that the key was never
  // published anywhere (docs/TESTING.md §8).
  const PROTECTED_URL_KEYS: ReadonlyArray<{ scenarioPath: string; urlKey: string }> = [
    { scenarioPath: 'bewerbung', urlKey: 'pdf' },
    { scenarioPath: 'bewerbung', urlKey: 'sprache' },
    { scenarioPath: 'bewerbung', urlKey: 'labels' },
    { scenarioPath: 'bewerbung', urlKey: 'tastatur' },
    { scenarioPath: 'bewerbung', urlKey: 'fehler' },
  ];

  it('keeps every previously published {scenarioPath, urlKey} pair (add here on release)', () => {
    for (const { scenarioPath, urlKey } of PROTECTED_URL_KEYS) {
      const scenario = scenarios.find((candidate) => candidate.path === scenarioPath);
      const stillExists = scenario?.barriers.some((barrier) => urlKeysOf(barrier).includes(urlKey));
      expect(stillExists).withContext(`${scenarioPath}?frei=${urlKey}`).toBeTrue();
    }
  });

  it('references only barrierIds that exist in the scenario barrier list', () => {
    for (const scenario of scenarios) {
      const barrierIds = new Set(scenario.barriers.map((barrier) => barrier.id));
      for (const step of scenario.steps) {
        for (const barrierId of step.barrierIds) {
          expect(barrierIds.has(barrierId))
            .withContext(`${scenario.path}/${step.path} → ${barrierId}`)
            .toBeTrue();
        }
      }
    }
  });

  it('gives every combined barrier at least two parts with unique urlKeys', () => {
    // No combined barrier exists yet in v1 content (the CSR video barrier is
    // still a `status: 'planned'` stub), so this loop currently has nothing
    // to iterate — the assertion below keeps the spec meaningful rather than
    // silently vacuous until that barrier is authored.
    expect(scenarios.length).toBeGreaterThan(0);
    forEachBarrier(scenarios, (scenario, barrier) => {
      if (!barrier.parts) {
        return;
      }
      expect(barrier.parts.length)
        .withContext(`${scenario.path}/${barrier.urlKey}`)
        .toBeGreaterThanOrEqual(2);
      const partKeys = barrier.parts.map((part) => part.urlKey);
      expect(new Set(partKeys).size)
        .withContext(`${scenario.path}/${barrier.urlKey} parts`)
        .toBe(partKeys.length);
    });
  });

  it('has an axe fixture entry for every barrier with automatedDetection: axe', () => {
    forEachBarrier(scenarios, (scenario, barrier) => {
      if (barrier.automatedDetection !== 'axe') {
        return;
      }
      expect(AXE_RULE_FIXTURES[barrier.id])
        .withContext(`${scenario.path}/${barrier.id} is missing an AXE_RULE_FIXTURES entry`)
        .toBeDefined();
    });
  });

  it('keeps scenario path values unique', () => {
    const paths = scenarios.map((scenario) => scenario.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
