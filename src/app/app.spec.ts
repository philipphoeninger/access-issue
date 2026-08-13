import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the home page at the root route', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('AccessIssue');
  });

  it('renders a scenario page at its route', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/szenario/bewerbung/stellenanzeige');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Bewerbungsprozess');
  });

  // docs/ARCHITECTURE.md §17, docs/SPEC_v1.md §5 Slice 11. Keeping the URL is
  // half the point: a redirect would make a broken slide link look like the
  // home page, and the address nobody can see is the one nobody fixes.
  it('renders the not-found page on an unknown route, without changing the URL', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/does-not-exist');
    fixture.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/does-not-exist');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Diese Seite gibt es nicht');
  });

  it('renders the "in Vorbereitung" page on a planned scenario path', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/szenario/softwarebeschaffung');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe(
      'Dieses Szenario ist noch in Vorbereitung',
    );
  });

  // The step paths ARCHITECTURE.md §9 already lists for the procurement
  // scenario — a slide may carry one long before the content exists.
  it('renders the "in Vorbereitung" page on a step path of a planned scenario', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/szenario/softwarebeschaffung/vergabe');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe(
      'Dieses Szenario ist noch in Vorbereitung',
    );
  });
});
