// Das Gerüst der Kampagnenseite (docs/SPEC_v2.md Slice 14): fünf Abschnitte,
// die Überschriftenebenen der Grenze, die Id-Regel des Simulationsbereichs —
// und die Prüfung, die keine andere Ebene leisten kann: dass jeder Menüpunkt
// der Bereichsnavigation ein Ziel hat, das es wirklich gibt.
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { CAMPAIGN_NAV_ITEMS } from '../campaign-nav/campaign-nav.component';
import { CSR_CAMPAIGN_SCENARIO } from '../../../content/csr-campaign/csr-campaign.scenario';
import { CampaignPageStepComponent } from './campaign-page-step.component';

function setup(frei?: string): ComponentFixture<CampaignPageStepComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [CampaignPageStepComponent],
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

  const fixture = TestBed.createComponent(CampaignPageStepComponent);
  fixture.detectChanges();
  return fixture;
}

function element(fixture: ComponentFixture<CampaignPageStepComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

/** Die fünf Abschnitte in Seitenreihenfolge (docs/UX-COPY.md §9). */
const SECTIONS: ReadonlyArray<{ anchorId: string; heading: string }> = [
  { anchorId: 'sim-kampagne', heading: 'Inklusiv. Nachhaltig. Sichtbar.' },
  { anchorId: 'sim-texte', heading: 'Unser Ziel' },
  { anchorId: 'sim-medien', heading: 'Aus unserem Instagram-Feed' },
  { anchorId: 'sim-event', heading: 'Podiumsdiskussion „Inklusiv. Nachhaltig. Sichtbar."' },
  { anchorId: 'sim-spende', heading: 'Jetzt spenden' },
];

describe('CampaignPageStepComponent (docs/SPEC_v2.md Slice 14)', () => {
  it('renders the five sections in page order, each as an h3', () => {
    const headings = Array.from(element(setup()).querySelectorAll('h3'), (heading) => ({
      anchorId: heading.id,
      heading: (heading.textContent ?? '').trim(),
    }));

    expect(headings).toEqual(SECTIONS.map((section) => ({ ...section })));
  });

  // docs/ARCHITECTURE.md §5.6 Regel 1: Seiten-`h1` ist der Szenariotitel im
  // Rahmen, `h2` gehört dem Simulationsbereich, Szenarioinhalt beginnt bei
  // `h3`. Eine kaputte Gliederung ist nie eine zulässige Barriere — axe Lauf 3
  // fängt sie auf der zusammengesetzten Seite, dies fängt sie in der
  // Komponente, die sie verursacht hätte.
  it('contains no h1 and no h2, and starts at h3', () => {
    for (const frei of [undefined, 'alle']) {
      const levels = Array.from(
        element(setup(frei)).querySelectorAll('h1, h2, h3, h4, h5, h6'),
        (heading) => Number(heading.tagName.slice(1)),
      );

      expect(levels.length).toBeGreaterThan(0);
      expect(Math.min(...levels)).toBe(3);
      levels.forEach((level, index) => {
        if (index > 0) {
          expect(level).toBeLessThanOrEqual(levels[index - 1] + 1);
        }
      });
    }
  });

  // CLAUDE.md Regel 2, über beide Barrierezustände — die Ids der Abschnitte
  // sind zugleich Sprungziele aus dem Panel, und eine Kollision mit einer
  // Rahmen-Id würde dort eine `aria-labelledby`-Beziehung stehlen.
  it('prefixes every id with sim-', () => {
    for (const frei of [undefined, 'alle']) {
      const ids = Array.from(element(setup(frei)).querySelectorAll('[id]'), (node) => node.id);

      expect(ids.length).toBeGreaterThan(0);
      expect(ids.filter((id) => !id.startsWith('sim-'))).toEqual([]);
    }
  });

  // Ohne `tabindex="-1"` ist eine Überschrift nicht fokussierbar: Der Browser
  // scrollt hin und lässt den Fokus zurück, und für die Screenreader-Nutzerin,
  // für die der Sprung gedacht war, ist nichts passiert
  // (docs/ARCHITECTURE.md §6 zu `BarrierGroup.anchorId`).
  it('makes every section heading a real jump target', () => {
    const headings = element(setup()).querySelectorAll('h3');

    for (const heading of Array.from(headings)) {
      expect(heading.getAttribute('tabindex')).withContext(heading.id).toBe('-1');
    }
  });

  // Die Prüfung, die kein Contract-Test leisten kann: Beide Seiten der
  // Zuordnung sind Zeichenketten in verschiedenen Dateien. Ein Tippfehler
  // ergäbe einen Menüpunkt, der ins Leere führt — bei grüner Übersetzung und
  // grünem Panel.
  it('gives every entry of the section navigation a target that exists', () => {
    for (const frei of [undefined, 'navigation']) {
      const page = element(setup(frei));

      for (const item of CAMPAIGN_NAV_ITEMS) {
        expect(page.querySelector(`#${item.anchorId}`))
          .withContext(`${item.label} → #${item.anchorId}`)
          .not.toBeNull();
      }
    }
  });

  // Dasselbe für die Sprungziele, die das Panel deklariert
  // (content/csr-campaign/csr-campaign.scenario.ts). e2e/barrier-panel.spec.ts
  // prüft den ganzen Weg im Browser; dies fängt eine falsche Id, bevor eine
  // Playwright-Runde dafür nötig ist.
  it('renders the anchor of every declared panel group', () => {
    const page = element(setup());

    for (const group of CSR_CAMPAIGN_SCENARIO.groups) {
      expect(page.querySelector(`#${group.anchorId}`))
        .withContext(`${group.title} → #${group.anchorId}`)
        .not.toBeNull();
    }
  });

  // Dieselbe Kopfzeile, dasselbe Logo, dieselbe Typografie wie im
  // Bewerbungsprozess (docs/SPEC_v2.md Slice 14, docs/UX-COPY.md §8.1) — das
  // ist es, was beide Seiten als dasselbe Unternehmen lesbar macht. Das Logo
  // trägt seinen Alternativtext und ist keine Barriere, hier so wenig wie dort.
  it('renders the shared Elbwerk page chrome', () => {
    const page = element(setup());

    expect(page.textContent).toContain('Unternehmen · Leistungen · Karriere · Kontakt');
    expect(page.querySelector('.logo')!.getAttribute('alt')).toBe('Elbwerk KG');
  });
});
