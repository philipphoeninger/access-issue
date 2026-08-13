// Structural assertions for the three barriers of step 4 (docs/TESTING.md §6):
// the thing that should be missing is missing, and the thing that should be
// present is present — in both directions, because a barrier that cannot be
// switched off is not a demonstration.
//
// Two of the three are organisational (`ansprechperson`,
// `inklusionshinweis`): they violate no success criterion, no checker can see
// them, and no markup is malformed while they are active. This file is
// therefore their *entire* automated coverage, and the assertions are
// necessarily about the presence and absence of information rather than about
// the correctness of anything. That is the point of the step, not a weakness
// of the test — see docs/TESTING.md §2.
//
// `bestaetigung` is the exception: the missing `alt` on the signature graphic
// is visible to axe, and e2e/confirmation.spec.ts asserts it in a browser
// (run 2). What is here is the rest of that barrier — the case number and the
// next steps existing as text or only inside the image.
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ConfirmationStepComponent } from './confirmation-step.component';

/**
 * The query parameters of the running fixture, so a test can change the barrier
 * state the way the panel does — by publishing a new URL — instead of building
 * a second component in the other state.
 */
let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

/** Barrier state is read from the URL only (docs/ARCHITECTURE.md §8). */
function setup(frei?: string): ComponentFixture<ConfirmationStepComponent> {
  TestBed.resetTestingModule();
  queryParams = new BehaviorSubject(convertToParamMap(frei === undefined ? {} : { frei }));
  TestBed.configureTestingModule({
    imports: [ConfirmationStepComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
    ],
  });

  const fixture = TestBed.createComponent(ConfirmationStepComponent);
  fixture.detectChanges();
  return fixture;
}

/** What the panel does: navigate to the same page with a different `frei`. */
function toggleTo(fixture: ComponentFixture<ConfirmationStepComponent>, frei: string): void {
  queryParams.next(convertToParamMap({ frei }));
  fixture.detectChanges();
}

function element(fixture: ComponentFixture<ConfirmationStepComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function text(fixture: ComponentFixture<ConfirmationStepComponent>): string {
  return element(fixture).textContent ?? '';
}

function signature(fixture: ComponentFixture<ConfirmationStepComponent>): HTMLImageElement {
  return element(fixture).querySelector<HTMLImageElement>('.confirm-signature')!;
}

const ALL_RESOLVED = 'alle';

/** docs/TESTING.md §4 — the n + 2 set for the three barriers of this step. */
const STATES = [undefined, ALL_RESOLVED, 'bestaetigung', 'ansprechperson', 'inklusionshinweis'];

const REFERENCE = 'Ihr Aktenzeichen: BW-2026-0417';
const MAILBOX = 'Bei Rückfragen wenden Sie sich bitte an bewerbung@elbwerk.de.';
const SIGNATURE_SRC = 'simulation/signatur_personalabteilung_final.png';

describe('ConfirmationStepComponent (docs/SPEC_v1.md Slice 10)', () => {
  describe('the page around the barriers (docs/UX-COPY.md §8.9)', () => {
    it('renders the confirmation heading from the copy', () => {
      expect(element(setup()).querySelector('h3')!.textContent!.trim()).toBe(
        'Ihre Bewerbung ist eingegangen',
      );
    });

    // docs/ARCHITECTURE.md §5.6 rule 1. Everything this component renders
    // starts at h3 and nests without skipping a level — in every state, and
    // the states differ in which headings exist at all.
    it('starts its headings at h3 and nests them without a gap', () => {
      for (const frei of STATES) {
        const levels = Array.from(
          element(setup(frei)).querySelectorAll('h1, h2, h3, h4, h5, h6'),
          (heading) => Number(heading.tagName.slice(1)),
        );

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
      for (const frei of STATES) {
        const ids = Array.from(element(setup(frei)).querySelectorAll('[id]'), (node) => node.id);

        expect(ids.length).toBeGreaterThan(0);
        expect(ids.filter((id) => !id.startsWith('sim-')))
          .withContext(`frei=${frei}`)
          .toEqual([]);
        expect(new Set(ids).size).withContext(`frei=${frei}`).toBe(ids.length);
      }
    });

    // Why there is no fifth Simulationshinweis (docs/UX-COPY.md §8.4, §8.9,
    // CLAUDE.md rule 5): the note stands wherever someone could enter real
    // data or trigger a real action, and this page offers neither. The
    // assertion is on the *reason* rather than on the absent note, so that
    // adding a field here fails this test instead of silently creating an
    // input point without a note.
    it('offers no input point, and therefore carries no simulation note', () => {
      for (const frei of STATES) {
        const page = element(setup(frei));

        expect(page.querySelectorAll('form, input, textarea, select, button').length)
          .withContext(`frei=${frei}`)
          .toBe(0);
        expect(page.querySelector('.simulation-note')).withContext(`frei=${frei}`).toBeNull();
      }
    });

    // docs/UX-COPY.md §8.9: the contact details are text in both variants —
    // Elbwerk is fictional, and a `mailto:` would open the participant's mail
    // client on an address that goes nowhere. The barrier is the missing
    // person, not the missing link target.
    it('sets the contact details as text, never as a link', () => {
      for (const frei of STATES) {
        expect(element(setup(frei)).querySelectorAll('a').length)
          .withContext(`frei=${frei}`)
          .toBe(0);
      }
    });

    it('shows the same signature graphic in every state', () => {
      for (const frei of STATES) {
        // Relative, never root-absolute: a leading slash 404s under a
        // configurable base href (docs/ARCHITECTURE.md §16).
        expect(signature(setup(frei)).getAttribute('src'))
          .withContext(`frei=${frei}`)
          .toBe(SIGNATURE_SRC);
      }
    });
  });

  describe('barrier `bestaetigung` — active (docs/UX-COPY.md §8.9)', () => {
    it('writes the confirmation in boilerplate German', () => {
      const fixture = setup();

      expect(text(fixture)).toContain('Wir bestätigen den Eingang Ihrer Bewerbungsunterlagen');
      expect(text(fixture)).toContain('Von zwischenzeitlichen Rückfragen zum Bearbeitungsstand');
      expect(text(fixture)).not.toContain('Vielen Dank für Ihre Bewerbung.');
    });

    // The barrier itself: the details are in the image and nowhere else, and
    // the image carries no `alt` at all. A screen reader then reads out the
    // file name (docs/UX-COPY.md §8.9).
    it('leaves the case number and the next steps inside an image with no alt', () => {
      const fixture = setup();

      expect(signature(fixture).hasAttribute('alt')).toBeFalse();
      expect(signature(fixture).hasAttribute('aria-hidden')).toBeFalse();

      expect(text(fixture)).not.toContain('BW-2026-0417');
      expect(text(fixture)).not.toContain('Wie es weitergeht');
      expect(element(fixture).querySelector('.next-steps')).toBeNull();
      expect(element(fixture).querySelector('.confirm-reference')).toBeNull();
    });
  });

  describe('barrier `bestaetigung` — resolved', () => {
    it('writes the confirmation in plain language', () => {
      const fixture = setup('bestaetigung');

      expect(text(fixture)).toContain(
        'Vielen Dank für Ihre Bewerbung. Wir haben Ihre Unterlagen erhalten.',
      );
      expect(text(fixture)).not.toContain('Wir bestätigen den Eingang Ihrer Bewerbungsunterlagen');
    });

    // The other half of the barrier: everything the graphic carried is now on
    // the page as text, in the copy's own wording and order.
    it('puts the case number and the next steps on the page as text', () => {
      const fixture = setup('bestaetigung');

      expect(element(fixture).querySelector('.confirm-reference')!.textContent!.trim()).toBe(
        REFERENCE,
      );
      expect(element(fixture).querySelector('h4')!.textContent!.trim()).toBe('Wie es weitergeht');

      const steps = Array.from(element(fixture).querySelectorAll('.next-steps li'), (item) =>
        item.textContent!.trim(),
      );
      expect(steps).toEqual([
        'Wir prüfen Ihre Unterlagen',
        'Bei einer Einladung erhalten Sie eine E-Mail mit Terminvorschlägen',
        'Das Gespräch dauert etwa eine Stunde und findet in Wilhelmsburg oder online statt',
      ]);
      // Ordered, because the order is information: the interview follows the
      // invitation and not the other way round.
      expect(element(fixture).querySelector('.next-steps')!.tagName).toBe('OL');
    });

    // docs/UX-COPY.md §8.9: the graphic stays as decoration rather than
    // getting `elbwerk.confirm.signatureImageAlt` as its `alt`. Its
    // information now stands beside it, and a labelled image would have a
    // screen reader read the same list twice.
    it('keeps the graphic as decoration, not as a second copy of the text', () => {
      const image = signature(setup('bestaetigung'));

      expect(image.getAttribute('alt')).toBe('');
      expect(image.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('barrier `ansprechperson` — active (docs/UX-COPY.md §8.9)', () => {
    it('names a function mailbox and no person', () => {
      const fixture = setup();

      expect(element(fixture).querySelector('.contact-mailbox')!.textContent!.trim()).toBe(MAILBOX);
      expect(element(fixture).querySelector('.contact')).toBeNull();
      expect(text(fixture)).not.toContain('Miriam Kessler');
      expect(text(fixture)).not.toContain('040 555 0123');
      expect(text(fixture)).not.toContain('Sprechzeiten');
    });
  });

  describe('barrier `ansprechperson` — resolved', () => {
    it('names a person, a phone number and when she can be reached', () => {
      const fixture = setup('ansprechperson');

      const contact = element(fixture).querySelector('.contact')!;
      expect(contact.querySelector('h4')!.textContent!.trim()).toBe('Ihre Ansprechperson');
      expect(contact.textContent).toContain('Miriam Kessler, Personalabteilung.');
      expect(contact.textContent).toContain('Telefon 040 555 0123');
      expect(contact.textContent).toContain('montags bis donnerstags von 9 bis 15 Uhr');

      // The mailbox is replaced, not supplemented: two contact routes on one
      // page would leave the reader deciding which one is meant.
      expect(element(fixture).querySelector('.contact-mailbox')).toBeNull();
      expect(text(fixture)).not.toContain(MAILBOX);
    });

    it('labels the section by its own heading', () => {
      const contact = element(setup('ansprechperson')).querySelector('.contact')!;

      expect(contact.getAttribute('aria-labelledby')).toBe('sim-confirm-contact-heading');
      expect(contact.querySelector('h4')!.id).toBe('sim-confirm-contact-heading');
    });
  });

  describe('barrier `inklusionshinweis` — active (docs/UX-COPY.md §8.9)', () => {
    // Absent without replacement, which is the barrier: there is nothing to
    // find, so nobody learns that asking is possible. Nothing stands in its
    // place — a stub sentence would be a milder barrier than the one
    // docs/PRD.md §6.1 describes.
    it('says nothing at all about adjustments', () => {
      const fixture = setup();

      expect(element(fixture).querySelector('.inclusion')).toBeNull();
      expect(text(fixture)).not.toContain('Anpassung');
      expect(text(fixture)).not.toContain('Sie brauchen etwas anderes?');
    });
  });

  describe('barrier `inklusionshinweis` — resolved', () => {
    it('offers adjustments and says that asking costs nothing', () => {
      const fixture = setup('inklusionshinweis');

      const inclusion = element(fixture).querySelector('.inclusion')!;
      expect(inclusion.querySelector('h4')!.textContent!.trim()).toBe(
        'Sie brauchen etwas anderes?',
      );
      expect(inclusion.textContent).toContain('eine Gebärdensprachdolmetschung');

      // docs/UX-COPY.md §8.9: "Der letzte Satz ist der wichtigste im ganzen
      // Szenario. Ohne ihn ist der Hinweis eine Falle." Asserted verbatim for
      // that reason — an abridged variant of this note would be a different
      // teaching object.
      expect(inclusion.textContent).toContain(
        'Das hat keinen Einfluss auf die Bewertung Ihrer Bewerbung.',
      );
    });

    it('labels the section by its own heading', () => {
      const inclusion = element(setup('inklusionshinweis')).querySelector('.inclusion')!;

      expect(inclusion.getAttribute('aria-labelledby')).toBe('sim-confirm-inclusion-heading');
      expect(inclusion.querySelector('h4')!.id).toBe('sim-confirm-inclusion-heading');
    });
  });

  // Three independent barriers on one page: resolving one may not resolve or
  // disturb another. docs/TESTING.md §4 tests each in isolation for exactly
  // this reason, and this is that matrix read off the rendered page.
  describe('the three barriers are independent (docs/TESTING.md §4)', () => {
    it('renders each of the five tested states as exactly that state', () => {
      for (const frei of STATES) {
        const fixture = setup(frei);
        const resolved = (urlKey: string) => frei === ALL_RESOLVED || frei === urlKey;
        const page = element(fixture);

        expect(page.querySelector('.next-steps') !== null)
          .withContext(`frei=${frei} — bestaetigung`)
          .toBe(resolved('bestaetigung'));
        expect(page.querySelector('.contact') !== null)
          .withContext(`frei=${frei} — ansprechperson`)
          .toBe(resolved('ansprechperson'));
        expect(page.querySelector('.inclusion') !== null)
          .withContext(`frei=${frei} — inklusionshinweis`)
          .toBe(resolved('inklusionshinweis'));
      }
    });

    // The same thing through the move a participant actually makes: the panel
    // publishes a new URL and the page re-renders from it. Barrier state lives
    // in the URL and nowhere else (docs/ARCHITECTURE.md §8), so this has to
    // hold without the component being rebuilt.
    it('follows a toggle in the panel without being rebuilt', () => {
      const fixture = setup();

      toggleTo(fixture, 'inklusionshinweis');
      expect(element(fixture).querySelector('.inclusion')).not.toBeNull();
      expect(element(fixture).querySelector('.contact')).toBeNull();
      expect(signature(fixture).hasAttribute('alt')).toBeFalse();

      toggleTo(fixture, ALL_RESOLVED);
      expect(element(fixture).querySelector('.contact')).not.toBeNull();
      expect(text(fixture)).toContain(REFERENCE);

      toggleTo(fixture, '');
      expect(element(fixture).querySelector('.inclusion')).toBeNull();
      expect(element(fixture).querySelector('.contact-mailbox')).not.toBeNull();
    });
  });
});
