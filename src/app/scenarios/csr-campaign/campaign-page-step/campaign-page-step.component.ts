// Die Kampagnenseite „Inklusiv. Nachhaltig. Sichtbar." — das einzige „Schritt"-
// View der CSR-Kampagne (docs/UX-COPY.md §9, docs/SPEC_v2.md slice 14).
//
// Eine Seite, fünf Abschnitte, und die Abschnitte sind zugleich die
// Panel-Gruppen (docs/ARCHITECTURE.md §12.1.1). Diese Datei baut das Gerüst:
// die Elbwerk-Seitenhülle, die Bereichsnavigation mit ihrer Barriere und die
// fünf Abschnitte mit ihren Überschriften und Sprungzielen. Vier davon sind
// vorerst leer — ihre Inhalte und Barrieren bringen die Schnitte 15 bis 18
// (docs/SPEC_v2.md §5), und jeder von ihnen füllt genau einen Abschnitt.
//
// **Die Sprungziele stehen jetzt schon vollständig da**, obwohl das Panel
// heute nur auf den ersten zeigt. Sie sind das, worauf die Navigation
// verweist — alle fünf, in beiden Barrierezuständen —, und eine Navigation mit
// vier Zielen ins Leere wäre eine zweite, unerklärte Barriere (CLAUDE.md
// Regel 18).
//
// Überschriftenebenen sind nicht Sache dieser Komponente: Seiten-`h1` ist der
// Szenariotitel im Rahmen, `h2` die Überschrift des Simulationsbereichs, und
// **jeder Szenarioinhalt beginnt bei `h3`** (docs/ARCHITECTURE.md §5.6 Regel 1).
// Die fünf Abschnitte sind deshalb `h3`, alles darunter `h4`. Eine kaputte
// Gliederung ist nie eine zulässige Barriere.
//
// Die Komponente besitzt keinen Zustand und navigiert nicht
// (docs/ARCHITECTURE.md §14). Die Barriere der Navigation liegt in
// CampaignNavComponent, weil sie eigenes Verhalten hat; die Abschnitte hier
// sind reine Auszeichnung.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ElbwerkPageComponent } from '../../elbwerk-page/elbwerk-page.component';
import { CampaignNavComponent } from '../campaign-nav/campaign-nav.component';

@Component({
  selector: 'app-campaign-page-step',
  imports: [ElbwerkPageComponent, CampaignNavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-page-step.component.html',
  styleUrl: './campaign-page-step.component.scss',
})
export class CampaignPageStepComponent {}
