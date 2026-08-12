// Display labels for the responsible business areas (docs/UX-COPY.md §5.6
// `area.*`). Frame copy for a domain type, so it lives in `frame/` rather
// than `content/`: content/ holds scenario data that WERTE.IT authors, this
// is a fixed UI vocabulary that never varies by scenario.
//
// Naming an area on every barrier is the panel's whole thesis, not decoration
// (docs/ARCHITECTURE.md §12.1.1, CLAUDE.md rule 18) — barriers arise between
// departments, not inside one.
//
// docs/UX-COPY.md §5.6 also lists `area.csr`. `ResponsibleArea` has no 'csr'
// member: docs/ARCHITECTURE.md §6 is the type's source and the CSR campaign
// is still a `status: 'planned'` stub. The discrepancy is recorded on
// RESPONSIBLE_AREAS in models/domain.model.ts and gets reconciled when CSR
// content lands. Typing this as `Record<ResponsibleArea, string>` means the
// compiler forces the map to grow at the same moment the type does.
import type { ResponsibleArea } from '../models/domain.model';

export const AREA_LABELS: Record<ResponsibleArea, string> = {
  personal: 'Personal',
  kommunikation: 'Kommunikation',
  it: 'IT',
  beschaffung: 'Beschaffung',
  management: 'Management',
};
