// docs/ARCHITECTURE.md §9. Home, one route per scenario step (generated from
// the registry so a new available scenario needs no routing edit here), and
// a wildcard. The wildcard redirects to home for now — the dedicated
// not-found page with its own accessible state is Slice 9's deliverable
// (docs/SPEC_v1.md §5 Slice 9); a redirect is already a "defined state with
// no error page" in the meantime.
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
  { path: '**', redirectTo: '' },
];
