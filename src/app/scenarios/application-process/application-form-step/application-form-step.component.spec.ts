// Structural assertions for the four barriers of step 2 (docs/TESTING.md §6):
// the thing that should be missing is missing, and the thing that should be
// present is present — in both directions, because a barrier that cannot be
// switched off is not a demonstration.
//
// Three of the four are invisible to axe (`automatedDetection: 'manual'`), so
// this file is their only automated coverage. `labels` is visible to axe, but
// only as "some field has no accessible name"; that the visible text is
// unchanged and that it comes back as a `<label for>` is asserted here.
//
// What is deliberately *not* here: the keyboard assertions and the focus move
// to the first error. Both need real key events and a real focus model
// (docs/TESTING.md §6: "a simulated trap that a test can bypass by calling
// .focus() is not being tested at all"), so they live in
// e2e/application-form.spec.ts.
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ApplicationFormStepComponent } from './application-form-step.component';

/** Barrier state is read from the URL only (docs/ARCHITECTURE.md §8). */
function setup(frei?: string): ComponentFixture<ApplicationFormStepComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ApplicationFormStepComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          queryParamMap: new BehaviorSubject(convertToParamMap(frei === undefined ? {} : { frei })),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(ApplicationFormStepComponent);
  fixture.detectChanges();
  return fixture;
}

function element(fixture: ComponentFixture<ApplicationFormStepComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function text(fixture: ComponentFixture<ApplicationFormStepComponent>): string {
  return element(fixture).textContent ?? '';
}

function submitControl(fixture: ComponentFixture<ApplicationFormStepComponent>): HTMLElement {
  return element(fixture).querySelector('.submit-button')!;
}

/** Presses the submit control, whichever element the `tastatur` state made it. */
function submit(fixture: ComponentFixture<ApplicationFormStepComponent>): void {
  submitControl(fixture).click();
  fixture.detectChanges();
}

function fieldIds(fixture: ComponentFixture<ApplicationFormStepComponent>): string[] {
  return Array.from(
    element(fixture).querySelectorAll<HTMLElement>('.field-control'),
    (control) => control.id,
  );
}

/** The four required fields of docs/UX-COPY.md §8.4. */
const REQUIRED_IDS = ['sim-first-name', 'sim-last-name', 'sim-email', 'sim-cv'];

const ALL_RESOLVED = 'alle';

describe('ApplicationFormStepComponent (docs/SPEC_v1.md Slice 8)', () => {
  describe('the form around the barriers (docs/UX-COPY.md §8.4)', () => {
    it('renders the eight fields in the order the copy lists them', () => {
      expect(fieldIds(setup())).toEqual([
        'sim-first-name',
        'sim-last-name',
        'sim-email',
        'sim-phone',
        'sim-start-date',
        'sim-salary',
        'sim-cover-letter',
        'sim-cv',
      ]);
    });

    it('renders the heading, the intro and the submit label from the copy', () => {
      const fixture = setup();

      expect(element(fixture).querySelector('h3')!.textContent!.trim()).toBe('Online-Bewerbung');
      expect(text(fixture)).toContain('Bitte füllen Sie das Formular vollständig aus.');
      expect(submitControl(fixture).textContent!.trim()).toBe('Bewerbung absenden');
      expect(text(fixture)).toContain(
        'Mit dem Absenden stimmen Sie unseren Datenschutzhinweisen zu.',
      );
    });

    // docs/UX-COPY.md §8.4: the Simulationshinweis stands wherever someone
    // could enter real data, is present regardless of barrier state, and is
    // never made into a barrier. Asserted in every state for that reason —
    // a note that disappeared with a toggle would be exactly the failure the
    // rule exists to prevent.
    it('always carries the simulation note, in every barrier state', () => {
      for (const frei of [undefined, ALL_RESOLVED, 'labels', 'tastatur', 'pflichtfeld', 'fehler']) {
        const note = element(setup(frei)).querySelector('.simulation-note');

        expect(note).withContext(`frei=${frei}`).not.toBeNull();
        expect(note!.textContent!.trim()).toBe(
          'Diese Bewerbung wird nicht übertragen. Es werden keine Daten gespeichert.',
        );
      }
    });

    // docs/ARCHITECTURE.md §5.6 rule 1. Everything this component renders
    // starts at h3 and nests without skipping a level — including the error
    // summary's h4, which only exists after a failed submission.
    it('starts its headings at h3 and nests them without a gap', () => {
      const fixture = setup(ALL_RESOLVED);
      submit(fixture);

      const levels = Array.from(
        element(fixture).querySelectorAll('h1, h2, h3, h4, h5, h6'),
        (heading) => Number(heading.tagName.slice(1)),
      );

      expect(levels.length).toBeGreaterThan(1);
      expect(levels[0]).toBe(3);
      levels.forEach((level, index) => {
        if (index > 0) {
          expect(level).toBeLessThanOrEqual(levels[index - 1] + 1);
        }
      });
    });

    // docs/ARCHITECTURE.md §5.6 rule 2 — a duplicate id across the boundary
    // would break `for`/`aria-labelledby` in the panel. Eight form fields make
    // this the step where it would first go wrong.
    it('prefixes every id with sim-, including the error message ids', () => {
      for (const frei of [undefined, ALL_RESOLVED]) {
        const fixture = setup(frei);
        submit(fixture);
        const ids = Array.from(element(fixture).querySelectorAll('[id]'), (node) => node.id);

        expect(ids.length).toBeGreaterThan(8);
        expect(ids.filter((id) => !id.startsWith('sim-')))
          .withContext(`frei=${frei}`)
          .toEqual([]);
      }
    });

    it('gives every id exactly once', () => {
      const fixture = setup(ALL_RESOLVED);
      submit(fixture);
      const ids = Array.from(element(fixture).querySelectorAll('[id]'), (node) => node.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    // No backend, no persistence, no network request (docs/SPEC_v1.md slice 8).
    // A form that could navigate away would take the whole application with it.
    it('does not let the form submission leave the page', () => {
      const fixture = setup(ALL_RESOLVED);
      const form: HTMLFormElement = element(fixture).querySelector('form')!;
      const event = new Event('submit', { cancelable: true, bubbles: true });

      form.dispatchEvent(event);

      expect(event.defaultPrevented).toBeTrue();
    });
  });

  describe('barrier `labels` — active (docs/UX-COPY.md §8.4)', () => {
    it('renders the visible texts as plain divs, associated with nothing', () => {
      const fixture = setup();

      expect(element(fixture).querySelectorAll('label').length).toBe(0);
      expect(element(fixture).querySelectorAll('div.field-label').length).toBe(8);
    });

    it('leaves every field without an accessible name of any kind', () => {
      const fixture = setup();

      for (const control of Array.from(
        element(fixture).querySelectorAll<HTMLElement>('.field-control'),
      )) {
        expect(control.getAttribute('aria-label')).toBeNull();
        expect(control.getAttribute('aria-labelledby')).toBeNull();
        expect(control.getAttribute('title')).toBeNull();
        // No placeholder either: a placeholder-as-label would be a *different*
        // barrier, and one that nothing in the panel explains.
        expect(control.getAttribute('placeholder')).toBeNull();
      }
    });

    it('keeps the visible text identical to the resolved variant', () => {
      const labelText = (fixture: ComponentFixture<ApplicationFormStepComponent>): string[] =>
        Array.from(element(fixture).querySelectorAll('.field-label'), (label) =>
          label.textContent!.replace(/\s+/g, ' ').trim(),
        );

      expect(labelText(setup())).toEqual(labelText(setup('labels')));
    });
  });

  describe('barrier `labels` — resolved', () => {
    it('gives every field a label element pointing at it', () => {
      const fixture = setup('labels');
      const labels = Array.from(element(fixture).querySelectorAll<HTMLLabelElement>('label'));

      expect(labels.length).toBe(8);
      expect(element(fixture).querySelectorAll('div.field-label').length).toBe(0);
      expect(labels.map((label) => label.htmlFor)).toEqual(fieldIds(fixture));

      // The association a screen reader and a voice-control user actually
      // read, not just the attribute: `control.labels` is what the browser
      // resolved it to.
      for (const control of Array.from(
        element(fixture).querySelectorAll<HTMLInputElement>('.field-control'),
      )) {
        expect(control.labels!.length).withContext(control.id).toBe(1);
      }
    });
  });

  describe('barrier `tastatur` — active (docs/ARCHITECTURE.md §5.3)', () => {
    it('renders the submit control as a div with no way into the tab order', () => {
      const control = submitControl(setup());

      expect(control.tagName).toBe('DIV');
      expect(control.getAttribute('tabindex')).toBeNull();
      // No `role="button"` either: that would announce a button that cannot
      // then be operated, which is a second defect on top of the declared one
      // (docs/UX-COPY.md §8.4 writes it as a plain div).
      expect(control.getAttribute('role')).toBeNull();
    });

    // The other half of "unreachable": with no submit element in it, the form
    // has no implicit submission either, so Enter in a text field does nothing
    // — the dead end keyboard users actually hit.
    it('leaves the form without any submit element', () => {
      const fixture = setup();

      expect(
        element(fixture).querySelectorAll('button, input[type="submit"], input[type="image"]')
          .length,
      ).toBe(0);
    });

    // By omission, never by interception (CLAUDE.md rule 6): the control does
    // not answer to a key, and nothing on the page answers *for* it.
    //
    // Asserted by dispatching the keys rather than by looking for inline
    // `onkeydown` attributes — Angular compiles `(keydown)` to
    // `addEventListener`, so an attribute check cannot see the binding that
    // would break this rule and would pass no matter what the template said.
    it('does not answer Enter or Space on the submit control', () => {
      const fixture = setup();

      for (const key of ['Enter', ' ']) {
        submitControl(fixture).dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
        );
        submitControl(fixture).dispatchEvent(
          new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }),
        );
        fixture.detectChanges();

        expect(element(fixture).querySelector('.error-generic'))
          .withContext(`key ${key}`)
          .toBeNull();
      }
    });

    // The rule this project cannot afford to break: nothing fights the user
    // agent over Tab. A handler that called `preventDefault` here would hold a
    // keyboard user inside the region — the failure docs/TESTING.md §7 exists
    // to catch, caught here in the component that would have caused it.
    it('lets Tab through untouched, from every element of the form', () => {
      const fixture = setup();
      const targets: EventTarget[] = [
        element(fixture).querySelector('form')!,
        submitControl(fixture),
        ...Array.from(element(fixture).querySelectorAll('.field-control')),
      ];

      for (const target of targets) {
        const event = new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          cancelable: true,
        });
        target.dispatchEvent(event);

        expect(event.defaultPrevented).toBeFalse();
      }
    });

    it('still reacts to a mouse click — the barrier is the keyboard, not the button', () => {
      const fixture = setup();
      submit(fixture);

      expect(element(fixture).querySelector('.error-generic')).not.toBeNull();
    });
  });

  describe('barrier `tastatur` — resolved', () => {
    it('renders a real submit button', () => {
      const control = submitControl(setup('tastatur'));

      expect(control.tagName).toBe('BUTTON');
      expect((control as HTMLButtonElement).type).toBe('submit');
      expect(control.getAttribute('tabindex')).toBeNull(); // native, not bolted on
    });
  });

  describe('barrier `pflichtfeld` — active (docs/UX-COPY.md §8.7)', () => {
    it('marks required fields with an asterisk and nothing else', () => {
      const fixture = setup();

      expect(element(fixture).querySelectorAll('.required-star').length).toBe(REQUIRED_IDS.length);
      expect(text(fixture)).not.toContain('(Pflichtfeld)');
      expect(text(fixture)).not.toContain('müssen ausgefüllt werden');
    });

    it('sets `required` on no field at all', () => {
      const fixture = setup();

      for (const control of Array.from(
        element(fixture).querySelectorAll<HTMLInputElement>('.field-control'),
      )) {
        expect(control.hasAttribute('required')).withContext(control.id).toBeFalse();
        expect(control.getAttribute('aria-required')).toBeNull();
      }
    });

    // The asterisk is inside the label text and is *not* aria-hidden — with
    // `labels` resolved a screen reader reads „Vorname Stern", with `labels`
    // active it reads nothing at all. Both are what docs/UX-COPY.md §8.7
    // describes; what neither gives is the word „Pflichtfeld".
    it('puts the asterisk inside the visible label, unhidden', () => {
      const fixture = setup('labels');
      const firstLabel = element(fixture).querySelector('label')!;

      expect(firstLabel.textContent!.replace(/\s+/g, ' ').trim()).toBe('Vorname *');
      expect(firstLabel.querySelector('.required-star')!.getAttribute('aria-hidden')).toBeNull();
    });
  });

  describe('barrier `pflichtfeld` — resolved', () => {
    it('names the requirement in the label, sets `required`, and drops the asterisk', () => {
      const fixture = setup('pflichtfeld');

      expect(element(fixture).querySelectorAll('.required-star').length).toBe(0);

      const required = Array.from(
        element(fixture).querySelectorAll<HTMLInputElement>('.field-control'),
      ).filter((control) => control.hasAttribute('required'));
      expect(required.map((control) => control.id)).toEqual(REQUIRED_IDS);

      for (const label of Array.from(element(fixture).querySelectorAll('.field-label'))) {
        const labelText = label.textContent!.replace(/\s+/g, ' ').trim();
        const isRequired = REQUIRED_IDS.some((id) => fieldOfLabel(label) === id);
        expect(labelText.includes('(Pflichtfeld)')).withContext(labelText).toBe(isRequired);
      }
    });

    it('adds the legend above the form and drops the asterisk sentence from the intro', () => {
      const fixture = setup('pflichtfeld');

      expect(text(fixture)).toContain(
        'Mit „Pflichtfeld" gekennzeichnete Felder müssen ausgefüllt werden.',
      );
      expect(text(fixture)).toContain('Bitte füllen Sie das Formular vollständig aus.');
      // The intro's second sentence points at a marking that no longer
      // exists in this state (docs/UX-COPY.md §8.4).
      expect(text(fixture)).not.toContain('Mit * gekennzeichnete Felder');
    });
  });

  describe('barrier `fehler` — active (docs/UX-COPY.md §8.5)', () => {
    it('answers an invalid submission with one opaque line and no association', () => {
      const fixture = setup();
      submit(fixture);

      expect(element(fixture).querySelector('.error-generic')!.textContent!.trim()).toBe(
        'Fehler: Die Übermittlung konnte nicht durchgeführt werden. ' +
          'Bitte überprüfen Sie Ihre Eingaben. (Code 422)',
      );
      expect(element(fixture).querySelectorAll('[role="alert"]').length).toBe(0);
      expect(element(fixture).querySelectorAll('[aria-invalid]').length).toBe(0);
      expect(element(fixture).querySelectorAll('[aria-describedby]').length).toBe(0);
      expect(element(fixture).querySelectorAll('.field-error').length).toBe(0);
    });

    it('reports nothing at all before the first submission', () => {
      const fixture = setup();

      expect(element(fixture).querySelector('.error-generic')).toBeNull();
      expect(element(fixture).querySelector('.error-summary')).toBeNull();
    });
  });

  describe('barrier `fehler` — resolved', () => {
    it('renders a summary with jump links to every field in error', () => {
      const fixture = setup('fehler');
      submit(fixture);

      const summary = element(fixture).querySelector('.error-summary')!;
      expect(summary.getAttribute('role')).toBe('alert');
      expect(summary.querySelector('h4')!.textContent!.trim()).toBe(
        'Die Bewerbung konnte nicht abgesendet werden',
      );
      expect(summary.textContent).toContain('Bitte korrigieren Sie 4 Angaben:');

      // Empty form: first name, last name, e-mail and CV, in field order —
      // which is the order „the first error" refers to.
      const links = Array.from(
        summary.querySelectorAll('a'),
        (link) => link.getAttribute('href')!.split('#')[1],
      );
      expect(links).toEqual(['sim-first-name', 'sim-last-name', 'sim-email', 'sim-cv']);
    });

    it('associates each message with its field and marks the field invalid', () => {
      const fixture = setup('fehler');
      submit(fixture);

      for (const id of REQUIRED_IDS) {
        const control = element(fixture).querySelector<HTMLElement>(`#${id}`)!;
        expect(control.getAttribute('aria-invalid')).withContext(id).toBe('true');

        const describedBy = control.getAttribute('aria-describedby');
        expect(describedBy).withContext(id).not.toBeNull();

        // The association has to point at something that exists and says
        // something — an `aria-describedby` to a missing id is silence.
        const message = element(fixture).querySelector(`#${describedBy}`);
        expect(message).withContext(id).not.toBeNull();
        expect(message!.textContent!.trim().length).toBeGreaterThan(0);
      }
    });

    it('leaves the fields that are fine untouched', () => {
      const fixture = setup('fehler');
      submit(fixture);

      for (const id of ['sim-phone', 'sim-start-date', 'sim-salary', 'sim-cover-letter']) {
        const control = element(fixture).querySelector<HTMLElement>(`#${id}`)!;
        expect(control.getAttribute('aria-invalid')).withContext(id).toBeNull();
        expect(control.getAttribute('aria-describedby')).withContext(id).toBeNull();
      }
    });

    // The contrast that carries the lesson (docs/UX-COPY.md §8.5): „Code 422"
    // against „enthält kein @". Both are error messages; only one says what to
    // do.
    it('says what is wrong with the e-mail address rather than that something is', () => {
      const fixture = setup('fehler');
      type(fixture, 'sim-email', 'anna.beispiel.elbwerk.de');
      submit(fixture);

      expect(text(fixture)).toContain(
        'Diese E-Mail-Adresse enthält kein @. Bitte prüfen Sie die Schreibweise.',
      );
      expect(text(fixture)).not.toContain('Bitte geben Sie Ihre E-Mail-Adresse an.');
    });

    it('uses the singular when one field is left', () => {
      const fixture = setup('fehler');
      type(fixture, 'sim-first-name', 'Anna');
      type(fixture, 'sim-last-name', 'Beispiel');
      type(fixture, 'sim-email', 'anna@beispiel.de');
      submit(fixture);

      expect(text(fixture)).toContain('Bitte korrigieren Sie eine Angabe:');
      expect(text(fixture)).toContain('Bitte fügen Sie Ihren Lebenslauf als PDF bei.');
    });

    it('clears the report once every entry is valid', () => {
      const fixture = setup('fehler');
      submit(fixture);
      expect(element(fixture).querySelector('.error-summary')).not.toBeNull();

      type(fixture, 'sim-first-name', 'Anna');
      type(fixture, 'sim-last-name', 'Beispiel');
      type(fixture, 'sim-email', 'anna@beispiel.de');
      attachCv(fixture, 1024);
      submit(fixture);

      expect(element(fixture).querySelector('.error-summary')).toBeNull();
      expect(element(fixture).querySelectorAll('[aria-invalid]').length).toBe(0);
    });

    it('names the actual size when the CV is too large', () => {
      const fixture = setup('fehler');
      attachCv(fixture, 7 * 1024 * 1024);
      submit(fixture);

      expect(text(fixture)).toContain('Die Datei ist 7,0 MB groß. Erlaubt sind bis zu 5 MB.');
    });
  });

  // Each barrier is its own toggle; resolving one must not resolve another,
  // which is what the panel's per-barrier checkboxes promise.
  describe('the four barriers switch independently', () => {
    it('leaves the other three alone when only `labels` is resolved', () => {
      const fixture = setup('labels');
      submit(fixture);

      expect(element(fixture).querySelectorAll('label').length).toBe(8);
      expect(submitControl(fixture).tagName).toBe('DIV');
      expect(element(fixture).querySelectorAll('.required-star').length).toBe(REQUIRED_IDS.length);
      expect(element(fixture).querySelector('.error-generic')).not.toBeNull();
    });

    it('leaves the other three alone when only `fehler` is resolved', () => {
      const fixture = setup('fehler');
      submit(fixture);

      expect(element(fixture).querySelectorAll('label').length).toBe(0);
      expect(submitControl(fixture).tagName).toBe('DIV');
      expect(element(fixture).querySelectorAll('.required-star').length).toBe(REQUIRED_IDS.length);
      expect(element(fixture).querySelector('.error-summary')).not.toBeNull();
    });

    it('resolves all four together for `frei=alle`', () => {
      const fixture = setup(ALL_RESOLVED);
      submit(fixture);

      expect(element(fixture).querySelectorAll('label').length).toBe(8);
      expect(submitControl(fixture).tagName).toBe('BUTTON');
      expect(element(fixture).querySelectorAll('.required-star').length).toBe(0);
      expect(element(fixture).querySelector('.error-summary')).not.toBeNull();
    });
  });
});

/** The id of the control a `.field-label` belongs to, in either barrier state. */
function fieldOfLabel(label: Element): string {
  const forAttribute = label.getAttribute('for');
  if (forAttribute !== null) {
    return forAttribute;
  }
  return label.parentElement!.querySelector('.field-control')!.id;
}

function type(
  fixture: ComponentFixture<ApplicationFormStepComponent>,
  fieldId: string,
  value: string,
): void {
  const control = element(fixture).querySelector<HTMLInputElement>(`#${fieldId}`)!;
  control.value = value;
  control.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

/**
 * A file of the given size on the CV field. `DataTransfer` is how a file input
 * is filled without a file picker; the `File` never leaves the tab, which is
 * also true of the real thing (no backend, PRD §4).
 */
function attachCv(fixture: ComponentFixture<ApplicationFormStepComponent>, bytes: number): void {
  const control = element(fixture).querySelector<HTMLInputElement>('#sim-cv')!;
  const file = new File([new Uint8Array(bytes)], 'lebenslauf.pdf', { type: 'application/pdf' });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  control.files = transfer.files;
  control.dispatchEvent(new Event('change'));
  fixture.detectChanges();
}
