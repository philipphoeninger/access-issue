// Step 3 of the application process — uploading the documents, and the two
// barriers docs/SPEC_v1.md slice 9 places here (docs/PRD.md §6.1).
//
// Both are **pattern A** (docs/ARCHITECTURE.md §11): two authored templates
// switched with `@if`, because each changes what content exists rather than how
// existing content is exposed.
//
//  - `pdf` — the job description is a download and nothing else, against the
//    same description as text on the page with the download still offered
//    beside it (docs/UX-COPY.md §8.2). The resolved state is "also as text",
//    never "PDF removed": the document does not vanish, it just stops being the
//    only way in.
//  - `upload` — a file field that names neither the formats it takes nor a
//    size limit and answers a rejected file with „Upload fehlgeschlagen",
//    against one that says both up front and names the file, the format and the
//    limit when something is wrong (docs/UX-COPY.md §8.8).
//
// Neither variant is a repair layer bolted onto the other (CLAUDE.md rule 10).
//
// **The description text comes from JobDescriptionComponent**, the same
// component step 1 uses. One document, one wording, one source — and therefore
// the text here answers to `sprache`, which the panel lists under step 1. That
// is deliberate and recorded in docs/UX-COPY.md §8.2.
//
// **State.** Scenario components own no state (docs/ARCHITECTURE.md §14); a
// form is the exception that cannot honour it literally. The signals below hold
// which file is attached and what the last submission found, and nothing else.
// No barrier state (that is read from the URL, as everywhere), no navigation,
// no persistence, no network: the `File` objects are read for their name and
// size and never leave the tab.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BarrierStateService } from '../../../core/barrier-state.service';
import {
  PDF_BARRIER,
  UPLOAD_BARRIER,
} from '../../../content/application-process/application-process.content';
import { APPLICATION_PROCESS_SCENARIO } from '../../../content/application-process/application-process.scenario';
import { ElbwerkPageComponent } from '../elbwerk-page/elbwerk-page.component';
import { JobDescriptionComponent } from '../job-description/job-description.component';

export interface UploadField {
  /** Element id. `sim-` prefixed like every id in the region (CLAUDE.md rule 2). */
  readonly id: string;
  /** docs/UX-COPY.md §8.8 — identical in both barrier states. */
  readonly label: string;
}

interface UploadError {
  readonly fieldId: string;
  /** Id of the message element, for `aria-describedby` when `upload` is resolved. */
  readonly messageId: string;
  readonly message: string;
}

const CV = 'sim-upload-cv';
const CERTIFICATES = 'sim-upload-certificates';

/** docs/UX-COPY.md §8.8 `elbwerk.upload.formatHint`. */
const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'odt'];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * What the field takes while the barrier is active: one format, unnamed. The
 * whole barrier in one constant — „Das Upload-Feld akzeptiert nur ein einziges
 * Dateiformat, nennt aber weder die zulässigen Formate noch die maximale
 * Größe" (docs/PRD.md §6.1).
 */
const SINGLE_ACCEPTED_EXTENSION = 'pdf';

@Component({
  selector: 'app-document-upload-step',
  imports: [ElbwerkPageComponent, JobDescriptionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './document-upload-step.component.html',
  styleUrl: './document-upload-step.component.scss',
})
export class DocumentUploadStepComponent {
  private readonly barrierState = inject(BarrierStateService);

  /** Imported rather than taken as an input — see JobPostingStepComponent. */
  private readonly scenario = APPLICATION_PROCESS_SCENARIO;

  /**
   * `urlKey`s read off the barrier constants, never written as string literals:
   * they are public API that may never be renamed (CLAUDE.md rule 11), and a
   * literal here would let content and template drift apart without the
   * compiler noticing.
   */
  protected readonly postingAsText = computed(() =>
    this.barrierState.isResolved(this.scenario, PDF_BARRIER.urlKey),
  );

  protected readonly uploadGuidance = computed(() =>
    this.barrierState.isResolved(this.scenario, UPLOAD_BARRIER.urlKey),
  );

  /** docs/UX-COPY.md §8.8 — two fields, labels identical in both states. */
  protected readonly fields: readonly UploadField[] = [
    { id: CV, label: 'Lebenslauf' },
    { id: CERTIFICATES, label: 'Zeugnisse' },
  ];

  // ── Copy (docs/UX-COPY.md §8.2, §8.8) ──────────────────────────────────────

  protected readonly heading = 'Unterlagen hochladen';
  protected readonly intro = 'Bitte laden Sie Ihre vollständigen Bewerbungsunterlagen hoch.';
  protected readonly submitLabel = 'Unterlagen übermitteln';
  protected readonly formatHint = 'Zulässig sind PDF, DOCX und ODT bis 10 MB je Datei.';
  protected readonly structureHint =
    'Bitte verwenden Sie in Ihren Dokumenten echte Überschriften statt vergrößerter Textzeilen. ' +
    'Das erleichtert uns die Auswertung — und Ihnen die Wiederverwendung.';
  protected readonly errorGeneric = 'Upload fehlgeschlagen. Bitte versuchen Sie es erneut.';

  protected readonly postingHeading = 'Stellenausschreibung';
  protected readonly pdfIntro =
    'Die vollständige Stellenbeschreibung entnehmen Sie bitte dem beigefügten Dokument.';
  protected readonly htmlNote =
    'Sie können die Stellenbeschreibung hier lesen oder als PDF herunterladen.';
  protected readonly pdfLinkText =
    'Stellenausschreibung_2026_IT-Projektmanagement_final_v3.pdf (412 KB)';

  /**
   * One asset path, as docs/SPEC_v1.md §4.2 asks for: swapping the placeholder
   * for a genuinely untagged PDF authored by WERTE.IT is then a file and this
   * one line, not a rework. The file that stands here today is generated from
   * assets-src/simulation/stellenausschreibung.py and is untagged already.
   *
   * Relative, not root-absolute: relative URLs resolve against `<base href>`,
   * so the download survives a deployment under a subpath
   * (docs/ARCHITECTURE.md §16).
   */
  protected readonly postingPdf =
    'simulation/Stellenausschreibung_2026_IT-Projektmanagement_final_v3.pdf';

  /**
   * `elbwerk.upload.simulationNote` (docs/UX-COPY.md §8.8). The fourth
   * **Simulationshinweis** — the one text type that reaches from the frame into
   * the simulation. A file field is an input point, so it needs one; it stands
   * in every barrier state and is never made into a barrier (CLAUDE.md rule 5).
   */
  protected readonly simulationNote =
    'Diese Unterlagen werden nicht übertragen. Es werden keine Dateien gespeichert.';

  /** Ids referenced from the template's `aria-describedby`. */
  protected readonly formatHintId = 'sim-upload-format-hint';

  // ── Form state ─────────────────────────────────────────────────────────────

  /** Attached files by field id. Read for name and size, never transmitted. */
  private readonly files = signal<Readonly<Record<string, File | null>>>({});

  /**
   * The files as they stood at the last submission, and `null` before the first
   * one — which is what „nothing is reported before the first attempt" means,
   * with no second flag that could disagree with it.
   *
   * A snapshot rather than the live `files`, because picking a different file
   * must not silently rewrite the report: what is displayed is the answer to a
   * submission that happened, not a running commentary on the field.
   */
  private readonly submittedFiles = signal<Readonly<Record<string, File | null>> | null>(null);

  /**
   * The error output, **derived** and not stored — which is the whole point of
   * it being a `computed`.
   *
   * The rules this validates against depend on the barrier (`validate` takes
   * the accepted formats from `uploadGuidance()`), and the barrier can change
   * after a submission: failing, then resolving the barrier in the panel, is
   * the exact move this tool is built for. A stored result would then still be
   * the one computed under the other state's rules, and the resolved variant
   * would reject a DOCX two lines below its own sentence saying DOCX is
   * accepted. Recomputing keeps the report and the hint telling the same story
   * in every state.
   */
  protected readonly visibleErrors = computed<readonly UploadError[]>(() => {
    const submitted = this.submittedFiles();
    return submitted === null ? [] : this.validate(submitted);
  });

  protected readonly hasErrors = computed(() => this.visibleErrors().length > 0);

  /**
   * The field's message, but only while `upload` is resolved. Active, there is
   * no per-field message at all: „Upload fehlgeschlagen" naming no file is the
   * point of it.
   */
  protected fieldErrorFor(field: UploadField): UploadError | undefined {
    if (!this.uploadGuidance()) {
      return undefined;
    }
    return this.visibleErrors().find((error) => error.fieldId === field.id);
  }

  protected ariaInvalidFor(field: UploadField): string | null {
    return this.fieldErrorFor(field) === undefined ? null : 'true';
  }

  /**
   * The hint and the message together, in reading order, and only in the
   * resolved state — active there is neither.
   *
   * `structureHint` is deliberately not in here. It asks for real headings
   * inside the uploaded documents, which is advice about the file rather than
   * about the field; announcing it on both controls would bury the format and
   * the size limit that the barrier is actually about.
   */
  protected describedByFor(field: UploadField): string | null {
    if (!this.uploadGuidance()) {
      return null;
    }
    const error = this.fieldErrorFor(field);
    return error === undefined ? this.formatHintId : `${this.formatHintId} ${error.messageId}`;
  }

  /**
   * What the file picker offers. Active it is one format and the page says so
   * nowhere; resolved it is the three formats the hint names, so picker and
   * text agree.
   */
  protected acceptAttribute(): string {
    if (this.uploadGuidance()) {
      return ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(',');
    }
    return `.${SINGLE_ACCEPTED_EXTENSION}`;
  }

  protected onFileChange(fieldId: string, event: Event): void {
    const selected = (event.target as HTMLInputElement).files;
    const file = selected !== null && selected.length > 0 ? selected[0] : null;
    this.files.update((files) => ({ ...files, [fieldId]: file }));
  }

  /**
   * `preventDefault` is on the form's own submit event only — without it the
   * browser would navigate away from the application. That is not interception
   * of a user agent behaviour a barrier depends on (docs/ARCHITECTURE.md §5.3);
   * it is how any single-page form stops a page load, and it touches no key, no
   * focus and no tab order.
   */
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submittedFiles.set(this.files());
  }

  /**
   * Format and size, in field order. Nothing else is checked: docs/UX-COPY.md
   * §8.8 has messages for exactly these two, and a „Bitte wählen Sie eine
   * Datei" that no reviewed copy contains would be invented editorial content
   * (CLAUDE.md rule 14). A submission with nothing attached therefore reports
   * nothing — and, as in step 2, a valid one has no success text either: the
   * confirmation is step 4, and the Simulationshinweis says throughout why
   * nothing further happens (docs/UX-COPY.md §8.4).
   *
   * The messages are worded for the resolved state, which is the only state
   * that renders them. Active, the template shows `errorGeneric` and needs
   * nothing from here but the fact that something failed — which is the
   * barrier: the page knows exactly what went wrong and does not say.
   */
  private validate(submitted: Readonly<Record<string, File | null>>): UploadError[] {
    const errors: UploadError[] = [];
    const allowed = this.uploadGuidance() ? ACCEPTED_EXTENSIONS : [SINGLE_ACCEPTED_EXTENSION];

    for (const field of this.fields) {
      const file = submitted[field.id];
      if (file === undefined || file === null) {
        continue;
      }

      const messageId = `sim-upload-error-${field.id.slice('sim-upload-'.length)}`;
      const extension = this.extensionOf(file.name);

      if (!allowed.includes(extension)) {
        errors.push({
          fieldId: field.id,
          messageId,
          // A file name without a dot has no format to name, and „hat das
          // Format ." would be a broken sentence read out verbatim from a
          // `role="alert"` — in the variant this module holds up as the
          // correct one (docs/UX-COPY.md §8.8 `error.formatUnknown`).
          message:
            extension === ''
              ? `Die Datei „${file.name}" hat kein erkennbares Format. ` +
                'Zulässig sind PDF, DOCX und ODT.'
              : `Die Datei „${file.name}" hat das Format ${extension.toUpperCase()}. ` +
                'Zulässig sind PDF, DOCX und ODT.',
        });
      } else if (file.size > MAX_BYTES) {
        errors.push({
          fieldId: field.id,
          messageId,
          message:
            `Die Datei „${file.name}" ist ${this.formatFileSize(file.size)} groß. ` +
            'Erlaubt sind bis zu 10 MB.',
        });
      }
    }

    return errors;
  }

  /** Lower-cased, without the dot; the empty string for a name without one. */
  private extensionOf(fileName: string): string {
    const dot = fileName.lastIndexOf('.');
    return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
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
