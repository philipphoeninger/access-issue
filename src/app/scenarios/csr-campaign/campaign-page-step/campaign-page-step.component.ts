// Die Kampagnenseite „Inklusiv. Nachhaltig. Sichtbar." — das einzige „Schritt"-
// View der CSR-Kampagne (docs/UX-COPY.md §9, docs/SPEC_v2.md slice 14).
//
// Eine Seite, fünf Abschnitte, und die Abschnitte sind zugleich die
// Panel-Gruppen (docs/ARCHITECTURE.md §12.1.1). Diese Datei baut das Gerüst:
// die Elbwerk-Seitenhülle, die Bereichsnavigation mit ihrer Barriere und die
// fünf Abschnitte mit ihren Überschriften und Sprungzielen. Seit Schnitt 18
// (docs/SPEC_v2.md §5) hat jeder von ihnen Inhalt.
//
// **Die Sprungziele standen von Anfang an vollständig da**, auch als das Panel
// erst auf den ersten zeigte. Sie sind das, worauf die Navigation verweist —
// alle fünf, in beiden Barrierezuständen —, und eine Navigation mit vier Zielen
// ins Leere wäre eine zweite, unerklärte Barriere (CLAUDE.md Regel 18).
//
// Überschriftenebenen sind nicht Sache dieser Komponente: Seiten-`h1` ist der
// Szenariotitel im Rahmen, `h2` die Überschrift des Simulationsbereichs, und
// **jeder Szenarioinhalt beginnt bei `h3`** (docs/ARCHITECTURE.md §5.6 Regel 1).
// Die fünf Abschnitte sind deshalb `h3`, alles darunter `h4`. Eine kaputte
// Gliederung ist nie eine zulässige Barriere.
//
// Die Komponente besitzt keinen Zustand und navigiert nicht
// (docs/ARCHITECTURE.md §14). Die Barrieren liegen in den Komponenten der
// Abschnitte — CampaignNavComponent, CampaignTextsComponent,
// CampaignMediaComponent, CampaignEventComponent, CampaignDonationComponent und
// CampaignCarouselComponent —, weil sie eigenes Verhalten haben; die Abschnitte
// hier sind reine Auszeichnung. Sechs Komponenten für fünf Abschnitte: Der
// Spendenaufruf ist der einzige, der sich auf zwei verteilt, und die Begründung
// steht im Markup.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ElbwerkPageComponent } from '../../elbwerk-page/elbwerk-page.component';
import { CampaignCarouselComponent } from '../campaign-carousel/campaign-carousel.component';
import { CampaignDonationComponent } from '../campaign-donation/campaign-donation.component';
import { CampaignEventComponent } from '../campaign-event/campaign-event.component';
import { CampaignMediaComponent } from '../campaign-media/campaign-media.component';
import { CampaignNavComponent } from '../campaign-nav/campaign-nav.component';
import { CampaignTextsComponent } from '../campaign-texts/campaign-texts.component';

@Component({
  selector: 'app-campaign-page-step',
  imports: [
    ElbwerkPageComponent,
    CampaignNavComponent,
    CampaignTextsComponent,
    CampaignMediaComponent,
    CampaignEventComponent,
    CampaignDonationComponent,
    CampaignCarouselComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-page-step.component.html',
  styleUrl: './campaign-page-step.component.scss',
})
export class CampaignPageStepComponent {}
