import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import type { NavigationExtras, Params } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { BarrierStateService } from './barrier-state.service';
import { BEWERBUNG_BARRIERS, VIDEO_BARRIERS, makeScenario } from './testing/barrier-fixtures';

/** The service always navigates with `[]` + queryParams — extras is never actually omitted. */
function mostRecentExtras(router: jasmine.SpyObj<Router>): NavigationExtras & {
  queryParams: Params;
} {
  const extras = router.navigate.calls.mostRecent().args[1];
  if (!extras || !extras.queryParams) {
    throw new Error('expected router.navigate to have been called with queryParams');
  }
  return extras as NavigationExtras & { queryParams: Params };
}

// docs/TESTING.md §9: "Router spy confirms replaceUrl: true is set on
// toggles and absent on step navigation." Step navigation lives in the app
// shell (slice 3) and has nothing to test here yet — this suite asserts the
// half that belongs to this service: replaceUrl is true on every write.
describe('BarrierStateService (docs/ARCHITECTURE.md §7)', () => {
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let router: jasmine.SpyObj<Router>;
  let service: BarrierStateService;

  function setup(initialQueryParams: Record<string, string> = {}): void {
    queryParams = new BehaviorSubject(convertToParamMap(initialQueryParams));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
      ],
    });
    service = TestBed.inject(BarrierStateService);
  }

  const scenario = makeScenario(BEWERBUNG_BARRIERS);
  const videoScenario = makeScenario(VIDEO_BARRIERS);

  describe('resolvedKeys / isResolved', () => {
    it('resolves nothing when frei is absent — the default, all-active state', () => {
      setup();
      expect(service.resolvedKeys(scenario)).toEqual(new Set());
      expect(service.isResolved(scenario, 'labels')).toBeFalse();
    });

    it('reads resolved barriers from the frei query param', () => {
      setup({ frei: 'labels,fehler' });
      expect(service.resolvedKeys(scenario)).toEqual(new Set(['labels', 'fehler']));
      expect(service.isResolved(scenario, 'labels')).toBeTrue();
      expect(service.isResolved(scenario, 'pdf')).toBeFalse();
    });
  });

  describe('isBarrierResolved — the combined-barrier rule', () => {
    it('is resolved for a simple barrier once its own key is resolved', () => {
      setup({ frei: 'labels' });
      const labelsBarrier = scenario.barriers.find((b) => b.urlKey === 'labels')!;
      expect(service.isBarrierResolved(scenario, labelsBarrier)).toBeTrue();
    });

    it('is not resolved for a combined barrier when only one part is resolved', () => {
      setup({ frei: 'video-ut' });
      const videoBarrier = videoScenario.barriers.find((b) => b.urlKey === 'video')!;
      expect(service.isBarrierResolved(videoScenario, videoBarrier)).toBeFalse();
    });

    it('is resolved for a combined barrier only once every part is', () => {
      setup({ frei: 'video-ut,video-transkript' });
      const videoBarrier = videoScenario.barriers.find((b) => b.urlKey === 'video')!;
      expect(service.isBarrierResolved(videoScenario, videoBarrier)).toBeTrue();
    });
  });

  // The number the simulation bar renders and the panel's announcements
  // speak (docs/UX-COPY.md §5.4, §5.7). The partial case is the judgement
  // call worth protecting: a barrier that still stands, even partly, is still
  // a barrier (docs/UX-COPY.md §5.6).
  describe('activeBarrierCount', () => {
    it('counts every barrier while none is resolved', () => {
      setup();
      expect(service.activeBarrierCount(scenario)).toBe(scenario.barriers.length);
    });

    it('counts down as barriers are resolved', () => {
      setup({ frei: 'labels,fehler' });
      expect(service.activeBarrierCount(scenario)).toBe(scenario.barriers.length - 2);
    });

    it('reaches zero once every barrier is resolved', () => {
      setup({ frei: 'alle' });
      expect(service.activeBarrierCount(scenario)).toBe(0);
    });

    it('counts a partially resolved combined barrier as active', () => {
      setup({ frei: 'video-ut' });
      expect(service.activeBarrierCount(videoScenario)).toBe(videoScenario.barriers.length);
    });
  });

  describe('explainedUrlKey', () => {
    it('is undefined when erklaerung is absent', () => {
      setup();
      expect(service.explainedUrlKey(scenario)).toBeUndefined();
    });

    it('reads the explained barrier from the erklaerung query param', () => {
      setup({ erklaerung: 'pdf' });
      expect(service.explainedUrlKey(scenario)).toBe('pdf');
    });

    it('falls back to the empty state for an unknown erklaerung value', () => {
      setup({ erklaerung: 'unbekannt' });
      expect(service.explainedUrlKey(scenario)).toBeUndefined();
    });
  });

  describe('toggle', () => {
    it('activates a resolved barrier, navigating with replaceUrl and the new frei value', () => {
      setup({ frei: 'labels,fehler' });
      service.toggle(scenario, 'labels');

      expect(router.navigate).toHaveBeenCalledTimes(1);
      const commands = router.navigate.calls.mostRecent().args[0];
      const extras = mostRecentExtras(router);
      expect(commands).toEqual([]);
      expect(extras.replaceUrl).toBeTrue();
      expect(extras.queryParams).toEqual({ frei: 'fehler', erklaerung: 'labels' });
    });

    it('resolves an active barrier', () => {
      setup({ frei: 'fehler' });
      service.toggle(scenario, 'labels');

      const extras = mostRecentExtras(router);
      expect(extras.queryParams['frei']).toBe('fehler,labels');
      expect(extras.queryParams['erklaerung']).toBe('labels');
    });

    it('sets frei to null (omits the param) when the toggle empties the resolved set', () => {
      setup({ frei: 'labels' });
      service.toggle(scenario, 'labels');

      const extras = mostRecentExtras(router);
      expect(extras.queryParams['frei']).toBeNull();
    });

    it("toggles every part of a combined barrier together when given the parent's urlKey", () => {
      setup({ frei: 'video-ut' });
      service.toggle(videoScenario, 'video');

      // one part was already resolved, so the lockstep toggle resolves the rest —
      // the other scenario barriers are untouched, so this is not 'alle'
      const extras = mostRecentExtras(router);
      expect(extras.queryParams['frei']).toBe('video-transkript,video-ut');
      expect(extras.queryParams['erklaerung']).toBe('video');
    });

    it('deactivates every part together when all parts were already resolved', () => {
      setup({ frei: 'video-ut,video-transkript' });
      service.toggle(videoScenario, 'video');

      const extras = mostRecentExtras(router);
      expect(extras.queryParams['frei']).toBeNull();
    });

    it('always sets replaceUrl: true, never pushes a history entry', () => {
      setup();
      service.toggle(scenario, 'pdf');
      expect(mostRecentExtras(router).replaceUrl).toBeTrue();
    });

    // A urlKey outside this scenario cannot land in the URL as an
    // explanation target — the same "never leak a foreign key" guarantee
    // frei already gets from serialiseResolvedKeys, which is also why frei
    // here comes back unchanged: the unknown key is dropped during
    // serialisation, same as it would be on the next parse.
    it('does not write erklaerung for a urlKey outside the scenario', () => {
      setup({ frei: 'labels' });
      service.toggle(scenario, 'unbekannt');

      const extras = mostRecentExtras(router);
      expect(extras.queryParams['frei']).toBe('labels');
      expect('erklaerung' in extras.queryParams).toBeFalse();
    });
  });

  describe('resolveAll / resetAll', () => {
    it('resolveAll navigates with frei=alle, clears erklaerung, and sets replaceUrl: true', () => {
      setup({ frei: 'labels', erklaerung: 'labels' });
      service.resolveAll();

      const commands = router.navigate.calls.mostRecent().args[0];
      const extras = mostRecentExtras(router);
      expect(commands).toEqual([]);
      expect(extras.queryParams).toEqual({ frei: 'alle', erklaerung: null });
      expect(extras.replaceUrl).toBeTrue();
    });

    it('resetAll navigates with frei=null (omitted), clears erklaerung, and sets replaceUrl: true', () => {
      setup({ frei: 'alle', erklaerung: 'labels' });
      service.resetAll();

      const extras = mostRecentExtras(router);
      expect(extras.queryParams).toEqual({ frei: null, erklaerung: null });
      expect(extras.replaceUrl).toBeTrue();
    });
  });
});
