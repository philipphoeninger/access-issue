// Der Abschnitt „Texte und Inhalte" der Kampagnenseite und die kombinierte
// Barriere `sprache` mit ihren zwei Teilen (docs/UX-COPY.md §9.2,
// docs/PRD.md §6.2 Bereich 2, docs/SPEC_v2.md Slice 15).
//
// **Zwei Teile, zwei Muster A** (docs/ARCHITECTURE.md §11): Beide Teile ändern,
// *welche* Inhalte es gibt, nicht wie sie ausgezeichnet sind. `jargon`
// tauscht den Kampagnentext gegen eine eigenständig geschriebene Fassung in
// verständlichem Deutsch; `leichte-sprache` fügt eine Fassung in Leichter
// Sprache hinzu, die es vorher überhaupt nicht gibt.
//
// **Die vier Zustände sind vier Aussagen**, und das ist der ganze Sinn der
// Kopplung (docs/UX-COPY.md §9.2, docs/PRD.md §6.4):
//
//   beide aktiv            — Jargon, keine Leichte Sprache
//   nur `jargon` behoben   — verständliches Deutsch, aber weiterhin nichts für
//                            Menschen mit Lernbehinderung
//   nur `leichte-sprache`  — Leichte Sprache als Sonderweg neben einem
//     behoben                Haupttext, den niemand versteht
//   beide behoben          — barrierefrei
//
// Der dritte Zustand ist der lehrreichste und zugleich der, den eine
// „Reparaturschicht" unmöglich machen würde: Wäre die Leichte Sprache als
// Umschreibung des Haupttexts gebaut, gäbe es ihn nicht (CLAUDE.md Regel 10).
// Beide Fassungen des Haupttexts und die Fassung in Leichter Sprache sind
// deshalb drei ausgeschriebene Texte, keiner aus einem anderen abgeleitet.
//
// **Barriere durch Auslassen** (CLAUDE.md Regel 6): Ist `leichte-sprache`
// aktiv, fehlt die Fassung schlicht. Es gibt keine Schaltfläche, die nichts
// tut, und keinen Hinweis auf etwas, das es nicht gibt — genau das ist der
// Zustand, den eine Redaktion herstellt, die nicht daran gedacht hat.
//
// Überschriftenebene: Der Abschnitt trägt eine `h3` (Seitenkomponente), die
// Fassung in Leichter Sprache steht darunter und ist deshalb eine `h4`
// (docs/ARCHITECTURE.md §5.6 Regel 1).
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core';
import { BarrierStateService } from '../../../core/barrier-state.service';
import {
  JARGON_PART,
  LEICHTE_SPRACHE_PART,
} from '../../../content/csr-campaign/csr-campaign.content';
import { CSR_CAMPAIGN_SCENARIO } from '../../../content/csr-campaign/csr-campaign.scenario';

/**
 * docs/UX-COPY.md §9.2 `csr.easyLanguage.body`, ein Satz je Eintrag.
 *
 * **Die Aufteilung ist keine redaktionelle Änderung, sondern die Typografie,
 * die das Regelwerk verlangt**: Leichte Sprache setzt jeden Satz in eine
 * eigene Zeile. Aneinandergehängt ergeben die Einträge Zeichen für Zeichen die
 * Zeichenkette aus §9.2 — campaign-texts.component.spec.ts prüft genau das,
 * damit eine redaktionelle Änderung an der Copy hier nicht unbemerkt
 * zurückbleibt.
 *
 * Der Text ist ein Platzhalter und **muss** vor Veröffentlichung von einer
 * Fachstelle für Leichte Sprache geprüft werden (docs/UX-COPY.md §9.2, §10).
 * Eine schlecht gemachte Fassung ist in einem Modul über Barrierefreiheit
 * schlimmer als keine — deshalb trägt der Barriereteil
 * `contentStatus: 'placeholder'`, was die Freigabe blockiert.
 */
export const EASY_LANGUAGE_SENTENCES: readonly string[] = [
  'Elbwerk ist eine Firma in Hamburg.',
  'Elbwerk sammelt Geld.',
  'Das Geld ist für den Nachbarschafts-Treff.',
  'Der Treff ist ein Haus im Stadt-Teil Wilhelmsburg.',
  'Dort treffen sich Menschen.',
  'Kinder bekommen Hilfe bei den Haus-Aufgaben.',
  'Es gibt jeden Tag ein warmes Mittag-Essen.',
  'Der Treff braucht neue Stühle und Tische.',
  'Dafür sammeln wir 12.000 Euro.',
];

@Component({
  selector: 'app-campaign-texts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-texts.component.html',
  styleUrl: './campaign-texts.component.scss',
})
export class CampaignTextsComponent {
  private readonly barrierState = inject(BarrierStateService);

  /** Importiert statt als Input übergeben — siehe JobPostingStepComponent. */
  private readonly scenario = CSR_CAMPAIGN_SCENARIO;

  /**
   * Die beiden Teile werden einzeln gelesen, nie der Elternschlüssel: `frei`
   * kennt nur die Teilschlüssel als Zustand, der Elternschlüssel ist
   * Abkürzung beim Parsen (docs/ARCHITECTURE.md §8, core/url-state.ts). Beide
   * `urlKey`s stehen am Inhaltsobjekt und werden nie als Zeichenkette
   * hingeschrieben (CLAUDE.md Regel 11).
   *
   * **Über die benannten Konstanten, nicht über `parts[0]` und `parts[1]`.**
   * Die Reihenfolge im Array ist die Lesereihenfolge des Panels und darf sich
   * ändern; ein Index hier würde beim Umsortieren stillschweigend vertauschen,
   * welcher Haken welche Fassung schaltet — und ein Test, der seine Schlüssel
   * aus derselben Reihenfolge ableitet, bliebe dabei grün.
   */
  protected readonly plainLanguage = computed(() =>
    this.barrierState.isResolved(this.scenario, JARGON_PART.urlKey),
  );

  protected readonly easyLanguage = computed(() =>
    this.barrierState.isResolved(this.scenario, LEICHTE_SPRACHE_PART.urlKey),
  );

  protected readonly sentences = EASY_LANGUAGE_SENTENCES;

  /** docs/UX-COPY.md §9.2. */
  protected readonly toggleLabel = 'Diesen Text in Leichter Sprache lesen';
  protected readonly easyHeading = 'Die Aktion in Leichter Sprache';

  /** `sim-` wie jede Id im Simulationsbereich (CLAUDE.md Regel 2). */
  protected readonly panelId = 'sim-leichte-sprache';

  /**
   * `linkedSignal` statt `signal`, aus demselben Grund wie in
   * CampaignNavComponent: Das Umschalten des Teils erzeugt die Komponente
   * nicht neu, nur ihren Zweig. Ohne die Rückstellung stünde die Fassung beim
   * Zurückschalten unaufgefordert offen, mit `aria-expanded="true"` an einer
   * Schaltfläche, die niemand gedrückt hat.
   *
   * Zugeklappt als Ausgangszustand, nicht aufgeklappt: Die Fassung in Leichter
   * Sprache ist ein Angebot neben dem Haupttext, kein Ersatz für ihn, und ein
   * ungefragt ausgeklappter Block wäre beim Vorlesen der Seite der doppelte
   * Text.
   */
  protected readonly expanded = linkedSignal<boolean, boolean>({
    source: this.easyLanguage,
    computation: () => false,
  });

  protected toggle(): void {
    this.expanded.update((open) => !open);
  }
}
