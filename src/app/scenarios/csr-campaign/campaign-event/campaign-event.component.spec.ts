// Strukturprüfungen für den Abschnitt „Event und Podiumsdiskussion"
// (docs/TESTING.md §6, docs/UX-COPY.md §9.6, docs/SPEC_v2.md Slice 17).
//
// Keine der drei Teilbarrieren sieht ein Prüfwerkzeug (docs/TESTING.md §2), was
// die Last hierher verschiebt: Was diese Datei prüft, ist, dass in jedem der
// acht Zustände genau das auf der Seite steht, was der Erklärtext behauptet —
// und vor allem, dass im aktiven Zustand nichts davon dasteht. Eine Barriere
// durch Auslassen ist genau dann umgesetzt, wenn die Auslassung vollständig ist
// (CLAUDE.md Regel 6).
//
// Die Playwright-Suite prüft daneben, was nur ein echter Browser beantworten
// kann: dass die Zeichnung wirklich gezeichnet wird, dass der Downloadlink eine
// Datei liefert und dass der Sprung der Panel-Gruppe hier ankommt
// (e2e/csr-campaign.spec.ts).
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  ALT_BARRIER,
  DOLMETSCHUNG_PART,
  EINLADUNG_PART,
  EVENT_BARRIER,
  ZUGANG_PART,
} from '../../../content/csr-campaign/csr-campaign.content';
import { CampaignEventComponent } from './campaign-event.component';

let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

/** Zustand ist ausschließlich der Query-Parameter (docs/ARCHITECTURE.md §8). */
function setup(frei?: string): ComponentFixture<CampaignEventComponent> {
  TestBed.resetTestingModule();
  queryParams = new BehaviorSubject(convertToParamMap(frei === undefined ? {} : { frei }));
  TestBed.configureTestingModule({
    imports: [CampaignEventComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
    ],
  });

  const fixture = TestBed.createComponent(CampaignEventComponent);
  fixture.detectChanges();
  return fixture;
}

function element(fixture: ComponentFixture<CampaignEventComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function text(fixture: ComponentFixture<CampaignEventComponent>): string {
  return (element(fixture).textContent ?? '').replace(/\s+/g, ' ').trim();
}

function svg(fixture: ComponentFixture<CampaignEventComponent>): SVGElement {
  return element(fixture).querySelector('svg.venue-illustration')!;
}

const EINLADUNG = EINLADUNG_PART.urlKey;
const DOLMETSCHUNG = DOLMETSCHUNG_PART.urlKey;
const ZUGANG = ZUGANG_PART.urlKey;
const ALT = ALT_BARRIER.urlKey;

/**
 * Die acht Kombinationen der drei Teile, als `frei`-Werte.
 *
 * Ausgeschrieben statt aus `EVENT_BARRIER.parts` erzeugt: Die Reihenfolge im
 * Array ist die des Panels und darf sich ändern, und ein Test, der seine
 * Schlüssel aus derselben Quelle ableitet wie die Komponente, bliebe beim
 * Vertauschen grün.
 */
const PART_STATES: readonly (string | undefined)[] = [
  undefined,
  EINLADUNG,
  DOLMETSCHUNG,
  ZUGANG,
  `${EINLADUNG},${DOLMETSCHUNG}`,
  `${EINLADUNG},${ZUGANG}`,
  `${DOLMETSCHUNG},${ZUGANG}`,
  `${EINLADUNG},${DOLMETSCHUNG},${ZUGANG}`,
];

/** docs/UX-COPY.md §9.6, unabhängig abgeschrieben — nicht aus der Komponente gelesen. */
const PROGRAMME = [
  '18:00 Uhr Begrüßung durch die Geschäftsführung',
  '18:15 Uhr Podiumsdiskussion mit Gästen aus dem Stadtteil',
  '19:30 Uhr Ausklang bei Getränken',
];

const ACCESS = [
  'Stufenloser Zugang über eine Rampe am Haupteingang',
  'Barrierefreie Toilette im Erdgeschoss',
  'Induktive Höranlage im Saal',
  'Reservierte Plätze in der ersten Reihe für Rollstuhlnutzende und für Menschen, die auf gute Sicht zur Dolmetschung angewiesen sind',
];

const DGS_NOTE =
  'Die Veranstaltung wird durchgehend in Deutsche Gebärdensprache gedolmetscht. Eine Schriftdolmetschung wird auf eine Leinwand neben dem Podium übertragen.';

const ALT_STAIRS =
  'Der Eingang des Nachbarschaftstreffs. Drei Stufen führen zur Eingangstür, ein Handlauf ist nicht vorhanden.';
const ALT_RAMP =
  'Der Eingang des Nachbarschaftstreffs. Neben drei Stufen führt eine Rampe mit Handlauf zur Eingangstür.';

describe('CampaignEventComponent (docs/SPEC_v2.md Slice 17)', () => {
  // Eckdaten und Anmeldung gehören keiner der drei Teilbarrieren. Stünden sie
  // nur in einem Zustand da, wäre das eine vierte, unerklärte Barriere
  // (CLAUDE.md Regel 18).
  it('states date, venue and registration in every state', () => {
    for (const frei of [...PART_STATES, ALT, 'event', 'alle']) {
      const rendered = text(setup(frei));
      expect(rendered)
        .withContext(`frei=${frei}`)
        .toContain('Donnerstag, 24. September 2026, 18 Uhr');
      expect(rendered)
        .withContext(`frei=${frei}`)
        .toContain('Anmeldung bis zum 20. September per E-Mail an event@elbwerk.de');
    }
  });

  describe('Teil `einladung` (docs/UX-COPY.md §9.6)', () => {
    // Der behobene Zustand ist „auch als Text", nicht „PDF entfernt" — das
    // Dokument verschwindet nicht, es ist nur nicht mehr der einzige Weg.
    it('keeps the PDF download in every state, with a relative href', () => {
      for (const frei of PART_STATES) {
        const link = element(setup(frei)).querySelector('.invitation-download a')!;
        expect(link).withContext(`frei=${frei}`).not.toBeNull();
        expect(link.getAttribute('href'))
          .withContext(`frei=${frei}`)
          .toBe('simulation/Einladung_Podiumsdiskussion_Sept2026_final.pdf');
        expect((link.textContent ?? '').trim())
          .withContext(`frei=${frei}`)
          .toBe('Einladung_Podiumsdiskussion_Sept2026_final.pdf (1,2 MB)');
      }
    });

    it('offers the document as the only route to the details while active', () => {
      for (const frei of [undefined, DOLMETSCHUNG, ZUGANG, `${DOLMETSCHUNG},${ZUGANG}`]) {
        const fixture = setup(frei);
        expect(text(fixture))
          .withContext(`frei=${frei}`)
          .toContain('Alle Einzelheiten entnehmen Sie bitte der Einladung.');
        expect(element(fixture).querySelector('.programme')).withContext(`frei=${frei}`).toBeNull();
        // Kein Programmpunkt steht irgendwo auf der Seite — auch nicht
        // ausgeblendet. Ein per CSS verborgener Absatz wäre für einen
        // Screenreader weiterhin da.
        for (const item of PROGRAMME) {
          expect(text(fixture)).withContext(`frei=${frei}`).not.toContain(item);
        }
      }
    });

    it('puts the same details on the page once resolved', () => {
      for (const frei of [EINLADUNG, 'event', 'alle']) {
        const fixture = setup(frei);
        expect(text(fixture))
          .withContext(`frei=${frei}`)
          .toContain('Sie können die Einladung hier lesen oder als PDF herunterladen.');
        expect(text(fixture)).withContext(`frei=${frei}`).not.toContain('entnehmen Sie bitte');

        const items = Array.from(element(fixture).querySelectorAll('.programme li'), (node) =>
          (node.textContent ?? '').trim(),
        );
        expect(items).withContext(`frei=${frei}`).toEqual(PROGRAMME);
      }
    });
  });

  describe('Teil `dolmetschung` (docs/UX-COPY.md §9.6)', () => {
    // Ausgelassen, nicht abgefangen: Aktiv steht der Satz nicht da, und es
    // steht auch kein „keine Dolmetschung vorgesehen" da. Das Fehlen jeder
    // Angabe *ist* die Barriere — wer darauf angewiesen ist, findet nichts,
    // nicht einmal eine Absage.
    it('offers no interpreting anywhere on the page while active', () => {
      for (const frei of [undefined, EINLADUNG, ZUGANG, `${EINLADUNG},${ZUGANG}`]) {
        const fixture = setup(frei);
        expect(element(fixture).querySelector('.sign-language'))
          .withContext(`frei=${frei}`)
          .toBeNull();
        expect(text(fixture)).withContext(`frei=${frei}`).not.toContain(DGS_NOTE);
        // Kleinschreibung auf beiden Seiten: Eine Prüfung, die nur wegen eines
        // Großbuchstabens durchgeht, prüft die Schreibweise und nicht die
        // Aussage.
        expect(text(fixture).toLowerCase())
          .withContext(`frei=${frei}`)
          .not.toContain('gebärdensprache');
      }
    });

    // Die schärfere Fassung derselben Aussage, und sie gilt nur, solange auch
    // `zugang` aktiv ist: Die Liste zur Barrierefreiheit nennt „Menschen, die
    // auf gute Sicht zur Dolmetschung angewiesen sind" (docs/UX-COPY.md §9.6).
    // Dieser Satz gehört zum Teil `zugang` und ist dort richtig — er sagt, für
    // wen Plätze reserviert sind, und nicht, dass gedolmetscht wird.
    //
    // Die beiden Fälle auseinanderzuhalten ist der ganze Punkt: Über alle vier
    // Zustände hinweg ließe sich „das Wort kommt nirgends vor" nur behaupten,
    // wenn man die Großschreibung ausnutzt — also die Schreibweise prüft statt
    // der Sache.
    it('does not use the word at all while `zugang` is active too', () => {
      for (const frei of [undefined, EINLADUNG]) {
        expect(text(setup(frei)).toLowerCase())
          .withContext(`frei=${frei}`)
          .not.toContain('dolmetsch');
      }
    });

    it('states both interpreting services once resolved', () => {
      for (const frei of [DOLMETSCHUNG, 'event', 'alle']) {
        const note = element(setup(frei)).querySelector('.sign-language');
        expect((note?.textContent ?? '').trim())
          .withContext(`frei=${frei}`)
          .toBe(DGS_NOTE);
      }
    });
  });

  describe('Teil `zugang` (docs/UX-COPY.md §9.6, docs/SPEC_v2.md §4.3)', () => {
    // Muster A auf einer Zeichnung: Beide Zustände zeigen denselben Eingang,
    // und was sich ändert, ist, was dort gebaut ist. Erschiene die Zeichnung
    // erst im behobenen Zustand, wäre die Barriere ein fehlendes Bild.
    it('draws the entrance in every state', () => {
      for (const frei of PART_STATES) {
        expect(svg(setup(frei)))
          .withContext(`frei=${frei}`)
          .not.toBeNull();
      }
    });

    it('shows steps without a ramp while active, and the ramp once resolved', () => {
      for (const frei of [undefined, EINLADUNG, DOLMETSCHUNG]) {
        expect(svg(setup(frei)).querySelector('.ramp'))
          .withContext(`frei=${frei}`)
          .toBeNull();
      }
      for (const frei of [ZUGANG, 'event', 'alle']) {
        expect(svg(setup(frei)).querySelector('.ramp'))
          .withContext(`frei=${frei}`)
          .not.toBeNull();
      }
    });

    it('says nothing about access while active', () => {
      for (const frei of [undefined, EINLADUNG, DOLMETSCHUNG, `${EINLADUNG},${DOLMETSCHUNG}`]) {
        const fixture = setup(frei);
        expect(element(fixture).querySelector('.access')).withContext(`frei=${frei}`).toBeNull();
        expect(element(fixture).querySelector('.access-contact'))
          .withContext(`frei=${frei}`)
          .toBeNull();
        for (const item of ACCESS) {
          expect(text(fixture)).withContext(`frei=${frei}`).not.toContain(item);
        }
      }
    });

    // Die vier Angaben und die benannte Ansprechperson. Die vierte Angabe wird
    // nicht gekürzt: Sie nennt den Grund mit und verbindet den dritten Teil mit
    // dem zweiten.
    it('names the access provisions and a person to ask once resolved', () => {
      for (const frei of [ZUGANG, 'event', 'alle']) {
        const fixture = setup(frei);
        const items = Array.from(element(fixture).querySelectorAll('.access li'), (node) =>
          (node.textContent ?? '').trim(),
        );
        expect(items).withContext(`frei=${frei}`).toEqual(ACCESS);
        expect((element(fixture).querySelector('.access-contact')?.textContent ?? '').trim())
          .withContext(`frei=${frei}`)
          .toContain('Torben Kruse, Telefon 040 555 0188');
      }
    });
  });

  // Der Alternativtext der Zeichnung hängt an der Barriere `alt`, nicht am Teil
  // `zugang` — die Begründung steht ausführlich in campaign-event.component.ts.
  // Hier wird sie geprüft: Die Zeichnung trägt ihren Namen genau dann, wenn
  // `alt` behoben ist, unabhängig davon, welche der beiden Fassungen zu sehen
  // ist.
  describe('der Alternativtext der Zeichnung (Barriere `alt`, docs/UX-COPY.md §9.3)', () => {
    it('leaves the drawing without role, title or label while `alt` is active', () => {
      for (const frei of PART_STATES) {
        const drawing = svg(setup(frei));
        expect(drawing.hasAttribute('role')).withContext(`frei=${frei}`).toBeFalse();
        expect(drawing.hasAttribute('aria-label')).withContext(`frei=${frei}`).toBeFalse();
        expect(drawing.hasAttribute('aria-labelledby')).withContext(`frei=${frei}`).toBeFalse();
        expect(drawing.querySelector('title')).withContext(`frei=${frei}`).toBeNull();
        // Und nicht durch `aria-hidden` ersetzt: Das erklärte die Zeichnung für
        // schmückend, was eine andere Aussage wäre (CLAUDE.md Regel 6).
        expect(drawing.hasAttribute('aria-hidden')).withContext(`frei=${frei}`).toBeFalse();
      }
    });

    it('names the drawing that is actually on screen once `alt` is resolved', () => {
      for (const [frei, expected] of [
        [ALT, ALT_STAIRS],
        [`${ALT},${ZUGANG}`, ALT_RAMP],
        ['alle', ALT_RAMP],
      ] as const) {
        const drawing = svg(setup(frei));
        expect(drawing.getAttribute('role')).withContext(`frei=${frei}`).toBe('img');

        const title = drawing.querySelector('title')!;
        expect(title).withContext(`frei=${frei}`).not.toBeNull();
        expect((title.textContent ?? '').trim())
          .withContext(`frei=${frei}`)
          .toBe(expected);
        // Der Name kommt aus dem `<title>`, und `aria-labelledby` zeigt darauf:
        // `aria-label` allein ließe den sichtbaren Titel aus dem Namen fallen,
        // ein `<title>` ohne Bezug wird nicht von jedem Screenreader gelesen.
        expect(drawing.getAttribute('aria-labelledby')).withContext(`frei=${frei}`).toBe(title.id);
      }
    });

    // Die aktive Fassung beschreibt, was zu sehen ist, statt es zu deuten — und
    // dazu gehört, was *nicht* da ist. Ohne diesen Halbsatz beschriebe der Text
    // dieselbe Treppe wie die behobene Fassung.
    it('describes the missing handrail in the steps variant', () => {
      expect(ALT_STAIRS).toContain('ein Handlauf ist nicht vorhanden');
      expect(ALT_RAMP).toContain('Rampe mit Handlauf');
    });
  });

  // CLAUDE.md Regel 2 — eine doppelte Id über die Grenze hinweg bräche `for`
  // und `aria-labelledby` im Panel.
  it('prefixes every id with sim-', () => {
    for (const frei of [...PART_STATES, ALT, 'alle']) {
      const ids = Array.from(element(setup(frei)).querySelectorAll('[id]'), (node) => node.id);
      expect(ids.filter((id) => !id.startsWith('sim-')))
        .withContext(`frei=${frei}`)
        .toEqual([]);
    }
  });

  // Überschriftenebene: Der Abschnitt trägt die `h3` (Seitenkomponente), alles
  // hier steht darunter (docs/ARCHITECTURE.md §5.6 Regel 1). Eine kaputte
  // Gliederung ist nie eine zulässige Barriere.
  it('starts its own headings at h4, in every state', () => {
    for (const frei of [...PART_STATES, 'alle']) {
      const levels = Array.from(
        element(setup(frei)).querySelectorAll('h1, h2, h3, h4, h5, h6'),
        (node) => node.tagName,
      );
      expect(new Set(levels).size).withContext(`frei=${frei}`).toBeLessThanOrEqual(1);
      expect(levels.filter((tag) => tag !== 'H4'))
        .withContext(`frei=${frei}`)
        .toEqual([]);
    }
  });

  // Die drei Teile schalten unabhängig, und der Elternschlüssel schaltet alle
  // drei. Das prüft core/url-state.ts für sich; hier wird nachgesehen, dass die
  // Komponente wirklich alle drei Änderungen zeigt, wenn das Panel „Event"
  // schaltet — die Verdrahtung, die ein Tippfehler in einem `urlKey` still
  // zerlegen würde.
  it('shows all three repairs under the parent key alone', () => {
    const fixture = setup(EVENT_BARRIER.urlKey);
    expect(text(fixture)).toContain('Sie können die Einladung hier lesen');
    expect(element(fixture).querySelector('.sign-language')).not.toBeNull();
    expect(svg(fixture).querySelector('.ramp')).not.toBeNull();
    expect(element(fixture).querySelector('.access')).not.toBeNull();
  });
});
