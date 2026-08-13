// The body of the Elbwerk job description, and the barrier `sprache` that
// decides how it is written (docs/UX-COPY.md §8.3).
//
// **Why this is its own component.** Two steps render this text: step 1 shows
// the posting, and step 3 shows the same posting as the document Elbwerk
// supplies — the resolved half of the barrier `pdf` (docs/UX-COPY.md §8.2,
// "Der Text auf der Seite ist derselbe wie in Schritt 1"). It is one document,
// so it is one wording, from one source. Two copies of an officialese
// paragraph in two templates would drift on the first editorial pass, and the
// scenario would then be claiming that Elbwerk publishes its own advertisement
// in two versions.
//
// It follows from that single source that the text on step 3 answers to
// `sprache`, a barrier the panel lists under step 1. That is deliberate and
// recorded in docs/UX-COPY.md §8.2: language complexity is a property of the
// text, not of the page it is printed on.
//
// Pattern A (docs/ARCHITECTURE.md §11): two authored templates switched with
// `@if`, because the barrier changes what content exists. Neither is a repair
// layer over the other — both are written as a careless and a careful author
// would each have written them (CLAUDE.md rule 10).
//
// Heading level: `h5` in both places it is used, because in both it sits under
// an `h4` (the job title in step 1, the document heading in step 3). All
// scenario content starts at `h3` (docs/ARCHITECTURE.md §5.6 rule 1).
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BarrierStateService } from '../../../core/barrier-state.service';
import { SPRACHE_BARRIER } from '../../../content/application-process/application-process.content';
import { APPLICATION_PROCESS_SCENARIO } from '../../../content/application-process/application-process.scenario';

@Component({
  selector: 'app-job-description',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-description.component.html',
  styleUrl: './job-description.component.scss',
})
export class JobDescriptionComponent {
  private readonly barrierState = inject(BarrierStateService);

  /** Imported rather than taken as an input — see JobPostingStepComponent. */
  private readonly scenario = APPLICATION_PROCESS_SCENARIO;

  /**
   * `urlKey` read off the barrier constant, never written out as a string
   * literal: it is public API that may never be renamed (CLAUDE.md rule 11).
   */
  protected readonly plainLanguage = computed(() =>
    this.barrierState.isResolved(this.scenario, SPRACHE_BARRIER.urlKey),
  );
}
