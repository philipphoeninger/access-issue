// docs/UX-COPY.md §5.1. Two of the three skip links; the third
// ("Simulationsbereich überspringen") is not header-level and is rendered by
// SimulationRegionComponent immediately before the region.
//
// Both links go through FragmentLink rather than carrying a literal
// `href="#content"`: under `<base href="/">` a bare fragment resolves against
// the base, so on a scenario route these two used to reload the application
// on the home page instead of skipping anything — see the directive for the
// full story.
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FragmentLink } from '../fragment-link.directive';

@Component({
  selector: 'app-skip-links',
  imports: [MatButtonModule, FragmentLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skip-links.component.html',
  styleUrl: './skip-links.component.scss',
})
export class SkipLinksComponent {
  /**
   * Whether the current page has a barrier-panel target (`#panel`) to skip
   * to. UX-COPY.md §5.1 places "Zum Barriere-Panel springen" unconditionally
   * in the header, but that assumes a panel exists on the page — true for
   * every scenario route, not true for the home page. Rather than ship a
   * link to a target that is not there, the link itself is only rendered
   * when one exists.
   */
  readonly hasPanel = input(false);
}
