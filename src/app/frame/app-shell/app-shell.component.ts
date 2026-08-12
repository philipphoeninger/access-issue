// Everything outside the simulation region that is shared by every page:
// skip links, header, scenario navigation, the routed content, and the
// frame's single live region (docs/ARCHITECTURE.md §12.2). This is the one
// place SkipLinksComponent, FocusManager and Announcer come together.
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { filter } from 'rxjs';
import { Announcer } from '../../core/announcer.service';
import { FocusManager } from '../../core/focus-manager.service';
import { ScenarioRegistry } from '../../core/scenario-registry.service';
import { firstStepPath } from '../../core/scenario-routes';
import type { Scenario } from '../../models/domain.model';
import { VisuallyHidden } from '../../shared/visually-hidden.directive';
import { SkipLinksComponent } from '../../shared/skip-links/skip-links.component';

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterOutlet,
    SkipLinksComponent,
    VisuallyHidden,
    MatToolbarModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  // Injected purely for its constructor side effect: it subscribes to
  // router navigation once and manages focus for the app's lifetime
  // (docs/ARCHITECTURE.md §9). Nothing here reads from it.
  private readonly focusManager = inject(FocusManager);

  protected readonly announcer = inject(Announcer);

  private readonly registry = inject(ScenarioRegistry);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    { initialValue: null },
  );

  /**
   * Whether the current page has a barrier-panel target for SkipLinksComponent.
   * All routes are flat (no nested child routes below the router outlet), so
   * the immediately activated child of the root route is always the current
   * page's route, and its `data.hasPanel` is authoritative.
   */
  protected readonly hasPanel = computed(() => {
    this.navigationEnd();
    return this.route.firstChild?.snapshot.data['hasPanel'] === true;
  });

  protected readonly availableScenarios = computed(() =>
    this.registry.getAll().filter((scenario) => scenario.status === 'available'),
  );

  protected scenarioLink(scenario: Scenario): string[] {
    return firstStepPath(scenario);
  }
}
