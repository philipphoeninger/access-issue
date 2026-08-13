// docs/UX-COPY.md §5.10, docs/ARCHITECTURE.md §17 "Link to a `planned`
// scenario".
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PlannedScenarioPageComponent } from './planned-scenario-page.component';

describe('PlannedScenarioPageComponent (docs/UX-COPY.md §5.10)', () => {
  let fixture: ComponentFixture<PlannedScenarioPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PlannedScenarioPageComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    fixture = TestBed.createComponent(PlannedScenarioPageComponent);
    fixture.detectChanges();
  });

  function text(selector: string): string {
    return (fixture.nativeElement.querySelector(selector) as HTMLElement)
      .textContent!.replace(/\s+/g, ' ')
      .trim();
  }

  it('renders exactly one h1, carrying `planned.h1`', () => {
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    expect(text('h1')).toBe('Dieses Szenario ist noch in Vorbereitung');
  });

  it('says the scenario is being worked on and points at the others', () => {
    expect(text('.body')).toBe(
      'Wir arbeiten daran. Die anderen Szenarien kannst du schon durchgehen.',
    );
  });

  it('offers a way to the available scenarios', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.action a');

    expect(link.textContent!.trim()).toBe('Zu den verfügbaren Szenarien');
    expect(link.getAttribute('href')).toBe('/');
  });

  // It names neither the scenario nor a date: both would be editorial
  // content this project does not author (CLAUDE.md rules 14, 15), and a
  // date on a page nobody redeploys ages into a broken promise.
  it('promises no date and names no scenario', () => {
    const page = (fixture.nativeElement as HTMLElement).textContent!;

    expect(page).not.toContain('Softwarebeschaffung');
    expect(page).not.toMatch(/20\d\d/);
  });
});
