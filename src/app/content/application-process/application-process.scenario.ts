// Structure, steps and barrier ids for the application-process scenario.
// Prose lives in application-process.content.ts (docs/ARCHITECTURE.md §13) so
// structural edits never touch reviewed editorial text.
//
// Route segments match docs/ARCHITECTURE.md §9:
//   /szenario/bewerbung/stellenanzeige
//   /szenario/bewerbung/formular
import type { Scenario } from '../../models/domain.model';
import {
  FEHLER_BARRIER,
  LABELS_BARRIER,
  PDF_BARRIER,
  SPRACHE_BARRIER,
  TASTATUR_BARRIER,
} from './application-process.content';

export const APPLICATION_PROCESS_SCENARIO: Scenario = {
  id: 'application-process',
  path: 'bewerbung',
  title: 'Bewerbungsprozess',
  summary:
    'Eine Stellenanzeige und ein Bewerbungsformular. Die Barrieren summieren sich über zwei Schritte auf, bis die Bewerbung scheitert.',
  status: 'available',
  steps: [
    {
      id: 'stellenanzeige',
      path: 'stellenanzeige',
      title: 'Stellenanzeige',
      barrierIds: ['pdf', 'sprache'],
    },
    {
      id: 'formular',
      path: 'formular',
      title: 'Bewerbungsformular',
      barrierIds: ['labels', 'tastatur', 'fehler'],
    },
  ],
  barriers: [PDF_BARRIER, SPRACHE_BARRIER, LABELS_BARRIER, TASTATUR_BARRIER, FEHLER_BARRIER],
};
