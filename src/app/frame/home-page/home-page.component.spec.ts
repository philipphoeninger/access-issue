import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { APPLICATION_PROCESS_SCENARIO } from '../../content/application-process/application-process.scenario';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent (docs/UX-COPY.md §5.2)', () => {
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
  });

  function cards(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.scenario-card'));
  }

  it('renders the h1', () => {
    const h1: HTMLHeadingElement = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('AccessIssue');
  });

  it('lists one card per scenario in the registry', () => {
    expect(cards().length).toBeGreaterThanOrEqual(3);
  });

  it('shows the barrier count for an available scenario, derived from scenario data', () => {
    const card = cards().find(
      (c) => c.querySelector('h3')?.textContent?.trim() === 'Bewerbungsprozess',
    );
    expect(card).toBeTruthy();

    const count: HTMLElement | null = card!.querySelector('.barrier-count');
    expect(count?.textContent?.trim()).toBe(
      `${APPLICATION_PROCESS_SCENARIO.barriers.length} Barrieren`,
    );

    const link: HTMLAnchorElement | null = card!.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/szenario/bewerbung/stellenanzeige');
  });

  it('marks a planned scenario as "In Vorbereitung" with no open link', () => {
    const card = cards().find(
      (c) => c.querySelector('h3')?.textContent?.trim() === 'Softwarebeschaffung',
    );
    expect(card).toBeTruthy();

    expect(card!.querySelector('.planned-badge')?.textContent?.trim()).toBe('In Vorbereitung');
    expect(card!.querySelector('a')).toBeNull();
    expect(card!.querySelector('.barrier-count')).toBeNull();
  });
});
