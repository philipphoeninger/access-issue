import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    // Angular Material in the frame only (docs/ARCHITECTURE.md §11 corollary).
    // Async so the animations renderer is a separate chunk, not part of the
    // initial bundle. Verified compatible with zoneless change detection by
    // the Slice 0 spike (src/app/zoneless-material.spec.ts).
    provideAnimationsAsync(),
  ],
};
