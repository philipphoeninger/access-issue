// Das Testimonial-Karussell (docs/TESTING.md §6, §10, §11, docs/UX-COPY.md
// §9.10, docs/SPEC_v2.md Slice 18).
//
// **Die Uhr wird gestellt, nie abgewartet.** Ein Test, der vier Sekunden
// schläft, fällt auf einem ausgelasteten CI-Läufer um, wird als „flaky"
// markiert, dann übersprungen, dann gelöscht (docs/TESTING.md §10).
//
// **Die Systemeinstellung wird gestellt, nicht gelesen.** `mediaPreference`
// fragt `window.matchMedia`; hier wird die Antwort vorgegeben, damit beide
// Richtungen prüfbar sind — auch die Gegenprobe, ohne die ein Fehler, der das
// Karussell bedingungslos anhält, die Prüfung auf reduzierte Bewegung bestünde
// und eine Barriere still aus dem Modul nähme (docs/TESTING.md §11).
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SuppressionNoticeService } from '../../../core/suppression-notice.service';
import { KARUSSELL_BARRIER } from '../../../content/csr-campaign/csr-campaign.content';
import { CSR_CAMPAIGN_SCENARIO } from '../../../content/csr-campaign/csr-campaign.scenario';
import {
  ADVANCE_INTERVAL_MS,
  CAROUSEL_QUOTES,
  CampaignCarouselComponent,
  REDUCED_MOTION_NOTE,
} from './campaign-carousel.component';

let notices: SuppressionNoticeService;

/**
 * Die Zuhörer, die `mediaPreference` auf der nachgestellten Medienabfrage
 * angemeldet hat. Über sie wird der *Wechsel* der Einstellung während der
 * Sitzung nachgestellt — der Fall, in dem eine dozierende Person sie vorführt.
 */
let preferenceListeners: Array<(event: MediaQueryListEvent) => void> = [];

/**
 * Gibt `window.matchMedia` eine feste Antwort — und einen Griff, um sie zu
 * ändern (`switchPreference`). Die echte Einstellung des Prüfrechners ist
 * damit ohne Belang, und beide Richtungen sind prüfbar.
 */
function fakePreference(reducedMotion: boolean): void {
  preferenceListeners = [];
  spyOn(window, 'matchMedia').and.callFake(
    (query: string) =>
      ({
        matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
        media: query,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          if (query.includes('prefers-reduced-motion')) {
            preferenceListeners.push(listener);
          }
        },
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
}

/** Schaltet `prefers-reduced-motion` um, wie das System es täte. */
function switchPreference(
  fixture: ComponentFixture<CampaignCarouselComponent>,
  reducedMotion: boolean,
): void {
  for (const listener of preferenceListeners) {
    listener({ matches: reducedMotion } as MediaQueryListEvent);
  }
  fixture.detectChanges();
}

function setup(frei?: string): ComponentFixture<CampaignCarouselComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [CampaignCarouselComponent],
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

  notices = TestBed.inject(SuppressionNoticeService);
  const fixture = TestBed.createComponent(CampaignCarouselComponent);
  fixture.detectChanges();
  return fixture;
}

function element(fixture: ComponentFixture<CampaignCarouselComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function quote(fixture: ComponentFixture<CampaignCarouselComponent>): string {
  return (element(fixture).querySelector('.carousel-quote')?.textContent ?? '').trim();
}

/** Rückt die Uhr um einen Wechseltakt vor und lässt neu zeichnen. */
function advance(fixture: ComponentFixture<CampaignCarouselComponent>, times = 1): void {
  for (let step = 0; step < times; step++) {
    jasmine.clock().tick(ADVANCE_INTERVAL_MS);
    fixture.detectChanges();
  }
}

const KARUSSELL = KARUSSELL_BARRIER.urlKey;

/** Die Notiz, die für dieses Szenario und diese Barriere veröffentlicht ist. */
function publishedNote(): string | undefined {
  return notices
    .all()
    .find(
      (notice) => notice.scenarioPath === CSR_CAMPAIGN_SCENARIO.path && notice.urlKey === KARUSSELL,
    )?.note;
}

describe('CampaignCarouselComponent (docs/SPEC_v2.md Slice 18)', () => {
  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  describe('bei gewöhnlichen Systemeinstellungen', () => {
    beforeEach(() => fakePreference(false));

    // Die drei Zitate der Copy, in ihrer Reihenfolge, und zurück zum ersten.
    it('advances through all three quotes while the barrier is active', () => {
      const fixture = setup();
      expect(quote(fixture)).toBe(CAROUSEL_QUOTES[0]);

      advance(fixture);
      expect(quote(fixture)).toBe(CAROUSEL_QUOTES[1]);
      advance(fixture);
      expect(quote(fixture)).toBe(CAROUSEL_QUOTES[2]);
      advance(fixture);
      expect(quote(fixture)).toBe(CAROUSEL_QUOTES[0]);
    });

    // Ausgelassen, nicht abgefangen (CLAUDE.md Regel 6): Es gibt keine
    // ausgegraute Schaltfläche und keine Steuerung, die nichts tut. Es gibt sie
    // nicht.
    it('offers no control and no position while active', () => {
      const page = element(setup());
      expect(page.querySelector('.carousel-toggle')).toBeNull();
      expect(page.querySelector('.carousel-position')).toBeNull();
      expect(page.querySelectorAll('button').length).toBe(0);
    });

    it('names the pause control and the position once resolved', () => {
      const fixture = setup(KARUSSELL);
      const toggle = element(fixture).querySelector('.carousel-toggle')!;

      expect((toggle.textContent ?? '').trim()).toBe('Automatischen Wechsel anhalten');
      expect((element(fixture).querySelector('.carousel-position')?.textContent ?? '').trim()).toBe(
        'Beitrag 1 von 3',
      );

      advance(fixture);
      expect((element(fixture).querySelector('.carousel-position')?.textContent ?? '').trim()).toBe(
        'Beitrag 2 von 3',
      );
    });

    // Die Pause hält wirklich an — und die Beschriftung sagt danach, was der
    // nächste Druck tut.
    it('stops the rotation on the pause control and starts it again', () => {
      const fixture = setup(KARUSSELL);
      const toggle = (): HTMLButtonElement =>
        element(fixture).querySelector<HTMLButtonElement>('.carousel-toggle')!;

      toggle().click();
      fixture.detectChanges();
      expect((toggle().textContent ?? '').trim()).toBe('Automatischen Wechsel fortsetzen');

      const held = quote(fixture);
      advance(fixture, 3);
      expect(quote(fixture)).toBe(held);

      toggle().click();
      fixture.detectChanges();
      advance(fixture);
      expect(quote(fixture)).not.toBe(held);
    });

    // **Die Pause des Nutzers überlebt eine Änderung der Systemeinstellung.**
    //
    // Sie tat es nicht: `paused` hing als `linkedSignal` unmittelbar an
    // `prefers-reduced-motion` und wurde bei jeder Änderung neu aus ihr
    // gerechnet. Wer angehalten hatte und die Einstellung danach abschaltete —
    // oder wem eine dozierende Person sie vorführte —, sah das Karussell wieder
    // loslaufen, ohne es angefordert zu haben. Das ist der Verstoß gegen
    // SC 2.2.2, den die behobene Fassung vorführen soll, und er stand in ihr
    // selbst.
    it('keeps the user’s pause across a change of the system preference', () => {
      const fixture = setup(KARUSSELL);
      const toggle = (): HTMLButtonElement =>
        element(fixture).querySelector<HTMLButtonElement>('.carousel-toggle')!;

      toggle().click();
      fixture.detectChanges();
      const held = quote(fixture);

      // Die Einstellung wird eingeschaltet — angehalten bleibt angehalten —
      // und wieder abgeschaltet.
      switchPreference(fixture, true);
      switchPreference(fixture, false);

      expect((toggle().textContent ?? '').trim()).toBe('Automatischen Wechsel fortsetzen');
      advance(fixture, 3);
      expect(quote(fixture)).toBe(held);
    });

    // Die Gegenrichtung, und sie ist die wichtigere: Wird reduzierte Bewegung
    // *eingeschaltet*, hat sie Vorrang — auch über einen Nutzer, der den
    // Wechsel vorher ausdrücklich gestartet hat (CLAUDE.md Regel 9).
    // Vestibuläre Auslöser sind keine Lerngelegenheit.
    it('overrules an earlier request to play when the preference is switched on', () => {
      const fixture = setup(KARUSSELL);
      const toggle = (): HTMLButtonElement =>
        element(fixture).querySelector<HTMLButtonElement>('.carousel-toggle')!;

      // Anhalten und wieder starten: Damit steht eine ausdrückliche
      // Entscheidung für den Wechsel im Raum, die es zu übersteuern gilt.
      toggle().click();
      fixture.detectChanges();
      toggle().click();
      fixture.detectChanges();
      expect((toggle().textContent ?? '').trim()).toBe('Automatischen Wechsel anhalten');

      switchPreference(fixture, true);

      expect((toggle().textContent ?? '').trim()).toBe('Automatischen Wechsel fortsetzen');
      const held = quote(fixture);
      advance(fixture, 5);
      expect(quote(fixture)).toBe(held);
    });

    // „Wechsel stoppt bei Fokus oder Zeigerkontakt" (docs/UX-COPY.md §9.10).
    // Wer liest, soll zu Ende lesen können, ohne erst eine Schaltfläche zu
    // suchen.
    it('holds the quote while the pointer or the focus is inside', () => {
      const fixture = setup(KARUSSELL);
      const group = element(fixture).querySelector('.carousel')!;

      group.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      const held = quote(fixture);
      advance(fixture, 2);
      expect(quote(fixture)).toBe(held);

      group.dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();
      advance(fixture);
      expect(quote(fixture)).not.toBe(held);

      element(fixture).querySelector<HTMLButtonElement>('.carousel-toggle')!.focus();
      fixture.detectChanges();
      const focused = quote(fixture);
      advance(fixture, 2);
      expect(quote(fixture)).toBe(focused);
    });

    // Die Gegenprobe zu allem Folgenden: Ohne angeforderte reduzierte Bewegung
    // gibt es nichts zu unterdrücken und deshalb keinen Hinweis.
    it('publishes no suppression note', () => {
      setup();
      expect(publishedNote()).toBeUndefined();

      setup(KARUSSELL);
      expect(publishedNote()).toBeUndefined();
    });
  });

  describe('bei angeforderter reduzierter Bewegung (CLAUDE.md Regel 9)', () => {
    beforeEach(() => fakePreference(true));

    // Die Einstellung schlägt die Barriere, ohne Ausnahme. In *keinem* der
    // beiden Zustände wechselt etwas von selbst.
    it('never advances on its own, in either state', () => {
      for (const frei of [undefined, KARUSSELL]) {
        const fixture = setup(frei);
        const start = quote(fixture);
        advance(fixture, 5);
        expect(quote(fixture)).withContext(`frei=${frei}`).toBe(start);
      }
    });

    // Der Hinweis benennt die Ursache, die Folge und was sonst zu sehen wäre
    // (docs/UX-COPY.md §5.9). Ohne den dritten Teil hält eine dozierende Person
    // die Barriere für kaputt.
    it('publishes the reduced-motion note while the barrier is active', () => {
      setup();
      expect(publishedNote()).toBe(REDUCED_MOTION_NOTE);
    });

    // Und nimmt ihn zurück, sobald die Barriere behoben ist: Der Satz endet auf
    // „ohne dass du es anhalten kannst", und im behobenen Zustand gibt es die
    // Pause-Schaltfläche. Ein Hinweis, der eine Barriere beschreibt, die gerade
    // nicht besteht, widerspricht dem Panel daneben (siehe Dateikopf der
    // Komponente).
    it('publishes no note once the barrier is resolved', () => {
      setup(KARUSSELL);
      expect(publishedNote()).toBeUndefined();
    });

    // Die behobene Fassung startet angehalten und behält ihre Steuerung: Wer
    // den Wechsel ausdrücklich will, bekommt ihn. Unterdrückt wird die
    // *automatische* Bewegung, nicht eine angeforderte.
    it('starts paused but keeps the control usable once resolved', () => {
      const fixture = setup(KARUSSELL);
      const toggle = element(fixture).querySelector<HTMLButtonElement>('.carousel-toggle')!;
      expect((toggle.textContent ?? '').trim()).toBe('Automatischen Wechsel fortsetzen');

      toggle.click();
      fixture.detectChanges();
      const start = quote(fixture);
      advance(fixture);
      expect(quote(fixture)).not.toBe(start);
    });

    // Der Dienst ist root-provided und überlebt die Komponente. Ein
    // liegengebliebener Hinweis behauptete auf der nächsten Seite eine
    // Barriere, die sie nicht hat — und eine dozierende Person macht den
    // Screenshot.
    it('retracts the note when the component is destroyed', () => {
      const fixture = setup();
      expect(publishedNote()).toBe(REDUCED_MOTION_NOTE);

      fixture.destroy();
      expect(publishedNote()).toBeUndefined();
    });
  });

  describe('Auszeichnung', () => {
    beforeEach(() => fakePreference(false));

    // Höchstens eine Live-Region in der Simulation, und die gehört dem
    // behobenen Countdown (docs/ARCHITECTURE.md §12.2). Die Positionsanzeige
    // ist gewöhnlicher Text.
    it('declares no live region of its own', () => {
      for (const frei of [undefined, KARUSSELL]) {
        expect(element(setup(frei)).querySelectorAll('[aria-live]').length)
          .withContext(`frei=${frei}`)
          .toBe(0);
      }
    });

    // Überschriftenebene: Der Abschnitt trägt die `h3` (Seitenkomponente),
    // diese Überschrift steht darunter — auch wenn ihr Schlüssel
    // `csr.carousel.h3` heißt (docs/ARCHITECTURE.md §5.6 Regel 1).
    it('renders its heading as an h4 in both states', () => {
      for (const frei of [undefined, KARUSSELL]) {
        const page = element(setup(frei));
        const levels = Array.from(
          page.querySelectorAll('h1, h2, h3, h4, h5, h6'),
          (node) => node.tagName,
        );
        expect(levels).withContext(`frei=${frei}`).toEqual(['H4']);
        expect((page.querySelector('h4')?.textContent ?? '').trim())
          .withContext(`frei=${frei}`)
          .toBe('Stimmen aus dem Stadtteil');
      }
    });

    // CLAUDE.md Regel 2.
    it('prefixes every id with sim-', () => {
      for (const frei of [undefined, KARUSSELL]) {
        const ids = Array.from(element(setup(frei)).querySelectorAll('[id]'), (node) => node.id);
        expect(ids.filter((id) => !id.startsWith('sim-')))
          .withContext(`frei=${frei}`)
          .toEqual([]);
      }
    });
  });
});
