// docs/UX-COPY.md §5.2. Barrier counts are read from scenario data, never
// hard-coded (docs/SPEC_v1.md Slice 3 acceptance criteria), so this page
// ages correctly as barriers are added.
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ScenarioRegistry } from '../../core/scenario-registry.service';
import { firstStepPath } from '../../core/scenario-routes';
import type { Scenario } from '../../models/domain.model';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly registry = inject(ScenarioRegistry);

  readonly scenarios = computed(() => this.registry.getAll());

  isAvailable(scenario: Scenario): boolean {
    return scenario.status === 'available';
  }

  barrierCountLabel(scenario: Scenario): string {
    return `${scenario.barriers.length} Barrieren`;
  }

  openLink(scenario: Scenario): string[] {
    return firstStepPath(scenario);
  }
}
