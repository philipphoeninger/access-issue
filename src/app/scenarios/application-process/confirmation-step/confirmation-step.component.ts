// Step 4 of the application process — the confirmation, and the three barriers
// docs/SPEC_v1.md slice 10 places here (docs/PRD.md §6.1).
//
// All three are **pattern A** (docs/ARCHITECTURE.md §11): two authored
// templates switched with `@if`, because each changes what content exists
// rather than how existing content is exposed.
//
//  - `bestaetigung` — boilerplate German with the case number and the next
//    steps trapped in a signature graphic that carries no `alt`, against plain
//    language with the same details as text (docs/UX-COPY.md §8.9). This is the
//    one barrier of this step axe can see, by the missing `alt`
//    (src/app/content/axe-rule-fixtures.ts).
//  - `ansprechperson` — a function mailbox and nothing else, against a named
//    person with a phone number and office hours.
//  - `inklusionshinweis` — absent, against present, including the sentence that
//    asking has no bearing on the application.
//
// **The last two violate no success criterion at all**, and this component is
// the first place in the application where that is visible: nothing is
// malformed, nothing is unlabelled, no checker has anything to report, and a
// person who needs an adjustment still has nowhere to ask. Both carry
// `organisational: true` and an empty `standards` array, and the explanation
// view answers the norms rubric rather than dropping it
// (docs/UX-COPY.md §5.8, CLAUDE.md rule 19).
//
// **No Simulationshinweis on this page.** The rule (docs/UX-COPY.md §8.4)
// places one wherever someone could enter real data or trigger a real action.
// The confirmation has neither a field nor a button, and the contact details
// are text rather than `mailto:`/`tel:` links — Elbwerk does not exist, and a
// link would open the participant's mail client on an address that goes
// nowhere. There are still four notes, not five (CLAUDE.md rule 5).
//
// The component owns no state and performs no navigation
// (docs/ARCHITECTURE.md §14): it reads barrier state and renders.
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BarrierStateService } from '../../../core/barrier-state.service';
import {
  ANSPRECHPERSON_BARRIER,
  BESTAETIGUNG_BARRIER,
  INKLUSIONSHINWEIS_BARRIER,
} from '../../../content/application-process/application-process.content';
import { APPLICATION_PROCESS_SCENARIO } from '../../../content/application-process/application-process.scenario';
import { ElbwerkPageComponent } from '../../elbwerk-page/elbwerk-page.component';

@Component({
  selector: 'app-confirmation-step',
  imports: [ElbwerkPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirmation-step.component.html',
  styleUrl: './confirmation-step.component.scss',
})
export class ConfirmationStepComponent {
  private readonly barrierState = inject(BarrierStateService);

  /** Imported rather than taken as an input — see JobPostingStepComponent. */
  private readonly scenario = APPLICATION_PROCESS_SCENARIO;

  /**
   * `urlKey`s read off the barrier constants, never written as string literals:
   * they are public API that may never be renamed (CLAUDE.md rule 11), and a
   * literal here would let content and template drift apart without the
   * compiler noticing.
   */
  protected readonly plainConfirmation = computed(() =>
    this.barrierState.isResolved(this.scenario, BESTAETIGUNG_BARRIER.urlKey),
  );

  protected readonly namedContact = computed(() =>
    this.barrierState.isResolved(this.scenario, ANSPRECHPERSON_BARRIER.urlKey),
  );

  protected readonly inclusionNote = computed(() =>
    this.barrierState.isResolved(this.scenario, INKLUSIONSHINWEIS_BARRIER.urlKey),
  );

  // ── Copy (docs/UX-COPY.md §8.9) ────────────────────────────────────────────

  protected readonly heading = 'Ihre Bewerbung ist eingegangen';

  protected readonly bodyComplex =
    'Wir bestätigen den Eingang Ihrer Bewerbungsunterlagen und danken Ihnen für Ihr Interesse ' +
    'an einer Tätigkeit in unserem Hause. Nach Abschluss der Sichtung sämtlicher eingegangener ' +
    'Bewerbungen werden wir uns unaufgefordert mit Ihnen in Verbindung setzen. Von ' +
    'zwischenzeitlichen Rückfragen zum Bearbeitungsstand bitten wir abzusehen.';

  protected readonly bodyPlain =
    'Vielen Dank für Ihre Bewerbung. Wir haben Ihre Unterlagen erhalten. Wir sichten alle ' +
    'Bewerbungen bis zum 15. September und melden uns danach bei Ihnen. Sie müssen nichts ' +
    'weiter tun.';

  /**
   * The one detail in the signature graphic that someone acts on: a query
   * without it cannot be filed against anything, and it appears nowhere else on
   * the page while the barrier is active (docs/UX-COPY.md §8.9).
   */
  protected readonly reference = 'Ihr Aktenzeichen: BW-2026-0417';

  protected readonly nextStepsHeading = 'Wie es weitergeht';

  /**
   * docs/UX-COPY.md §8.9 `elbwerk.confirm.nextSteps.items`, split on the „·"
   * the copy separates them with. An ordered list, because the order is
   * information: the interview only follows the invitation.
   */
  protected readonly nextSteps = [
    'Wir prüfen Ihre Unterlagen',
    'Bei einer Einladung erhalten Sie eine E-Mail mit Terminvorschlägen',
    'Das Gespräch dauert etwa eine Stunde und findet in Wilhelmsburg oder online statt',
  ];

  protected readonly contactMailbox =
    'Bei Rückfragen wenden Sie sich bitte an bewerbung@elbwerk.de.';

  protected readonly contactHeading = 'Ihre Ansprechperson';
  protected readonly contactBody =
    'Miriam Kessler, Personalabteilung. Telefon 040 555 0123, erreichbar montags bis ' +
    'donnerstags von 9 bis 15 Uhr. E-Mail: m.kessler@elbwerk.de';

  protected readonly inclusionHeading = 'Sie brauchen etwas anderes?';
  protected readonly inclusionBody =
    'Wenn Sie für das Bewerbungsgespräch eine Anpassung benötigen — etwa Unterlagen in einem ' +
    'bestimmten Format, mehr Zeit, eine Gebärdensprachdolmetschung oder einen barrierefreien ' +
    'Zugang — sagen Sie uns einfach Bescheid. Das hat keinen Einfluss auf die Bewertung Ihrer ' +
    'Bewerbung.';

  /**
   * A PNG, and a signature is one in the real world: built once in a graphics
   * program and pasted into every template afterwards. That is also how this
   * barrier comes about — text moves into an image and stays there. Source and
   * regeneration command:
   * assets-src/simulation/signatur_personalabteilung_final.svg.
   *
   * Relative URL for the same reason as the Elbwerk logo — see
   * ElbwerkPageComponent.
   */
  protected readonly signatureImage = 'simulation/signatur_personalabteilung_final.png';

  /**
   * The graphic's intrinsic size, bound rather than written into the template
   * twice: `width`/`height` reserve the right box before the file arrives, and
   * a stale pair after a regeneration at a different size would shift the
   * layout on load. Keep in step with the SVG source.
   */
  protected readonly signatureSize = { width: 600, height: 300 };
}
