// Das Testimonial-Karussell des Spendenaufrufs und die Barriere `karussell`
// (docs/UX-COPY.md §9.10, docs/PRD.md §6.2 Bereich 5, docs/SPEC_v2.md Slice 18).
//
// **Eine eigene Komponente, obwohl es derselbe Abschnitt ist.** Die anderen drei
// Barrieren des Spendenaufrufs stehen in CampaignDonationComponent; diese hier
// ist die einzige des Werkzeugs, die von sich aus etwas tut und die eine
// Systemeinstellung ganz abschaltet. Ein Zeitgeber, ein Zustand aus vier
// Bedingungen und die Anbindung an den SuppressionNoticeService neben einem
// Formular und einem Countdown in einer Datei wären drei Themen an einem Ort —
// und der Abschnitt liest sich in der Seitenkomponente auch so, wie er auf der
// Seite steht.
//
// **Muster A** (docs/ARCHITECTURE.md §11): Aktiv wechseln die Zitate alle vier
// Sekunden, es gibt keine Pause-Schaltfläche, keine Positionsanzeige, und der
// Wechsel hält bei nichts an. Behoben steht die Pause-Schaltfläche als erstes
// Element der Gruppe, die Position steht daneben, und der Wechsel hält bei Fokus
// oder Zeigerkontakt an.
//
// **Barriere durch Auslassen** (CLAUDE.md Regel 6): Aktiv gibt es keine
// Schaltfläche, die nichts tut, und keine ausgegraute Steuerung. Es gibt sie
// schlicht nicht. Und nichts hier fängt eine Tastenbedienung ab — ein Karussell
// ohne Pause ist kein Karussell, das sich gegen das Anhalten wehrt, sondern
// eines, an das niemand eine Pause gebaut hat.
//
// ── Reduzierte Bewegung ──────────────────────────────────────────────────────
//
// **Die Systemeinstellung schlägt die Barriere, ohne Ausnahme** (CLAUDE.md
// Regel 9, docs/ARCHITECTURE.md §5.5). Bei `prefers-reduced-motion` wechselt in
// *keinem* der beiden Zustände etwas von selbst. Vestibuläre Auslöser sind keine
// Lerngelegenheit.
//
// Der Hinweis in der Simulationsleiste (docs/UX-COPY.md §5.9
// `suppressed.reducedMotion`) steht dabei **nur, solange die Barriere aktiv
// ist**, und das weicht von docs/UX-COPY.md §9.10 ab, wo er „in beiden
// Zuständen" greifen soll. Der Grund steht im Text selbst: „Ohne diese
// Einstellung würde es alle vier Sekunden weiterspringen, **ohne dass du es
// anhalten kannst**." Im behobenen Zustand ist der zweite Halbsatz falsch — dort
// gibt es die Pause-Schaltfläche. Ein Hinweis, der eine Barriere beschreibt, die
// gerade nicht besteht, ist schlimmer als keiner: Er widerspricht dem Panel
// daneben. Dieselbe Regel, nach der die Kontrast-Barriere ihren Hinweis nur im
// aktiven Zustand meldet (campaign-media.component.ts). **Redaktionell zu
// bestätigen** (docs/UX-COPY.md §10).
//
// Im behobenen Zustand ist die Einstellung deshalb nicht Unterdrückung, sondern
// die zugängliche Umsetzung selbst: Das Karussell startet **angehalten**, die
// Schaltfläche sagt „Automatischen Wechsel fortsetzen", und wer den Wechsel
// trotzdem will, kann ihn starten. Das ist keine Verletzung von Regel 9 —
// unterdrückt wird die *automatische* Bewegung, nicht eine ausdrücklich
// angeforderte.
//
// ── Warum keine zweite Live-Region ───────────────────────────────────────────
//
// Die Positionsanzeige ist gewöhnlicher Text und keine Live-Region.
// docs/ARCHITECTURE.md §12.2 erlaubt **höchstens eine** in der Simulation, und
// die gehört dem behobenen Countdown. Zwei polite Regionen auf einer Seite
// reden übereinander, und die des Countdowns ist die, deren Frequenz diese
// Kampagne ausdrücklich lehrt (docs/UX-COPY.md §9.8).
//
// Überschriftenebene: Der Abschnitt trägt die `h3` (Seitenkomponente), die
// Überschrift hier steht darunter und ist `h4` (docs/ARCHITECTURE.md §5.6
// Regel 1) — auch wenn ihr Schlüssel `csr.carousel.h3` heißt. Die Ebenen legt
// die Architektur fest, nicht der Schlüsselname (docs/UX-COPY.md §9).
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { BarrierStateService } from '../../../core/barrier-state.service';
import { REDUCED_MOTION, mediaPreference } from '../../../core/media-preference';
import { SuppressionNoticeService } from '../../../core/suppression-notice.service';
import { KARUSSELL_BARRIER } from '../../../content/csr-campaign/csr-campaign.content';
import { CSR_CAMPAIGN_SCENARIO } from '../../../content/csr-campaign/csr-campaign.scenario';

/**
 * docs/UX-COPY.md §9.10 `csr.carousel.quote1` bis `quote3`.
 *
 * Zitat und Zuschreibung stehen in einer Zeichenkette, so wie in der Copy. Wer
 * sie trennte, träfe eine redaktionelle Entscheidung darüber, was Zitat ist und
 * was Quelle — und die Namen sind in docs/UX-COPY.md §10 ohnehin ein offener
 * Punkt.
 */
export const CAROUSEL_QUOTES: readonly string[] = [
  '„Ohne die Unterstützung hätten wir den Treff im Winter schließen müssen." — Regina Ohlsen, Leiterin des Nachbarschaftstreffs',
  '„Meine Kinder gehen zweimal die Woche zur Hausaufgabenhilfe. Das ist Gold wert." — Aylin Demir, Anwohnerin',
  '„Wir kommen aus dem Stadtteil. Da hilft man sich." — Torben Kruse, Elbwerk KG',
];

/** docs/UX-COPY.md §9.10: „Wechsel alle vier Sekunden". */
export const ADVANCE_INTERVAL_MS = 4000;

/** docs/UX-COPY.md §5.9 `suppressed.reducedMotion`. */
export const REDUCED_MOTION_NOTE =
  'Dein System fordert reduzierte Bewegung an. Diese Einstellung hat Vorrang: Das Karussell wechselt die Beiträge nicht automatisch. Ohne diese Einstellung würde es alle vier Sekunden weiterspringen, ohne dass du es anhalten kannst.';

@Component({
  selector: 'app-campaign-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-carousel.component.html',
  styleUrl: './campaign-carousel.component.scss',
})
export class CampaignCarouselComponent {
  private readonly barrierState = inject(BarrierStateService);
  private readonly notices = inject(SuppressionNoticeService);

  /** Importiert statt als Input übergeben — siehe JobPostingStepComponent. */
  private readonly scenario = CSR_CAMPAIGN_SCENARIO;

  /**
   * `urlKey` am Barriere-Objekt abgelesen, nie als Zeichenkette hingeschrieben
   * (CLAUDE.md Regel 11).
   */
  protected readonly hasControls = computed(() =>
    this.barrierState.isResolved(this.scenario, KARUSSELL_BARRIER.urlKey),
  );

  private readonly reducedMotion = mediaPreference(REDUCED_MOTION);

  protected readonly quotes = CAROUSEL_QUOTES;

  protected readonly index = signal(0);

  protected readonly current = computed(() => this.quotes[this.index()]);

  /**
   * Die ausdrückliche Entscheidung des Nutzers, oder `null`, solange er keine
   * getroffen hat. Nur die behobene Fassung führt diesen Zustand — die aktive
   * hat nichts, womit man ihn ändern könnte.
   *
   * **Warum drei Werte und nicht zwei.** Angehalten kann zweierlei heißen: „das
   * System fordert reduzierte Bewegung" und „ich habe auf Pause gedrückt". Ein
   * einzelnes `boolean` verwechselt die beiden, und dann kostet jede Änderung
   * der Systemeinstellung die Entscheidung des Nutzers: Wer angehalten hatte und
   * die Einstellung danach *abschaltet*, sähe das Karussell wieder loslaufen,
   * ohne es angefordert zu haben — genau der Verstoß gegen SC 2.2.2, den die
   * behobene Fassung vorführen soll.
   *
   * `linkedSignal` auf die Systemeinstellung, und sie greift in genau einen
   * Fall ein: Wird reduzierte Bewegung *eingeschaltet*, verfällt eine frühere
   * Bitte um Bewegung, denn die Einstellung hat Vorrang (CLAUDE.md Regel 9).
   *
   * Eine frühere **Pause** verfällt dabei nicht. Sie ist mit der Einstellung
   * einig, und sie muss noch da sein, wenn die Einstellung wieder ausgeht —
   * sonst liefe das Karussell in dem Moment los, in dem eine dozierende Person
   * die Einstellung zurückstellt, ohne dass jemand es angefordert hätte.
   */
  private readonly userChoice = linkedSignal<boolean, boolean | null>({
    source: this.reducedMotion,
    computation: (reduced, previous) => {
      const choice = previous?.value ?? null;
      return reduced && choice === false ? null : choice;
    },
  });

  /**
   * Ob gerade angehalten ist: die Entscheidung des Nutzers, und solange es
   * keine gibt, die Systemeinstellung. Bei reduzierter Bewegung startet das
   * Karussell damit angehalten — und wer den Wechsel dennoch will, kann ihn
   * starten. Unterdrückt wird die *automatische* Bewegung, nicht eine
   * ausdrücklich angeforderte.
   */
  protected readonly paused = computed(() => {
    const choice = this.userChoice();
    return choice === null ? this.reducedMotion() : choice;
  });

  private readonly pointerInside = signal(false);
  private readonly focusInside = signal(false);

  /**
   * Ob gerade automatisch gewechselt wird.
   *
   * Zwei Zustände, zwei Regeln, und keine ist die Reparatur der anderen:
   *
   *   aktiv   — es wechselt, es sei denn, das System verbietet Bewegung. Sonst
   *             hält es bei nichts an, auch nicht beim Lesen.
   *   behoben — es wechselt, solange niemand pausiert hat, der Zeiger draußen
   *             ist und der Fokus draußen ist. Bei reduzierter Bewegung startet
   *             es angehalten (siehe `paused`), sodass auch hier von selbst
   *             nichts wechselt.
   */
  protected readonly advancing = computed(() =>
    this.hasControls()
      ? !this.paused() && !this.pointerInside() && !this.focusInside()
      : !this.reducedMotion(),
  );

  // ── Copy (docs/UX-COPY.md §9.10) ───────────────────────────────────────────

  protected readonly heading = 'Stimmen aus dem Stadtteil';
  protected readonly pauseLabel = 'Automatischen Wechsel anhalten';
  protected readonly playLabel = 'Automatischen Wechsel fortsetzen';

  protected readonly toggleLabel = computed(() =>
    this.paused() ? this.playLabel : this.pauseLabel,
  );

  /** `csr.carousel.position` — „Beitrag {current} von {total}". */
  protected readonly position = computed(
    () => `Beitrag ${this.index() + 1} von ${this.quotes.length}`,
  );

  constructor() {
    // Der Zeitgeber lebt genau so lange, wie gewechselt werden soll. `onCleanup`
    // räumt ihn vor jedem erneuten Durchlauf und beim Zerstören der Komponente
    // ab — ein Intervall, das eine Pause überlebt, ist eine Pause, die keine
    // ist.
    //
    // Der Effekt liest `advancing()` und schreibt `index`. Das ist keine
    // Schleife: Ein Schreibvorgang erzeugt keine Abhängigkeit, und `index` wird
    // hier nirgends gelesen.
    effect((onCleanup) => {
      if (!this.advancing()) {
        return;
      }
      const timer = setInterval(() => {
        this.index.update((current) => (current + 1) % this.quotes.length);
      }, ADVANCE_INTERVAL_MS);
      onCleanup(() => clearInterval(timer));
    });

    // Der Hinweis steht nur, solange es etwas zu unterdrücken gibt: im aktiven
    // Zustand, bei angeforderter reduzierter Bewegung. Die Begründung für „nur
    // im aktiven Zustand" steht ausführlich im Dateikopf.
    effect(() => {
      const suppressed = this.reducedMotion() && !this.hasControls();
      this.notices.publish(
        this.scenario.path,
        KARUSSELL_BARRIER.urlKey,
        suppressed ? REDUCED_MOTION_NOTE : undefined,
      );
    });

    // Zurücknehmen beim Zerstören, und **nicht** über `onCleanup` des Effekts
    // darüber — die Begründung steht in campaign-media.component.ts. Nötig ist
    // es, weil der Dienst root-provided ist und diese Komponente überlebt.
    inject(DestroyRef).onDestroy(() =>
      this.notices.publish(this.scenario.path, KARUSSELL_BARRIER.urlKey, undefined),
    );
  }

  /**
   * Gegen den *aktuellen* Zustand geschaltet, nicht gegen die letzte
   * Entscheidung: Beim ersten Druck gibt es keine, und die Schaltfläche muss
   * das tun, was ihre Beschriftung ankündigt.
   */
  protected toggle(): void {
    this.userChoice.set(!this.paused());
  }

  protected onPointerEnter(): void {
    this.pointerInside.set(true);
  }

  protected onPointerLeave(): void {
    this.pointerInside.set(false);
  }

  protected onFocusIn(): void {
    this.focusInside.set(true);
  }

  /**
   * Hält erst an, wenn der Fokus die Gruppe wirklich verlässt. Ohne die Prüfung
   * auf `relatedTarget` liefe der Wechsel beim Weitertabben innerhalb der Gruppe
   * wieder an — dieselbe Überlegung wie beim Aufklappmenü der Bereichs-
   * navigation (campaign-nav.component.ts).
   */
  protected onFocusOut(event: FocusEvent): void {
    const group = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    if (next === null || !group.contains(next)) {
      this.focusInside.set(false);
    }
  }
}
