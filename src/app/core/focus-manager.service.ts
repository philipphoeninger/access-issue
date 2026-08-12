// Route-change accessibility (docs/ARCHITECTURE.md §9). Angular does not move
// focus on client-side navigation by itself, which leaves screen reader
// users unaware the page changed. On every `NavigationEnd` *after* the
// app's initial load, this focuses the page `h1`, announces its text through
// the frame's single live region, and resets scroll position.
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
import { filter } from 'rxjs';
import { Announcer } from './announcer.service';

@Injectable({ providedIn: 'root' })
export class FocusManager {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly announcer = inject(Announcer);

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
    this.announcer.announce(text);
  }
}
