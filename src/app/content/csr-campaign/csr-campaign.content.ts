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
// Barrier set and order follow the five sections of docs/PRD.md §6.2. Slices 14
// and 15 build the first two of them; slices 16 to 18 add the other three
// (docs/SPEC_v2.md §5).
import type { Barrier, BarrierPart } from '../../models/domain.model';
import { BITV_2_0_4 } from '../standards/bitv';
import { WCAG_2_1_1, WCAG_2_4_7, WCAG_3_1_5 } from '../standards/wcag';

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

// ── Bereich 2: Texte und Inhalte ─────────────────────────────────────────────

/**
 * The two parts of `SPRACHE_BARRIER`, as named constants rather than as
 * anonymous entries in its `parts` array.
 *
 * **The scenario component reads these, never `parts[0]` and `parts[1]`.**
 * Position is not part of a part's identity — the array order is the panel's
 * reading order and an editor may change it — but a component that indexed
 * into it would silently swap which text variant each checkbox controls, and
 * would keep passing a unit test that derived its keys from the same order.
 * Exporting them makes the mistake unavailable rather than merely discouraged.
 */
export const JARGON_PART: BarrierPart = {
  id: 'jargon',
  urlKey: 'jargon',
  title: 'Kampagnentext ohne Fachjargon',
  standards: [WCAG_3_1_5],
  explanation: {
    problem:
      '[Platzhalter] Der Kampagnentext besteht aus Anglizismen und Marketingfloskeln: „Purpose-driven Impact-Programm", „Stakeholder-Value", „Social-Impact-KPIs". Er sagt nicht, wofür gesammelt wird.',
    affected:
      '[Platzhalter] Wer den Fachjargon nicht kennt, liest den Text zu Ende und weiß danach nicht mehr als vorher. Das trifft Menschen mit kognitiven Einschränkungen und geringer Literalität, Nicht-Muttersprachler — und im Übrigen jede Leserin, die es eilig hat.',
    solution:
      '[Platzhalter] Der Text nennt in kurzen Sätzen und ohne Fachwörter, wer sammelt, wofür und für wen. Was ein Fachwort ersetzt, ist keine Vereinfachung des Inhalts, sondern seine erste Mitteilung.',
  },
  contentStatus: 'placeholder',
};

export const LEICHTE_SPRACHE_PART: BarrierPart = {
  id: 'leichte-sprache',
  urlKey: 'leichte-sprache',
  title: 'Fassung in Leichter Sprache vorhanden',
  // BITV 2.0 § 4, not § 3 as docs/PRD.md §6.2 has it — see the correction
  // recorded in content/standards/bitv.ts.
  standards: [BITV_2_0_4],
  explanation: {
    problem:
      '[Platzhalter] Es gibt keine Fassung in Leichter Sprache. Ein verständlich geschriebener Haupttext ist noch keine: Leichte Sprache ist ein eigenes Regelwerk mit kurzen Sätzen, einem Gedanken pro Satz und Bindestrichen in zusammengesetzten Wörtern.',
    affected:
      '[Platzhalter] Menschen mit Lernbehinderung und Menschen mit geringer Literalität. Für sie entscheidet nicht, ob ein Text gut geschrieben ist, sondern ob es eine Fassung nach diesen Regeln gibt.',
    solution:
      '[Platzhalter] Eine eigenständige Fassung in Leichter Sprache steht auf derselben Seite und ist über eine benannte Schaltfläche erreichbar — nicht auf einer Sonderseite, zu der niemand findet. Geprüft wird sie von einer Fachstelle, nicht von der Redaktion, die den Haupttext geschrieben hat.',
  },
  contentStatus: 'placeholder',
};

/**
 * The first combined barrier that ships (docs/SPEC_v2.md slice 15). Two parts,
 * two norms, two groups of people — and the reason they are coupled is the
 * lesson (docs/PRD.md §6.2, docs/UX-COPY.md §9.2): repairing only `jargon`
 * produces comprehensible German, which is a real improvement for many and
 * still too hard for people with a learning disability; repairing only
 * `leichte-sprache` offers an easy-language version as a side door next to a
 * main text nobody can read. Neither half is the other's substitute, and the
 * explanation has to name both.
 *
 * The parent carries both parts' references rather than a third of its own:
 * the combined barrier *is* the two parts, and a top-level explanation citing
 * only one of them would quietly rank them.
 *
 * `parts` are content in their own right — the panel gives each a checkbox and
 * the explanation view renders each one's prose and standards from `part.*`,
 * never from the parent (frame/explanation-view). Their `title`s are the panel
 * labels of docs/UX-COPY.md §5.6, section „Bereich Texte und Inhalte".
 */
export const SPRACHE_BARRIER: Barrier = {
  // Same `id` and `urlKey` as the application process's language barrier, and
  // that is fine in both cases, for the same reason: both are scoped by the
  // scenario that declares them. `frei` is parsed against one scenario's
  // barriers (core/url-state.ts), and every lookup by id takes a scenario path
  // first (ScenarioRegistry.getBarrier). Renaming either to something like
  // `csr-sprache` would put scaffolding into a value that appears on module
  // slides (CLAUDE.md rule 11).
  //
  // This barrier is the first id that exists twice, so it is what made the one
  // structure that was *not* scoped visible: content/axe-rule-fixtures.ts was
  // a flat map on `Barrier.id`. It is keyed by scenario path now, and
  // content/data-contract.spec.ts asserts both directions of that mapping.
  id: 'sprache',
  urlKey: 'sprache',
  title: 'Sprache',
  shortTitle: 'Texte verständlich',
  categories: ['cognitive'],
  affectedGroups: [
    'kognitive Einschränkungen',
    'geringe Literalität',
    'Nicht-Muttersprachler',
    'Menschen mit Lernbehinderung',
  ],
  responsibleArea: 'kommunikation',
  groupId: 'texte',
  organisational: false,
  standards: [WCAG_3_1_5, BITV_2_0_4],
  explanation: {
    problem:
      '[Platzhalter] Der Kampagnentext steht in Marketingjargon voller Anglizismen, und es gibt keine Fassung in Leichter Sprache. Beides zusammen schließt eine Kampagne, die von Inklusion handelt, von denen aus, um die es in ihr geht.',
    affected:
      '[Platzhalter] Zwei Gruppen, die nicht dieselbe sind: Wer den Jargon nicht entschlüsselt — mit kognitiver Einschränkung, geringer Literalität oder als Nicht-Muttersprachler — braucht verständliches Deutsch. Wer eine Lernbehinderung hat, braucht Leichte Sprache, ein eigenes Regelwerk mit eigenen Prüfkriterien.',
    solution:
      '[Platzhalter] Der Haupttext ist in verständlichem Deutsch geschrieben, und daneben steht eine eigenständige Fassung in Leichter Sprache, die über eine benannte Schaltfläche erreichbar ist. Verständliches Deutsch ersetzt Leichte Sprache nicht, und Leichte Sprache entschuldigt keinen unverständlichen Haupttext.',
  },
  // Reading order in the panel. The components that render the two variants
  // read the constants above by name, so this order is free to change.
  parts: [JARGON_PART, LEICHTE_SPRACHE_PART],
  // Manual: no automated tool judges whether a text is comprehensible, and
  // none checks whether an easy-language version exists (docs/TESTING.md §2,
  // §16). What the suite can prove is that the two variants differ, that the
  // disclosure is a real one, and that the partial states behave — the
  // editorial claim itself is the one thing this project cannot test
  // (docs/UX-COPY.md §10).
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};
