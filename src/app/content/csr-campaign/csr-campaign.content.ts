// German editorial prose for the CSR-campaign scenario.
//
// Same division of labour as the application process
// (application-process.content.ts): `explanation.problem/affected/solution` is
// scaffolding and every barrier below therefore carries
// `contentStatus: 'placeholder'`. WERTE.IT has not delivered the reviewed texts
// for the campaign's eleven barriers (docs/SPEC_v2.md §10, docs/PRD.md §10). Do
// not flip a barrier to 'approved' without an actual WERTE.IT text replacing
// the placeholder prose.
//
// `title`, `shortTitle` and `responsibleArea` are **not** placeholder: they are
// the panel strings of docs/UX-COPY.md §5.6 („Barriere" / „Beschriftung" /
// „Bereich" columns, section *CSR-Kampagne*). `standards` and `affectedGroups`
// transcribe docs/PRD.md §6.2.
//
// Barrier set and order follow the five sections of docs/PRD.md §6.2. Slice 14
// builds the first of them; slices 15 to 18 add the other four
// (docs/SPEC_v2.md §5).
import type { Barrier } from '../../models/domain.model';
import { WCAG_2_1_1, WCAG_2_4_7 } from '../standards/wcag';

// ── Bereich 1: Kampagnenseite ────────────────────────────────────────────────

export const NAVIGATION_BARRIER: Barrier = {
  id: 'navigation',
  urlKey: 'navigation',
  title: 'Navigation',
  shortTitle: 'Navigation per Tastatur bedienbar',
  categories: ['motor', 'visual'],
  affectedGroups: ['motorische Einschränkungen', 'blinde Personen', 'Tastaturnutzer'],
  responsibleArea: 'it',
  groupId: 'kampagnenseite',
  organisational: false,
  standards: [WCAG_2_1_1, WCAG_2_4_7],
  explanation: {
    problem:
      '[Platzhalter] Die Bereichsnavigation der Kampagnenseite besteht aus <div>-Elementen mit Klick-Handlern. Sie steht nicht in der Tab-Reihenfolge, und das Aufklappmenü öffnet ausschließlich bei Mauskontakt.',
    affected:
      '[Platzhalter] Wer die Seite mit der Tastatur bedient — dauerhaft wegen einer motorischen Einschränkung, mit einem Screenreader, oder vorübergehend ohne Maus — erreicht die Navigation gar nicht. Auch ein sichtbarer Fokus fehlt, weil es nichts gibt, das den Fokus erhalten könnte.',
    solution:
      '[Platzhalter] Die Navigation besteht aus echten Links in einem <nav>-Element mit Bezeichnung. Sie steht in der Tab-Reihenfolge, zeigt einen sichtbaren Fokus, und das Aufklappmenü öffnet auch bei Fokus und mit der Eingabetaste.',
  },
  // Manual: axe sees a `div` with a click handler as ordinary text. That two
  // thirds of this project's barriers are invisible to automated checking is
  // the point docs/TESTING.md §2 makes, and this is one of them — the
  // Playwright suite asserts it with real key events instead
  // (e2e/csr-campaign.spec.ts).
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};
