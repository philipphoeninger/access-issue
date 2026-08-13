// The Elbwerk page chrome — logo, company name, menu line — shared by the four
// steps of the application process (docs/UX-COPY.md §8.1). Plain HTML, plain
// CSS, system font stack: no Angular Material inside the simulation region
// (docs/ARCHITECTURE.md §11). Material is engineered to be accessible and
// resists being made otherwise, and fighting it would produce markup no real
// company site has.
//
// This component carries **no barrier**. The barriers of this scenario are
// exactly the eleven in docs/PRD.md §6.1; the page chrome around them is
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
  protected readonly logoAlt = 'Elbwerk GmbH & Co. KG';
}
