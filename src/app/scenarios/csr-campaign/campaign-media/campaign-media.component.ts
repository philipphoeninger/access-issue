// Der Abschnitt „Medien" der Kampagnenseite: eine nachgebildete
// Social-Media-Einbettung mit drei Barrieren (docs/UX-COPY.md §9.3 bis §9.5,
// docs/PRD.md §6.2 Bereich 3, docs/SPEC_v2.md Slice 16).
//
// **Nachbildung, keine Einbettung** (docs/ARCHITECTURE.md §16): Die Beiträge
// sind lokales Markup, die Bilder liegen im Projekt. Kein iframe, kein Skript
// von Instagram, keine Anfrage, die die Seite verlässt — in einem Werkzeug über
// Barrierefreiheit wäre ein Drittanbieter-Einbettungscode der eine Teil der
// Seite, dessen Zugänglichkeit niemand hier kontrolliert.
//
// **Drei Barrieren, zwei Muster** (docs/ARCHITECTURE.md §11):
//
//   `alt`      — Muster B: dieselben drei Bilder, einmal mit `alt`, einmal
//                ohne. Was auf der Seite steht, ändert sich nicht; was ein
//                Screenreader daraus macht, vollständig.
//   `emoji`    — Muster A: zwei ausgeschriebene Fassungen desselben Beitrags.
//                Die eine trägt ihre Information in Emojis, die andere in
//                Wörtern.
//   `kontrast` — Muster B: dieselbe Bildunterschrift, einmal in
//                --sim-fail-text auf heller Fläche (2,92:1), einmal in
//                --sim-white auf --sim-brand (11,48:1).
//
// **Warum die Bildunterschrift auf einer deckenden Fläche steht und nicht
// direkt auf dem Bild.** docs/UX-COPY.md §9.5 beschreibt sie „direkt auf dem
// Bild" beziehungsweise auf einem „abgedunkelten Verlauf". Beides ist hier
// bewusst anders umgesetzt, aus zwei Gründen, und der zweite ist der wichtige:
//
//   1. `--sim-text` auf einem *abgedunkelten* Verlauf wäre dunkel auf dunkel.
//      Der behobene Zustand verfehlte die 4,5:1, die derselbe Absatz verlangt.
//      Er ist deshalb weiß auf --sim-brand.
//   2. axe kann ein Kontrastverhältnis nur berechnen, wenn es den Hintergrund
//      kennt. Über einem Bild oder einem Verlauf meldet es „incomplete" statt
//      eines Verstoßes — und „incomplete" prüft niemand. Die Barriere wäre
//      damit als `automatedDetection: 'axe'` deklariert und im Testlauf 2
//      trotzdem unsichtbar (docs/SPEC_v2.md Slice 16, Abnahmekriterium 1).
//
// Der didaktische Gehalt bleibt derselbe: zu schwacher Text über einem Bild,
// und die Reparatur ist dieselbe, die eine echte Redaktion vornimmt. Beide
// Abweichungen sind in docs/UX-COPY.md §9.5 vermerkt und redaktionell zu
// bestätigen.
//
// **Systemeinstellungen schlagen simulierte Barrieren** (CLAUDE.md Regel 9).
// Erzwingt das System eigene Farben, stellt der Browser die Bildunterschrift in
// Systemfarben dar und die Kontrast-Barriere ist schlicht nicht zu sehen. Diese
// Komponente unternimmt nichts dagegen — sie sagt es: über
// SuppressionNoticeService erscheint der Hinweis aus docs/UX-COPY.md §5.9 in
// der Simulationsleiste, mit dem Teil, auf den es ankommt, nämlich was ohne die
// Einstellung zu sehen wäre. Ohne ihn hält eine dozierende Person die Barriere
// für kaputt.
//
// Überschriftenebene: Der Abschnitt trägt die `h3` (Seitenkomponente), alles
// hier steht darunter (docs/ARCHITECTURE.md §5.6 Regel 1). Die Beiträge tragen
// keine eigene Überschrift — ein Social-Media-Beitrag hat keine, und eine
// erfundene wäre erfundene Redaktion (CLAUDE.md Regel 14).
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
} from '@angular/core';
import { BarrierStateService } from '../../../core/barrier-state.service';
import { FORCED_COLORS, mediaPreference } from '../../../core/media-preference';
import { SuppressionNoticeService } from '../../../core/suppression-notice.service';
import {
  ALT_BARRIER,
  EMOJI_BARRIER,
  KONTRAST_BARRIER,
} from '../../../content/csr-campaign/csr-campaign.content';
import { CSR_CAMPAIGN_SCENARIO } from '../../../content/csr-campaign/csr-campaign.scenario';

/** Ein Beitrag der Einbettung, der aus einem Bild besteht. */
interface CampaignPost {
  /** Nur zum Nachverfolgen in `@for`, nie im DOM. */
  readonly id: string;
  /**
   * Relativ, ohne führenden Schrägstrich: Ein root-absoluter Pfad liefe unter
   * einem konfigurierten `base href` ins Leere (docs/ARCHITECTURE.md §16).
   */
  readonly image: string;
  /** docs/UX-COPY.md §9.3, nur im behobenen Zustand von `alt` ausgegeben. */
  readonly alt: string;
  /** docs/UX-COPY.md §9.5, in beiden Zuständen von `kontrast` vorhanden. */
  readonly overlay: string;
}

/**
 * Die drei Bildbeiträge, docs/UX-COPY.md §9.3 (`csr.social.postN.alt`) und
 * §9.5 (`csr.social.postN.overlay`).
 *
 * Nicht exportiert, und der Test liest sie auch nicht: Er schreibt die
 * Alternativtexte unabhängig ab (campaign-media.component.spec.ts). Läse er sie
 * von hier, prüfte er die Konstante gegen sich selbst und bliebe grün, während
 * die Copy und die Seite auseinanderlaufen.
 *
 * Die Bilder sind schematische SVG-Zeichnungen, keine Fotos — die Begründung
 * steht in public/simulation/csr-post-anstrich.svg und folgt docs/SPEC_v2.md
 * §4.2: Ein Foto bände den Bau an eine externe Lieferung, und was hier lehrt,
 * ist der Alternativtext, nicht die Fotografie.
 */
const CAMPAIGN_POSTS: readonly CampaignPost[] = [
  {
    id: 'anstrich',
    image: 'simulation/csr-post-anstrich.svg',
    alt: 'Zwölf Mitarbeitende von Elbwerk stehen mit Malerrollen vor der frisch gestrichenen Wand des Nachbarschaftstreffs.',
    overlay: 'Aktionstag im Treff',
  },
  {
    id: 'scheck',
    image: 'simulation/csr-post-scheck.svg',
    alt: 'Eine Frau übergibt einen symbolischen Spendenscheck über 2.000 Euro an zwei Vertreterinnen des Nachbarschaftstreffs.',
    overlay: '2.000 € übergeben',
  },
  {
    id: 'basteln',
    image: 'simulation/csr-post-basteln.svg',
    alt: 'Kinder sitzen an einem langen Tisch im Nachbarschaftstreff und basteln.',
    overlay: 'Bastelnachmittag',
  },
];

/**
 * docs/UX-COPY.md §9.4 `csr.social.emojiPost`. Ein Screenreader liest daraus
 * „Party-Popper, Party-Popper, Party-Popper, Schon, Ziffer acht, Ziffer null,
 * Prozent, erhobene Hände, …" — die Prozentzahl ist verloren, und das
 * Rollstuhlsymbol, das Inklusion signalisieren soll, ist nicht einmal
 * beschriftet.
 *
 * Die Zeichenkette enthält Variationsselektoren und
 * Keycap-Sequenzen, die man nicht sieht. Wer sie ändert, prüfe sie gegen
 * docs/UX-COPY.md §9.4 — campaign-media.component.spec.ts zählt die Emojis,
 * kann aber nicht wissen, welche gemeint waren.
 */
const EMOJI_POST = 'Aktionstag im Treff 🎉🎉🎉 Schon 8️⃣0️⃣% 🙌 Jetzt mitmachen 👉 Link in Bio ❤️♿';

/**
 * docs/UX-COPY.md §9.4 `csr.social.plainPost`.
 *
 * **Ein Emoji bleibt stehen, und das ist der Punkt.** Die Lehre ist nicht
 * „Emojis sind schlecht", sondern „Emojis dürfen keine Information tragen".
 * Ein schmückendes Emoji nach einem vollständigen Satz ist unproblematisch —
 * eine Fassung ganz ohne Emojis würde die falsche Regel vorführen.
 */
const PLAIN_POST =
  'Aktionstag im Nachbarschaftstreff: Wir haben 80 Prozent des Spendenziels erreicht. Machen Sie mit — der Link steht in unserem Profil. 🎉';

@Component({
  selector: 'app-campaign-media',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-media.component.html',
  styleUrl: './campaign-media.component.scss',
})
export class CampaignMediaComponent {
  private readonly barrierState = inject(BarrierStateService);
  private readonly notices = inject(SuppressionNoticeService);

  /** Importiert statt als Input übergeben — siehe JobPostingStepComponent. */
  private readonly scenario = CSR_CAMPAIGN_SCENARIO;

  /**
   * `urlKey` jeweils am Barriere-Objekt abgelesen, nie als Zeichenkette
   * hingeschrieben: `urlKey`s sind öffentliche Schnittstelle (CLAUDE.md
   * Regel 11).
   */
  protected readonly altTexts = computed(() =>
    this.barrierState.isResolved(this.scenario, ALT_BARRIER.urlKey),
  );

  protected readonly plainWording = computed(() =>
    this.barrierState.isResolved(this.scenario, EMOJI_BARRIER.urlKey),
  );

  protected readonly readableOverlay = computed(() =>
    this.barrierState.isResolved(this.scenario, KONTRAST_BARRIER.urlKey),
  );

  protected readonly posts = CAMPAIGN_POSTS;
  protected readonly emojiPost = EMOJI_POST;
  protected readonly plainPost = PLAIN_POST;

  /**
   * Die Bilder sind 600 × 600. Die Maße stehen am `img`, damit der Platz vor
   * dem Laden reserviert ist: Ein nachträglicher Umbruch verschiebt die Seite
   * unter dem Zeiger weg und ist für Nutzer mit Vergrößerung besonders
   * ärgerlich. Der Wert ist die intrinsische Größe der Datei, nicht die
   * Anzeigegröße — die bestimmt das Stylesheet.
   */
  protected readonly imageSize = { width: 600, height: 600 };

  /**
   * `csr.social.disclaimer` (docs/UX-COPY.md §9.3). Einer der vier
   * **Simulationshinweise** — der einen Textsorte, die aus dem Rahmen in die
   * Simulation hineinragt (docs/UX-COPY.md §8.4, CLAUDE.md Regel 5). Er steht
   * in jedem Barrierezustand und wird nie zur Barriere gemacht.
   *
   * Hier steht er nicht, weil jemand Daten eingeben könnte, sondern weil eine
   * Social-Media-Einbettung genau die Stelle ist, an der eine echte Seite Daten
   * an Dritte überträgt. Der Hinweis sagt, dass diese es nicht tut.
   */
  protected readonly disclaimer =
    'Nachbildung einer Social-Media-Einbettung. Es werden keine Daten an Dritte übertragen.';

  /** docs/UX-COPY.md §5.9 `suppressed.forcedColors`. */
  private readonly forcedColorsNote =
    'Dein System erzwingt eigene Farben. Diese Einstellung hat Vorrang: Die Kontrast-Barriere wird nicht dargestellt. Ohne diese Einstellung wäre der Text auf den Bildern kaum lesbar.';

  private readonly forcedColors = mediaPreference(FORCED_COLORS);

  constructor() {
    // Der Hinweis steht nur, solange es etwas zu unterdrücken gibt: Erzwingt
    // das System Farben und ist die Barriere behoben, wird nichts überstimmt.
    effect(() => {
      const suppressed = this.forcedColors() && !this.readableOverlay();
      this.notices.publish(
        this.scenario.path,
        KONTRAST_BARRIER.urlKey,
        suppressed ? this.forcedColorsNote : undefined,
      );
    });

    // Zurücknehmen beim Zerstören, und **nicht** über `onCleanup` des Effekts:
    // Das liefe auch vor jedem erneuten Durchlauf und schriebe erst
    // „kein Hinweis", dann den Hinweis — zwei Änderungen für einen Wechsel, mit
    // einem Zwischenzustand, in dem die Leiste kurz nichts sagt.
    //
    // Nötig ist es trotzdem: Der Dienst ist root-provided und überlebt diese
    // Komponente. Ein liegengebliebener Hinweis behauptete auf der nächsten
    // Seite eine Barriere, die sie nicht hat.
    inject(DestroyRef).onDestroy(() =>
      this.notices.publish(this.scenario.path, KONTRAST_BARRIER.urlKey, undefined),
    );
  }
}
