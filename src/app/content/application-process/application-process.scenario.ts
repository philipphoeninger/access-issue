// Structure, steps and panel groups for the application-process scenario.
// Prose lives in application-process.content.ts (docs/ARCHITECTURE.md §13) so
// structural edits never touch reviewed editorial text.
//
// Four-step flow per docs/PRD.md §6.1 and route segments per
// docs/ARCHITECTURE.md §9:
//   /szenario/bewerbung/stellenanzeige
//   /szenario/bewerbung/formular
//   /szenario/bewerbung/dokumente
//   /szenario/bewerbung/rueckmeldung
// Step titles are the UI strings from docs/UX-COPY.md §5.3.
import type { Scenario } from '../../models/domain.model';
import {
  ANSPRECHPERSON_BARRIER,
  BESTAETIGUNG_BARRIER,
  FEHLER_BARRIER,
  GRAFIK_BARRIER,
  INKLUSIONSHINWEIS_BARRIER,
  LABELS_BARRIER,
  PDF_BARRIER,
  PFLICHTFELD_BARRIER,
  SPRACHE_BARRIER,
  TASTATUR_BARRIER,
  UPLOAD_BARRIER,
} from './application-process.content';

export const APPLICATION_PROCESS_SCENARIO: Scenario = {
  id: 'application-process',
  path: 'bewerbung',
  title: 'Bewerbungsprozess',
  // docs/UX-COPY.md §5.2 `scenario.application.summary`.
  summary:
    'Eine Stellenanzeige, ein Bewerbungsformular, der Upload der Unterlagen und die Rückmeldung. Die Barrieren summieren sich über vier Schritte auf, bis die Bewerbung scheitert.',
  status: 'available',
  steps: [
    { id: 'stellenanzeige', path: 'stellenanzeige', title: 'Stellenanzeige' },
    { id: 'formular', path: 'formular', title: 'Bewerbungsformular' },
    { id: 'dokumente', path: 'dokumente', title: 'Unterlagen hochladen' },
    { id: 'rueckmeldung', path: 'rueckmeldung', title: 'Rückmeldung' },
  ],
  // Four panel groups mirroring the four steps one-to-one
  // (docs/ARCHITECTURE.md §12.1.1). They are declared rather than derived
  // from `steps`, because the panel's structure and the routing structure
  // coincide here and nowhere else — the CSR campaign is one step with five
  // groups (docs/SPEC_v2.md §4.1). Ids match the step ids so a deep link and
  // the group a barrier sits in stay recognisably the same thing; titles are
  // the step titles from docs/UX-COPY.md §5.3.
  //
  // No `anchorId`: a step is reached by navigating to it, not by jumping
  // within the page, and an in-page anchor to a section that is not rendered
  // would be a link to nowhere.
  groups: [
    { id: 'stellenanzeige', title: 'Stellenanzeige' },
    { id: 'formular', title: 'Bewerbungsformular' },
    { id: 'dokumente', title: 'Unterlagen hochladen' },
    { id: 'rueckmeldung', title: 'Rückmeldung' },
  ],
  barriers: [
    GRAFIK_BARRIER,
    SPRACHE_BARRIER,
    LABELS_BARRIER,
    TASTATUR_BARRIER,
    PFLICHTFELD_BARRIER,
    FEHLER_BARRIER,
    PDF_BARRIER,
    UPLOAD_BARRIER,
    BESTAETIGUNG_BARRIER,
    ANSPRECHPERSON_BARRIER,
    INKLUSIONSHINWEIS_BARRIER,
  ],
};
