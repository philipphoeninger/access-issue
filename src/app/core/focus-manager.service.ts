// Route-change accessibility (docs/ARCHITECTURE.md §9). Angular does not move
// focus on client-side navigation by itself, which leaves screen reader
// users unaware the page changed. On every `NavigationEnd` *after* the
// app's initial load, this focuses the page `h1`, announces the page change
// through the frame's single live region, and resets scroll position.
//
// The announcement is the page title plus how many barriers are still active
// (docs/UX-COPY.md §5.7 "Seitenwechsel") — see `pageChangeAnnouncement`. That
// is why a service otherwise concerned with focus knows about scenarios at
// all: §5.7 gives every announcement in this application the same two-
// sentence shape, and the frame has exactly one live region to say them in
// (docs/ARCHITECTURE.md §12.2), so this is the only place the sentence can be
// assembled without a second announcer racing it.
//
// Two kinds of NavigationEnd are deliberately excluded.
//
// The initial load, for two reasons, not one:
//  - Angular Router fires a `NavigationEnd` for the very first navigation
//    too, and moving focus away from the browser's own initial focus state
//    (the top of the document) on first load is itself a known
//    anti-pattern — it would jump a keyboard user's very first Tab press
//    straight past the skip links (UX-COPY.md §5.1: "erste fokussierbare
//    Elemente"), defeating the one thing they exist to guarantee.
//  - The problem this service solves — a route change with no full page
//    load, so nothing tells assistive tech the page content changed — does
//    not exist on first load; the browser's normal page-load behaviour
//    already covers it.
// The document title is still set on first load (`Title`), since that has
// no bearing on focus or tab order.
//
// And navigations that keep the same path — a barrier toggle writing `frei`,
// a fragment link moving focus to its target — which are not page changes at
// all; the reasoning is at the check itself in `onNavigationEnd`.
//
// A root-provided singleton, constructed once and never destroyed — the
// subscription below lives for the application's lifetime, so it does not
// need `takeUntilDestroyed()`. AppShellComponent injects this service once,
// at the root of the component tree, purely to force its construction; the
// service itself does no rendering.
import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import type { ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs';
import type { Scenario } from '../models/domain.model';
import { Announcer } from './announcer.service';
import { BarrierStateService } from './barrier-state.service';
import { ScenarioRegistry } from './scenario-registry.service';
import type { ScenarioRouteData } from './scenario-routes';

@Injectable({ providedIn: 'root' })
export class FocusManager {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly announcer = inject(Announcer);
  private readonly registry = inject(ScenarioRegistry);
  private readonly barriers = inject(BarrierStateService);

  /** Path of the last navigation, query string and fragment stripped. */
  private lastPath: string | null = null;

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.onNavigationEnd(event));
  }

  private onNavigationEnd(event: NavigationEnd): void {
    const path = event.urlAfterRedirects.split(/[?#]/)[0];
    const isFirstNavigation = this.lastPath === null;
    const isSamePage = path === this.lastPath;
    this.lastPath = path;

    // Not every NavigationEnd is a page change, and treating them alike
    // breaks two things at once. Resolving a barrier writes a query
    // parameter (docs/ARCHITECTURE.md §8) — focus has to stay on the
    // checkbox the user just activated (§12.2), not jump to the h1. And a
    // fragment link — the skip links, the simulation region's exit link —
    // makes the browser move focus to its target, which the router then
    // reports as a navigation; focusing the h1 here would undo the jump the
    // user asked for and silently break the safety-critical exit path
    // (docs/TESTING.md §7). Same path, so: nothing to announce, nothing to
    // focus, and no scroll to the top either.
    if (isSamePage) {
      return;
    }

    if (!isFirstNavigation) {
      this.document.defaultView?.scrollTo(0, 0);
    }

    // The router outlet's newly activated component is not guaranteed to
    // have rendered its view yet when NavigationEnd fires — under zoneless
    // change detection this is true on the *first* navigation too, since a
    // route component's interpolated bindings (e.g. `{{ scenario().title }}`
    // in the h1) are only populated by the next change-detection pass, not
    // by the synchronous activation itself. A macrotask lets that pass run
    // before this looks for an <h1>, on every navigation alike.
    setTimeout(() => {
      if (isFirstNavigation) {
        this.setTitleFromHeading();
      } else {
        this.focusHeading();
      }
    });
  }

  private setTitleFromHeading(): void {
    const text = this.document.querySelector('h1')?.textContent?.trim() ?? '';
    this.title.setTitle(text === '' ? 'AccessIssue' : `${text} – AccessIssue`);
  }

  private focusHeading(): void {
    const heading = this.document.querySelector('h1');
    if (!heading) {
      return;
    }

    // Programmatic focus only, never user-initiated — the one case allowed
    // to suppress the visible focus ring (docs/DESIGN.md §5), via the
    // `h1[tabindex="-1"]:focus` rule in src/styles.scss.
    heading.setAttribute('tabindex', '-1');
    (heading as HTMLElement).focus();

    const text = heading.textContent?.trim() ?? '';
    this.title.setTitle(text === '' ? 'AccessIssue' : `${text} – AccessIssue`);
    this.announcer.announce(this.pageChangeAnnouncement(text));
  }

  /**
   * docs/UX-COPY.md §5.7, "Seitenwechsel": *{Seitentitel}. {n} von {total}
   * Barrieren aktiv.* Same two-sentence shape as every other announcement —
   * what is now, how many remain — so a screen reader user who arrives on a
   * step knows immediately how much of it is still broken, without having to
   * go looking for the simulation bar.
   *
   * The count is only appended where it means something: the home page and
   * the not-found page have no barriers, and "0 von 0 Barrieren aktiv" is not
   * a sentence. Those keep the bare title.
   *
   * This is not a second counter (CLAUDE.md rule 17). It is spoken once, on
   * arrival, and rendered nowhere.
   */
  private pageChangeAnnouncement(title: string): string {
    const scenario = this.currentScenario();
    if (!scenario || scenario.barriers.length === 0) {
      return title;
    }

    const active = this.barriers.activeBarrierCount(scenario);
    return `${title}. ${active} von ${scenario.barriers.length} Barrieren aktiv.`;
  }

  /**
   * The scenario of the route just activated, read from the router's own
   * snapshot rather than from the URL string: `scenarioPath` is put into the
   * route `data` by core/scenario-routes.ts, so this cannot drift out of sync
   * with the path grammar the way a hand-written parse would. `undefined` for
   * any route that is not a scenario step.
   *
   * Read at announcement time, after `NavigationEnd`, so the snapshot is
   * already the new one — and `frei` with it, which is what makes the count
   * correct on a deep link into a partially resolved scenario.
   */
  private currentScenario(): Scenario | undefined {
    let route: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const { scenarioPath } = route.data as Partial<ScenarioRouteData>;
    if (!scenarioPath) {
      return undefined;
    }
    return this.registry.getScenario(scenarioPath);
  }
}
