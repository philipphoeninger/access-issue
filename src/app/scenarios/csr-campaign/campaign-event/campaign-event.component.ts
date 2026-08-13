// Der Abschnitt „Event und Podiumsdiskussion" der Kampagnenseite und die
// dreiteilige kombinierte Barriere `event` (docs/UX-COPY.md §9.6,
// docs/PRD.md §6.2 Bereich 4, docs/SPEC_v2.md Slice 17).
//
// **Drei Teile, drei Muster A** (docs/ARCHITECTURE.md §11): Jeder Teil ändert,
// *welche* Inhalte es gibt, nicht wie sie ausgezeichnet sind.
//
//   `einladung`     — nur ein PDF-Download gegen dieselben Angaben als Text auf
//                     der Seite; das PDF bleibt daneben stehen.
//   `dolmetschung`  — nichts gegen den Satz, dass gedolmetscht wird.
//   `zugang`        — die Zeichnung des Eingangs mit Stufen und kein Wort zum
//                     Zugang gegen die Zeichnung mit Rampe und eine Liste der
//                     Angaben zur Barrierefreiheit.
//
// **Die acht Zustände sind acht Aussagen**, und darauf beruht die Kopplung
// (docs/UX-COPY.md §9.6, docs/PRD.md §6.4): Wer nur `einladung` behebt, hat eine
// gut lesbare Einladung zu einer Veranstaltung, die man nicht betreten kann. Wer
// nur `zugang` behebt, baut eine Rampe für Menschen, die von der Veranstaltung
// nur erfahren, wenn sie ein PDF öffnen können. Keine Teillösung hilft der
// jeweils anderen Gruppe — deshalb ist es eine Barriere mit drei Teilen und
// nicht sind es drei Barrieren.
//
// **Barriere durch Auslassen** (CLAUDE.md Regel 6): Ist `dolmetschung` aktiv,
// steht der Satz nicht da — es gibt keinen Hinweis auf etwas, das es nicht gibt,
// und keine Schaltfläche, die nichts tut. Ist `zugang` aktiv, steht zum Zugang
// nichts, nicht einmal „keine Angabe".
//
// **Der Alternativtext der Zeichnung gehört zur Barriere `alt`, nicht zu
// `zugang`.** Das ist die eine Entscheidung dieses Abschnitts, die man kennen
// muss, bevor man ihn ändert:
//
//   - `zugang` trägt `organisational: true` mit leerem `standards`-Array — die
//     Aussage, dass dieser Teil gegen kein Erfolgskriterium verstößt und
//     trotzdem Menschen ausschließt (CLAUDE.md Regel 19, docs/SPEC_v2.md §4.3).
//     Läge der fehlende Alternativtext bei ihm, wäre er ein Verstoß gegen
//     WCAG 1.1.1, und der Erklärungsbereich behauptete daneben das Gegenteil.
//   - docs/SPEC_v2.md §4.2 sagt es genauso: „Both variants carry real
//     alternative text … when the alt-text barrier is resolved. When it is
//     active the active-state image has no `alt` at all." *Beide* Fassungen
//     tragen ihren Text im selben Zustand — das kann nur eine Barriere sein, die
//     quer zu `zugang` steht, denn je Zustand ist nur eine Zeichnung zu sehen.
//   - Deshalb sind in docs/UX-COPY.md §9.6 auch zwei Alternativtexte
//     verzeichnet, `venueImageAlt.stairs` und `venueImageAlt.ramp`. Gäbe es die
//     Stufen-Zeichnung nie mit Alternativtext, stünde der erste dort ohne Grund.
//
// Diese Komponente liest damit als einzige des Szenarios eine Barriere eines
// anderen Abschnitts (`alt`, docs/UX-COPY.md §9.3). docs/SPEC_v2.md §6 hält
// fest, dass die Schnitte 15 bis 18 einander nicht lesen — das ist eine Aussage
// über die parallele Bearbeitung, die hier bewusst zugunsten der obigen
// Begründung zurücktritt. **Redaktionell zu bestätigen** (docs/UX-COPY.md §10).
//
// **Keine `alt`-Attribute, sondern eingebettete `svg`** (docs/SPEC_v2.md §4.2):
// Die beiden Zeichnungen stehen im Markup, damit sie `--sim-*`-Tokens benutzen
// können — eine über `img` geladene Datei erbt keine CSS-Variablen der Seite.
// Der barrierefreie Zustand gibt ihnen deshalb `role="img"` und einen `<title>`
// statt eines `alt`; der aktive lässt beides weg, so wie er sonst ein `alt`
// wegließe.
//
// Überschriftenebene: Der Abschnitt trägt eine `h3` (Seitenkomponente), alles
// hier steht darunter und ist `h4` (docs/ARCHITECTURE.md §5.6 Regel 1).
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BarrierStateService } from '../../../core/barrier-state.service';
import {
  ALT_BARRIER,
  DOLMETSCHUNG_PART,
  EINLADUNG_PART,
  ZUGANG_PART,
} from '../../../content/csr-campaign/csr-campaign.content';
import { CSR_CAMPAIGN_SCENARIO } from '../../../content/csr-campaign/csr-campaign.scenario';

/** docs/UX-COPY.md §9.6 `csr.event.programme.items`, an „ · " getrennt. */
export const PROGRAMME_ITEMS: readonly string[] = [
  '18:00 Uhr Begrüßung durch die Geschäftsführung',
  '18:15 Uhr Podiumsdiskussion mit Gästen aus dem Stadtteil',
  '19:30 Uhr Ausklang bei Getränken',
];

/**
 * docs/UX-COPY.md §9.6 `csr.event.access.items`, an „ · " getrennt.
 *
 * Vier Angaben, vier Behinderungsarten — und die vierte nennt den Grund mit
 * („für Menschen, die auf gute Sicht zur Dolmetschung angewiesen sind"), was sie
 * mit dem zweiten Teil dieser Barriere verbindet. Die Liste ist geprüfte Copy
 * und wird hier nicht gekürzt.
 */
export const ACCESS_ITEMS: readonly string[] = [
  'Stufenloser Zugang über eine Rampe am Haupteingang',
  'Barrierefreie Toilette im Erdgeschoss',
  'Induktive Höranlage im Saal',
  'Reservierte Plätze in der ersten Reihe für Rollstuhlnutzende und für Menschen, die auf gute Sicht zur Dolmetschung angewiesen sind',
];

/** docs/UX-COPY.md §9.6 `csr.event.venueImageAlt.stairs` / `.ramp`. */
export const VENUE_ALT_STAIRS =
  'Der Eingang des Nachbarschaftstreffs. Drei Stufen führen zur Eingangstür, ein Handlauf ist nicht vorhanden.';
export const VENUE_ALT_RAMP =
  'Der Eingang des Nachbarschaftstreffs. Neben drei Stufen führt eine Rampe mit Handlauf zur Eingangstür.';

@Component({
  selector: 'app-campaign-event',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-event.component.html',
  styleUrl: './campaign-event.component.scss',
})
export class CampaignEventComponent {
  private readonly barrierState = inject(BarrierStateService);

  /** Importiert statt als Input übergeben — siehe JobPostingStepComponent. */
  private readonly scenario = CSR_CAMPAIGN_SCENARIO;

  /**
   * Die drei Teile werden einzeln gelesen, nie der Elternschlüssel: `frei` kennt
   * nur die Teilschlüssel als Zustand (docs/ARCHITECTURE.md §8,
   * core/url-state.ts). Über die benannten Konstanten, nicht über `parts[n]` —
   * die Reihenfolge im Array ist die Lesereihenfolge des Panels und darf sich
   * ändern (siehe CampaignTextsComponent).
   */
  protected readonly invitationAsText = computed(() =>
    this.barrierState.isResolved(this.scenario, EINLADUNG_PART.urlKey),
  );

  protected readonly signLanguage = computed(() =>
    this.barrierState.isResolved(this.scenario, DOLMETSCHUNG_PART.urlKey),
  );

  protected readonly stepFreeAccess = computed(() =>
    this.barrierState.isResolved(this.scenario, ZUGANG_PART.urlKey),
  );

  /** Die Barriere des Abschnitts „Medien" — die Begründung steht im Dateikopf. */
  protected readonly altTexts = computed(() =>
    this.barrierState.isResolved(this.scenario, ALT_BARRIER.urlKey),
  );

  /**
   * Der Alternativtext zu der Zeichnung, die gerade zu sehen ist. Er beschreibt,
   * was auf ihr zu sehen ist, statt es zu deuten — bei der aktiven Fassung heißt
   * das ausdrücklich „ein Handlauf ist nicht vorhanden".
   */
  protected readonly venueAlt = computed(() =>
    this.stepFreeAccess() ? VENUE_ALT_RAMP : VENUE_ALT_STAIRS,
  );

  // ── Copy (docs/UX-COPY.md §9.6) ────────────────────────────────────────────

  protected readonly basics =
    'Donnerstag, 24. September 2026, 18 Uhr, Nachbarschaftstreff Veringstraße, Hamburg-Wilhelmsburg';
  protected readonly registration =
    'Anmeldung bis zum 20. September per E-Mail an event@elbwerk.de';

  protected readonly pdfIntro = 'Alle Einzelheiten entnehmen Sie bitte der Einladung.';
  protected readonly htmlNote = 'Sie können die Einladung hier lesen oder als PDF herunterladen.';
  protected readonly pdfLinkText = 'Einladung_Podiumsdiskussion_Sept2026_final.pdf (1,2 MB)';

  /**
   * Relativ, ohne führenden Schrägstrich: Ein root-absoluter Pfad liefe unter
   * einem konfigurierten `base href` ins Leere (docs/ARCHITECTURE.md §16).
   *
   * Die Datei ist echt und absichtlich ungetaggt; erzeugt wird sie aus
   * assets-src/simulation/einladung.py, das seine eigene Begründung trägt. Ein
   * Downloadlink ins Leere führte keine Barriere vor, sondern einen Fehler 404.
   */
  protected readonly invitationPdf = 'simulation/Einladung_Podiumsdiskussion_Sept2026_final.pdf';

  protected readonly programmeHeading = 'Programm';
  protected readonly programmeItems = PROGRAMME_ITEMS;

  protected readonly signLanguageNote =
    'Die Veranstaltung wird durchgehend in Deutsche Gebärdensprache gedolmetscht. Eine Schriftdolmetschung wird auf eine Leinwand neben dem Podium übertragen.';

  protected readonly accessHeading = 'Barrierefreiheit der Veranstaltung';
  protected readonly accessItems = ACCESS_ITEMS;
  protected readonly accessContact =
    'Sie brauchen etwas, das hier nicht steht? Melden Sie sich bei Torben Kruse, Telefon 040 555 0188. Wir versuchen es möglich zu machen.';

  /** `sim-` wie jede Id im Simulationsbereich (CLAUDE.md Regel 2). */
  protected readonly venueTitleId = 'sim-event-venue-title';
}
