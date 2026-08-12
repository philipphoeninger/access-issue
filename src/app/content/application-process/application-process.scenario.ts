// Structure, steps and barrier ids for the application-process scenario.
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
    {
      id: 'stellenanzeige',
      path: 'stellenanzeige',
      title: 'Stellenanzeige',
      barrierIds: ['grafik', 'sprache'],
    },
    {
      id: 'formular',
      path: 'formular',
      title: 'Bewerbungsformular',
      barrierIds: ['labels', 'tastatur', 'pflichtfeld', 'fehler'],
    },
    {
      id: 'dokumente',
      path: 'dokumente',
      title: 'Unterlagen hochladen',
      barrierIds: ['pdf', 'upload'],
    },
    {
      id: 'rueckmeldung',
      path: 'rueckmeldung',
      title: 'Rückmeldung',
      barrierIds: ['bestaetigung', 'ansprechperson', 'inklusionshinweis'],
    },
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
