// Strukturprüfungen für den Abschnitt „Spendenaufruf", ohne das Karussell
// (docs/TESTING.md §6, docs/UX-COPY.md §9.7 bis §9.9, docs/SPEC_v2.md Slice 18).
//
// Zwei der drei Barrieren sieht kein Prüfwerkzeug, und die dritte sieht axe nur
// von außen: Dass `fortschritt` ein `image-alt` pflanzt, prüft die
// Playwright-Suite; dass die *Angaben* im aktiven Zustand nirgends als Text
// stehen, kann nur eine Prüfung wie diese. Eine Barriere durch Auslassen ist
// genau dann umgesetzt, wenn die Auslassung vollständig ist (CLAUDE.md Regel 6).
//
// **Die Uhr wird gestellt, nie abgewartet** (docs/TESTING.md §10). Der Countdown
// ist neben dem Karussell die einzige Stelle des Projekts, an der etwas von
// selbst geschieht; ein Test, der auf eine Sekunde wartet, ist ein Test, der auf
// einem ausgelasteten CI-Läufer als „flaky" endet.
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  COUNTDOWN_BARRIER,
  FORTSCHRITT_BARRIER,
  SLIDER_BARRIER,
} from '../../../content/csr-campaign/csr-campaign.content';
import { CAMPAIGN_END, CampaignDonationComponent } from './campaign-donation.component';

/**
 * Ein fester Zeitpunkt vor dem Ende der Aktion. Alle Erwartungen an den
 * Countdown werden daraus und aus `CAMPAIGN_END` gerechnet, nicht
 * hingeschrieben: Wer das Enddatum verschiebt, verschiebt diese Prüfung mit,
 * und nicht ihre Aussage.
 */
const NOW = new Date(CAMPAIGN_END.getTime() - ((3 * 24 + 4) * 60 + 12) * 60_000 - 30_000);

function setup(frei?: string): ComponentFixture<CampaignDonationComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [CampaignDonationComponent],
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

  const fixture = TestBed.createComponent(CampaignDonationComponent);
  fixture.detectChanges();
  return fixture;
}

function element(fixture: ComponentFixture<CampaignDonationComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function text(fixture: ComponentFixture<CampaignDonationComponent>): string {
  return (element(fixture).textContent ?? '').replace(/\s+/g, ' ').trim();
}

const FORTSCHRITT = FORTSCHRITT_BARRIER.urlKey;
const COUNTDOWN = COUNTDOWN_BARRIER.urlKey;
const SLIDER = SLIDER_BARRIER.urlKey;

/** Die Zustände, in denen die jeweilige Barriere noch aktiv ist. */
const WITHOUT_FORTSCHRITT = [undefined, COUNTDOWN, SLIDER, `${COUNTDOWN},${SLIDER}`];
const WITHOUT_COUNTDOWN = [undefined, FORTSCHRITT, SLIDER, `${FORTSCHRITT},${SLIDER}`];
const WITHOUT_SLIDER = [undefined, FORTSCHRITT, COUNTDOWN, `${FORTSCHRITT},${COUNTDOWN}`];

const EVERY_STATE = [undefined, FORTSCHRITT, COUNTDOWN, SLIDER, 'alle'];

/** docs/UX-COPY.md §9.7, unabhängig abgeschrieben — nicht aus der Komponente gelesen. */
const PROGRESS_TEXT = '8.400 € von 12.000 € erreicht — 70 Prozent';
const PROGRESS_REMAINING = 'Noch 3.600 € bis zum Ziel';

/** docs/UX-COPY.md §9.9. */
const SIMULATION_NOTE = 'Es wird keine Spende ausgelöst. Dies ist eine Nachbildung.';

describe('CampaignDonationComponent (docs/SPEC_v2.md Slice 18)', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(NOW);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('Barriere `fortschritt` (docs/UX-COPY.md §9.7)', () => {
    // Muster B: dieselbe Grafik in beiden Zuständen. Erschiene sie erst im
    // behobenen Zustand, wäre die Barriere ein fehlendes Bild.
    it('shows the same graphic in every state', () => {
      for (const frei of EVERY_STATE) {
        const graphic = element(setup(frei)).querySelector('img.progress-graphic');
        expect(graphic).withContext(`frei=${frei}`).not.toBeNull();
        expect(graphic!.getAttribute('src'))
          .withContext(`frei=${frei}`)
          .toBe('simulation/csr-spendenstand.svg');
      }
    });

    // Ausgelassen, nicht abgefangen (CLAUDE.md Regel 6): kein leeres `alt`, kein
    // `aria-hidden`, das die Lücke kaschierte. Ein `img` ohne `alt` ist genau
    // das, was eine Redaktion hinterlässt, die das Feld übersprungen hat — und
    // es ist die Fundstelle, die axe erhebt.
    it('leaves the graphic without alt and states the figures nowhere else', () => {
      for (const frei of WITHOUT_FORTSCHRITT) {
        const fixture = setup(frei);
        const graphic = element(fixture).querySelector('img.progress-graphic')!;

        expect(graphic.hasAttribute('alt')).withContext(`frei=${frei}`).toBeFalse();
        expect(graphic.hasAttribute('aria-hidden')).withContext(`frei=${frei}`).toBeFalse();
        expect(text(fixture)).withContext(`frei=${frei}`).not.toContain(PROGRESS_TEXT);
        expect(text(fixture)).withContext(`frei=${frei}`).not.toContain(PROGRESS_REMAINING);
        // Auch nicht als Bruchstück: Solange die Barriere steht, gibt es die
        // Zahlen ausschließlich im Bild.
        expect(text(fixture)).withContext(`frei=${frei}`).not.toContain('70 Prozent');
      }
    });

    it('puts the figures beside the bar and hides the bar once resolved', () => {
      for (const frei of [FORTSCHRITT, 'alle']) {
        const fixture = setup(frei);
        const graphic = element(fixture).querySelector('img.progress-graphic')!;

        expect(graphic.getAttribute('alt')).withContext(`frei=${frei}`).toBe('');
        expect(graphic.getAttribute('aria-hidden')).withContext(`frei=${frei}`).toBe('true');
        expect((element(fixture).querySelector('.progress-text')?.textContent ?? '').trim())
          .withContext(`frei=${frei}`)
          .toBe(PROGRESS_TEXT);
        expect((element(fixture).querySelector('.progress-remaining')?.textContent ?? '').trim())
          .withContext(`frei=${frei}`)
          .toBe(PROGRESS_REMAINING);
      }
    });

    // Kein `role="progressbar"` mit ARIA-Werten (docs/UX-COPY.md §9.7): Der
    // behobene Zustand ist sichtbarer Text, nicht ein Balken mit einem Wert, den
    // nur ein Screenreader kennt.
    it('never uses a progressbar role', () => {
      for (const frei of EVERY_STATE) {
        expect(element(setup(frei)).querySelector('[role="progressbar"]'))
          .withContext(`frei=${frei}`)
          .toBeNull();
      }
    });
  });

  describe('Barriere `countdown` (docs/UX-COPY.md §9.8)', () => {
    // Muster B: Die sichtbare Anzeige ist in beiden Zuständen dieselbe — drei
    // Blöcke mit den Einheiten der Copy. Was fehlt, ist die Ansage.
    it('shows the same three blocks in every state', () => {
      for (const frei of EVERY_STATE) {
        const units = Array.from(element(setup(frei)).querySelectorAll('.countdown-unit'), (node) =>
          (node.textContent ?? '').trim(),
        );
        expect(units).withContext(`frei=${frei}`).toEqual(['Tage', 'Stunden', 'Minuten']);
      }
    });

    it('counts down the time that is really left', () => {
      const numbers = Array.from(element(setup()).querySelectorAll('.countdown-number'), (node) =>
        (node.textContent ?? '').trim(),
      );
      // `NOW` liegt 3 Tage, 4 Stunden, 12 Minuten und 30 Sekunden vor dem Ende;
      // angezeigt werden die vollen Einheiten.
      expect(numbers).toEqual(['3', '4', '12']);
    });

    it('has no live region at all while active', () => {
      for (const frei of WITHOUT_COUNTDOWN) {
        expect(element(setup(frei)).querySelectorAll('[aria-live]').length)
          .withContext(`frei=${frei}`)
          .toBe(0);
      }
    });

    // Höchstens eine Live-Region in der Simulation, und nur solange die Barriere
    // behoben ist (docs/ARCHITECTURE.md §12.2).
    it('adds exactly one polite live region once resolved', () => {
      for (const frei of [COUNTDOWN, 'alle']) {
        const regions = element(setup(frei)).querySelectorAll('[aria-live]');
        expect(regions.length).withContext(`frei=${frei}`).toBe(1);
        expect(regions[0].getAttribute('aria-live')).withContext(`frei=${frei}`).toBe('polite');
        expect((regions[0].textContent ?? '').trim())
          .withContext(`frei=${frei}`)
          .toBe('3 Tage, 4 Stunden, 12 Minuten');
      }
    });

    // **Der eigentliche Lehrinhalt** (docs/UX-COPY.md §9.8): Eine Live-Region
    // einzubauen genügt nicht, sie muss die richtige Frequenz haben. Der Text
    // enthält keine Sekunden, also ändert er sich einmal pro Minute — auch wenn
    // die Anzeige sekündlich neu gerechnet wird.
    //
    // Über die gestellte Uhr, nie über Wartezeiten (docs/TESTING.md §10).
    it('changes the announcement once a minute and not once a second', () => {
      const fixture = setup(COUNTDOWN);
      const announcement = (): string =>
        (element(fixture).querySelector('[aria-live]')?.textContent ?? '').trim();

      const start = announcement();

      // `NOW` liegt 30 Sekunden vor dem Minutenwechsel. In keiner dieser
      // dreißig Sekunden darf sich der Text ändern — sonst spräche die Region
      // sekündlich und redete über jede Ansage des Rahmens hinweg.
      for (let second = 1; second <= 30; second++) {
        jasmine.clock().tick(1000);
        fixture.detectChanges();
        expect(announcement()).withContext(`nach ${second} s`).toBe(start);
      }

      // Und dann, mit der Minute, genau einmal.
      jasmine.clock().tick(1000);
      fixture.detectChanges();
      expect(announcement()).toBe('3 Tage, 4 Stunden, 11 Minuten');
    });

    // Nach dem Ende der Aktion. Der Satz steht in der Copy, weil ein Countdown
    // einen Zustand nach null braucht — auch mitten in einer Vorführung.
    it('states that the campaign is over once the deadline has passed', () => {
      jasmine.clock().mockDate(new Date(CAMPAIGN_END.getTime() + 1000));
      const fixture = setup(COUNTDOWN);

      expect(text(fixture)).toContain(
        'Die Aktion ist beendet. Vielen Dank für Ihre Unterstützung.',
      );
      expect(element(fixture).querySelector('.countdown-blocks')).toBeNull();
      expect((element(fixture).querySelector('[aria-live]')?.textContent ?? '').trim()).toBe(
        'Die Aktion ist beendet. Vielen Dank für Ihre Unterstützung.',
      );
    });
  });

  describe('Barriere `slider` (docs/UX-COPY.md §9.9)', () => {
    // Aktiv: eine Fläche mit Zeigerhandlern. Kein Bedienelement, keine
    // Beschriftung, kein Betrag als Zahl — und nichts, was `tabindex` oder
    // `role` vortäuschte (CLAUDE.md Regel 6).
    it('offers nothing but a drag surface while active', () => {
      for (const frei of WITHOUT_SLIDER) {
        const page = element(setup(frei));
        const track = page.querySelector('.drag-slider')!;

        expect(track).withContext(`frei=${frei}`).not.toBeNull();
        expect(track.hasAttribute('tabindex')).withContext(`frei=${frei}`).toBeFalse();
        expect(track.hasAttribute('role')).withContext(`frei=${frei}`).toBeFalse();
        expect(track.hasAttribute('aria-label')).withContext(`frei=${frei}`).toBeFalse();

        expect(page.querySelectorAll('input').length).withContext(`frei=${frei}`).toBe(0);
        expect(page.querySelectorAll('label').length).withContext(`frei=${frei}`).toBe(0);
        expect(page.querySelectorAll('.preset').length).withContext(`frei=${frei}`).toBe(0);
      }
    });

    it('adds presets, a labelled number field and a real range once resolved', () => {
      for (const frei of [SLIDER, 'alle']) {
        const page = element(setup(frei));

        // Der Regler bleibt — als echtes `input[type=range]`, beschriftet und
        // damit mit den Pfeiltasten bedienbar (SC 2.5.7: was per Ziehen geht,
        // muss auch ohne Ziehen gehen).
        const range = page.querySelector<HTMLInputElement>('input[type="range"]')!;
        expect(range).withContext(`frei=${frei}`).not.toBeNull();
        expect(page.querySelector(`label[for="${range.id}"]`)?.textContent?.trim())
          .withContext(`frei=${frei}`)
          .toBe('Betrag in Euro');

        const number = page.querySelector<HTMLInputElement>('input[type="number"]')!;
        expect(number).withContext(`frei=${frei}`).not.toBeNull();
        expect(page.querySelector(`label[for="${number.id}"]`)?.textContent?.trim())
          .withContext(`frei=${frei}`)
          .toBe('Anderer Betrag');

        const presets = Array.from(page.querySelectorAll('.preset'), (node) =>
          (node.textContent ?? '').trim(),
        );
        expect(presets).withContext(`frei=${frei}`).toEqual(['10 €', '25 €', '50 €', '100 €']);

        // Die ziehbare Fläche ist weg: Ihre Aufgabe erfüllt jetzt der echte
        // Regler, und zwei Regler nebeneinander wären zwei Wahrheiten über
        // denselben Betrag.
        expect(page.querySelector('.drag-slider')).withContext(`frei=${frei}`).toBeNull();
      }
    });

    // Der eingestellte Betrag steht nicht allein in der Färbung der
    // Voreinstellung (SC 1.4.1) — `aria-pressed` sagt ihn.
    it('reports the selected preset in aria-pressed, and follows a click', () => {
      const fixture = setup(SLIDER);
      const presets = Array.from(element(fixture).querySelectorAll<HTMLButtonElement>('.preset'));

      // 25 € ist die Voreinstellung beim Laden.
      expect(presets.map((button) => button.getAttribute('aria-pressed'))).toEqual([
        'false',
        'true',
        'false',
        'false',
      ]);

      presets[3].click();
      fixture.detectChanges();

      expect(
        Array.from(element(fixture).querySelectorAll('.preset'), (button) =>
          button.getAttribute('aria-pressed'),
        ),
      ).toEqual(['false', 'false', 'false', 'true']);
      expect(element(fixture).querySelector<HTMLInputElement>('input[type="number"]')!.value).toBe(
        '100',
      );
      expect(element(fixture).querySelector<HTMLInputElement>('input[type="range"]')!.value).toBe(
        '100',
      );
    });

    // ── Die Eingabe des Betrags ────────────────────────────────────────────
    //
    // Drei Prüfungen um einen Fehler herum, den die erste Fassung dieses
    // Abschnitts hatte und den keiner der übrigen Tests sah: Das Feld ist an
    // `amount()` gebunden, und weil jede Tasteneingabe sofort auf den kleinsten
    // Betrag gehoben und zurückgeschrieben wurde, ließ sich kein Betrag mit
    // einer führenden Ziffer unter 5 eintippen. Aus „40" wurde 50, aus „100"
    // wurde 500 — in der *behobenen* Fassung einer Barriere, deren ganzer Inhalt
    // ist, dass man den Betrag auch ohne Ziehen einstellen kann.
    //
    // Die Eingabe wird deshalb Zeichen für Zeichen nachgestellt, so wie ein
    // Mensch tippt. Ein Test, der den Wert in einem Rutsch setzt, hätte den
    // Fehler nie gesehen.
    function type(fixture: ComponentFixture<CampaignDonationComponent>, digits: string): void {
      const field = element(fixture).querySelector<HTMLInputElement>('input[type="number"]')!;
      field.value = '';
      field.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      for (const digit of digits) {
        field.value = `${field.value}${digit}`;
        field.dispatchEvent(new Event('input'));
        fixture.detectChanges();
      }
    }

    function fieldValue(fixture: ComponentFixture<CampaignDonationComponent>): string {
      return element(fixture).querySelector<HTMLInputElement>('input[type="number"]')!.value;
    }

    it('takes every amount that can be typed, digit by digit', () => {
      for (const amount of ['10', '25', '30', '40', '100', '250']) {
        const fixture = setup(SLIDER);
        type(fixture, amount);
        expect(fieldValue(fixture)).withContext(`getippt: ${amount}`).toBe(amount);
      }
    });

    // Gültig gemacht wird der Betrag beim Verlassen des Feldes — nicht beim
    // Tippen, weil das Tippen sonst nicht ginge, und nicht nie, weil ein Betrag
    // von 2 € sonst stehen bliebe.
    it('brings the amount into range when the field is left', () => {
      const fixture = setup(SLIDER);
      const field = element(fixture).querySelector<HTMLInputElement>('input[type="number"]')!;

      type(fixture, '2');
      expect(fieldValue(fixture)).withContext('während der Eingabe').toBe('2');

      field.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(fieldValue(fixture)).toBe('5');

      type(fixture, '900');
      field.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(fieldValue(fixture)).toBe('500');
    });

    // Ein `input[type=range]` rastet einen zugewiesenen Wert auf sein Raster
    // ein. Trüge das Zahlenfeld eine feinere Schrittweite, zeigten die beiden
    // nach „7" verschiedene Beträge — und die Behauptung, es sei ein Betrag und
    // nicht zwei, wäre auf der Seite widerlegt.
    it('keeps the range and the number field on one amount', () => {
      const fixture = setup(SLIDER);
      const range = element(fixture).querySelector<HTMLInputElement>('input[type="range"]')!;
      const number = element(fixture).querySelector<HTMLInputElement>('input[type="number"]')!;

      expect(number.getAttribute('step')).toBe(range.getAttribute('step'));
      expect(number.getAttribute('min')).toBe(range.getAttribute('min'));
      expect(number.getAttribute('max')).toBe(range.getAttribute('max'));

      type(fixture, '7');
      number.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(fieldValue(fixture)).toBe('5');
      expect(element(fixture).querySelector<HTMLInputElement>('input[type="range"]')!.value).toBe(
        '5',
      );
    });

    // Wer im Zahlenfeld die Eingabetaste drückt, verlässt das Feld nie.
    it('brings the amount into range on submit as well', () => {
      const fixture = setup(SLIDER);
      type(fixture, '3');

      element(fixture).querySelector('form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(fieldValue(fixture)).toBe('5');
    });
  });

  // Der Simulationshinweis steht in jedem Zustand und wird nie zur Barriere
  // gemacht (docs/UX-COPY.md §8.4, CLAUDE.md Regel 5). Ebenso die
  // Absende-Schaltfläche: Das Absenden ist keine der Barrieren dieses
  // Abschnitts, und eine, die nur in einem Zustand da wäre, wäre eine zweite,
  // unerklärte (CLAUDE.md Regel 18).
  it('keeps the simulation note and the submit button in every state', () => {
    for (const frei of EVERY_STATE) {
      const page = element(setup(frei));
      expect((page.querySelector('.simulation-note')?.textContent ?? '').trim())
        .withContext(`frei=${frei}`)
        .toBe(SIMULATION_NOTE);

      const submit = page.querySelector<HTMLButtonElement>('button[type="submit"]')!;
      expect(submit).withContext(`frei=${frei}`).not.toBeNull();
      expect((submit.textContent ?? '').trim())
        .withContext(`frei=${frei}`)
        .toBe('Spende bestätigen');
    }
  });

  // CLAUDE.md Regel 2 — eine doppelte Id über die Grenze hinweg bräche `for`
  // und `aria-labelledby` im Panel.
  it('prefixes every id with sim-', () => {
    for (const frei of EVERY_STATE) {
      const ids = Array.from(element(setup(frei)).querySelectorAll('[id]'), (node) => node.id);
      expect(ids.filter((id) => !id.startsWith('sim-')))
        .withContext(`frei=${frei}`)
        .toEqual([]);
    }
  });

  // Überschriftenebene: Der Abschnitt trägt die `h3` (Seitenkomponente), alles
  // hier steht darunter (docs/ARCHITECTURE.md §5.6 Regel 1).
  it('starts its own headings at h4, in every state', () => {
    for (const frei of EVERY_STATE) {
      const levels = Array.from(
        element(setup(frei)).querySelectorAll('h1, h2, h3, h4, h5, h6'),
        (node) => node.tagName,
      );
      expect(levels.length).withContext(`frei=${frei}`).toBeGreaterThan(0);
      expect(levels.filter((tag) => tag !== 'H4'))
        .withContext(`frei=${frei}`)
        .toEqual([]);
    }
  });
});
