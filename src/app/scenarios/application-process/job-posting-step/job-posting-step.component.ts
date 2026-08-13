// Step 1 of the application process — the Elbwerk job posting, and the first
// two barriers in the application (docs/SPEC_v1.md slice 7, docs/PRD.md §6.1).
//
// Both barriers use **pattern A** (docs/ARCHITECTURE.md §11): two authored
// templates switched with `@if`, because each changes *what content exists*
// rather than how existing content is exposed.
//
//  - `grafik` — pay and benefits live only inside a raster graphic with no
//    `alt` attribute; resolved, the same figures are text with a heading and a
//    list and the graphic stays on as decoration (docs/UX-COPY.md §8.6).
//  - `sprache` — nested officialese against plain language, same substance
//    either way (docs/UX-COPY.md §8.3).
//
// Neither variant is a repair layer bolted onto the other. Both are written
// the way a competent and a careless author would each have written them —
// the rule exists because a visible repair artefact teaches that accessibility
// is a patch, which is the misconception this module exists to dispel
// (docs/ARCHITECTURE.md §11, CLAUDE.md rule 10).
//
// The component owns no state and performs no navigation (docs/ARCHITECTURE.md
// §14): it reads barrier state and renders. Walking on to step 2 belongs to
// the frame's step navigation.
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BarrierStateService } from '../../../core/barrier-state.service';
import {
  GRAFIK_BARRIER,
  SPRACHE_BARRIER,
} from '../../../content/application-process/application-process.content';
import { APPLICATION_PROCESS_SCENARIO } from '../../../content/application-process/application-process.scenario';
import { ElbwerkPageComponent } from '../elbwerk-page/elbwerk-page.component';

@Component({
  selector: 'app-job-posting-step',
  imports: [ElbwerkPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-posting-step.component.html',
  styleUrl: './job-posting-step.component.scss',
})
export class JobPostingStepComponent {
  private readonly barrierState = inject(BarrierStateService);

  /**
   * The scenario is imported rather than taken as an input. This component is
   * step 1 *of the application process* and of nothing else — it is reachable
   * only through that scenario's route — so an input would be a parameter with
   * exactly one legal argument, and passing it through
   * `NgComponentOutlet`'s untyped `inputs` map would trade a compile-time
   * guarantee for a runtime one on the way.
   */
  private readonly scenario = APPLICATION_PROCESS_SCENARIO;

  /**
   * `urlKey`s read off the barrier constants, never written out as string
   * literals: they are public API that may never be renamed (CLAUDE.md rule
   * 11), and a literal here would let content and template drift apart without
   * the compiler noticing.
   */
  protected readonly benefitsAsText = computed(() =>
    this.barrierState.isResolved(this.scenario, GRAFIK_BARRIER.urlKey),
  );

  protected readonly plainLanguage = computed(() =>
    this.barrierState.isResolved(this.scenario, SPRACHE_BARRIER.urlKey),
  );

  /**
   * A PNG, deliberately, and rendered at its natural width. An SVG would stay
   * sharp under magnification and take half the point away — pixelating
   * letters at 400 % zoom are the part of this barrier sighted participants
   * feel for themselves (docs/UX-COPY.md §8.6). Source and regeneration
   * command: assets-src/simulation/grafik_benefits_final.svg.
   *
   * Relative URL for the same reason as the Elbwerk logo — see
   * ElbwerkPageComponent.
   */
  protected readonly benefitsGraphic = 'simulation/grafik_benefits_final.png';

  /**
   * docs/UX-COPY.md §8.6 `elbwerk.job.benefits.items`, split on the „·" the
   * copy separates them with. One source, so the list in the resolved variant
   * cannot quietly diverge from the string the copy document defines.
   */
  protected readonly benefits = [
    '30 Urlaubstage',
    'Gleitzeit',
    'Jobrad',
    'Zuschuss zum Deutschlandticket',
    'Betriebliche Altersvorsorge',
  ];

  /**
   * docs/UX-COPY.md §8.6 `elbwerk.job.process.items`, split the same way.
   *
   * The graphic swallows the application process as well as pay and benefits,
   * because docs/PRD.md §6.1 scopes this barrier to all three — and the
   * process is the part someone *acts* on. Not knowing that a reply comes
   * within two weeks, or that the interview can be held over video, is what
   * turns a missing alternative text from an annoyance into a lost
   * application.
   */
  protected readonly processSteps = [
    'Online bewerben',
    'Rückmeldung innerhalb von zwei Wochen',
    'Gespräch per Video oder vor Ort',
    'Start nach Absprache',
  ];

  /**
   * The graphic's intrinsic size, bound rather than written into the template
   * twice: `width`/`height` reserve the right box before the file arrives, and
   * a stale pair after the graphic is regenerated at a different size would
   * shift the layout on load. Keep in step with
   * assets-src/simulation/grafik_benefits_final.svg.
   */
  protected readonly graphicSize = { width: 640, height: 460 };
}
