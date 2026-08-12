// German editorial prose for the application-process scenario.
//
// `explanation.problem/affected/solution` are scaffolding — `contentStatus:
// 'placeholder'` on every barrier below is intentional and correct. WERTE.IT
// has not yet delivered the reviewed texts (docs/SPEC_v1.md §4.1,
// docs/PRD.md §10 "Fachtexte für alle Barrieren"). Do not flip a barrier to
// 'approved' without an actual WERTE.IT text replacing the placeholder prose.
//
// `title`, `shortTitle`, `standards`, `affectedGroups`, `responsibleArea` and
// `organisational` are not placeholder: `title`/`shortTitle` are the
// frame-owned panel strings from docs/UX-COPY.md §5.6 ("Barriere" /
// "Beschriftung" columns), and `standards`/`affectedGroups`/`responsibleArea`/
// `organisational` transcribe docs/PRD.md §6.1 directly rather than inventing
// new copy.
//
// Barrier set and order follow the four-step flow of docs/PRD.md §6.1
// (11 barriers, two of them organisational without a standards reference).
import type { Barrier } from '../../models/domain.model';
import {
  WCAG_1_1_1,
  WCAG_1_3_1,
  WCAG_1_3_2,
  WCAG_1_4_1,
  WCAG_1_4_5,
  WCAG_2_1_1,
  WCAG_2_1_2,
  WCAG_3_1_5,
  WCAG_3_3_1,
  WCAG_3_3_2,
  WCAG_3_3_3,
  WCAG_4_1_2,
} from '../standards/wcag';

// ── Schritt 1: Stellenanzeige ────────────────────────────────────────────────

export const GRAFIK_BARRIER: Barrier = {
  id: 'grafik',
  urlKey: 'grafik',
  title: 'Textgrafik',
  shortTitle: 'Gehalt und Leistungen als Text, nicht als Bild',
  categories: ['visual'],
  affectedGroups: ['blinde und sehbehinderte Personen', 'Nutzer mit Vergrößerung'],
  responsibleArea: 'kommunikation',
  organisational: false,
  standards: [WCAG_1_1_1, WCAG_1_4_5],
  explanation: {
    problem:
      '[Platzhalter] Gehalt, Benefits und Ablauf der Stellenanzeige stehen ausschließlich in einer Grafik. Der Text ist als Bild eingebettet und hat keine gleichwertige Textalternative.',
    affected:
      '[Platzhalter] Wer einen Screenreader nutzt, bekommt die Angaben gar nicht vorgelesen. Wer die Seite vergrößert, sieht die eingebetteten Buchstaben verpixeln, statt dass der Text mitfließt.',
    solution:
      '[Platzhalter] Dieselben Angaben stehen als echter Text mit Überschrift und Liste auf der Seite. Eine Grafik darf begleiten, ersetzt aber nicht die Information.',
  },
  automatedDetection: 'axe',
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
  responsibleArea: 'kommunikation',
  organisational: false,
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

// ── Schritt 2: Bewerbungsformular ────────────────────────────────────────────

export const LABELS_BARRIER: Barrier = {
  id: 'labels',
  urlKey: 'labels',
  title: 'Fehlende Labels',
  shortTitle: 'Formularfelder mit Beschriftungen',
  categories: ['visual', 'motor'],
  affectedGroups: ['blinde und sehbehinderte Personen', 'Spracheingabe-Nutzer'],
  responsibleArea: 'it',
  organisational: false,
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
  responsibleArea: 'it',
  organisational: false,
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

export const PFLICHTFELD_BARRIER: Barrier = {
  id: 'pflichtfeld',
  urlKey: 'pflichtfeld',
  title: 'Pflichtfeld-Kennzeichnung',
  shortTitle: 'Pflichtfelder erkennbar benannt',
  categories: ['visual', 'cognitive'],
  affectedGroups: ['Farbfehlsichtige', 'Screenreader-Nutzer', 'kognitive Einschränkungen'],
  responsibleArea: 'personal',
  organisational: false,
  standards: [WCAG_1_4_1, WCAG_3_3_2],
  explanation: {
    problem:
      '[Platzhalter] Pflichtfelder sind allein durch eine rote Färbung gekennzeichnet, ohne Text und ohne programmatische Kennzeichnung.',
    affected:
      '[Platzhalter] Farbfehlsichtige erkennen die Markierung nicht. Screenreader-Nutzer erfahren nicht, dass ein Feld verpflichtend ist, weil die Information nur in der Farbe steckt.',
    solution:
      '[Platzhalter] Pflichtfelder tragen „(Pflichtfeld)" im Label und das Attribut required, ergänzt durch eine erklärende Legende. Farbe unterstützt, trägt die Bedeutung aber nicht allein.',
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
  responsibleArea: 'it',
  organisational: false,
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

// ── Schritt 3: Unterlagen hochladen ──────────────────────────────────────────

export const PDF_BARRIER: Barrier = {
  id: 'pdf',
  urlKey: 'pdf',
  title: 'PDF-Stellenanzeige',
  shortTitle: 'Stellenanzeige als Text auf der Seite',
  categories: ['visual', 'situational'],
  affectedGroups: ['blinde und sehbehinderte Personen', 'mobile Nutzung'],
  responsibleArea: 'personal',
  organisational: false,
  standards: [WCAG_1_3_1, WCAG_1_3_2, WCAG_4_1_2],
  explanation: {
    problem:
      '[Platzhalter] Die Stellenausschreibung steht ausschließlich als PDF-Datei zum Download bereit. Das Dokument ist nicht als barrierefreies PDF ausgezeichnet und hat keine erkennbare Lese- oder Überschriftenstruktur.',
    affected:
      '[Platzhalter] Wer einen Screenreader nutzt, kann den Inhalt kaum oder gar nicht erfassen. Wer mobil oder mit langsamer Verbindung unterwegs ist, muss zusätzlich eine große Datei laden und in einer separaten App öffnen.',
    solution:
      '[Platzhalter] Die Stellenbeschreibung steht zusätzlich als strukturierter Text direkt auf der Seite, mit Überschriften ab Ebene 3. Das PDF bleibt als Download verfügbar, ist aber nicht mehr der einzige Zugang.',
  },
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};

export const UPLOAD_BARRIER: Barrier = {
  id: 'upload',
  urlKey: 'upload',
  title: 'Upload-Formate',
  shortTitle: 'Zulässige Dateiformate und Größen angegeben',
  categories: ['cognitive', 'visual'],
  affectedGroups: ['alle Gruppen', 'besonders Screenreader-Nutzer', 'kognitive Einschränkungen'],
  responsibleArea: 'personal',
  organisational: false,
  standards: [WCAG_3_3_2],
  explanation: {
    problem:
      '[Platzhalter] Das Upload-Feld akzeptiert nur ein einziges Dateiformat, nennt aber weder die zulässigen Formate noch die maximale Größe. Schlägt der Upload fehl, erscheint nur eine unspezifische Meldung.',
    affected:
      '[Platzhalter] Alle Bewerber, besonders Screenreader-Nutzer und Menschen mit kognitiven Einschränkungen, müssen raten, was erlaubt ist, und scheitern ohne verwertbaren Hinweis.',
    solution:
      '[Platzhalter] Das Feld nennt vorab die zulässigen Formate und die Größenbegrenzung. Schlägt der Upload fehl, sagt eine konkrete Meldung, woran es lag und was zu tun ist.',
  },
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};

// ── Schritt 4: Rückmeldung ───────────────────────────────────────────────────

export const BESTAETIGUNG_BARRIER: Barrier = {
  id: 'bestaetigung',
  urlKey: 'bestaetigung',
  title: 'Bestätigungstext',
  shortTitle: 'Bestätigung in verständlicher Sprache',
  categories: ['visual', 'cognitive'],
  affectedGroups: ['blinde Personen', 'kognitive Einschränkungen', 'geringe Literalität'],
  responsibleArea: 'kommunikation',
  organisational: false,
  standards: [WCAG_1_1_1, WCAG_3_1_5],
  explanation: {
    problem:
      '[Platzhalter] Die Bestätigungsseite ist in Textbaustein-Deutsch verfasst, und die zentralen Angaben — Aktenzeichen, nächste Schritte — stehen nur in einer Bildsignatur ohne Textalternative.',
    affected:
      '[Platzhalter] Blinde Personen erhalten die entscheidenden Angaben nicht, weil sie im Bild stecken. Menschen mit kognitiven Einschränkungen oder geringer Literalität scheitern zusätzlich am Amtsdeutsch.',
    solution:
      '[Platzhalter] Die Bestätigung steht in klarer Sprache, und alle wichtigen Angaben stehen als Text — nicht in einer Bildsignatur.',
  },
  automatedDetection: 'axe',
  contentStatus: 'placeholder',
};

export const ANSPRECHPERSON_BARRIER: Barrier = {
  id: 'ansprechperson',
  urlKey: 'ansprechperson',
  title: 'Ansprechperson',
  shortTitle: 'Ansprechperson mit Namen und Kontakt genannt',
  categories: ['cognitive', 'situational'],
  affectedGroups: ['alle Gruppen'],
  responsibleArea: 'personal',
  // Organisatorisches Versäumnis, kein technischer Fehler: eine fehlende
  // namentliche Ansprechperson verletzt kein WCAG-Erfolgskriterium. Der leere
  // `standards`-Array ist deshalb korrekt und Absicht (docs/PRD.md §6.1).
  organisational: true,
  standards: [],
  explanation: {
    problem:
      '[Platzhalter] Für Rückfragen wird nur ein unpersönliches Funktionspostfach genannt, keine Person mit Namen, Durchwahl und Erreichbarkeit.',
    affected:
      '[Platzhalter] Wer eine Anpassung im Verfahren braucht, weiß nicht, an wen er sich wenden kann. Das trifft alle Gruppen, die einen konkreten Ansprechpartner benötigen, um überhaupt nach einer Lösung zu fragen.',
    solution:
      '[Platzhalter] Die Rückmeldung nennt eine namentliche Ansprechperson mit Telefonnummer und Sprechzeiten, an die man sich mit Rückfragen wenden kann.',
  },
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};

export const INKLUSIONSHINWEIS_BARRIER: Barrier = {
  id: 'inklusionshinweis',
  urlKey: 'inklusionshinweis',
  title: 'Inklusionshinweis',
  shortTitle: 'Hinweis, dass Anpassungen möglich sind',
  categories: ['cognitive', 'situational'],
  affectedGroups: ['alle Gruppen'],
  responsibleArea: 'personal',
  // Wie bei der Ansprechperson: ein fehlender Hinweis auf mögliche Anpassungen
  // ist ein organisatorisches Versäumnis ohne Normbezug. Leerer `standards`-
  // Array bewusst (docs/PRD.md §6.1, docs/ARCHITECTURE.md §6).
  organisational: true,
  standards: [],
  explanation: {
    problem:
      '[Platzhalter] Nirgends im Verfahren steht, dass Bewerber Anpassungen anfragen können — etwa mehr Zeit, ein anderes Format oder Unterstützung im Gespräch.',
    affected:
      '[Platzhalter] Menschen, die eine Anpassung bräuchten, gehen davon aus, dass keine möglich ist, und bewerben sich gar nicht erst weiter. Das trifft alle Gruppen mit Anpassungsbedarf.',
    solution:
      '[Platzhalter] Ein klarer Hinweis, dass Anpassungen möglich sind und wie man sie anfragt — inklusive der Zusage, dass die Anfrage keinen Einfluss auf die Bewerbung hat.',
  },
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};
