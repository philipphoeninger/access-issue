// Step 2 of the application process — the Elbwerk online application form and
// the four barriers docs/SPEC_v1.md slice 8 calls the riskiest in phase 1.
//
// Three of the four are **pattern B** (docs/ARCHITECTURE.md §11): one authored
// form, conditional bindings, because they change *how existing content is
// exposed* rather than what exists. The fourth is pattern A.
//
//  - `labels` (B) — the visible field text is a `<label for>` or a `<div>` next
//    to the field. Same words either way (docs/UX-COPY.md §8.4); only the
//    association differs. This is the one barrier of this step axe can see
//    (rule `label`, src/app/content/axe-rule-fixtures.ts).
//  - `tastatur` (B) — the submit control is a `<button type="submit">` or a
//    `<div>` with a click handler. **By omission, never by interception**
//    (docs/ARCHITECTURE.md §5.3): the `<div>` has no `tabindex`, no `role`, no
//    key handler, and nothing anywhere on this page touches the Tab key. One
//    control becomes unreachable; the region does not. See the note on
//    `keyboardOperable` below for why it is a bare `<div>` and not a
//    `<div role="button">`.
//  - `pflichtfeld` (B) — a red asterisk carrying the meaning alone, against
//    „(Pflichtfeld)" in the label plus `required` plus a legend
//    (docs/UX-COPY.md §8.7).
//  - `fehler` (A) — two authored error outputs: one opaque „Code 422" line
//    with no association at all, or a summary with jump links, per-field
//    messages, `aria-invalid`, `aria-describedby` and focus on the first
//    error (docs/UX-COPY.md §8.5). Two genuinely different renderings, which
//    is what makes it pattern A rather than a set of attributes.
//
// Neither side of any of the four is a repair layer bolted onto the other
// (CLAUDE.md rule 10).
//
// **State.** docs/ARCHITECTURE.md §14 says scenario components own no state.
// A form is the one thing that cannot honour that literally: what the user
// typed has to live somewhere. The signals below hold exactly that and nothing
// else — no barrier state (that is read from the URL, as everywhere), no
// navigation, no persistence, no network. Nothing entered here leaves the
// browser tab; the file input's `File` is read for its size and never sent.
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { BarrierStateService } from '../../../core/barrier-state.service';
import {
  FEHLER_BARRIER,
  LABELS_BARRIER,
  PFLICHTFELD_BARRIER,
  TASTATUR_BARRIER,
} from '../../../content/application-process/application-process.content';
import { APPLICATION_PROCESS_SCENARIO } from '../../../content/application-process/application-process.scenario';
import { FragmentLink } from '../../../shared/fragment-link.directive';
import { ElbwerkPageComponent } from '../elbwerk-page/elbwerk-page.component';

/** How a field is rendered. `textarea` and `file` are their own elements. */
type ControlKind = 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'file';

export interface ApplicationFormField {
  /** Element id. `sim-` prefixed like every id in the region (CLAUDE.md rule 2). */
  readonly id: string;
  /** Label text without the required marker — the marker is the barrier. */
  readonly label: string;
  readonly control: ControlKind;
  readonly required: boolean;
  /**
   * WCAG 1.3.5, and identical in both barrier states on purpose. A careless
   * author would plausibly have left it out too, but a missing autocomplete
   * token is not one of the four barriers this step declares, and an
   * undeclared barrier is one the panel never explains (CLAUDE.md rule 18).
   */
  readonly autocomplete: string | null;
}

interface FieldError {
  readonly fieldId: string;
  /** Id of the message element, for `aria-describedby` when `fehler` is resolved. */
  readonly messageId: string;
  readonly message: string;
}

const FIRST_NAME = 'sim-first-name';
const LAST_NAME = 'sim-last-name';
const EMAIL = 'sim-email';
const CV = 'sim-cv';

/** docs/UX-COPY.md §8.4 — „Lebenslauf (PDF, max. 5 MB)". */
const MAX_CV_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-application-form-step',
  imports: [ElbwerkPageComponent, FragmentLink, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './application-form-step.component.html',
  styleUrl: './application-form-step.component.scss',
})
export class ApplicationFormStepComponent {
  private readonly barrierState = inject(BarrierStateService);
  private readonly injector = inject(Injector);

  /** Imported rather than taken as an input — see JobPostingStepComponent. */
  private readonly scenario = APPLICATION_PROCESS_SCENARIO;

  /**
   * `urlKey`s read off the barrier constants, never written as string
   * literals: they are public API that may never be renamed (CLAUDE.md rule
   * 11), and a literal here would let content and template drift apart
   * without the compiler noticing.
   */
  protected readonly labelsAssociated = computed(() =>
    this.barrierState.isResolved(this.scenario, LABELS_BARRIER.urlKey),
  );

  /**
   * Resolved, the submit control is a real `<button type="submit">`. Active,
   * it is a bare `<div>` with a click handler — no `tabindex`, no `role`, no
   * key handler.
   *
   * docs/ARCHITECTURE.md §11 sketches this barrier as `<div role="button">`;
   * docs/UX-COPY.md §8.4 writes it as a plain `<div>` with a click handler,
   * and that is what is built here. The two differ in what a screen reader
   * says, not in what a keyboard can do: with `role="button"` the control is
   * announced as a button that then cannot be activated, which is a *second*
   * defect on top of the declared one. The plain `<div>` is also what the
   * copy document — the later and more specific of the two — describes, and
   * it is the more common real-world shape.
   */
  protected readonly keyboardOperable = computed(() =>
    this.barrierState.isResolved(this.scenario, TASTATUR_BARRIER.urlKey),
  );

  protected readonly requiredMarked = computed(() =>
    this.barrierState.isResolved(this.scenario, PFLICHTFELD_BARRIER.urlKey),
  );

  protected readonly errorFeedback = computed(() =>
    this.barrierState.isResolved(this.scenario, FEHLER_BARRIER.urlKey),
  );

  /** docs/UX-COPY.md §8.4 — eight fields, labels identical in both states. */
  protected readonly fields: readonly ApplicationFormField[] = [
    {
      id: FIRST_NAME,
      label: 'Vorname',
      control: 'text',
      required: true,
      autocomplete: 'given-name',
    },
    {
      id: LAST_NAME,
      label: 'Nachname',
      control: 'text',
      required: true,
      autocomplete: 'family-name',
    },
    { id: EMAIL, label: 'E-Mail-Adresse', control: 'email', required: true, autocomplete: 'email' },
    { id: 'sim-phone', label: 'Telefon', control: 'tel', required: false, autocomplete: 'tel' },
    {
      id: 'sim-start-date',
      label: 'Frühester Eintrittstermin',
      control: 'date',
      required: false,
      autocomplete: null,
    },
    {
      id: 'sim-salary',
      label: 'Gehaltsvorstellung (brutto/Jahr)',
      control: 'text',
      required: false,
      autocomplete: null,
    },
    {
      id: 'sim-cover-letter',
      label: 'Anschreiben',
      control: 'textarea',
      required: false,
      autocomplete: null,
    },
    {
      id: CV,
      label: 'Lebenslauf (PDF, max. 5 MB)',
      control: 'file',
      required: true,
      autocomplete: null,
    },
  ];

  // ── Copy (docs/UX-COPY.md §8.4, §8.5, §8.7) ────────────────────────────────

  protected readonly heading = 'Online-Bewerbung';
  protected readonly intro =
    'Bitte füllen Sie das Formular vollständig aus. Mit * gekennzeichnete Felder sind Pflichtfelder.';
  protected readonly introBase = 'Bitte füllen Sie das Formular vollständig aus.';
  protected readonly requiredLegend =
    'Mit „Pflichtfeld" gekennzeichnete Felder müssen ausgefüllt werden.';
  protected readonly requiredSuffix = '(Pflichtfeld)';
  protected readonly submitLabel = 'Bewerbung absenden';
  protected readonly privacy = 'Mit dem Absenden stimmen Sie unseren Datenschutzhinweisen zu.';
  protected readonly errorGeneric =
    'Fehler: Die Übermittlung konnte nicht durchgeführt werden. Bitte überprüfen Sie Ihre Eingaben. (Code 422)';
  protected readonly errorSummaryHeading = 'Die Bewerbung konnte nicht abgesendet werden';

  /**
   * `elbwerk.form.simulationNote` (docs/UX-COPY.md §8.4). One of the three
   * **Simulationshinweise** — the one text type that reaches from the frame
   * into the simulation. It stands wherever someone could enter real data,
   * is present regardless of barrier state, and is never made into a barrier.
   */
  protected readonly simulationNote =
    'Diese Bewerbung wird nicht übertragen. Es werden keine Daten gespeichert.';

  // ── Form state ─────────────────────────────────────────────────────────────

  /**
   * Text values by field id, read on validation and never bound back to the
   * controls. The inputs sit outside every `@if` in the template, so a barrier
   * toggle re-renders around them rather than replacing them and what someone
   * typed survives; a `[value]` binding would only add a chance of moving the
   * caret on every keystroke.
   */
  private readonly values = signal<Readonly<Record<string, string>>>({});

  /** Read for its size only, and never transmitted (no backend, PRD §4). */
  private readonly cvFile = signal<File | null>(null);

  /**
   * What the last submission found, and the only source of the error output.
   *
   * There is no separate „has been submitted" flag: this starts empty and is
   * written nowhere but in `submit()`, so „nothing is reported before the
   * first attempt" is already what the empty array says. A second signal
   * saying it again could only ever disagree with this one.
   */
  protected readonly visibleErrors = signal<readonly FieldError[]>([]);

  protected readonly hasErrors = computed(() => this.visibleErrors().length > 0);

  /**
   * docs/UX-COPY.md §8.5 `elbwerk.form.errorSummary.intro` and its singular
   * form. „Bitte korrigieren Sie 1 Angaben" is the message someone reads just
   * before they get it right, so the singular is not a nicety.
   */
  protected readonly errorSummaryIntro = computed(() => {
    const count = this.visibleErrors().length;
    if (count === 1) {
      return 'Bitte korrigieren Sie eine Angabe:';
    }
    return `Bitte korrigieren Sie ${count} Angaben:`;
  });

  private errorFor(fieldId: string): FieldError | undefined {
    return this.visibleErrors().find((error) => error.fieldId === fieldId);
  }

  /**
   * The field's error, but only while the `fehler` barrier is resolved. Active,
   * there is no per-field message at all — the whole point of „Code 422" is
   * that it names no field.
   */
  protected fieldErrorFor(field: ApplicationFormField): FieldError | undefined {
    if (!this.errorFeedback()) {
      return undefined;
    }
    return this.errorFor(field.id);
  }

  /**
   * The label text as rendered. The words are the same in both `labels`
   * states (docs/UX-COPY.md §8.4); the required marker is what the
   * `pflichtfeld` barrier changes — „Vorname *" against „Vorname
   * (Pflichtfeld)" is the whole contrast of docs/UX-COPY.md §8.7. The
   * asterisk itself is a separate element in the template, because only there
   * can colour carry the meaning alone.
   */
  protected labelTextFor(field: ApplicationFormField): string {
    if (field.required && this.requiredMarked()) {
      return `${field.label} ${this.requiredSuffix}`;
    }
    return field.label;
  }

  protected showsAsterisk(field: ApplicationFormField): boolean {
    return field.required && !this.requiredMarked();
  }

  /**
   * `required` is part of the accessible variant of `pflichtfeld`, not of the
   * field definition: active, the asterisk is the only marking there is —
   * no text, and nothing a screen reader or a validation API could read
   * (docs/UX-COPY.md §8.7).
   */
  protected isRequiredAttributeSet(field: ApplicationFormField): boolean {
    return field.required && this.requiredMarked();
  }

  protected ariaInvalidFor(field: ApplicationFormField): string | null {
    return this.fieldErrorFor(field) === undefined ? null : 'true';
  }

  protected describedByFor(field: ApplicationFormField): string | null {
    const error = this.fieldErrorFor(field);
    return error === undefined ? null : error.messageId;
  }

  protected onInput(fieldId: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.values.update((values) => ({ ...values, [fieldId]: target.value }));
  }

  protected onFileChange(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    this.cvFile.set(files !== null && files.length > 0 ? files[0] : null);
  }

  /**
   * The one action on this page, and the same method for both variants of the
   * `tastatur` barrier — the barrier is which *element* calls it, never
   * whether the call happens.
   *
   * `preventDefault` is on the form's own submit event only: without it the
   * browser would navigate away from the application on the resolved
   * variant's real `<button type="submit">`. That is not interception of a
   * user agent behaviour the barrier depends on (docs/ARCHITECTURE.md §5.3) —
   * it is the standard way any single-page form stops a page load, and it
   * touches no key, no focus and no tab order.
   */
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submit();
  }

  protected submit(): void {
    const errors = this.validate();
    this.visibleErrors.set(errors);

    // docs/UX-COPY.md §8.5, docs/TESTING.md §6: the resolved variant moves
    // focus to the first field in error. The active variant deliberately does
    // not — „no error feedback" includes not being told where to look.
    // Deferred to after the next render because the message element the field
    // is described by does not exist yet at this point.
    if (this.errorFeedback() && errors.length > 0) {
      const firstFieldId = errors[0].fieldId;
      afterNextRender(
        () => {
          const field = document.getElementById(firstFieldId);
          if (field !== null) {
            field.focus();
          }
        },
        { injector: this.injector },
      );
    }
  }

  /**
   * Validation of the four fields docs/UX-COPY.md §8.5 has messages for, in
   * field order — which is also the order the summary lists them and
   * therefore the order „the first error" refers to.
   *
   * The optional fields are not validated at all: a phone number or a salary
   * expectation nobody entered is not an error on any real application form,
   * and inventing one would need copy that does not exist.
   */
  private validate(): FieldError[] {
    const errors: FieldError[] = [];
    const value = (fieldId: string): string => {
      const raw = this.values()[fieldId];
      return raw === undefined ? '' : raw.trim();
    };
    const add = (fieldId: string, message: string): void => {
      errors.push({ fieldId, messageId: `sim-error-${fieldId.slice('sim-'.length)}`, message });
    };

    if (value(FIRST_NAME) === '') {
      add(FIRST_NAME, 'Bitte geben Sie Ihren Vornamen an.');
    }
    if (value(LAST_NAME) === '') {
      add(LAST_NAME, 'Bitte geben Sie Ihren Nachnamen an.');
    }

    const email = value(EMAIL);
    if (email === '') {
      add(EMAIL, 'Bitte geben Sie Ihre E-Mail-Adresse an.');
    } else if (!email.includes('@')) {
      add(EMAIL, 'Diese E-Mail-Adresse enthält kein @. Bitte prüfen Sie die Schreibweise.');
    }

    const cv = this.cvFile();
    if (cv === null) {
      add(CV, 'Bitte fügen Sie Ihren Lebenslauf als PDF bei.');
    } else if (cv.size > MAX_CV_BYTES) {
      add(CV, `Die Datei ist ${this.formatFileSize(cv.size)} groß. Erlaubt sind bis zu 5 MB.`);
    }

    return errors;
  }

  /** German decimal comma — the application is German-only by decision (PRD §4). */
  private formatFileSize(bytes: number): string {
    const megabytes = bytes / (1024 * 1024);
    const formatted = megabytes.toLocaleString('de-DE', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `${formatted} MB`;
  }
}
