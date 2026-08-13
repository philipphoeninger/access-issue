// Strukturprüfungen für den Abschnitt „Medien" (docs/TESTING.md §6,
// docs/UX-COPY.md §9.3 bis §9.5, docs/SPEC_v2.md Slice 16).
//
// Zwei der drei Barrieren sieht axe, und das prüft die Playwright-Suite in
// einem echten Browser (e2e/csr-campaign.spec.ts, Lauf 2) — hier steht, was in
// Millisekunden zu prüfen ist: dass die Alternativtexte wirklich fehlen und
// wirklich die geprüfte Copy sind, dass die Emoji-Fassung die Information in
// Zeichen trägt und die behobene sie ausschreibt, und dass beide Farbfassungen
// der Bildunterschrift ausgeschrieben sind statt eine aus der anderen
// abgeleitet.
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  ALT_BARRIER,
  EMOJI_BARRIER,
  KONTRAST_BARRIER,
} from '../../../content/csr-campaign/csr-campaign.content';
import { CSR_CAMPAIGN_SCENARIO } from '../../../content/csr-campaign/csr-campaign.scenario';
import { SuppressionNoticeService } from '../../../core/suppression-notice.service';
import { CampaignMediaComponent } from './campaign-media.component';

let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

/** Zustand ist ausschließlich der Query-Parameter (docs/ARCHITECTURE.md §8). */
function setup(frei?: string): ComponentFixture<CampaignMediaComponent> {
  TestBed.resetTestingModule();
  queryParams = new BehaviorSubject(convertToParamMap(frei === undefined ? {} : { frei }));
  TestBed.configureTestingModule({
    imports: [CampaignMediaComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
    ],
  });

  const fixture = TestBed.createComponent(CampaignMediaComponent);
  fixture.detectChanges();
  return fixture;
}

function element(fixture: ComponentFixture<CampaignMediaComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function images(fixture: ComponentFixture<CampaignMediaComponent>): HTMLImageElement[] {
  return Array.from(element(fixture).querySelectorAll('img'));
}

function postText(fixture: ComponentFixture<CampaignMediaComponent>): string {
  return (element(fixture).querySelector('.post-text')!.textContent ?? '').trim();
}

const ALT = ALT_BARRIER.urlKey;
const EMOJI = EMOJI_BARRIER.urlKey;
const KONTRAST = KONTRAST_BARRIER.urlKey;

/** Alle Zustände dieses Abschnitts, für Zusicherungen die in jedem gelten. */
const EVERY_STATE = [undefined, ALT, EMOJI, KONTRAST, 'alle'];

/**
 * docs/UX-COPY.md §9.3, unabhängig abgeschrieben — nicht aus CAMPAIGN_POSTS
 * abgeleitet, sonst prüfte der Test die Konstante gegen sich selbst.
 */
const ALT_TEXTS = [
  'Zwölf Mitarbeitende von Elbwerk stehen mit Malerrollen vor der frisch gestrichenen Wand des Nachbarschaftstreffs.',
  'Eine Frau übergibt einen symbolischen Spendenscheck über 2.000 Euro an zwei Vertreterinnen des Nachbarschaftstreffs.',
  'Kinder sitzen an einem langen Tisch im Nachbarschaftstreff und basteln.',
];

/** docs/UX-COPY.md §9.5 `csr.social.postN.overlay`. */
const OVERLAYS = ['Aktionstag im Treff', '2.000 € übergeben', 'Bastelnachmittag'];

describe('CampaignMediaComponent (docs/SPEC_v2.md Slice 16)', () => {
  // Muster B: dieselben drei Bilder in beiden Zuständen. Ändert sich die Zahl
  // der Bilder mit der Barriere, ist es keine Auszeichnungs-Barriere mehr,
  // sondern eine über den Inhalt — und der Erklärtext spräche von etwas
  // anderem als die Simulation zeigt.
  it('renders the same three post images in every state', () => {
    for (const frei of EVERY_STATE) {
      const sources = images(setup(frei)).map((image) => image.getAttribute('src'));
      expect(sources)
        .withContext(`frei=${frei}`)
        .toEqual([
          'simulation/csr-post-anstrich.svg',
          'simulation/csr-post-scheck.svg',
          'simulation/csr-post-basteln.svg',
        ]);
    }
  });

  describe('Barriere `alt` (docs/UX-COPY.md §9.3)', () => {
    // Ausgelassen, nicht abgefangen (CLAUDE.md Regel 6): Das Attribut fehlt,
    // es steht nicht leer da und ist nicht durch `aria-hidden` ersetzt. Ein
    // leeres `alt` erklärte das Bild für schmückend — das wäre eine andere
    // Aussage und für axe kein Befund.
    it('omits the alt attribute entirely while active', () => {
      for (const frei of [undefined, EMOJI, KONTRAST]) {
        const missing = images(setup(frei)).map((image) => ({
          alt: image.hasAttribute('alt'),
          hidden: image.hasAttribute('aria-hidden'),
          role: image.hasAttribute('role'),
        }));
        expect(missing)
          .withContext(`frei=${frei}`)
          .toEqual([
            { alt: false, hidden: false, role: false },
            { alt: false, hidden: false, role: false },
            { alt: false, hidden: false, role: false },
          ]);
      }
    });

    it('carries the reviewed alternative texts once resolved', () => {
      for (const frei of [ALT, 'alle']) {
        expect(images(setup(frei)).map((image) => image.getAttribute('alt')))
          .withContext(`frei=${frei}`)
          .toEqual(ALT_TEXTS);
      }
    });

    // Die Maße stehen am Bild, damit der Platz vor dem Laden reserviert ist —
    // in beiden Zuständen, weil ein Umbruch beim Nachladen keine der drei
    // Barrieren ist und in keiner Erklärung vorkommt (CLAUDE.md Regel 18).
    it('states the intrinsic size in both states', () => {
      for (const frei of [undefined, ALT]) {
        for (const image of images(setup(frei))) {
          expect(image.getAttribute('width')).withContext(`frei=${frei}`).toBe('600');
          expect(image.getAttribute('height')).withContext(`frei=${frei}`).toBe('600');
        }
      }
    });
  });

  describe('Barriere `emoji` (docs/UX-COPY.md §9.4)', () => {
    it('lets emojis carry the information while active', () => {
      const text = postText(setup());

      expect(text).toContain('🎉🎉🎉');
      // Die Prozentzahl steht als Ziffern-Emojis da, nicht als Zahl: Genau das
      // ist der Verlust, den ein Screenreader vorführt.
      expect(text).not.toContain('80 Prozent');
      expect(text).toContain('♿');
    });

    it('writes the information out once resolved, keeping exactly one emoji', () => {
      const text = postText(setup(EMOJI));

      expect(text).toContain('80 Prozent');
      expect(text).not.toContain('♿');

      // docs/SPEC_v2.md Slice 16: „The resolved emoji post keeps exactly one
      // decorative emoji — the lesson is placement, not abstinence."
      //
      // Gezählt über die Unicode-Eigenschaft, nicht über eine Liste bekannter
      // Zeichen: Eine Liste bliebe grün, wenn die Copy ein Emoji hinzubekäme,
      // das niemand in sie eingetragen hat.
      const emojis = [...text].filter((character) => /\p{Extended_Pictographic}/u.test(character));
      expect(emojis).toEqual(['🎉']);
    });

    // Muster A auf einem Beitrag: Es steht genau ein Beitragstext auf der
    // Seite, nicht zwei, von denen einer per CSS ausgeblendet ist — der wäre
    // für einen Screenreader weiterhin da.
    it('renders exactly one post text in every state', () => {
      for (const frei of EVERY_STATE) {
        expect(element(setup(frei)).querySelectorAll('.post-text').length)
          .withContext(`frei=${frei}`)
          .toBe(1);
      }
    });
  });

  describe('Barriere `kontrast` (docs/UX-COPY.md §9.5)', () => {
    // Muster B: Der Text ist derselbe, nur seine Farbfassung wechselt. Stünde
    // die Bildunterschrift nur im behobenen Zustand da, wäre die Barriere ein
    // fehlender Text und keine Kontrast-Barriere.
    it('shows the same three overlay captions in every state', () => {
      for (const frei of EVERY_STATE) {
        const captions = Array.from(
          element(setup(frei)).querySelectorAll('.post-overlay'),
          (node) => (node.textContent ?? '').trim(),
        );
        expect(captions).withContext(`frei=${frei}`).toEqual(OVERLAYS);
      }
    });

    // Beide Fassungen sind ausgeschrieben (CLAUDE.md Regel 10): Jede der
    // beiden Klassen setzt Vorder- und Hintergrundfarbe selbst, keine ist eine
    // Reparaturschicht über der anderen. Geprüft wird die Klasse, nicht die
    // berechnete Farbe — das Verhältnis selbst rechnet axe im echten Browser
    // nach (e2e/csr-campaign.spec.ts, Lauf 2).
    it('marks the captions faint while active and readable once resolved', () => {
      const active = element(setup()).querySelectorAll('.post-overlay--faint');
      expect(active.length).toBe(3);
      expect(element(setup()).querySelectorAll('.post-overlay--readable').length).toBe(0);

      const resolved = element(setup(KONTRAST));
      expect(resolved.querySelectorAll('.post-overlay--readable').length).toBe(3);
      expect(resolved.querySelectorAll('.post-overlay--faint').length).toBe(0);
    });
  });

  // docs/UX-COPY.md §8.4, §9.3: einer der vier Simulationshinweise. Er steht in
  // jedem Zustand und wird nie zur Barriere gemacht (CLAUDE.md Regel 5).
  it('shows the simulation note in every state', () => {
    for (const frei of EVERY_STATE) {
      const note = element(setup(frei)).querySelector('.simulation-note');
      expect(note).withContext(`frei=${frei}`).not.toBeNull();
      expect((note!.textContent ?? '').trim()).toBe(
        'Nachbildung einer Social-Media-Einbettung. Es werden keine Daten an Dritte übertragen.',
      );
    }
  });

  // CLAUDE.md Regel 2 — eine doppelte Id über die Grenze hinweg bräche `for`
  // und `aria-labelledby` im Panel. Dieser Abschnitt vergibt heute gar keine;
  // der Test hält das fest, statt es dem nächsten Zusatz zu überlassen.
  it('prefixes every id with sim-', () => {
    for (const frei of EVERY_STATE) {
      const ids = Array.from(element(setup(frei)).querySelectorAll('[id]'), (node) => node.id);
      expect(ids.filter((id) => !id.startsWith('sim-')))
        .withContext(`frei=${frei}`)
        .toEqual([]);
    }
  });

  // Keine Anfrage nach außen (docs/ARCHITECTURE.md §16): Die Nachbildung darf
  // kein iframe und kein Skript eines Anbieters enthalten, und jede Bildquelle
  // ist projektlokal und relativ — ein führender Schrägstrich liefe unter einem
  // konfigurierten `base href` ins Leere.
  it('embeds nothing from a third party', () => {
    for (const frei of EVERY_STATE) {
      const fixture = setup(frei);
      expect(element(fixture).querySelectorAll('iframe, script, object, embed').length)
        .withContext(`frei=${frei}`)
        .toBe(0);

      for (const image of images(fixture)) {
        const source = image.getAttribute('src')!;
        expect(source)
          .withContext(`frei=${frei}`)
          .toMatch(/^simulation\//);
      }
    }
  });

  // CLAUDE.md Regel 9: Erzwingt das System eigene Farben, ist die
  // Kontrast-Barriere nicht dargestellt — und der Rahmen sagt, was sonst zu
  // sehen wäre. Die Erkennung gehört zur Barriere, die Ausgabe zur
  // Simulationsleiste; hier wird die Naht geprüft.
  describe('the forced-colors suppression note (docs/UX-COPY.md §5.9)', () => {
    // Der Karma-Browser erzwingt keine Farben, also ist hier nichts zu
    // unterdrücken. Dass der Hinweis unter `forced-colors` erscheint, prüft die
    // Playwright-Suite mit `emulateMedia` — das kann eine Komponentenprüfung
    // nicht (e2e/csr-campaign.spec.ts).
    it('publishes nothing while the system leaves colours alone', () => {
      setup();
      expect(TestBed.inject(SuppressionNoticeService).all()).toEqual([]);
    });

    // Der Hinweis darf nicht stehen bleiben, wenn die Seite verschwindet: Der
    // Dienst ist root-provided und überlebt die Komponente.
    //
    // Zurückgenommen wird unter demselben Paar aus Szenariopfad und
    // `urlKey`, unter dem veröffentlicht wird — sonst räumte diese Komponente
    // beim Verschwinden den Hinweis eines fremden Szenarios ab
    // (core/suppression-notice.service.spec.ts prüft genau das).
    it('retracts its note when the component goes away, and only its own', () => {
      const fixture = setup();
      const notices = TestBed.inject(SuppressionNoticeService);
      notices.publish(CSR_CAMPAIGN_SCENARIO.path, KONTRAST_BARRIER.urlKey, 'Hinweis');
      notices.publish('softwarebeschaffung', KONTRAST_BARRIER.urlKey, 'fremder Hinweis');

      fixture.destroy();

      expect(notices.all()).toEqual([
        {
          scenarioPath: 'softwarebeschaffung',
          urlKey: KONTRAST_BARRIER.urlKey,
          note: 'fremder Hinweis',
        },
      ]);
    });
  });
});
