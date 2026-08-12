// The regression this directive exists for: a bare `href="#panel"` under
// `<base href="/">` points at a *different document*, so the skip links and
// the simulation region's exit link reloaded the application on the home page
// instead of moving focus (docs/TESTING.md §7 — the safety-critical path).
// Asserting the rendered href is the only cheap way to catch that, because
// the broken version looks completely correct in the template.
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, provideRouter } from '@angular/router';
import { FragmentLink } from './fragment-link.directive';

@Component({
  imports: [FragmentLink],
  template: `<a appFragmentLink="panel">Zum Barriere-Panel springen</a>`,
})
class HostComponent {}

@Component({ template: '' })
class StepComponent {}

async function setup(url: string): Promise<ComponentFixture<HostComponent>> {
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: 'szenario/bewerbung/formular', component: StepComponent },
        { path: 'szenario/bewerbung/dokumente', component: StepComponent },
      ]),
      provideLocationMocks(),
    ],
  });

  await TestBed.inject(Router).navigateByUrl(url);
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return fixture;
}

function href(fixture: ComponentFixture<HostComponent>): string {
  return (fixture.nativeElement.querySelector('a') as HTMLAnchorElement).getAttribute('href')!;
}

describe('FragmentLink', () => {
  it('puts the current path in front of the fragment', async () => {
    expect(href(await setup('/szenario/bewerbung/formular'))).toBe(
      '/szenario/bewerbung/formular#panel',
    );
  });

  it('keeps the query string, so following the link cannot drop barrier state', async () => {
    expect(href(await setup('/szenario/bewerbung/formular?frei=labels,fehler'))).toBe(
      '/szenario/bewerbung/formular?frei=labels,fehler#panel',
    );
  });

  it('follows the URL as it changes', async () => {
    const fixture = await setup('/szenario/bewerbung/formular');

    await TestBed.inject(Router).navigateByUrl('/szenario/bewerbung/dokumente?frei=alle');
    fixture.detectChanges();

    expect(href(fixture)).toBe('/szenario/bewerbung/dokumente?frei=alle#panel');
  });

  it('never emits a bare fragment — the form that resolves against <base href>', async () => {
    expect(href(await setup('/szenario/bewerbung/formular')).startsWith('#')).toBeFalse();
  });
});
