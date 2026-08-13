// Structural assertions for the two barriers of step 3 (docs/TESTING.md §6):
// the thing that should be missing is missing, and the thing that should be
// present is present — in both directions, because a barrier that cannot be
// switched off is not a demonstration.
//
// Both barriers are invisible to axe (`automatedDetection: 'manual'`), so this
// file is their only automated coverage besides the runs in
// e2e/document-upload.spec.ts. docs/TESTING.md §6 names the assertion for the
// `pdf` barrier verbatim: "a download link exists; no equivalent HTML posting
// is present in the region" against "posting text is in the DOM as headings
// and paragraphs".
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DocumentUploadStepComponent } from './document-upload-step.component';

/**
 * The query parameters of the running fixture, so a test can change the barrier
 * state the way the panel does — by publishing a new URL — instead of building
 * a second component in the other state. Toggling *after* an interaction is a
 * different assertion from starting there, and it is the one the panel makes
 * possible.
 */
let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

/** Barrier state is read from the URL only (docs/ARCHITECTURE.md §8). */
function setup(frei?: string): ComponentFixture<DocumentUploadStepComponent> {
  TestBed.resetTestingModule();
  queryParams = new BehaviorSubject(convertToParamMap(frei === undefined ? {} : { frei }));
  TestBed.configureTestingModule({
    imports: [DocumentUploadStepComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
    ],
  });

  const fixture = TestBed.createComponent(DocumentUploadStepComponent);
  fixture.detectChanges();
  return fixture;
}

/** What the panel does: navigate to the same page with a different `frei`. */
function toggleTo(fixture: ComponentFixture<DocumentUploadStepComponent>, frei: string): void {
  queryParams.next(convertToParamMap({ frei }));
  fixture.detectChanges();
}

function element(fixture: ComponentFixture<DocumentUploadStepComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function text(fixture: ComponentFixture<DocumentUploadStepComponent>): string {
  return element(fixture).textContent ?? '';
}

function downloadLink(
  fixture: ComponentFixture<DocumentUploadStepComponent>,
): HTMLAnchorElement | null {
  return element(fixture).querySelector('.document-download a');
}

function submit(fixture: ComponentFixture<DocumentUploadStepComponent>): void {
  element(fixture).querySelector<HTMLButtonElement>('.submit-button')!.click();
  fixture.detectChanges();
}

const CV = 'sim-upload-cv';
const CERTIFICATES = 'sim-upload-certificates';

const PDF_LINK_TEXT = 'Stellenausschreibung_2026_IT-Projektmanagement_final_v3.pdf (412 KB)';
const FORMAT_HINT = 'Zulässig sind PDF, DOCX und ODT bis 10 MB je Datei.';

const ALL_RESOLVED = 'alle';

describe('DocumentUploadStepComponent (docs/SPEC_v1.md Slice 9)', () => {
  describe('the page around the barriers (docs/UX-COPY.md §8.8)', () => {
    it('renders the heading, the intro and the submit label from the copy', () => {
      const fixture = setup();

      expect(element(fixture).querySelector('h3')!.textContent!.trim()).toBe(
        'Unterlagen hochladen',
      );
      expect(text(fixture)).toContain(
        'Bitte laden Sie Ihre vollständigen Bewerbungsunterlagen hoch.',
      );
      expect(element(fixture).querySelector('.submit-button')!.textContent!.trim()).toBe(
        'Unterlagen übermitteln',
      );
    });

    it('renders the two upload fields in the order the copy lists them', () => {
      const controls = Array.from(
        element(setup()).querySelectorAll<HTMLInputElement>('.field-control'),
      );

      expect(controls.map((control) => control.id)).toEqual([CV, CERTIFICATES]);
      expect(controls.every((control) => control.type === 'file')).toBeTrue();
    });

    // Missing labels are the barrier of step 2 and of no other step. A barrier
    // the panel does not explain on this page must not appear on this page.
    it('associates both labels with their field, in every barrier state', () => {
      for (const frei of [undefined, ALL_RESOLVED, 'pdf', 'upload']) {
        const fixture = setup(frei);
        const labels = Array.from(element(fixture).querySelectorAll<HTMLLabelElement>('label'));

        expect(labels.map((label) => label.textContent!.trim()))
          .withContext(`frei=${frei}`)
          .toEqual(['Lebenslauf', 'Zeugnisse']);
        expect(labels.map((label) => label.htmlFor)).toEqual([CV, CERTIFICATES]);
      }
    });

    // docs/UX-COPY.md §8.8: the fourth Simulationshinweis. It stands wherever
    // someone could attach real documents, is present regardless of barrier
    // state, and is never made into a barrier — asserted in every state for
    // that reason (CLAUDE.md rule 5).
    it('always carries the simulation note, in every barrier state', () => {
      for (const frei of [undefined, ALL_RESOLVED, 'pdf', 'upload']) {
        const note = element(setup(frei)).querySelector('.simulation-note');

        expect(note).withContext(`frei=${frei}`).not.toBeNull();
        expect(note!.textContent!.trim()).toBe(
          'Diese Unterlagen werden nicht übertragen. Es werden keine Dateien gespeichert.',
        );
      }
    });

    // docs/ARCHITECTURE.md §5.6 rule 1. Everything this component renders
    // starts at h3 and nests without skipping a level — including the h5s of
    // the job description, which only exist while `pdf` is resolved.
    it('starts its headings at h3 and nests them without a gap', () => {
      for (const frei of [undefined, ALL_RESOLVED]) {
        const levels = Array.from(
          element(setup(frei)).querySelectorAll('h1, h2, h3, h4, h5, h6'),
          (heading) => Number(heading.tagName.slice(1)),
        );

        expect(levels.length).toBeGreaterThan(1);
        expect(levels[0]).withContext(`frei=${frei}`).toBe(3);
        levels.forEach((level, index) => {
          if (index > 0) {
            expect(level)
              .withContext(`frei=${frei}`)
              .toBeLessThanOrEqual(levels[index - 1] + 1);
          }
        });
      }
    });

    // docs/ARCHITECTURE.md §5.6 rule 2 — a duplicate id across the boundary
    // would break `for`/`aria-labelledby` in the panel.
    it('prefixes every id with sim- and gives each exactly once', () => {
      for (const frei of [undefined, ALL_RESOLVED]) {
        const fixture = setup(frei);
        attach(fixture, CV, 'lebenslauf.rtf', 1024);
        attach(fixture, CERTIFICATES, 'zeugnisse.rtf', 1024);
        submit(fixture);

        const ids = Array.from(element(fixture).querySelectorAll('[id]'), (node) => node.id);

        expect(ids.length).toBeGreaterThan(3);
        expect(ids.filter((id) => !id.startsWith('sim-')))
          .withContext(`frei=${frei}`)
          .toEqual([]);
        expect(new Set(ids).size).withContext(`frei=${frei}`).toBe(ids.length);
      }
    });

    // No backend, no persistence, no network request. A form that could
    // navigate away would take the whole application with it.
    it('does not let the form submission leave the page', () => {
      const fixture = setup(ALL_RESOLVED);
      const form: HTMLFormElement = element(fixture).querySelector('form')!;
      const event = new Event('submit', { cancelable: true, bubbles: true });

      form.dispatchEvent(event);

      expect(event.defaultPrevented).toBeTrue();
    });
  });

  describe('barrier `pdf` — active (docs/UX-COPY.md §8.2)', () => {
    it('offers the posting as a download and nowhere as text', () => {
      const fixture = setup();

      expect(text(fixture)).toContain(
        'Die vollständige Stellenbeschreibung entnehmen Sie bitte dem beigefügten Dokument.',
      );
      expect(text(fixture)).not.toContain('Sie können die Stellenbeschreibung hier lesen');

      // docs/TESTING.md §6: "no equivalent HTML posting is present in the
      // region". Both language variants are checked, because either one
      // appearing here would resolve the barrier by accident.
      expect(text(fixture)).not.toContain('Aufgabenprofil');
      expect(text(fixture)).not.toContain('Ihre Aufgaben');
      expect(element(fixture).querySelectorAll('h5').length).toBe(0);
    });

    it('links a real file, with the file type and size in the link text', () => {
      const link = downloadLink(setup())!;

      expect(link.textContent!.trim()).toBe(PDF_LINK_TEXT);
      // Relative, never root-absolute: a leading slash 404s under a
      // configurable base href (docs/ARCHITECTURE.md §16).
      expect(link.getAttribute('href')).toBe(
        'simulation/Stellenausschreibung_2026_IT-Projektmanagement_final_v3.pdf',
      );
    });
  });

  describe('barrier `pdf` — resolved', () => {
    it('puts the posting on the page as headings and paragraphs', () => {
      const fixture = setup('pdf');

      expect(text(fixture)).toContain(
        'Sie können die Stellenbeschreibung hier lesen oder als PDF herunterladen.',
      );
      expect(element(fixture).querySelectorAll('h5').length).toBeGreaterThan(0);
      expect(element(fixture).querySelectorAll('.posting-document p').length).toBeGreaterThan(1);
    });

    // docs/SPEC_v1.md slice 9 acceptance: "The resolved `pdf` variant still
    // offers the download — the accessible state is 'also as text', not 'PDF
    // removed'."
    it('keeps the download, unchanged, beside the text', () => {
      const active = downloadLink(setup())!;
      const resolved = downloadLink(setup('pdf'))!;

      expect(resolved.textContent!.trim()).toBe(active.textContent!.trim());
      expect(resolved.getAttribute('href')).toBe(active.getAttribute('href'));
    });
  });

  // docs/UX-COPY.md §8.2: the description on this page is the same document as
  // in step 1, from one source, and therefore follows `sprache` — a barrier the
  // panel lists under step 1. docs/TESTING.md §4 asks for a combination test
  // wherever one part of a scenario depends on another barrier's state; this is
  // that test.
  describe('the posting text is the same document as in step 1', () => {
    it('is written in officialese while `sprache` is active', () => {
      const fixture = setup('pdf');

      expect(element(fixture).querySelector('h5')!.textContent!.trim()).toBe('Aufgabenprofil');
      expect(text(fixture)).toContain('Im Rahmen der Ihnen obliegenden Tätigkeit');
    });

    it('is written in plain language once `sprache` is resolved as well', () => {
      const fixture = setup('pdf,sprache');

      expect(element(fixture).querySelector('h5')!.textContent!.trim()).toBe('Ihre Aufgaben');
      expect(text(fixture)).toContain('Sie leiten unsere IT-Projekte');
      expect(text(fixture)).not.toContain('Im Rahmen der Ihnen obliegenden Tätigkeit');
    });
  });

  describe('barrier `upload` — active (docs/UX-COPY.md §8.8)', () => {
    it('names neither the accepted formats nor a size limit', () => {
      const fixture = setup();

      expect(text(fixture)).not.toContain('Zulässig sind');
      expect(text(fixture)).not.toContain('10 MB');
      expect(text(fixture)).not.toContain('echte Überschriften');
      expect(element(fixture).querySelectorAll('[aria-describedby]').length).toBe(0);
    });

    it('takes a single format in the file picker, and says so nowhere', () => {
      for (const control of Array.from(
        element(setup()).querySelectorAll<HTMLInputElement>('.field-control'),
      )) {
        expect(control.getAttribute('accept')).withContext(control.id).toBe('.pdf');
      }
    });

    it('answers a rejected file with one opaque line and no association', () => {
      const fixture = setup();
      attach(fixture, CV, 'lebenslauf.docx', 1024);
      submit(fixture);

      expect(element(fixture).querySelector('.error-generic')!.textContent!.trim()).toBe(
        'Upload fehlgeschlagen. Bitte versuchen Sie es erneut.',
      );
      // The message names no file, no format and no limit — and nothing on the
      // page points at the field that was rejected.
      expect(text(fixture)).not.toContain('lebenslauf.docx');
      expect(element(fixture).querySelectorAll('[role="alert"]').length).toBe(0);
      expect(element(fixture).querySelectorAll('[aria-invalid]').length).toBe(0);
      expect(element(fixture).querySelectorAll('[aria-describedby]').length).toBe(0);
      expect(element(fixture).querySelectorAll('.field-error').length).toBe(0);
    });

    it('reports nothing at all before the first submission', () => {
      expect(element(setup()).querySelector('.error-generic')).toBeNull();
    });

    it('rejects a file over the limit the page never mentions', () => {
      const fixture = setup();
      attach(fixture, CV, 'lebenslauf.pdf', 12 * 1024 * 1024);
      submit(fixture);

      expect(element(fixture).querySelector('.error-generic')).not.toBeNull();
    });
  });

  describe('barrier `upload` — resolved', () => {
    it('states the formats, the size limit and the structure hint before the field', () => {
      const fixture = setup('upload');

      expect(text(fixture)).toContain(FORMAT_HINT);
      expect(text(fixture)).toContain(
        'Bitte verwenden Sie in Ihren Dokumenten echte Überschriften statt vergrößerter ' +
          'Textzeilen.',
      );

      // Stated in the markup as well as on screen: both fields are described
      // by the hint before anything has gone wrong.
      const hint = element(fixture).querySelector('.format-hint')!;
      expect(hint.id).toBe('sim-upload-format-hint');
      for (const control of Array.from(
        element(fixture).querySelectorAll<HTMLInputElement>('.field-control'),
      )) {
        expect(control.getAttribute('aria-describedby')).withContext(control.id).toBe(hint.id);
      }
    });

    it('offers all three formats in the file picker', () => {
      for (const control of Array.from(
        element(setup('upload')).querySelectorAll<HTMLInputElement>('.field-control'),
      )) {
        expect(control.getAttribute('accept')).withContext(control.id).toBe('.pdf,.docx,.odt');
      }
    });

    it('accepts a format the active variant rejects', () => {
      const fixture = setup('upload');
      attach(fixture, CV, 'lebenslauf.docx', 1024);
      submit(fixture);

      expect(element(fixture).querySelectorAll('.field-error').length).toBe(0);
    });

    // The contrast that carries the lesson (docs/UX-COPY.md §8.8): „Upload
    // fehlgeschlagen" against a message that names the file and the format.
    it('names the file and its format when the format is wrong', () => {
      const fixture = setup('upload');
      attach(fixture, CV, 'lebenslauf.rtf', 1024);
      submit(fixture);

      const message = element(fixture).querySelector('.field-error')!;
      expect(message.textContent!.trim()).toBe(
        'Die Datei „lebenslauf.rtf" hat das Format RTF. Zulässig sind PDF, DOCX und ODT.',
      );
      expect(message.getAttribute('role')).toBe('alert');
    });

    // A scanned or exported document often arrives without a dot in its name.
    // „hat das Format ." would be a broken sentence, read out verbatim from a
    // role="alert" — and in the variant this module holds up as the correct
    // one (docs/UX-COPY.md §8.8 `error.formatUnknown`).
    it('names no format when the file has none', () => {
      const fixture = setup('upload');
      attach(fixture, CV, 'Lebenslauf Anna Beispiel', 1024);
      submit(fixture);

      expect(element(fixture).querySelector('.field-error')!.textContent!.trim()).toBe(
        'Die Datei „Lebenslauf Anna Beispiel" hat kein erkennbares Format. ' +
          'Zulässig sind PDF, DOCX und ODT.',
      );
    });

    it('names the file and its size when the file is too large', () => {
      const fixture = setup('upload');
      attach(fixture, CERTIFICATES, 'zeugnisse.pdf', 12 * 1024 * 1024);
      submit(fixture);

      expect(element(fixture).querySelector('.field-error')!.textContent!.trim()).toBe(
        'Die Datei „zeugnisse.pdf" ist 12,0 MB groß. Erlaubt sind bis zu 10 MB.',
      );
    });

    it('associates the message with its field and marks the field invalid', () => {
      const fixture = setup('upload');
      attach(fixture, CV, 'lebenslauf.rtf', 1024);
      submit(fixture);

      const control = element(fixture).querySelector<HTMLInputElement>(`#${CV}`)!;
      expect(control.getAttribute('aria-invalid')).toBe('true');

      // The hint stays, and the message is added after it — an association
      // that replaced the hint would trade one piece of information for
      // another.
      const describedBy = control.getAttribute('aria-describedby')!;
      expect(describedBy).toBe('sim-upload-format-hint sim-upload-error-cv');
      for (const id of describedBy.split(' ')) {
        const target = element(fixture).querySelector(`#${id}`);
        expect(target).withContext(id).not.toBeNull();
        expect(target!.textContent!.trim().length).toBeGreaterThan(0);
      }
    });

    it('leaves the field that is fine untouched', () => {
      const fixture = setup('upload');
      attach(fixture, CV, 'lebenslauf.rtf', 1024);
      attach(fixture, CERTIFICATES, 'zeugnisse.pdf', 1024);
      submit(fixture);

      const fine = element(fixture).querySelector<HTMLInputElement>(`#${CERTIFICATES}`)!;
      expect(fine.getAttribute('aria-invalid')).toBeNull();
      expect(fine.getAttribute('aria-describedby')).toBe('sim-upload-format-hint');
    });

    it('clears the report once the attached files are acceptable', () => {
      const fixture = setup('upload');
      attach(fixture, CV, 'lebenslauf.rtf', 1024);
      submit(fixture);
      expect(element(fixture).querySelectorAll('.field-error').length).toBe(1);

      attach(fixture, CV, 'lebenslauf.pdf', 1024);
      submit(fixture);

      expect(element(fixture).querySelectorAll('.field-error').length).toBe(0);
      expect(element(fixture).querySelectorAll('[aria-invalid]').length).toBe(0);
    });
  });

  // Fail, then resolve the barrier and look again — the move this whole tool
  // exists for. The rules `upload` validates against depend on the barrier, so
  // a report kept from before the toggle would be the answer to a question
  // nobody is asking any more.
  describe('the report is recomputed when the barrier changes after a submission', () => {
    it('drops a rejection the resolved variant would never have made', () => {
      const fixture = setup();
      attach(fixture, CV, 'lebenslauf.docx', 1024);
      submit(fixture);
      expect(element(fixture).querySelector('.error-generic')).not.toBeNull();

      toggleTo(fixture, 'upload');

      // DOCX is one of the three formats the hint names two lines above. A
      // message rejecting it here would contradict the page itself.
      expect(text(fixture)).toContain(FORMAT_HINT);
      expect(element(fixture).querySelectorAll('.field-error').length).toBe(0);
      expect(element(fixture).querySelectorAll('[aria-invalid]').length).toBe(0);
      expect(text(fixture)).not.toContain('hat das Format DOCX');
    });

    it('states the reason for a rejection both variants make', () => {
      const fixture = setup();
      attach(fixture, CERTIFICATES, 'zeugnisse.pdf', 12 * 1024 * 1024);
      submit(fixture);
      expect(element(fixture).querySelector('.error-generic')).not.toBeNull();

      toggleTo(fixture, 'upload');

      expect(element(fixture).querySelector('.field-error')!.textContent!.trim()).toBe(
        'Die Datei „zeugnisse.pdf" ist 12,0 MB groß. Erlaubt sind bis zu 10 MB.',
      );
    });

    it('reports nothing after a toggle if nothing was ever submitted', () => {
      const fixture = setup();
      attach(fixture, CV, 'lebenslauf.docx', 1024);

      toggleTo(fixture, 'upload');

      expect(element(fixture).querySelector('.error-generic')).toBeNull();
      expect(element(fixture).querySelectorAll('.field-error').length).toBe(0);
    });

    // The other direction: what the resolved variant explains, the active one
    // only ever answers with „Upload fehlgeschlagen".
    it('falls back to the opaque line when the barrier is switched back on', () => {
      const fixture = setup('upload');
      attach(fixture, CV, 'lebenslauf.rtf', 1024);
      submit(fixture);
      expect(element(fixture).querySelectorAll('.field-error').length).toBe(1);

      toggleTo(fixture, '');

      expect(element(fixture).querySelector('.error-generic')!.textContent!.trim()).toBe(
        'Upload fehlgeschlagen. Bitte versuchen Sie es erneut.',
      );
      expect(element(fixture).querySelectorAll('.field-error').length).toBe(0);
      expect(text(fixture)).not.toContain('lebenslauf.rtf');
    });
  });

  // Each barrier is its own toggle; resolving one must not resolve the other,
  // which is what the panel's per-barrier checkboxes promise.
  describe('the two barriers switch independently', () => {
    it('leaves `upload` alone when only `pdf` is resolved', () => {
      const fixture = setup('pdf');
      attach(fixture, CV, 'lebenslauf.docx', 1024);
      submit(fixture);

      expect(text(fixture)).toContain('Sie können die Stellenbeschreibung hier lesen');
      expect(text(fixture)).not.toContain(FORMAT_HINT);
      expect(element(fixture).querySelector('.error-generic')).not.toBeNull();
    });

    it('leaves `pdf` alone when only `upload` is resolved', () => {
      const fixture = setup('upload');

      expect(text(fixture)).toContain(FORMAT_HINT);
      expect(text(fixture)).toContain('entnehmen Sie bitte dem beigefügten Dokument');
      expect(element(fixture).querySelectorAll('h5').length).toBe(0);
    });

    it('resolves both together for `frei=alle`', () => {
      const fixture = setup(ALL_RESOLVED);
      attach(fixture, CV, 'lebenslauf.docx', 1024);
      submit(fixture);

      expect(text(fixture)).toContain(FORMAT_HINT);
      expect(element(fixture).querySelectorAll('h5').length).toBeGreaterThan(0);
      expect(element(fixture).querySelector('.error-generic')).toBeNull();
      expect(downloadLink(fixture)).not.toBeNull();
    });
  });
});

/**
 * A file of the given name and size on one of the two fields. `DataTransfer` is
 * how a file input is filled without a file picker; the `File` never leaves the
 * tab, which is also true of the real thing (no backend, PRD §4).
 */
function attach(
  fixture: ComponentFixture<DocumentUploadStepComponent>,
  fieldId: string,
  fileName: string,
  bytes: number,
): void {
  const control = element(fixture).querySelector<HTMLInputElement>(`#${fieldId}`)!;
  const transfer = new DataTransfer();
  transfer.items.add(new File([new Uint8Array(bytes)], fileName));
  control.files = transfer.files;
  control.dispatchEvent(new Event('change'));
  fixture.detectChanges();
}
