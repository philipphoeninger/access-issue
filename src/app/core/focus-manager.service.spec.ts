import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Announcer } from './announcer.service';
import { FocusManager } from './focus-manager.service';

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// docs/ARCHITECTURE.md §9 says FocusManager acts "on every NavigationEnd",
// but Angular Router also fires NavigationEnd for the app's initial load —
// and moving focus away from the browser's own starting position there would
// jump a keyboard user's first Tab press past the skip links
// (UX-COPY.md §5.1). The first NavigationEnd this service ever sees is
// therefore treated as the initial load: title only, no focus, no
// announcement. `navigateOnce` fires that one and settles it, so each test
// below can exercise the "real" (second-and-later) navigation behaviour.
async function navigateOnce(events: Subject<unknown>, id = 1): Promise<void> {
  events.next(new NavigationEnd(id, '/a', '/a'));
  await settle();
}

describe('FocusManager (docs/ARCHITECTURE.md §9)', () => {
  let events: Subject<unknown>;
  let heading: HTMLHeadingElement;

  beforeEach(() => {
    events = new Subject();
    const router = { events } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: Router, useValue: router }],
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
      await navigateOnce(events, 2);

      expect(document.activeElement).toBe(heading);
      expect(heading.getAttribute('tabindex')).toBe('-1');
    });

    it('announces the heading text through the frame live region', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1);
      heading.textContent = 'Bewerbungsformular';
      await navigateOnce(events, 2);

      expect(TestBed.inject(Announcer).message()).toBe('Bewerbungsformular');
    });

    it('updates the document title', async () => {
      TestBed.inject(FocusManager);
      await navigateOnce(events, 1);
      heading.textContent = 'Bewerbungsformular';
      await navigateOnce(events, 2);

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

  it('ignores router events other than NavigationEnd', async () => {
    TestBed.inject(FocusManager);
    events.next(new NavigationStart(1, '/a'));
    await settle();

    expect(document.activeElement).not.toBe(heading);
  });
});
