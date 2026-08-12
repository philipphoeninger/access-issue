import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationStart,
  Router,
  convertToParamMap,
} from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { Announcer } from './announcer.service';
import { FocusManager } from './focus-manager.service';

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * The leaf route snapshot FocusManager walks to when it looks up the current
 * scenario. `data` carries what core/scenario-routes.ts puts there; an empty
 * object stands for a non-scenario route (home, not found).
 */
function routerStateWith(data: Record<string, unknown>): { snapshot: { root: unknown } } {
  return { snapshot: { root: { firstChild: { firstChild: null, data } } } };
}

// docs/ARCHITECTURE.md §9 says FocusManager acts "on every NavigationEnd",
// but Angular Router also fires NavigationEnd for the app's initial load —
// and moving focus away from the browser's own starting position there would
// jump a keyboard user's first Tab press past the skip links
// (UX-COPY.md §5.1). The first NavigationEnd this service ever sees is
// therefore treated as the initial load: title only, no focus, no
// announcement. `navigateOnce` fires that one and settles it, so each test
// below can exercise the "real" (second-and-later) navigation behaviour.
async function navigateOnce(events: Subject<unknown>, id = 1, url = '/a'): Promise<void> {
  events.next(new NavigationEnd(id, url, url));
  await settle();
}

describe('FocusManager (docs/ARCHITECTURE.md §9)', () => {
  let events: Subject<unknown>;
  let heading: HTMLHeadingElement;
  let routerState: { snapshot: { root: unknown } };
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  /** Puts the fake router on a scenario step, the way scenario-routes.ts would. */
  function onScenarioRoute(frei?: string): void {
    routerState.snapshot.root = routerStateWith({
      scenarioPath: 'bewerbung',
      stepPath: 'formular',
      hasPanel: true,
    }).snapshot.root;
    queryParams.next(convertToParamMap(frei === undefined ? {} : { frei }));
  }

  beforeEach(() => {
    events = new Subject();
    // Default: a route with no scenario in its data — the home page.
    routerState = routerStateWith({});
    queryParams = new BehaviorSubject(convertToParamMap({}));
    const router = { events, routerState } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: router },
        // For BarrierStateService, which FocusManager reads the active
        // barrier count from (docs/UX-COPY.md §5.7).
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
      ],
    });

    heading = document.createElement('h1');
    heading.textContent = 'Bewerbungsprozess';
    document.body.appendChild(heading);
  });

  afterEach(() => {
    heading.remove();
    document.title = '';
  });

  describe('the first NavigationEnd (initial load)', () => {
    it('sets the document title from the heading', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events);

      expect(TestBed.inject(Title).getTitle()).toBe('Bewerbungsprozess – AccessIssue');
    });

    it('does not move focus', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events);

      expect(document.activeElement).not.toBe(heading);
    });

    it('does not announce anything', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events);

      expect(TestBed.inject(Announcer).message()).toBe('');
    });

    it('reads the heading correctly even if it only appears after NavigationEnd fires, not before (zoneless render timing)', async () => {
      // Under zoneless change detection, a route component's interpolated
      // h1 (e.g. `{{ scenario().title }}`) is not guaranteed to be in the
      // DOM yet exactly when NavigationEnd fires — a synchronous read here
      // would previously see an empty document and fall back to the generic
      // title permanently, since the first NavigationEnd never re-runs.
      heading.remove();
      TestBed.inject(FocusManager);

      events.next(new NavigationEnd(1, '/a', '/a'));
      document.body.appendChild(heading); // simulates the deferred render
      await settle();

      expect(TestBed.inject(Title).getTitle()).toBe('Bewerbungsprozess – AccessIssue');
    });
  });

  describe('a later NavigationEnd (client-side route change)', () => {
    it('focuses the page h1, via a programmatic tabindex', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1);
      heading.textContent = 'Bewerbungsformular';
      await navigateOnce(events, 2, '/b');

      expect(document.activeElement).toBe(heading);
      expect(heading.getAttribute('tabindex')).toBe('-1');
    });

    // docs/UX-COPY.md §5.7 "Seitenwechsel". A route with no barriers — the
    // home page, the not-found page — keeps the bare title, because "0 von 0
    // Barrieren aktiv" is not a sentence.
    it('announces the heading text on a route without barriers', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1);
      heading.textContent = 'AccessIssue: Barrieren sichtbar machen';
      await navigateOnce(events, 2, '/b');

      expect(TestBed.inject(Announcer).message()).toBe('AccessIssue: Barrieren sichtbar machen');
    });

    // The announcement names the step, because the h1 does not: it carries
    // the scenario title and is the same on all four steps (UX-COPY §5.3).
    it('announces the step and how many barriers are still active on a scenario step', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1);
      heading.textContent = 'Bewerbungsprozess';
      onScenarioRoute();
      await navigateOnce(events, 2, '/szenario/bewerbung/formular');

      expect(TestBed.inject(Announcer).message()).toBe(
        'Bewerbungsprozess, Schritt 2 von 4 — Bewerbungsformular. 11 von 11 Barrieren aktiv.',
      );
    });

    it('titles the document by the step, so two steps are not the same tab', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1);
      onScenarioRoute();
      await navigateOnce(events, 2, '/szenario/bewerbung/formular');

      expect(TestBed.inject(Title).getTitle()).toBe(
        'Bewerbungsprozess, Schritt 2 von 4 — Bewerbungsformular – AccessIssue',
      );
    });

    // The count is read after NavigationEnd, so a deep link into a partially
    // resolved scenario announces what the URL actually says — not the
    // default all-active state.
    it('counts the barriers resolved in the URL of the page being entered', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1);
      heading.textContent = 'Bewerbungsprozess';
      onScenarioRoute('labels,pdf,grafik');
      await navigateOnce(events, 2, '/szenario/bewerbung/formular?frei=labels,pdf,grafik');

      expect(TestBed.inject(Announcer).message()).toBe(
        'Bewerbungsprozess, Schritt 2 von 4 — Bewerbungsformular. 8 von 11 Barrieren aktiv.',
      );
    });

    it('updates the document title', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1);
      heading.textContent = 'Bewerbungsformular';
      await navigateOnce(events, 2, '/b');

      expect(TestBed.inject(Title).getTitle()).toBe('Bewerbungsformular – AccessIssue');
    });

    it('does nothing if the page has no h1', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1);
      heading.remove();

      expect(() => {
        events.next(new NavigationEnd(2, '/b', '/b'));
      }).not.toThrow();
      await settle();
    });
  });

  // A navigation that keeps the path is not a page change. Two things in the
  // application produce one, and both would be broken by focusing the h1:
  // a barrier toggle writing `frei` (focus must stay on the checkbox,
  // docs/ARCHITECTURE.md §12.2) and a fragment link, where the browser has
  // just moved focus to the target the user asked for (docs/TESTING.md §7).
  describe('a NavigationEnd that only changes the query string or fragment', () => {
    it('leaves focus where it is when a barrier toggle rewrites `frei`', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1, '/szenario/bewerbung/formular');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      document.body.appendChild(checkbox);
      checkbox.focus();

      await navigateOnce(events, 2, '/szenario/bewerbung/formular?frei=labels');

      expect(document.activeElement).toBe(checkbox);
      checkbox.remove();
    });

    it('leaves focus where it is when a fragment link moves it', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1, '/szenario/bewerbung/formular');

      const target = document.createElement('div');
      target.tabIndex = -1;
      document.body.appendChild(target);
      target.focus();

      await navigateOnce(events, 2, '/szenario/bewerbung/formular#panel');

      expect(document.activeElement).toBe(target);
      target.remove();
    });

    it('announces nothing, so a toggle announcement is never overwritten', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1, '/szenario/bewerbung/formular');
      await navigateOnce(events, 2, '/szenario/bewerbung/formular?frei=alle');

      expect(TestBed.inject(Announcer).message()).toBe('');
    });
  });

  it('ignores router events other than NavigationEnd', async () => {
    TestBed.inject(FocusManager);
    events.next(new NavigationStart(1, '/a'));
    await settle();

    expect(document.activeElement).not.toBe(heading);
  });
});
