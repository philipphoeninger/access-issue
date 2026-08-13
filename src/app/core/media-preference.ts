// System preferences as signals (docs/ARCHITECTURE.md §5.5, CLAUDE.md rule 9).
//
// `prefers-reduced-motion` and `forced-colors` beat every simulated barrier,
// without exception, and whenever one of them does the frame says so
// (core/suppression-notice.service.ts). To say it, something has to know the
// preference is on — and it has to keep knowing: a user who switches high
// contrast on while the page is open must see the note appear, not on the next
// reload.
//
// A live `matchMedia` listener rather than a one-off read, for exactly that
// reason. Everything else about the preferences is handled in CSS
// (src/styles/_tokens.scss); this file exists only so a component can *render
// text* about them.
import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, signal, type Signal } from '@angular/core';

/**
 * Tracks a media query for as long as the calling injection context lives.
 *
 * Must be called from an injection context (a field initialiser or a
 * constructor), because it takes the caller's `DestroyRef` to remove its
 * listener. On a platform without `matchMedia` — a server render, a test
 * environment that stubs the document — it returns a constant `false` rather
 * than throwing: a missing preference is the same situation as a preference
 * that is off, and neither is worth crashing a page over.
 */
export function mediaPreference(query: string): Signal<boolean> {
  const view = inject(DOCUMENT).defaultView;
  if (view === null || typeof view.matchMedia !== 'function') {
    return signal(false).asReadonly();
  }

  const list = view.matchMedia(query);
  const matches = signal(list.matches);
  const onChange = (event: MediaQueryListEvent): void => matches.set(event.matches);

  list.addEventListener('change', onChange);
  inject(DestroyRef).onDestroy(() => list.removeEventListener('change', onChange));

  return matches.asReadonly();
}

/** docs/UX-COPY.md §5.9 `suppressed.forcedColors`. */
export const FORCED_COLORS = '(forced-colors: active)';

/** docs/UX-COPY.md §5.9 `suppressed.reducedMotion`. */
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
