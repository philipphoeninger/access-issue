import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScenarioRegistry } from '../core/scenario-registry.service';
import { AXE_RULE_FIXTURES } from './axe-rule-fixtures';
import { RESPONSIBLE_AREAS } from '../models/domain.model';
import type { Barrier, BarrierPart, Scenario } from '../models/domain.model';

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

/**
 * Every part of every combined barrier. Parts are content in their own right
 * — the panel gives each one a checkbox and the explanation view renders each
 * one's prose and standards from `part.*`, never from the parent's — so the
 * guarantees below have to reach them. They did not: every assertion in this
 * file used to walk `scenario.barriers` only, which made "missing prose is
 * impossible by contract test" (docs/SPEC_v1.md slice 6) untrue for exactly
 * the barrier shape that has the most content to get wrong.
 */
function forEachPart(
  scenarios: readonly Scenario[],
  fn: (scenario: Scenario, barrier: Barrier, part: BarrierPart) => void,
): void {
  forEachBarrier(scenarios, (scenario, barrier) => {
    for (const part of barrier.parts ?? []) {
      fn(scenario, barrier, part);
    }
  });
}

describe('scenario data contract (docs/TESTING.md §8)', () => {
  let registry: ScenarioRegistry;
  let scenarios: readonly Scenario[];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    registry = TestBed.inject(ScenarioRegistry);
    scenarios = registry.getAll();
  });

  // Deliberately unfiltered: organisational barriers are covered here too.
  // They are exempt from citing a standard, never from being explained —
  // docs/PRD.md §6.1 requires them "auch ohne Normbezug vollständig erklärt".
  // Do not narrow this to non-organisational barriers; that is precisely the
  // shortcut the `organisational` flag must not open.
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

  // This is the guard docs/TESTING.md §8 calls "the inverse guard: without it,
  // 'organisational' becomes a way to skip editorial work". Only this direction
  // is asserted — an empty `standards` array requires `organisational: true`.
  //
  // The converse is deliberately NOT asserted. docs/ARCHITECTURE.md §6 says
  // standards "may be empty if and only if organisational is true" and
  // docs/TESTING.md §8 says "at least one StandardReference unless
  // organisational is true": both permit an organisational barrier to cite a
  // standard, neither requires it to cite none. docs/PRD.md §6.2 is the case
  // that makes the difference real — the procurement Lastenheft and
  // Nachweispflicht barriers are process omissions that still carry EN 301 549
  // and BFSG references. A strict biconditional here would force whoever writes
  // that content to delete those references to keep the suite green.
  it('allows an empty standards array only when the barrier is organisational', () => {
    forEachBarrier(scenarios, (scenario, barrier) => {
      if (barrier.standards.length > 0) {
        return;
      }
      expect(barrier.organisational)
        .withContext(
          `${scenario.path}/${barrier.urlKey}: empty standards requires organisational: true`,
        )
        .toBeTrue();
    });
  });

  // Same guarantee as for barriers, on the objects the explanation view
  // actually renders when a part is selected (`?erklaerung=video-ut`). Like
  // the combined-barrier test further down, this iterates nothing today — the
  // CSR video barrier is still a `status: 'planned'` stub — and it is written
  // now precisely so that it is already in place when that content is
  // authored, which is the moment it can fail.
  it('gives every part of a combined barrier non-empty problem, affected and solution prose', () => {
    forEachPart(scenarios, (scenario, barrier, part) => {
      const where = `${scenario.path}/${barrier.urlKey}/${part.urlKey}`;
      expect(part.explanation.problem.trim().length)
        .withContext(`${where} problem`)
        .toBeGreaterThan(0);
      expect(part.explanation.affected.trim().length)
        .withContext(`${where} affected`)
        .toBeGreaterThan(0);
      expect(part.explanation.solution.trim().length)
        .withContext(`${where} solution`)
        .toBeGreaterThan(0);
    });
  });

  // Parts have no `organisational` field (docs/ARCHITECTURE.md §6), so nothing
  // about a part could ever justify an empty `standards` array — while the
  // explanation view renders exactly one thing for an empty array:
  // „Sie verstößt gegen keine Norm" (docs/UX-COPY.md §5.8). Asserting that
  // claim is never made for a part is the only way to keep the view from
  // stating, in a teaching tool, something no one decided.
  //
  // If a genuinely organisational part is ever needed, the fix is to add
  // `organisational` to `BarrierPart` and mirror the barrier-level rule here —
  // not to delete this test.
  it('requires every part of a combined barrier to cite at least one standard', () => {
    forEachPart(scenarios, (scenario, barrier, part) => {
      expect(part.standards.length)
        .withContext(`${scenario.path}/${barrier.urlKey}/${part.urlKey}`)
        .toBeGreaterThan(0);
    });
  });

  it('gives every barrier a valid responsibleArea (docs/TESTING.md §8)', () => {
    const validAreas: readonly string[] = RESPONSIBLE_AREAS;
    forEachBarrier(scenarios, (scenario, barrier) => {
      expect(validAreas)
        .withContext(`${scenario.path}/${barrier.urlKey}: "${barrier.responsibleArea}"`)
        .toContain(barrier.responsibleArea);
    });
  });

  // `organisational` waives the standards reference and nothing else. The prose
  // requirement is already enforced for these barriers by the unfiltered test
  // above, so it is not restated here — a test that only re-checks a subset of
  // what another test already covers cannot fail on its own and gives false
  // confidence.
  //
  // The detection mode does need its own assertion. An organisational barrier
  // is by definition one with "nothing a checker could see"
  // (models/domain.model.ts), so marking it axe-detectable is a contradiction:
  // it would demand an AXE_RULE_FIXTURES entry and send the Playwright run-2
  // suite (docs/TESTING.md §5) hunting for a violation that can never appear.
  it('never marks an organisational barrier as axe-detectable', () => {
    forEachBarrier(scenarios, (scenario, barrier) => {
      if (!barrier.organisational) {
        return;
      }
      expect(barrier.automatedDetection)
        .withContext(`${scenario.path}/${barrier.urlKey} is organisational`)
        .toBe('manual');
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
    // The four-step application-process barrier set (docs/PRD.md §6.1). Keys are
    // append-only: the original five (pdf, sprache, labels, tastatur, fehler)
    // survived the two-step → four-step migration unchanged, and the six added
    // then are locked here going forward (docs/ARCHITECTURE.md §8, §18).
    { scenarioPath: 'bewerbung', urlKey: 'grafik' },
    { scenarioPath: 'bewerbung', urlKey: 'sprache' },
    { scenarioPath: 'bewerbung', urlKey: 'labels' },
    { scenarioPath: 'bewerbung', urlKey: 'tastatur' },
    { scenarioPath: 'bewerbung', urlKey: 'pflichtfeld' },
    { scenarioPath: 'bewerbung', urlKey: 'fehler' },
    { scenarioPath: 'bewerbung', urlKey: 'pdf' },
    { scenarioPath: 'bewerbung', urlKey: 'upload' },
    { scenarioPath: 'bewerbung', urlKey: 'bestaetigung' },
    { scenarioPath: 'bewerbung', urlKey: 'ansprechperson' },
    { scenarioPath: 'bewerbung', urlKey: 'inklusionshinweis' },
  ];

  it('keeps every previously published {scenarioPath, urlKey} pair (add here on release)', () => {
    for (const { scenarioPath, urlKey } of PROTECTED_URL_KEYS) {
      const scenario = scenarios.find((candidate) => candidate.path === scenarioPath);
      const stillExists = scenario?.barriers.some((barrier) => urlKeysOf(barrier).includes(urlKey));
      expect(stillExists).withContext(`${scenarioPath}?frei=${urlKey}`).toBeTrue();
    }
  });

  // The barrier panel renders one fieldset per declared group and fills it by
  // matching `groupId` (docs/ARCHITECTURE.md §12.1.1). A barrier naming a
  // group that does not exist would simply not be offered — a barrier nobody
  // can switch off, invisible in every screenshot. This is the assertion that
  // lets the panel filter without a catch-all group of its own.
  it('resolves every groupId to a group the scenario declares', () => {
    forEachBarrier(scenarios, (scenario, barrier) => {
      const groupIds = scenario.groups.map((group) => group.id);
      expect(groupIds)
        .withContext(`${scenario.path}/${barrier.urlKey}: groupId "${barrier.groupId}"`)
        .toContain(barrier.groupId);
    });
  });

  // The other direction. An empty group renders as a fieldset with a legend
  // and nothing in it — a heading promising controls that are not there, and
  // in a single-page scenario an anchor to a section whose barriers went
  // somewhere else.
  it('gives every declared group at least one barrier', () => {
    for (const scenario of scenarios) {
      for (const group of scenario.groups) {
        const count = scenario.barriers.filter((barrier) => barrier.groupId === group.id).length;
        expect(count).withContext(`${scenario.path} → group "${group.id}"`).toBeGreaterThan(0);
      }
    }
  });

  // Group ids reach the DOM as `barrier-group-{id}-title` and
  // `barrier-group-{id}-anchor` (frame/barrier-panel), which the anchor link's
  // `aria-labelledby` then references. Holding them to the urlKey shape keeps
  // those ids valid and unambiguous; nothing else would.
  it('keeps group ids unique within a scenario and matching /^[a-z0-9-]+$/', () => {
    for (const scenario of scenarios) {
      const ids = scenario.groups.map((group) => group.id);
      expect(new Set(ids).size).withContext(`${scenario.path} group ids`).toBe(ids.length);
      for (const id of ids) {
        expect(id).withContext(`${scenario.path} group "${id}"`).toMatch(URL_KEY_PATTERN);
      }
    }
  });

  // An `anchorId` is a link target inside the simulation region, so it obeys
  // the region's id rule (docs/ARCHITECTURE.md §5.6 rule 2, CLAUDE.md rule 2).
  // Without the prefix it could collide with a frame id and quietly steal a
  // `for` or `aria-labelledby` reference across the boundary.
  it('prefixes every group anchorId with sim-', () => {
    for (const scenario of scenarios) {
      for (const group of scenario.groups) {
        if (group.anchorId === undefined) {
          continue;
        }
        expect(group.anchorId)
          .withContext(`${scenario.path} → group "${group.id}"`)
          .toMatch(/^sim-[a-z0-9-]+$/);
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

  // core/scenario-routes.ts (firstStepPath, buildScenarioRoutes) reads
  // scenario.steps[0] unconditionally for every 'available' scenario — an
  // available scenario with an empty steps array would crash routing and
  // the home page's scenario list. ARCHITECTURE.md §6 already documents the
  // invariant ("a single-page scenario is modelled as a scenario with one
  // step"); this test is what actually enforces it.
  it('gives every available scenario at least one step', () => {
    for (const scenario of scenarios) {
      if (scenario.status !== 'available') {
        continue;
      }
      expect(scenario.steps.length).withContext(scenario.path).toBeGreaterThan(0);
    }
  });
});
