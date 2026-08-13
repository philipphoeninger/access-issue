// Die Bereichsnavigation der Kampagnenseite und die Barriere `navigation`
// (docs/UX-COPY.md §9.1, docs/PRD.md §6.2 Bereich 1, docs/SPEC_v2.md slice 14).
//
// **Muster B** (docs/ARCHITECTURE.md §11): Es ändert sich nicht, *welche*
// Inhalte es gibt — dieselben fünf Ziele stehen in beiden Zuständen unter
// derselben Beschriftung — sondern nur, wie sie ausgezeichnet und dadurch
// bedienbar sind. Aktiv sind es `<div>`-Elemente mit Klick-Handlern, behoben
// echte Links in einem `<nav>`.
//
// Beide Fassungen sind eigenständig geschrieben, keine ist eine Reparatur der
// anderen (CLAUDE.md Regel 10). Die aktive Fassung ist genau das, was in der
// Praxis entsteht, wenn eine Navigation im Design-Werkzeug entworfen und
// anschließend „nachgebaut" wird: sichtbar richtig, semantisch nichts.
//
// **Barriere durch Auslassen, nicht durch Abfangen** (CLAUDE.md Regel 6). Die
// aktive Fassung hängt sich in keine Tastaturbedienung ein, unterdrückt kein
// `Tab` und setzt nirgends `outline: none`. Es gibt schlicht kein
// fokussierbares Element — deshalb ist auch kein Fokusring zu sehen, und genau
// das meint der Normbezug 2.4.7. Regel 8 („ein fehlender Fokusring ist nie eine
// Barriere") ist damit nicht verletzt: unterdrückt wird nichts.
//
// Das Aufklappmenü öffnet aktiv ausschließlich über `:hover` in CSS, ohne jedes
// JavaScript — auch das ist Auslassen. Behoben öffnet es zusätzlich bei Fokus
// und mit der Eingabetaste, und die Schaltfläche trägt `aria-expanded`.
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core';
import { BarrierStateService } from '../../../core/barrier-state.service';
import { NAVIGATION_BARRIER } from '../../../content/csr-campaign/csr-campaign.content';
import { CSR_CAMPAIGN_SCENARIO } from '../../../content/csr-campaign/csr-campaign.scenario';
import { FragmentLink } from '../../../shared/fragment-link.directive';

export interface CampaignNavItem {
  /** Sichtbarer Text, docs/UX-COPY.md §9.1 `csr.nav.items`. */
  readonly label: string;
  /** Ziel im Simulationsbereich, `sim-` wie jede Id dort (CLAUDE.md Regel 2). */
  readonly anchorId: string;
}

/**
 * docs/UX-COPY.md §9.1 `csr.nav.items`, an „ · " getrennt, dazu das Ziel, das
 * jeder Eintrag benennt.
 *
 * **Die Reihenfolge ist die der Copy, nicht die der Seite.** „Mitmachen" führt
 * zum Spendenaufruf und „Veranstaltung" zum Event; auf der Seite steht das
 * Event vor dem Spendenaufruf (docs/UX-COPY.md §9.6 vor §9.7). Beides so zu
 * lassen ist die ehrlichere Variante: die Menüreihenfolge einer echten
 * Kampagnenseite folgt dem, was beworben werden soll, nicht dem Seitenaufbau.
 * Die Zuordnung selbst steht in docs/UX-COPY.md §9.1 und wird hier nicht
 * erfunden.
 *
 * Exportiert, damit der Test der Seite prüfen kann, dass jedes Ziel existiert.
 * Nichts verbindet die Zeichenkette hier mit dem `id` im Template der Seite —
 * ein Tippfehler ergäbe einen Link ins Leere, bei dem jeder Unit-Test grün
 * bleibt.
 */
export const CAMPAIGN_NAV_ITEMS: readonly CampaignNavItem[] = [
  { label: 'Die Aktion', anchorId: 'sim-kampagne' },
  { label: 'Unser Ziel', anchorId: 'sim-texte' },
  { label: 'Stimmen', anchorId: 'sim-medien' },
  { label: 'Mitmachen', anchorId: 'sim-spende' },
  { label: 'Veranstaltung', anchorId: 'sim-event' },
];

@Component({
  selector: 'app-campaign-nav',
  imports: [FragmentLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-nav.component.html',
  styleUrl: './campaign-nav.component.scss',
})
export class CampaignNavComponent {
  private readonly barrierState = inject(BarrierStateService);
  private readonly document = inject(DOCUMENT);

  /** Importiert statt als Input übergeben — siehe JobPostingStepComponent. */
  private readonly scenario = CSR_CAMPAIGN_SCENARIO;

  /**
   * `urlKey` am Barriere-Konstantenobjekt abgelesen, nie als Zeichenkette
   * hingeschrieben: `urlKey`s sind öffentliche Schnittstelle und dürfen nie
   * umbenannt werden (CLAUDE.md Regel 11).
   */
  protected readonly keyboardOperable = computed(() =>
    this.barrierState.isResolved(this.scenario, NAVIGATION_BARRIER.urlKey),
  );

  protected readonly items = CAMPAIGN_NAV_ITEMS;

  /** docs/UX-COPY.md §9.1 `csr.nav.label`. */
  protected readonly label = 'Bereiche dieser Seite';

  protected readonly menuId = 'sim-nav-menu';

  /**
   * Nur die behobene Fassung führt diesen Zustand: aktiv öffnet das Menü über
   * `:hover` in CSS, und ein Signal, das nichts steuert, wäre eine Zeile, die
   * das Gegenteil behauptet.
   *
   * `linkedSignal` statt `signal`, damit das Umschalten der Barriere den
   * Zustand zurücksetzt. Sonst überlebt ein offenes Menü den Wechsel in die
   * aktive Fassung — die Komponente wird dabei nicht neu erzeugt, nur ihr
   * Zweig — und stünde beim Zurückschalten unaufgefordert offen, mit
   * `aria-expanded="true"`, ohne dass jemand es geöffnet hätte. Mitten in
   * einer Vorführung ist ein Menü, das sich selbst aufklappt, genau das
   * Rauschen, das vom Umschalter ablenkt.
   */
  protected readonly expanded = linkedSignal<boolean, boolean>({
    source: this.keyboardOperable,
    computation: () => false,
  });

  protected toggle(): void {
    this.expanded.update((open) => !open);
  }

  protected open(): void {
    this.expanded.set(true);
  }

  protected close(): void {
    this.expanded.set(false);
  }

  /**
   * Der Zeiger verlässt die Navigation — und das Menü bleibt offen, solange
   * der Fokus darin steht.
   *
   * Ohne diese Bedingung schließt eine reine Zeigerbewegung ein Menü, in dem
   * jemand gerade mit der Tastatur steht: Das `<ul>` bekommt `hidden`, der
   * fokussierte Link wird unsichtbar, `document.activeElement` bleibt auf ihm
   * stehen, und der nächste `Tab` springt an den Anfang des Dokuments. Ein
   * Fokus, der auf einem unsichtbaren Element sitzt, ist kein sichtbarer Fokus
   * (SC 2.4.7), und in der behobenen Fassung ist das nicht bloß ein Schönheits-
   * fehler, sondern ein Widerspruch zu dem, was sie vorführen soll.
   *
   * `contains(null)` ist `false`, der Zweig schließt also auch dann, wenn gar
   * nichts fokussiert ist — was der gewollte Normalfall ist.
   */
  protected onPointerLeave(event: MouseEvent): void {
    const nav = event.currentTarget as HTMLElement;
    if (!nav.contains(this.document.activeElement)) {
      this.close();
    }
  }

  /**
   * Schließt erst, wenn der Fokus die Navigation wirklich verlässt. Ohne die
   * Prüfung auf `relatedTarget` fiele das Menü beim Weitertabben vom
   * Auslöser zum ersten Link in sich zusammen — der Fokus stünde dann auf
   * einem Element, das es nicht mehr gibt.
   */
  protected onFocusOut(event: FocusEvent): void {
    const nav = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    if (next === null || !nav.contains(next)) {
      this.close();
    }
  }

  /**
   * Der Klick-Handler der aktiven Fassung. Ein echter Link würde springen
   * *und* den Fokus mitnehmen; hier scrollt die Seite und sonst geschieht
   * nichts — was eine mausbediente Navigation eben tut. Kein `preventDefault`,
   * kein globaler Handler, nichts, was dem Browser in den Arm fällt.
   */
  protected scrollToSection(anchorId: string): void {
    this.document.getElementById(anchorId)?.scrollIntoView();
  }
}
