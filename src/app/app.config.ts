import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { UrlSerializer, provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { TolerantUrlSerializer } from './core/tolerant-url-serializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    // A malformed query string must degrade to the default state, not take
    // the navigation down with it (docs/ARCHITECTURE.md §17) — see
    // core/tolerant-url-serializer.ts for what the default serialiser does
    // to `?frei=%E0%A4%A` and why url-state.ts's own defensive decoding
    // never gets to see it.
    { provide: UrlSerializer, useClass: TolerantUrlSerializer },
    // Angular Material in the frame only (docs/ARCHITECTURE.md §11 corollary).
    // Async so the animations renderer is a separate chunk, not part of the
    // initial bundle. Verified compatible with zoneless change detection by
    // the Slice 0 spike (src/app/zoneless-material.spec.ts).
    provideAnimationsAsync(),
  ],
};
