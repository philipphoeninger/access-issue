// Structural assertions for the two barriers of step 1 (docs/TESTING.md §6):
// the thing that should be missing is missing, and the thing that should be
// present is present — in both directions, because a barrier that cannot be
// switched off is not a demonstration.
//
// `sprache` is invisible to axe (`automatedDetection: 'manual'`), so this file
// is its only automated coverage. `grafik` is visible to axe, but only as
// "some image has no alt" — that it is *this* image, and that the information
// it carries reappears as text, is asserted here.
//
// The last describe block is the one docs/SPEC_v1.md slice 7 calls out for
// hand review: both language variants must carry the same substance, or the
// scenario measures how much was written rather than how it was written.
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { JobPostingStepComponent } from './job-posting-step.component';

/**
 * Barrier state is read from the URL only (docs/ARCHITECTURE.md §8), so a
 * state is a query parameter and nothing else.
 *
 * The reset makes `setup` callable twice inside one spec, which several
 * assertions below need: the interesting comparison is between two states of
 * the same component, and splitting those across specs would leave the actual
 * claim — that the two differ in exactly this way — asserted nowhere.
 */
function setup(frei?: string): ComponentFixture<JobPostingStepComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [JobPostingStepComponent],
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

  const fixture = TestBed.createComponent(JobPostingStepComponent);
  fixture.detectChanges();
  return fixture;
}

function element(fixture: ComponentFixture<JobPostingStepComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function text(fixture: ComponentFixture<JobPostingStepComponent>): string {
  return element(fixture).textContent ?? '';
}

function graphic(fixture: ComponentFixture<JobPostingStepComponent>): HTMLImageElement {
  return element(fixture).querySelector('.benefits-graphic')!;
}

describe('JobPostingStepComponent (docs/SPEC_v1.md Slice 7)', () => {
  describe('the page around the barriers', () => {
    it('renders the Elbwerk posting for the advertised role (docs/UX-COPY.md §8.1)', () => {
      const fixture = setup();

      expect(element(fixture).querySelector('h3')!.textContent!.trim()).toBe('Offene Stellen');
      expect(element(fixture).querySelector('h4')!.textContent!.trim()).toBe(
        'IT-Projektmanager (m/w/d)',
      );
      expect(text(fixture)).toContain('Vollzeit · Hamburg-Wilhelmsburg · ab sofort');
    });

    // docs/ARCHITECTURE.md §5.6 rule 1. The region's own h2 and the page h1
    // belong to the frame; everything this component renders starts at h3 and
    // nests without skipping a level. axe run 3 catches a broken outline on
    // the assembled page, but only once the page exists — this catches it in
    // the component that would have caused it.
    it('starts its headings at h3 and nests them without a gap', () => {
      const levels = Array.from(
        element(setup()).querySelectorAll('h1, h2, h3, h4, h5, h6'),
        (heading) => Number(heading.tagName.slice(1)),
      );

      expect(levels[0]).toBe(3);
      levels.forEach((level, index) => {
        if (index > 0) {
          expect(level).toBeLessThanOrEqual(levels[index - 1] + 1);
        }
      });
    });

    // docs/ARCHITECTURE.md §5.6 rule 2 — a duplicate id across the boundary
    // would break `for` and `aria-labelledby` in the panel.
    it('prefixes every id with sim-', () => {
      for (const frei of [undefined, 'alle']) {
        const ids = Array.from(element(setup(frei)).querySelectorAll('[id]'), (node) => node.id);

        expect(ids.length).toBeGreaterThan(0);
        expect(ids.filter((id) => !id.startsWith('sim-'))).toEqual([]);
      }
    });

    // The menu is text, not navigation (docs/UX-COPY.md §8.1): the simulation
    // has only the pages the scenario knows as steps, and a menu entry leading
    // nowhere would be a twelfth barrier that no panel entry explains. It also
    // keeps the region's tab order to the exit link alone, which is what makes
    // the exit-link suite's trap detector meaningful.
    it('renders the Elbwerk menu without any links', () => {
      const fixture = setup();

      expect(fixture.nativeElement.textContent).toContain(
        'Unternehmen · Leistungen · Karriere · Kontakt',
      );
      expect(element(fixture).querySelectorAll('a').length).toBe(0);
    });

    // Not a barrier and never one: the barriers of this scenario are exactly
    // the eleven in docs/PRD.md §6.1, and a logo with no text alternative
    // would be a twelfth that nothing in the panel explains.
    it('gives the company logo a text alternative (docs/UX-COPY.md §8.1)', () => {
      const logo: HTMLImageElement = element(setup()).querySelector('.logo')!;
      expect(logo.getAttribute('alt')).toBe('Elbwerk AG');
    });
  });

  describe('barrier `grafik` — active (docs/UX-COPY.md §8.6)', () => {
    it('carries pay, benefits and the process in an image with no alt attribute', () => {
      const fixture = setup();

      // Missing, not empty: an empty alt would mark it decorative, which is
      // the *resolved* state. axe reports `image-alt` for this
      // (src/app/content/axe-rule-fixtures.ts).
      expect(graphic(fixture).hasAttribute('alt')).toBeFalse();
      expect(graphic(fixture).getAttribute('src')).toContain('grafik_benefits_final.png');
    });

    // All three of the things docs/PRD.md §6.1 names for this barrier — pay,
    // benefits and the application process. The process matters most: it is
    // the part someone acts on, and not knowing that a reply comes within two
    // weeks or that the interview can be held over video is what turns a
    // missing alt attribute into a lost application.
    it('offers the same figures nowhere as text', () => {
      const fixture = setup();

      expect(text(fixture)).not.toContain('Was wir bieten');
      expect(text(fixture)).not.toContain('Entgeltgruppe');
      expect(text(fixture)).not.toContain('30 Urlaubstage');
      expect(text(fixture)).not.toContain('So geht es weiter');
      expect(text(fixture)).not.toContain('Rückmeldung innerhalb von zwei Wochen');
    });
  });

  describe('barrier `grafik` — resolved', () => {
    it('states pay and benefits as text with a heading and a list', () => {
      const fixture = setup('grafik');
      const headings = Array.from(element(fixture).querySelectorAll('h5'), (heading) =>
        heading.textContent!.trim(),
      );

      expect(headings).toContain('Was wir bieten');
      expect(text(fixture)).toContain(
        'Vergütung nach Haustarif, Entgeltgruppe 11 (58.000 – 68.000 € brutto/Jahr)',
      );

      const items = Array.from(element(fixture).querySelectorAll('li'), (item) =>
        item.textContent!.trim(),
      );
      for (const benefit of [
        '30 Urlaubstage',
        'Gleitzeit',
        'Jobrad',
        'Zuschuss zum Deutschlandticket',
        'Betriebliche Altersvorsorge',
      ]) {
        expect(items).toContain(benefit);
      }
    });

    it('states the application process as an ordered list', () => {
      const fixture = setup('grafik');
      const headings = Array.from(element(fixture).querySelectorAll('h5'), (heading) =>
        heading.textContent!.trim(),
      );

      expect(headings).toContain('So geht es weiter');

      // Ordered, because the sequence is part of the information — a set of
      // bullets would say the same words and lose that.
      const steps = Array.from(element(fixture).querySelectorAll('ol li'), (item) =>
        item.textContent!.trim(),
      );
      expect(steps).toEqual([
        'Online bewerben',
        'Rückmeldung innerhalb von zwei Wochen',
        'Gespräch per Video oder vor Ort',
        'Start nach Absprache',
      ]);
    });

    // The accessible state is "also as text", not "graphic removed" — and the
    // graphic becomes decorative rather than described, because its
    // information now stands beside it (docs/UX-COPY.md §8.6).
    it('keeps the graphic as decoration', () => {
      const fixture = setup('grafik');

      expect(graphic(fixture)).not.toBeNull();
      expect(graphic(fixture).getAttribute('alt')).toBe('');
      expect(graphic(fixture).getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('barrier `sprache` (docs/UX-COPY.md §8.3)', () => {
    it('renders the officialese variant while active', () => {
      const fixture = setup();

      expect(text(fixture)).toContain('Im Rahmen der Ihnen obliegenden Tätigkeit');
      expect(element(fixture).querySelector('h5')!.textContent!.trim()).toBe('Aufgabenprofil');
      // No list: nesting rather than itemising is half of what makes the
      // variant hard to read.
      expect(element(fixture).querySelectorAll('li').length).toBe(0);
    });

    it('renders the plain-language variant when resolved', () => {
      const fixture = setup('sprache');

      expect(text(fixture)).toContain('Sie leiten unsere IT-Projekte');
      expect(element(fixture).querySelector('h5')!.textContent!.trim()).toBe('Ihre Aufgaben');
      expect(element(fixture).querySelectorAll('li').length).toBe(3);
      expect(text(fixture)).not.toContain('obliegenden Tätigkeit');
    });

    it('switches independently of `grafik`', () => {
      // Each barrier is its own toggle; resolving one must not resolve the
      // other, which is what the panel's per-barrier checkboxes promise.
      const languageOnly = setup('sprache');
      expect(graphic(languageOnly).hasAttribute('alt')).toBeFalse();

      const graphicOnly = setup('grafik');
      expect(text(graphicOnly)).toContain('Im Rahmen der Ihnen obliegenden Tätigkeit');
    });
  });

  // docs/SPEC_v1.md slice 7: "Both language variants carry the same factual
  // content — reviewed by hand, recorded in the slice review." The review is
  // the authority; this is the regression guard under it, so an edit to one
  // variant that drops a fact fails here rather than at the next review.
  describe('both language variants carry the same substance', () => {
    const FACTS = [
      'informatik', // the required degree
      'it-projekt', // what is being led
      'termin', // deadlines
      'budget', // budget responsibility
      'qualität', // quality standards
      'abteilungen', // internal coordination
      'dienstleister', // external coordination
      'erfahrung', // years of experience
      'projektmanagement-methoden', // the "nice to have"
    ];

    it('mentions every fact in the officialese and in the plain variant', () => {
      const complex = text(setup()).toLowerCase();
      const plain = text(setup('sprache')).toLowerCase();

      for (const fact of FACTS) {
        expect(complex).withContext(`officialese variant: ${fact}`).toContain(fact);
        expect(plain).withContext(`plain variant: ${fact}`).toContain(fact);
      }
    });

    // The measurable half of "same substance, different language": the plain
    // variant is shorter and its sentences are shorter. If a future edit made
    // it longer, the likeliest cause is added information rather than clearer
    // wording — and then the scenario stops measuring language complexity.
    it('says it in fewer and shorter sentences', () => {
      const sentenceLengths = (source: string): number[] =>
        source
          .split('.')
          .map((sentence) => sentence.trim().split(/\s+/).length)
          .filter((length) => length > 3);

      const complex = sentenceLengths(text(setup()));
      const plain = sentenceLengths(text(setup('sprache')));

      const longest = (lengths: number[]): number => Math.max(...lengths);
      expect(longest(plain)).toBeLessThan(longest(complex));
    });
  });
});
