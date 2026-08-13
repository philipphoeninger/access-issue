// Display names for the four standards a `StandardReference` can cite
// (docs/UX-COPY.md §5.8 `standard.*`). Same reasoning as area-labels.ts: a
// fixed UI vocabulary for a domain type, so it lives in `frame/` rather than
// in `content/`, which holds the scenario data WERTE.IT authors.
//
// These are the proper names of the norms, not editorial copy — they are
// listed in docs/UX-COPY.md all the same, because they are rendered strings
// and the §5.8 table is where a reviewer looks for what the explanation view
// says (CLAUDE.md rule 15).
//
// Typed as `Record<Standard, string>` so the compiler forces this map to grow
// at the same moment the union in models/domain.model.ts does.
import type { Standard } from '../models/domain.model';

export const STANDARD_LABELS: Record<Standard, string> = {
  WCAG_2_2: 'WCAG 2.2',
  BITV_2_0: 'BITV 2.0',
  EN_301_549: 'EN 301 549',
  BFSG: 'BFSG',
};
