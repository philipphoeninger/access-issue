// German editorial prose for the application-process scenario.
//
// `explanation.problem/affected/solution` are scaffolding — `contentStatus:
// 'placeholder'` on every barrier below is intentional and correct. WERTE.IT
// has not yet delivered the reviewed texts (docs/SPEC_v1.md §4.1,
// docs/PRD.md §10 "Fachtexte für alle Barrieren"). Do not flip a barrier to
// 'approved' without an actual WERTE.IT text replacing the placeholder prose.
//
// `title`, `shortTitle`, `standards` and `affectedGroups` are not placeholder:
// `title`/`shortTitle` are the frame-owned panel strings from
// docs/UX-COPY.md §5.6 ("Barriere" / "Beschriftung" columns), and
// `standards`/`affectedGroups` transcribe docs/PRD.md §6.1 directly rather
// than inventing new copy.
import type { Barrier } from '../../models/domain.model';
import {
  WCAG_1_3_1,
  WCAG_1_3_2,
  WCAG_2_1_1,
  WCAG_2_1_2,
  WCAG_3_1_5,
  WCAG_3_3_1,
  WCAG_3_3_2,
  WCAG_3_3_3,
  WCAG_4_1_2,
} from '../standards/wcag';

export const PDF_BARRIER: Barrier = {
  id: 'pdf',
  urlKey: 'pdf',
  title: 'PDF-Stellenanzeige',
  shortTitle: 'Stellenanzeige als Text auf der Seite',
  categories: ['visual', 'motor', 'situational'],
  affectedGroups: [
    'blinde und sehbehinderte Personen',
    'motorische Einschränkungen',
    'mobile Nutzung',
  ],
  standards: [WCAG_1_3_1, WCAG_1_3_2, WCAG_4_1_2],
  explanation: {
    problem:
      '[Platzhalter] Die Stellenanzeige steht ausschließlich als PDF-Datei zum Download bereit. Das Dokument ist nicht als barrierefreies PDF ausgezeichnet und hat keine erkennbare Lese- oder Überschriftenstruktur.',
    affected:
      '[Platzhalter] Wer einen Screenreader nutzt, kann den Inhalt kaum oder gar nicht erfassen. Wer mobil oder mit langsamer Verbindung unterwegs ist, muss zusätzlich eine große Datei laden und in einer separaten App öffnen.',
    solution:
      '[Platzhalter] Die Stellenbeschreibung steht zusätzlich als strukturierter Text direkt auf der Seite, mit Überschriften ab Ebene 3. Das PDF bleibt als Download verfügbar, ist aber nicht mehr der einzige Zugang.',
  },
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};

export const SPRACHE_BARRIER: Barrier = {
  id: 'sprache',
  urlKey: 'sprache',
  title: 'Komplexe Sprache',
  shortTitle: 'Stellenbeschreibung in klarer Sprache',
  categories: ['cognitive'],
  affectedGroups: [
    'kognitive Einschränkungen',
    'Lernbehinderungen',
    'Nicht-Muttersprachler',
    'geringe Literalität',
  ],
  standards: [WCAG_3_1_5],
  explanation: {
    problem:
      '[Platzhalter] Die Stellenbeschreibung ist in verschachteltem Behördendeutsch mit langen Schachtelsätzen und Nominalisierungen verfasst.',
    affected:
      '[Platzhalter] Menschen mit kognitiven Einschränkungen, Lernbehinderungen, geringer Literalität oder ohne Deutsch als Muttersprache benötigen deutlich mehr Zeit oder verstehen den Text gar nicht.',
    solution:
      '[Platzhalter] Dieselbe Stellenbeschreibung in klarer Sprache: kurze Sätze, aktive Verben, Listen statt Schachtelsätzen — bei gleichem Sachinhalt.',
  },
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};

export const LABELS_BARRIER: Barrier = {
  id: 'labels',
  urlKey: 'labels',
  title: 'Fehlende Labels',
  shortTitle: 'Formularfelder mit Beschriftungen',
  categories: ['visual', 'motor'],
  affectedGroups: ['blinde und sehbehinderte Personen', 'Spracheingabe-Nutzer'],
  standards: [WCAG_1_3_1, WCAG_3_3_2, WCAG_4_1_2],
  explanation: {
    problem:
      '[Platzhalter] Die sichtbaren Beschriftungen der Formularfelder sind nicht programmatisch mit den Eingabefeldern verknüpft.',
    affected:
      '[Platzhalter] Screenreader-Nutzer hören nur „Eingabefeld, leer" statt des Feldnamens. Wer Spracheingabe nutzt, kann ein Feld nicht über seinen sichtbaren Namen ansteuern.',
    solution:
      '[Platzhalter] Jedes Feld hat ein programmatisch verknüpftes Label, sodass Screenreader den Feldnamen ansagen und Spracheingabe das Feld über den Namen findet.',
  },
  automatedDetection: 'axe',
  contentStatus: 'placeholder',
};

export const TASTATUR_BARRIER: Barrier = {
  id: 'tastatur',
  urlKey: 'tastatur',
  title: 'Keine Tastaturbedienung',
  shortTitle: 'Formular per Tastatur bedienbar',
  categories: ['motor', 'visual', 'situational'],
  affectedGroups: [
    'motorische Einschränkungen',
    'Screenreader-Nutzer',
    'temporäre Einschränkungen',
  ],
  standards: [WCAG_2_1_1, WCAG_2_1_2],
  explanation: {
    problem:
      '[Platzhalter] Die Absende-Schaltfläche ist ein einfaches Element mit Klick-Handler, ohne Tastatur-Fokussierbarkeit und ohne Tastenereignisse.',
    affected:
      '[Platzhalter] Wer keine Maus bedienen kann — dauerhaft oder vorübergehend, etwa mit eingegipstem Arm — erreicht die Schaltfläche nicht. Screenreader-Nutzer navigieren ebenfalls per Tastatur und sind betroffen.',
    solution:
      '[Platzhalter] Die Schaltfläche ist ein echtes Button-Element, per Tab erreichbar und mit Enter und Leertaste auslösbar.',
  },
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};

export const FEHLER_BARRIER: Barrier = {
  id: 'fehler',
  urlKey: 'fehler',
  title: 'Kein Fehler-Feedback',
  shortTitle: 'Verständliche Fehlermeldungen',
  categories: ['cognitive', 'visual'],
  affectedGroups: ['alle Gruppen', 'besonders kognitive Einschränkungen', 'Screenreader-Nutzer'],
  standards: [WCAG_3_3_1, WCAG_3_3_3],
  explanation: {
    problem:
      '[Platzhalter] Bei ungültiger Eingabe erscheint nur eine technische Sammelmeldung ohne Bezug zu einem Feld und ohne role="alert".',
    affected:
      '[Platzhalter] Niemand erfährt, welches Feld betroffen ist oder was zu tun ist — am stärksten betrifft das kognitive Einschränkungen und Screenreader-Nutzer, die die Meldung nicht zufällig sehen.',
    solution:
      '[Platzhalter] Eine Sammelmeldung mit Sprunglinks zu den fehlerhaften Feldern, dazu je Feld eine konkrete Meldung, aria-invalid und Fokus auf das erste fehlerhafte Feld.',
  },
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};
