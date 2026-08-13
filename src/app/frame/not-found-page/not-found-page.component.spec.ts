// docs/UX-COPY.md §5.10. The strings are asserted verbatim rather than by
// substring: this page is the one a lecturer meets when a slide link has
// gone stale, and §5.10's whole argument is what it says — no error code, no
// apology, and a way onwards.
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundPageComponent } from './not-found-page.component';

describe('NotFoundPageComponent (docs/UX-COPY.md §5.10)', () => {
  let fixture: ComponentFixture<NotFoundPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();
  });

  function text(selector: string): string {
    return (fixture.nativeElement.querySelector(selector) as HTMLElement)
      .textContent!.replace(/\s+/g, ' ')
      .trim();
  }

  // FocusManager focuses the `h1` of the activated route and titles the page
  // from it (core/focus-manager.service.ts), so "exactly one h1" is what
  // makes this page focusable and titled at all.
  it('renders exactly one h1, carrying `notFound.h1`', () => {
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    expect(text('h1')).toBe('Diese Seite gibt es nicht');
  });

  it('explains what happened in plain language', () => {
    expect(text('.body')).toBe(
      'Die Adresse führt ins Leere. Vielleicht hat sich ein Tippfehler eingeschlichen, ' +
        'oder der Link ist veraltet.',
    );
  });

  it('offers a way back to the home page', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.action a');

    expect(link.textContent!.trim()).toBe('Zur Startseite');
    expect(link.getAttribute('href')).toBe('/');
  });
});
