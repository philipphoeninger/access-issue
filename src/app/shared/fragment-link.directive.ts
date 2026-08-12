// Same-document fragment links that survive `<base href>`.
//
// `src/index.html` carries `<base href="/">`, which every Angular build needs
// so that hashed script and style URLs still resolve on a deep-linked route.
// The side effect is easy to miss and impossible to see in the markup: a bare
// `href="#panel"` is resolved against the *base* URL rather than the current
// document, so on `/szenario/bewerbung/stellenanzeige` it points at `/#panel`
// — a different document. Clicking it reloads the application on the home
// page instead of moving focus, which is a broken skip link and, for the
// simulation region's exit link, a broken escape route
// (docs/ARCHITECTURE.md §5.1, docs/TESTING.md §7).
//
// This directive writes the full current path, query string included, in
// front of the fragment, so the browser performs a genuine same-document
// navigation: it scrolls to the target and — this is the part that matters —
// focuses it, natively, without any focus code of our own.
//
// It is deliberately not `routerLink` + `fragment`. That renders a correct
// href but the router intercepts the click and performs a navigation of its
// own, which changes the URL and neither scrolls nor moves focus. A skip link
// that quietly does nothing is worse than one that reloads.
//
// **This assumes path-based routing** (docs/ARCHITECTURE.md §9). Under the
// last-resort hosting fallback `withHashLocation()`, `prepareExternalUrl`
// returns `#/szenario/…`, and appending a fragment to that yields a href with
// two `#` — the concrete form of the warning §9 already gives, that hash
// fragments interact badly with the in-page anchors this application relies
// on. Switching to hash location means solving the skip links first, not
// afterwards.
import { Location } from '@angular/common';
import { Directive, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Directive({
  selector: 'a[appFragmentLink]',
  host: { '[attr.href]': 'href()' },
})
export class FragmentLink {
  /** The id of the target element, without the leading `#`. */
  readonly appFragmentLink = input.required<string>();

  private readonly router = inject(Router);
  private readonly location = inject(Location);

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    { initialValue: null },
  );

  readonly href = computed(() => {
    // Read for its dependency, not its value: `router.url` is not a signal,
    // so the href has to be recomputed whenever navigation changes it. Query
    // params are part of it, and dropping them would turn every barrier
    // toggle into a state-losing full page load.
    this.navigationEnd();

    const [pathAndQuery] = this.router.url.split('#');
    return `${this.location.prepareExternalUrl(pathAndQuery)}#${this.appFragmentLink()}`;
  });
}
