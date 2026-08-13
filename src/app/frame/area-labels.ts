// Display labels for the responsible business areas (docs/UX-COPY.md §5.6
// `area.*`). Frame copy for a domain type, so it lives in `frame/` rather
// than `content/`: content/ holds scenario data that WERTE.IT authors, this
// is a fixed UI vocabulary that never varies by scenario.
//
// Naming an area on every barrier is the panel's whole thesis, not decoration
// (docs/ARCHITECTURE.md §12.1.1, CLAUDE.md rule 18) — barriers arise between
// departments, not inside one.
//
// `csr` (docs/UX-COPY.md §5.6 `area.csr`) was the one label this map lacked
// while the campaign had no barrier carrying it. It arrived with the event
// barrier of docs/SPEC_v2.md slice 17 — and it arrived here in the same commit
// because typing this as `Record<ResponsibleArea, string>` means the compiler
// forces the map to grow at the same moment the type does. That is the point
// of the annotation: an area with no label would reach the panel as
// `undefined` and read as a missing word, not as an error.
import type { ResponsibleArea } from '../models/domain.model';

export const AREA_LABELS: Record<ResponsibleArea, string> = {
  personal: 'Personal',
  kommunikation: 'Kommunikation',
  it: 'IT',
  beschaffung: 'Beschaffung',
  management: 'Management',
  csr: 'CSR',
};
