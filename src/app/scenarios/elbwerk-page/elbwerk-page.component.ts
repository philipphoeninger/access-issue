// The Elbwerk page chrome — logo, company name, menu line — shared by every
// page of the fictional company: the four steps of the application process and
// the CSR campaign page (docs/UX-COPY.md §8.1, §9). Plain HTML, plain CSS,
// system font stack: no Angular Material inside the simulation region
// (docs/ARCHITECTURE.md §11). Material is engineered to be accessible and
// resists being made otherwise, and fighting it would produce markup no real
// company site has.
//
// **It sits beside the scenario folders, not inside one.** It lived under
// `application-process/` while that was the only scenario, which stopped being
// true in docs/SPEC_v2.md slice 14: the campaign page shows the same header,
// the same logo and the same typography (that is what makes both read as one
// company), and importing it from a sibling scenario's folder would have said
// the opposite. docs/ARCHITECTURE.md §14 already called it "shared Elbwerk
// chrome"; this is the directory catching up with the label.
//
// This component carries **no barrier**, in any scenario. The barriers are
// exactly those in docs/PRD.md §6.1 and §6.2; the page chrome around them is
// written as a competent developer would write it, which is also what makes
// the barriers legible as barriers rather than as general sloppiness.
//
// Nothing here is state-dependent, so it does not read BarrierStateService at
// all — the steps do.
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-elbwerk-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './elbwerk-page.component.html',
  styleUrl: './elbwerk-page.component.scss',
})
export class ElbwerkPageComponent {
  /**
   * docs/UX-COPY.md §8.1 `elbwerk.nav.items`. Kept as the one string the copy
   * defines rather than as an array of menu entries, because it is rendered as
   * one line of text and not as navigation — see the template for why.
   */
  protected readonly menu = 'Unternehmen · Leistungen · Karriere · Kontakt';

  /**
   * Relative, not root-absolute (`/simulation/…`): relative URLs resolve
   * against `<base href>`, so the logo survives a deployment under a subpath.
   * The base href is deliberately configurable (docs/ARCHITECTURE.md §16) and
   * the host is still undecided (docs/SPEC_v1.md §9).
   */
  protected readonly logoSrc = 'simulation/elbwerk-logo.svg';

  /** docs/UX-COPY.md §8.1 `elbwerk.logo.alt`. */
  protected readonly logoAlt = 'Elbwerk KG';
}
