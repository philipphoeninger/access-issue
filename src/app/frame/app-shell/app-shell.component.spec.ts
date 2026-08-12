import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Announcer } from '../../core/announcer.service';
import { AppShellComponent } from './app-shell.component';

@Component({ template: '<h1>Startseite</h1>' })
class FakeHomeComponent {}

@Component({ template: '<h1>Szenario</h1><div id="panel"></div>' })
class FakeScenarioComponent {}

/** Flushes FocusManager's post-navigation macrotask (and the Announcer
 * microtask it schedules), so a test's own announcement is not immediately
 * overwritten by the route-change announcement still pending from a
 * navigation earlier in the test. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('AppShellComponent (docs/ARCHITECTURE.md §12.2)', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: '', component: FakeHomeComponent },
          {
            path: 'szenario/bewerbung/stellenanzeige',
            component: FakeScenarioComponent,
            data: { hasPanel: true },
          },
        ]),
      ],
    });

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await settle();
  });

  it('renders exactly one live region in the frame', () => {
    const regions = fixture.nativeElement.querySelectorAll('[aria-live]');
    expect(regions.length).toBe(1);
  });

  it('shows only the content skip link on a page without a panel', () => {
    expect(fixture.nativeElement.querySelector('a[href$="#content"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href$="#panel"]')).toBeNull();
  });

  it('shows both skip links once navigated to a page with a panel', async () => {
    await router.navigateByUrl('/szenario/bewerbung/stellenanzeige');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a[href$="#panel"]')).not.toBeNull();
  });

  it('lists available scenarios in the header navigation, not planned ones', () => {
    const navLinks: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.scenario-nav a'),
    );
    const labels = navLinks.map((a) => a.textContent?.trim());

    expect(labels).toContain('Bewerbungsprozess');
    expect(labels).not.toContain('Softwarebeschaffung');
  });

  it('announces the current Announcer message in the live region', async () => {
    const announcer = TestBed.inject(Announcer);
    announcer.announce('Testansage.');
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const region: HTMLElement = fixture.nativeElement.querySelector('[aria-live]');
    expect(region.textContent?.trim()).toBe('Testansage.');
  });
});
