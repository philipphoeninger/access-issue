// Der Abschnitt „Spendenaufruf" der Kampagnenseite mit drei seiner vier
// Barrieren (docs/UX-COPY.md §9.7 bis §9.9, docs/PRD.md §6.2 Bereich 5,
// docs/SPEC_v2.md Slice 18). Die vierte, das Testimonial-Karussell, steht in
// CampaignCarouselComponent — die Begründung für den Schnitt steht dort.
//
// **Drei Barrieren, zwei Muster** (docs/ARCHITECTURE.md §11):
//
//   `fortschritt` — Muster B: derselbe Spendenstand, einmal ausschließlich als
//                   Beschriftung *in* der Balkengrafik, einmal zusätzlich als
//                   Text daneben; dann trägt die Grafik `aria-hidden`.
//   `countdown`   — Muster B: dieselben Zahlen, dieselbe Aktualisierung. Was
//                   fehlt, ist die Ansage.
//   `slider`      — Muster A: zwei ausgeschriebene Fassungen desselben
//                   Formulars. Ein Regler, den man ziehen muss, gegen
//                   Voreinstellungen, ein beschriftetes Zahlenfeld und
//                   denselben Regler als echtes `input[type=range]`.
//
// **Die Live-Region ist die einzige außerhalb des Rahmens** (CLAUDE.md Regel 9
// zu Systemeinstellungen ist hier nicht betroffen, wohl aber
// docs/ARCHITECTURE.md §12.2): Der Rahmen hat genau eine, die Simulation höchs-
// tens eine — und die gibt es nur, solange `countdown` behoben ist. Deshalb
// **spricht sie im Minutentakt**: Eine Region, die sekündlich spricht, redet
// über jede Umschaltbestätigung des Panels hinweg, und beide Ansagen wären
// wertlos. Dass eine Live-Region allein nicht genügt, sondern die richtige
// Frequenz haben muss, ist der eigentliche Lehrinhalt dieser Barriere
// (docs/UX-COPY.md §9.8).
//
// **Zwei Abweichungen von docs/UX-COPY.md §9.8, beide redaktionell zu
// bestätigen** (docs/UX-COPY.md §10):
//
//   1. Die sichtbare Anzeige hat drei Blöcke — Tage, Stunden, Minuten —, weil
//      `csr.countdown.units` und `csr.countdown.value` beide genau diese drei
//      nennen. „Aktualisierung im Sekundentakt" ist deshalb als das umgesetzt,
//      was davon übrig bleibt: Der Wert wird **jede Sekunde neu berechnet**, so
//      dass der Minutenwechsel auf die Sekunde genau fällt. Ein vierter Block
//      „Sekunden" bräuchte eine Beschriftung, die es in der geprüften Copy
//      nicht gibt (CLAUDE.md Regel 14).
//   2. Die Live-Region sagt `csr.countdown.value` wortwörtlich an, ohne
//      einleitenden Halbsatz. „Die Aktion endet in 3 Tage, 4 Stunden" wäre
//      falsches Deutsch, und die Copy gibt keine Fassung im Dativ her.
//
// **Das Enddatum ist erfunden und steht genau einmal** (siehe `CAMPAIGN_END`).
// Nach diesem Zeitpunkt zeigt der Countdown `csr.countdown.ended`, und die
// Barriere ist nicht mehr vorführbar — das ist der Preis eines festen Datums
// und in docs/UX-COPY.md §10 als offener Punkt vermerkt.
//
// Überschriftenebene: Der Abschnitt trägt die `h3` mit der Copy
// `csr.donate.h3` („Jetzt spenden", Seitenkomponente), alles hier steht
// darunter und ist `h4` (docs/ARCHITECTURE.md §5.6 Regel 1). Das Formular
// braucht deshalb keine eigene Überschrift: Es hat schon eine.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { BarrierStateService } from '../../../core/barrier-state.service';
import {
  COUNTDOWN_BARRIER,
  FORTSCHRITT_BARRIER,
  SLIDER_BARRIER,
} from '../../../content/csr-campaign/csr-campaign.content';
import { CSR_CAMPAIGN_SCENARIO } from '../../../content/csr-campaign/csr-campaign.scenario';
import { VisuallyHidden } from '../../../shared/visually-hidden.directive';

/**
 * Das Ende der Spendenaktion.
 *
 * Erfunden — die Copy nennt kein Datum, nur den Countdown und den Satz für die
 * Zeit danach (`csr.countdown.ended`). Der 30. September liegt hinter der
 * Podiumsdiskussion am 24. September (docs/UX-COPY.md §9.6) und vor dem
 * Monatswechsel, was für eine Spendenaktion die naheliegende Frist ist.
 *
 * **Wer die Aktion neu terminiert, ändert diese eine Zeile.** Nach diesem
 * Zeitpunkt läuft nichts mehr herunter: Der Countdown zeigt dann
 * `csr.countdown.ended`, und mit ihm verschwindet das, was die Barriere
 * vorführen soll. Für einen Kurs nach dem 30. September 2026 muss das Datum
 * vorgerückt werden (docs/UX-COPY.md §10).
 *
 * Ortszeit, nicht UTC: Die Fiktion spielt in Hamburg, und die Prüfungen stellen
 * die Uhr in derselben Zone (docs/TESTING.md §10).
 */
export const CAMPAIGN_END = new Date('2026-09-30T23:59:00');

/** Neuberechnung der Anzeige. Siehe Abweichung 1 im Dateikopf. */
export const COUNTDOWN_TICK_MS = 1000;

/** docs/UX-COPY.md §9.8 `csr.countdown.units`, an „ · " getrennt. */
export const COUNTDOWN_UNITS: readonly string[] = ['Tage', 'Stunden', 'Minuten'];

/** docs/UX-COPY.md §9.9 `csr.donate.presets`, an „ · " getrennt, als Zahlen. */
export const DONATION_PRESETS: readonly number[] = [10, 25, 50, 100];

/**
 * Grenzen des Reglers. Sie sind in beiden Barrierezuständen dieselben — der
 * Unterschied ist, *wie* man den Wert einstellt, nicht welche Werte es gibt.
 * Die Schrittweite teilt jeden Voreinstellungsbetrag glatt, sonst wäre ein
 * Betrag über die Schaltfläche erreichbar und über den Regler nicht.
 *
 * **Beide beschrifteten Bedienelemente führen dieselbe Schrittweite**, und das
 * ist keine Kosmetik: Ein `input[type=range]` rastet einen zugewiesenen Wert auf
 * sein Raster ein. Trüge das Zahlenfeld eine feinere Schrittweite als der
 * Regler, zeigten die beiden nach einer Eingabe von „7" verschiedene Beträge —
 * 7 im Feld, 5 am Regler — für denselben Zustand.
 */
export const AMOUNT_MIN = 5;
export const AMOUNT_MAX = 500;
export const AMOUNT_STEP = 5;
export const AMOUNT_DEFAULT = 25;

/** Die verbleibende Zeit, schon in die drei Blöcke der Copy zerlegt. */
interface Remaining {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
}

@Component({
  selector: 'app-campaign-donation',
  imports: [VisuallyHidden],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-donation.component.html',
  styleUrl: './campaign-donation.component.scss',
})
export class CampaignDonationComponent {
  private readonly barrierState = inject(BarrierStateService);

  /** Importiert statt als Input übergeben — siehe JobPostingStepComponent. */
  private readonly scenario = CSR_CAMPAIGN_SCENARIO;

  /**
   * `urlKey` jeweils am Barriere-Objekt abgelesen, nie als Zeichenkette
   * hingeschrieben: `urlKey`s sind öffentliche Schnittstelle (CLAUDE.md
   * Regel 11).
   */
  protected readonly progressAsText = computed(() =>
    this.barrierState.isResolved(this.scenario, FORTSCHRITT_BARRIER.urlKey),
  );

  protected readonly countdownAnnounced = computed(() =>
    this.barrierState.isResolved(this.scenario, COUNTDOWN_BARRIER.urlKey),
  );

  protected readonly amountAsNumber = computed(() =>
    this.barrierState.isResolved(this.scenario, SLIDER_BARRIER.urlKey),
  );

  // ── Spendenstand (docs/UX-COPY.md §9.7) ────────────────────────────────────

  protected readonly progressHeading = 'Spendenstand';
  protected readonly progressText = '8.400 € von 12.000 € erreicht — 70 Prozent';
  protected readonly progressRemaining = 'Noch 3.600 € bis zum Ziel';

  /**
   * Relativ, ohne führenden Schrägstrich: Ein root-absoluter Pfad liefe unter
   * einem konfigurierten `base href` ins Leere (docs/ARCHITECTURE.md §16).
   *
   * Eine Datei und kein eingebettetes `svg`, anders als die Zeichnung des
   * Veranstaltungseingangs: Ein eingebettetes `svg` hätte Textknoten, die ein
   * Screenreader vorlesen kann — die halbe Barriere wäre von selbst behoben.
   * Die Datei sagt es selbst noch einmal (public/simulation/csr-spendenstand.svg).
   */
  protected readonly progressGraphic = 'simulation/csr-spendenstand.svg';

  /** Intrinsische Größe der Datei; reserviert den Platz vor dem Laden. */
  protected readonly graphicSize = { width: 600, height: 130 };

  // ── Countdown (docs/UX-COPY.md §9.8) ───────────────────────────────────────

  protected readonly countdownLabel = 'Die Aktion endet in';
  protected readonly countdownEnded = 'Die Aktion ist beendet. Vielen Dank für Ihre Unterstützung.';
  protected readonly countdownUnits = COUNTDOWN_UNITS;

  /**
   * Die Uhr, jede Sekunde neu. Ein Signal und kein `Date.now()` im Template:
   * Ein Aufruf im Template liefe bei jeder Änderungserkennung und änderte die
   * Anzeige trotzdem nie von selbst.
   *
   * Aufgeräumt wird über `DestroyRef` — ein Intervall, das die Komponente
   * überlebt, weckt die Anwendung im Sekundentakt auf einer Seite, die es nicht
   * mehr gibt.
   */
  private readonly now = signal(Date.now());

  protected readonly remaining = computed<Remaining | null>(() => {
    const milliseconds = CAMPAIGN_END.getTime() - this.now();
    if (milliseconds <= 0) {
      return null;
    }
    const totalMinutes = Math.floor(milliseconds / 60_000);
    return {
      days: Math.floor(totalMinutes / (60 * 24)),
      hours: Math.floor(totalMinutes / 60) % 24,
      minutes: totalMinutes % 60,
    };
  });

  /** Die drei Zahlen in der Reihenfolge von `COUNTDOWN_UNITS`. */
  protected readonly countdownValues = computed<readonly number[]>(() => {
    const left = this.remaining();
    return left === null ? [0, 0, 0] : [left.days, left.hours, left.minutes];
  });

  /**
   * `csr.countdown.value`, und damit der ganze Inhalt der Live-Region.
   *
   * **Der Minutentakt entsteht hier, nicht in einem zweiten Zeitgeber.** Der
   * Text enthält keine Sekunden, also ändert er sich genau einmal pro Minute —
   * auch wenn `now` sekündlich neu gesetzt wird. Ein Screenreader spricht eine
   * Live-Region nur bei einer *Änderung*, und die Änderung gibt es einmal pro
   * Minute. Ein eigenes Minuten-Intervall wäre eine zweite Wahrheit über
   * dieselbe Zahl, die eines Tages von der ersten abweicht.
   */
  protected readonly announcement = computed(() => {
    const left = this.remaining();
    if (left === null) {
      return this.countdownEnded;
    }
    return `${left.days} Tage, ${left.hours} Stunden, ${left.minutes} Minuten`;
  });

  // ── Spendenformular (docs/UX-COPY.md §9.9) ─────────────────────────────────

  protected readonly amountLabel = 'Betrag in Euro';
  protected readonly customLabel = 'Anderer Betrag';
  protected readonly submitLabel = 'Spende bestätigen';
  protected readonly presets = DONATION_PRESETS;

  protected readonly amountMin = AMOUNT_MIN;
  protected readonly amountMax = AMOUNT_MAX;
  protected readonly amountStep = AMOUNT_STEP;

  /**
   * `csr.donate.simulationNote` (docs/UX-COPY.md §9.9). Der fünfte
   * **Simulationshinweis** — der einen Textsorte, die aus dem Rahmen in die
   * Simulation hineinragt (docs/UX-COPY.md §8.4, CLAUDE.md Regel 5). Ein
   * Eingabefeld für einen Geldbetrag ist genau der Fall, für den die Regel
   * gemacht ist: Er steht in jedem Barrierezustand und wird nie zur Barriere
   * gemacht.
   */
  protected readonly simulationNote = 'Es wird keine Spende ausgelöst. Dies ist eine Nachbildung.';

  /**
   * Der eingestellte Betrag — der einzige Zustand dieser Komponente neben der
   * Uhr, und er ist derselbe in beiden Fassungen des Formulars
   * (docs/ARCHITECTURE.md §14: ein Formular ist das eine, was „keine eigenen
   * Zustände" nicht wörtlich nehmen kann). Nichts davon wird übertragen,
   * gespeichert oder verlassen den Browser-Tab.
   *
   * **Während der Eingabe darf hier ein Zwischenwert stehen**, auch einer
   * unterhalb von `AMOUNT_MIN` — siehe `onAmountInput`. Gültig gemacht wird der
   * Betrag beim Verlassen des Feldes.
   */
  protected readonly amount = signal(AMOUNT_DEFAULT);

  /**
   * Anteil des eingestellten Betrags an der Spannweite, für die Reglergrafik.
   *
   * Auf 0 bis 1 begrenzt, weil `amount` während einer Eingabe außerhalb der
   * Grenzen liegen kann: Ohne die Begrenzung liefe die Füllung des Ziehreglers
   * über ihre Schiene hinaus, sobald jemand im behobenen Zustand „700" tippt
   * und dann zurückschaltet.
   */
  protected readonly amountRatio = computed(() => {
    const ratio = (this.amount() - AMOUNT_MIN) / (AMOUNT_MAX - AMOUNT_MIN);
    return Math.min(Math.max(ratio, 0), 1);
  });

  /** `sim-` wie jede Id im Simulationsbereich (CLAUDE.md Regel 2). */
  protected readonly sliderId = 'sim-donate-slider';
  protected readonly amountId = 'sim-donate-amount';

  constructor() {
    const ticker = setInterval(() => this.now.set(Date.now()), COUNTDOWN_TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(ticker));
  }

  protected isPreset(preset: number): boolean {
    return this.amount() === preset;
  }

  protected selectPreset(preset: number): void {
    this.amount.set(preset);
  }

  /**
   * Beide beschrifteten Bedienelemente der behobenen Fassung schreiben denselben
   * Wert. Ein leeres Zahlenfeld lässt den Betrag stehen, statt ihn auf `NaN` zu
   * setzen: Wer das Feld leert, um etwas anderes einzutippen, soll dabei nicht
   * beobachten, wie der Regler springt.
   *
   * **Beim Tippen wird nicht begrenzt**, und das ist der Kern dieser Methode.
   * Das Feld ist an `amount()` gebunden; würde jede Tasteneingabe sofort auf
   * `AMOUNT_MIN` gehoben, schriebe die Bindung den gehobenen Wert zurück ins
   * Feld — und danach hinge die nächste Ziffer daran. Aus „40" würde so 50, aus
   * „100" würde 500, und jeder Betrag mit einer führenden Ziffer unter 5 wäre
   * überhaupt nicht eingebbar. Genau das ist in der Fassung passiert, die dieser
   * Kommentar ersetzt: eine Betragseingabe, die den Betrag nicht annimmt, in der
   * *behobenen* Fassung einer Barriere über Betragseingaben.
   *
   * „4" auf dem Weg zu „40" ist kein Fehler, sondern ein Zwischenstand. Gültig
   * gemacht wird der Betrag deshalb erst in `onAmountCommit`, wenn das Feld
   * verlassen wird.
   */
  protected onAmountInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    if (raw.trim() === '') {
      return;
    }
    const value = Number(raw);
    if (Number.isFinite(value)) {
      this.amount.set(Math.round(value));
    }
  }

  /**
   * Der Zwischenstand wird zum Betrag: begrenzt auf die Spannweite und auf die
   * Schrittweite gerundet, sobald das Feld den Fokus verliert. Das ist auch der
   * Moment, in dem der Regler daneben wieder dasselbe anzeigt.
   *
   * `blur` und nicht `change`: `change` bleibt aus, wenn jemand den eingegebenen
   * Wert unverändert lässt, und dann stünde ein ungültiger Zwischenstand
   * unbegrenzt da.
   */
  protected onAmountCommit(): void {
    this.amount.update((value) => this.clamp(value));
  }

  /**
   * Der Ziehregler der aktiven Fassung.
   *
   * **Auslassen, nicht abfangen** (CLAUDE.md Regel 6): Hier steht kein
   * `preventDefault`, kein Tastenhandler, kein `tabindex` und kein `role`. Die
   * Fläche reagiert auf den Zeiger und sonst auf nichts — das ist genau das,
   * was ein selbstgebauter Regler kann, wenn niemand an die Tastatur gedacht
   * hat. Der Browser wird dabei in nichts behindert.
   *
   * `buttons === 0` bedeutet „keine Taste gedrückt": Ein Zeiger, der nur über
   * die Fläche fährt, zieht nichts.
   */
  protected onTrackPointerDown(event: PointerEvent): void {
    this.setAmountFromPointer(event);
  }

  protected onTrackPointerMove(event: PointerEvent): void {
    if (event.buttons === 0) {
      return;
    }
    this.setAmountFromPointer(event);
  }

  /**
   * Die eine Aktion dieses Abschnitts, und in beiden Barrierezuständen dieselbe
   * echte `<button type="submit">`: Tastaturbedienbarkeit des Absendens ist
   * keine der Barrieren hier, und eine zweite, unerklärte wäre sie sonst
   * (CLAUDE.md Regel 18).
   *
   * Sie löst nichts aus — es gibt kein Backend, und der Simulationshinweis sagt
   * genau das. `preventDefault` verhindert nur, dass der Browser die Anwendung
   * verlässt; es fängt keine Tastatur- oder Fokusbedienung ab.
   *
   * Der Betrag wird dabei gültig gemacht: Wer im Zahlenfeld die Eingabetaste
   * drückt, sendet ab, ohne das Feld je zu verlassen — `blur` bliebe aus, und
   * ein Zwischenstand stünde als Betrag da.
   */
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.onAmountCommit();
  }

  private setAmountFromPointer(event: PointerEvent): void {
    const track = event.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) {
      return;
    }
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    this.amount.set(this.clamp(AMOUNT_MIN + ratio * (AMOUNT_MAX - AMOUNT_MIN)));
  }

  /**
   * Ein Betrag, den beide Bedienelemente gleich darstellen können: auf die
   * Schrittweite gerundet und in die Spannweite gelegt.
   *
   * **Die Rundung auf `AMOUNT_STEP` gehört dazu.** Ein `input[type=range]`
   * rastet einen zugewiesenen Wert auf sein eigenes Raster ein; ließe man hier
   * die 7 stehen, zeigte das Zahlenfeld 7 und der Regler 5 — zwei Beträge für
   * einen Zustand, während beide dasselbe Signal lesen.
   */
  private clamp(value: number): number {
    const snapped = Math.round(value / AMOUNT_STEP) * AMOUNT_STEP;
    return Math.min(Math.max(snapped, AMOUNT_MIN), AMOUNT_MAX);
  }
}
