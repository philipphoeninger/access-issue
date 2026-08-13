// docs/UX-COPY.md §5.10, docs/ARCHITECTURE.md §17 "Link to a `planned`
// scenario". Two of the three scenarios are registry stubs with no steps and
// no barriers (docs/SPEC_v1.md §3), and their paths are already written down
// in ARCHITECTURE.md §9 — so a slide, a bookmark or a hand-typed address can
// point at one long before the content exists. Without this page such a link
// would land on the not-found route, telling a lecturer their link is broken
// when it is merely early.
//
// Deliberately generic: it names neither the scenario nor a date. Both would
// be new editorial content, and content is WERTE.IT's (CLAUDE.md rules 14 and
// 15) — the three strings below are what §5.10 gives, verbatim.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-planned-scenario-page',
  imports: [RouterLink, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planned-scenario-page.component.html',
  styleUrl: './planned-scenario-page.component.scss',
})
export class PlannedScenarioPageComponent {}
