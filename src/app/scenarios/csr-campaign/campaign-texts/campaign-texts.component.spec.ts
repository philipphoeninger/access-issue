// Strukturprüfungen für die kombinierte Barriere `sprache` (docs/TESTING.md §6,
// docs/UX-COPY.md §9.2, docs/SPEC_v2.md Slice 15).
//
// Die Barriere ist `automatedDetection: 'manual'`, und zwar nicht aus
// Bequemlichkeit: Kein Werkzeug entscheidet, ob ein Text verständlich ist, und
// keines bemerkt, dass eine Fassung in Leichter Sprache fehlt (docs/TESTING.md
// §2, §16). Prüfbar ist, was strukturell zutrifft — dass die vier Zustände vier
// verschiedene Seiten ergeben, dass die Aufklappfläche eine echte ist, und dass
// die Fassung in Leichter Sprache Wort für Wort die geprüfte Copy ist.
//
// **Was diese Datei nicht prüfen kann**, ist die eine Behauptung, auf die es
// ankommt: dass die behobene Fassung tatsächlich leichter zu verstehen ist und
// dieselbe Aussage trägt. Das ist Handarbeit (docs/SPEC_v2.md Slice 15,
// docs/UX-COPY.md §10) und bleibt es.
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  JARGON_PART,
  LEICHTE_SPRACHE_PART,
  SPRACHE_BARRIER,
} from '../../../content/csr-campaign/csr-campaign.content';
import { CampaignTextsComponent, EASY_LANGUAGE_SENTENCES } from './campaign-texts.component';

let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

/** Zustand ist ausschließlich der Query-Parameter (docs/ARCHITECTURE.md §8). */
function setup(frei?: string): ComponentFixture<CampaignTextsComponent> {
  TestBed.resetTestingModule();
  queryParams = new BehaviorSubject(convertToParamMap(frei === undefined ? {} : { frei }));
  TestBed.configureTestingModule({
    imports: [CampaignTextsComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
    ],
  });

  const fixture = TestBed.createComponent(CampaignTextsComponent);
  fixture.detectChanges();
  return fixture;
}

/** Stellt eine Umschaltung im Barriere-Panel nach. */
function setBarrierState(frei?: string): void {
  queryParams.next(convertToParamMap(frei === undefined ? {} : { frei }));
}

function element(fixture: ComponentFixture<CampaignTextsComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function bodyText(fixture: ComponentFixture<CampaignTextsComponent>): string {
  return (element(fixture).querySelector('.body')!.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * docs/UX-COPY.md §9.2 `csr.easyLanguage.body`, unabhängig abgeschrieben. Die
 * Komponente hält denselben Text als Liste von Sätzen; dass beide Fassungen
 * übereinstimmen, ist die einzige Absicherung gegen ein stilles Auseinander-
 * laufen von Copy und Auszeichnung.
 */
const EASY_LANGUAGE_BODY =
  'Elbwerk ist eine Firma in Hamburg. Elbwerk sammelt Geld. Das Geld ist für den ' +
  'Nachbarschafts-Treff. Der Treff ist ein Haus im Stadt-Teil Wilhelmsburg. Dort treffen sich ' +
  'Menschen. Kinder bekommen Hilfe bei den Haus-Aufgaben. Es gibt jeden Tag ein warmes ' +
  'Mittag-Essen. Der Treff braucht neue Stühle und Tische. Dafür sammeln wir 12.000 Euro.';

/**
 * Die beiden Teilschlüssel, an den benannten Konstanten abgelesen (CLAUDE.md
 * Regel 11) — nicht positionsweise aus `SPRACHE_BARRIER.parts`. Täte er das,
 * teilte dieser Test die Annahme der Komponente, statt sie zu prüfen: Ein
 * Umsortieren der Teile vertauschte beide Seiten gleichzeitig und bliebe grün.
 */
const JARGON = JARGON_PART.urlKey;
const EASY = LEICHTE_SPRACHE_PART.urlKey;

describe('CampaignTextsComponent (docs/SPEC_v2.md Slice 15)', () => {
  // Die vier Zustände sind vier verschiedene Aussagen (docs/UX-COPY.md §9.2).
  // Der interessante ist der dritte: Leichte Sprache neben einem Haupttext,
  // den niemand versteht — genau das, was das Beheben nur eines Teils erzeugt.
  describe('the four states of the combined barrier', () => {
    it('shows jargon and no easy-language version while both parts are active', () => {
      const fixture = setup();

      expect(bodyText(fixture)).toContain('Purpose-driven Impact-Programm');
      expect(element(fixture).querySelector('.easy-language')).toBeNull();
    });

    it('shows plain German and still no easy-language version with only `jargon` resolved', () => {
      const fixture = setup(JARGON);

      expect(bodyText(fixture)).toContain('Nachbarschaftstreff an der Veringstraße');
      expect(bodyText(fixture)).not.toContain('Stakeholder-Value');
      expect(element(fixture).querySelector('.easy-language')).toBeNull();
    });

    it('keeps the jargon main text with only `leichte-sprache` resolved', () => {
      const fixture = setup(EASY);

      expect(bodyText(fixture)).toContain('Purpose-driven Impact-Programm');
      expect(element(fixture).querySelector('.easy-language')).not.toBeNull();
    });

    it('shows both when the parent key resolves the barrier as a whole', () => {
      const fixture = setup(SPRACHE_BARRIER.urlKey);

      expect(bodyText(fixture)).toContain('Nachbarschaftstreff an der Veringstraße');
      expect(element(fixture).querySelector('.easy-language')).not.toBeNull();
    });
  });

  // Muster A auf beiden Teilen (docs/ARCHITECTURE.md §11): Es steht genau ein
  // Haupttext auf der Seite, nicht zwei, von denen einer versteckt ist. Ein
  // per CSS ausgeblendeter zweiter Absatz wäre für einen Screenreader
  // weiterhin da — und die „behobene" Fassung läse beide.
  it('renders exactly one main text in every state', () => {
    for (const frei of [undefined, JARGON, EASY, 'alle']) {
      expect(element(setup(frei)).querySelectorAll('.body').length)
        .withContext(`frei=${frei}`)
        .toBe(1);
    }
  });

  describe('the easy-language version (docs/UX-COPY.md §9.2)', () => {
    it('is a real disclosure: a button that reports its state', () => {
      const fixture = setup(EASY);
      const toggle = element(fixture).querySelector('button')!;

      expect(toggle.getAttribute('type')).toBe('button');
      expect(toggle.textContent!.trim()).toBe('Diesen Text in Leichter Sprache lesen');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(toggle.getAttribute('aria-controls')).toBe('sim-leichte-sprache');
      expect(element(fixture).querySelector('#sim-leichte-sprache')!.hasAttribute('hidden'))
        .withContext('starts collapsed')
        .toBeTrue();
    });

    it('opens and closes on the button, and says so', async () => {
      const fixture = setup(EASY);
      const toggle = element(fixture).querySelector('button')!;
      const panel = element(fixture).querySelector('#sim-leichte-sprache')!;

      toggle.click();
      await fixture.whenStable();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(panel.hasAttribute('hidden')).toBeFalse();

      toggle.click();
      await fixture.whenStable();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(panel.hasAttribute('hidden')).toBeTrue();
    });

    it('carries its own h4 heading and nothing higher', () => {
      const fixture = setup('alle');
      const levels = Array.from(
        element(fixture).querySelectorAll('h1, h2, h3, h4, h5, h6'),
        (heading) => heading.tagName,
      );

      // Der Abschnitt trägt die `h3`, diese Komponente steht darunter
      // (docs/ARCHITECTURE.md §5.6 Regel 1). Eine kaputte Gliederung ist nie
      // eine zulässige Barriere.
      expect(levels).toEqual(['H4']);
      expect(element(fixture).querySelector('h4')!.textContent!.trim()).toBe(
        'Die Aktion in Leichter Sprache',
      );
    });

    // Die Aufteilung in Sätze ist Typografie, keine Redaktion: Leichte Sprache
    // setzt jeden Satz in eine eigene Zeile. Dieser Test ist, was die
    // Aufteilung von der geprüften Copy nicht abkommen lässt.
    it('is word for word the reviewed copy of docs/UX-COPY.md §9.2', () => {
      const fixture = setup(EASY);
      const sentences = Array.from(element(fixture).querySelectorAll('.easy-sentence'), (line) =>
        (line.textContent ?? '').trim(),
      );

      expect(sentences).toEqual([...EASY_LANGUAGE_SENTENCES]);
      expect(sentences.join(' ')).toBe(EASY_LANGUAGE_BODY);
    });

    // Umschalten tauscht den Zweig, zerstört die Komponente aber nicht. Ohne
    // Rücksetzen stünde die Fassung nach Aus- und Wiedereinschalten
    // unaufgefordert offen, an einer Schaltfläche, die niemand gedrückt hat.
    it('does not carry an open panel across a barrier toggle', async () => {
      const fixture = setup(EASY);

      element(fixture).querySelector('button')!.click();
      await fixture.whenStable();
      expect(
        element(fixture).querySelector('#sim-leichte-sprache')!.hasAttribute('hidden'),
      ).toBeFalse();

      setBarrierState(undefined);
      await fixture.whenStable();
      expect(element(fixture).querySelector('.easy-language')).toBeNull();

      setBarrierState(EASY);
      await fixture.whenStable();
      expect(element(fixture).querySelector('button')!.getAttribute('aria-expanded')).toBe('false');
    });
  });

  // Barriere durch Auslassen, nicht durch Abfangen (CLAUDE.md Regel 6): Ist
  // der Teil aktiv, fehlt die Fassung — es gibt keine Schaltfläche, die nichts
  // tut, und keinen Hinweis auf etwas, das es nicht gibt.
  it('offers nothing focusable while `leichte-sprache` is active', () => {
    for (const frei of [undefined, JARGON]) {
      const focusable = element(setup(frei)).querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex], [contenteditable]',
      );
      expect(focusable.length).withContext(`frei=${frei}`).toBe(0);
    }
  });

  // CLAUDE.md Regel 2 — eine doppelte Id über die Grenze hinweg bräche `for`
  // und `aria-labelledby` im Panel.
  it('prefixes every id with sim-', () => {
    for (const frei of [undefined, JARGON, EASY, 'alle']) {
      const ids = Array.from(element(setup(frei)).querySelectorAll('[id]'), (node) => node.id);
      expect(ids.filter((id) => !id.startsWith('sim-')))
        .withContext(`frei=${frei}`)
        .toEqual([]);
    }
  });
});
