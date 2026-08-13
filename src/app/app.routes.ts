// docs/ARCHITECTURE.md §9. Home, one route per scenario step (generated from
// the registry so a new available scenario needs no routing edit here), the
// two special-state routes a `planned` scenario answers on (also generated,
// see core/scenario-routes.ts), and a wildcard.
//
// The wildcard renders the not-found page rather than redirecting home
// (docs/ARCHITECTURE.md §17, docs/SPEC_v1.md §5 Slice 11): a redirect
// swallows the address that was actually followed, so a mistyped or outdated
// deep link from a module slide would quietly look like the home page and
// nobody would ever learn the link is broken.
import { Routes } from '@angular/router';
import { SCENARIOS } from './core/scenario-registry.service';
import { buildScenarioRoutes } from './core/scenario-routes';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./frame/home-page/home-page.component').then((m) => m.HomePageComponent),
  },
  ...buildScenarioRoutes(SCENARIOS),
  {
    path: '**',
    loadComponent: () =>
      import('./frame/not-found-page/not-found-page.component').then(
        (m) => m.NotFoundPageComponent,
      ),
  },
];
