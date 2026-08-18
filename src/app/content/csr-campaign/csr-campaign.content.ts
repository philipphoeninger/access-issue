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
// Barrier set and order follow the five sections of docs/PRD.md §6.2, and with
// slice 18 all five of them are here (docs/SPEC_v2.md §5).
import type { Barrier, BarrierPart } from '../../models/domain.model';
import { BITV_2_0_4 } from '../standards/bitv';
import {
  WCAG_1_1_1,
  WCAG_1_3_1,
  WCAG_1_4_3,
  WCAG_2_1_1,
  WCAG_2_2_1,
  WCAG_2_2_2,
  WCAG_2_4_7,
  WCAG_2_5_7,
  WCAG_3_1_5,
  WCAG_4_1_2,
  WCAG_4_1_3,
} from '../standards/wcag';

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
  organisational: false,
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
  organisational: false,
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

// ── Bereich 3: Medien ────────────────────────────────────────────────────────
//
// Die drei Barrieren der nachgebildeten Social-Media-Einbettung
// (docs/UX-COPY.md §9.3 bis §9.5, docs/SPEC_v2.md slice 16). Zwei von ihnen
// sieht axe — nach dem Bewerbungsprozess, wo fast alles Handarbeit war, das
// erste Mal die Mehrheit eines Bereichs.

export const ALT_BARRIER: Barrier = {
  id: 'alt',
  urlKey: 'alt',
  title: 'Alternativtexte',
  shortTitle: 'Bilder mit Alternativtexten',
  categories: ['visual'],
  affectedGroups: ['blinde und sehbehinderte Personen'],
  responsibleArea: 'kommunikation',
  groupId: 'medien',
  organisational: false,
  standards: [WCAG_1_1_1],
  explanation: {
    problem:
      '[Platzhalter] Die Bilder der Kampagnenseite tragen keine Textalternative: die drei Bilder der Social-Media-Einbettung ebenso wenig wie die Zeichnung des Veranstaltungseingangs. Was auf ihnen zu sehen ist — die gestrichene Wand, die Scheckübergabe, der Bastelnachmittag, die Stufen vor der Tür — steht nirgendwo als Text.',
    affected:
      '[Platzhalter] Blinde und sehbehinderte Personen hören an dieser Stelle den Dateinamen oder gar nichts. Die Kampagne zeigt ihre Wirkung in Bildern; wer sie nicht sieht, erfährt von dieser Wirkung nichts. Bei der Zeichnung des Eingangs kommt hinzu, dass sie die einzige Stelle ist, an der die drei Stufen überhaupt vorkommen.',
    solution:
      '[Platzhalter] Jedes Bild trägt einen Alternativtext, der beschreibt, was zu sehen ist, statt es zu deuten. „Zwölf Mitarbeitende stehen mit Malerrollen vor der frisch gestrichenen Wand" sagt, was auf dem Bild ist; „Teamgeist in Aktion" sagt es nicht.',
  },
  // **Diese Barriere gilt für die redaktionellen Bilder der Seite**: die drei
  // Beiträge der Einbettung und, seit Slice 17, die Zeichnung des
  // Veranstaltungseingangs (docs/SPEC_v2.md §4.2: „Both variants carry real
  // alternative text … when the alt-text barrier is resolved"). Der Erklärtext
  // oben zählt sie einzeln auf, und das ist Absicht.
  //
  // **Sie gilt nicht für die Balkengrafik des Spendenstands.** Deren fehlende
  // Textalternative ist die Barriere `fortschritt` (Slice 18, docs/UX-COPY.md
  // §9.7), und sie gehört dorthin: Was dort fehlt, ist nicht die Beschreibung
  // eines Bildes, sondern eine Zahl, die es nur als Bild gibt — behoben wird sie
  // durch sichtbaren Text neben dem Balken, nicht durch ein `alt`. Zwei
  // Barrieren, zwei Reparaturen, und deshalb zwei Einträge im Panel. Wer die
  // Beschriftung „Bilder mit Alternativtexten" wörtlich nimmt, prüfe sie gegen
  // diesen Zuschnitt — der Fall ist in docs/UX-COPY.md §10 vermerkt.
  //
  // Der Zuschnitt ist nicht kosmetisch. Läge der fehlende Alternativtext der
  // Zeichnung beim Teil `zugang`, wäre dieser Teil ein Verstoß gegen WCAG 1.1.1
  // — und der Erklärungsbereich behauptete zugleich, er verstoße gegen keine
  // Norm (docs/UX-COPY.md §5.8). Der Teil `zugang` trägt deshalb, was er
  // wirklich ist: das Verschweigen des Zugangs und die fehlende Rampe. Der
  // fehlende Alternativtext trägt hier, wo er hingehört.
  //
  // axe sieht ein `img` ohne `alt` (Regel `image-alt`, content/axe-rule-
  // fixtures.ts). Eine der wenigen Barrieren dieses Projekts, bei der ein
  // Werkzeug den Befund selbst erhebt statt ihn nur zu bestätigen. Die
  // Eingangszeichnung ist davon ausgenommen, weil sie ein eingebettetes `svg`
  // ist und kein `img`: axe prüft dort nur, was ein `role="img"` trägt.
  automatedDetection: 'axe',
  contentStatus: 'placeholder',
};

export const EMOJI_BARRIER: Barrier = {
  id: 'emoji',
  urlKey: 'emoji',
  title: 'Emojis',
  shortTitle: 'Emojis ergänzen den Text, statt ihn zu ersetzen',
  categories: ['visual', 'cognitive'],
  affectedGroups: ['blinde Personen', 'kognitive Einschränkungen'],
  responsibleArea: 'kommunikation',
  groupId: 'medien',
  organisational: false,
  standards: [WCAG_1_1_1],
  explanation: {
    problem:
      '[Platzhalter] Im Beitragstext tragen Emojis die Information, statt sie zu begleiten: die Zahl 80 steht als Ziffern-Emojis, der Aufruf als zeigende Hand, die Zusage von Inklusion als Rollstuhlsymbol. Ein Screenreader liest daraus eine Kette von Symbolnamen.',
    affected:
      '[Platzhalter] Blinde Personen hören „Ziffer acht, Ziffer null, Prozent" statt „80 Prozent" — und das ist noch der verständliche Teil. Für Menschen mit kognitiven Einschränkungen zerfällt der Satz in Zeichen, die einzeln geraten werden müssen.',
    solution:
      '[Platzhalter] Der Beitrag steht als vollständiger Satz. Ein schmückendes Emoji darf bleiben — die Lehre ist nicht „Emojis sind schlecht", sondern „Emojis dürfen keine Information tragen".',
  },
  // Manual: axe liest Emojis als Text und hat keinen Begriff davon, dass ein
  // Zeichen eine Zahl vertritt (docs/TESTING.md §2). Prüfbar ist, dass die
  // behobene Fassung genau ein Emoji trägt und die Zahl ausschreibt.
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};

export const KONTRAST_BARRIER: Barrier = {
  id: 'kontrast',
  urlKey: 'kontrast',
  title: 'Kontrast',
  shortTitle: 'Text auf Bildern gut lesbar',
  categories: ['visual'],
  affectedGroups: ['Sehbehinderung', 'Farbfehlsichtige', 'ältere Nutzer'],
  responsibleArea: 'kommunikation',
  groupId: 'medien',
  organisational: false,
  standards: [WCAG_1_4_3],
  explanation: {
    problem:
      '[Platzhalter] Die Bildunterschriften der Einbettung stehen in einem hellen Grau, das auf seinem Untergrund ein Kontrastverhältnis von 2,92:1 erreicht. Gefordert sind 4,5:1.',
    affected:
      '[Platzhalter] Menschen mit Sehbehinderung, Farbfehlsichtige und ältere Nutzer — und außerdem jede Person, die das Gerät bei Sonnenlicht in der Hand hält. Kontrast ist die Barriere, die am häufigsten aus einer rein ästhetischen Entscheidung entsteht.',
    solution:
      '[Platzhalter] Der Text steht auf einer eigenen, deckenden Fläche und erreicht dort 11,48:1. Ein Schriftzug direkt auf einem Bild ist nie verlässlich lesbar: Was darunter liegt, wechselt von Bild zu Bild.',
  },
  // axe rechnet Vordergrund gegen Hintergrund und meldet `color-contrast`
  // (content/axe-rule-fixtures.ts). Dass es das kann, hängt daran, dass der
  // Text auf einer deckenden Fläche steht und nicht auf dem Bild —
  // scenarios/csr-campaign/campaign-media/ erklärt, warum das so gebaut ist.
  automatedDetection: 'axe',
  contentStatus: 'placeholder',
};

// ── Bereich 4: Event und Podiumsdiskussion ───────────────────────────────────
//
// Die dreiteilige kombinierte Barriere (docs/UX-COPY.md §9.6, docs/PRD.md §6.2
// Bereich 4, docs/SPEC_v2.md Slice 17) — die stärkste des Werkzeugs, und die
// einzige, in der eine physische Barriere vorkommt.
//
// **Zwei der drei Teile verstoßen gegen kein Erfolgskriterium.** Genau dafür ist
// `organisational` da, und dafür trägt es das Feld seit diesem Schnitt auch am
// Teil (models/domain.model.ts): Ein Teil erbt die Einordnung des Elternteils
// nicht, sonst müsste diese Barriere entweder für `dolmetschung` und `zugang`
// einen Paragrafen erfinden oder ihn `einladung` wegnehmen.

/**
 * Teil 1 — die Einladung nur als PDF-Download.
 *
 * Der einzige technische Teil dieser Barriere. Das verlinkte Dokument ist echt
 * und absichtlich ungetaggt (assets-src/simulation/einladung.py), so wie das
 * Dokument der Barriere `pdf` im Bewerbungsprozess: Ein Downloadlink, der ins
 * Leere zeigt, führt die Barriere nicht vor, sondern nur einen Fehler 404.
 */
export const EINLADUNG_PART: BarrierPart = {
  id: 'einladung',
  urlKey: 'einladung',
  title: 'Einladung als Text auf der Seite',
  organisational: false,
  standards: [WCAG_1_3_1, WCAG_4_1_2],
  explanation: {
    problem:
      '[Platzhalter] Programm, Uhrzeiten und Ablauf der Podiumsdiskussion stehen ausschließlich in einem PDF, das erst heruntergeladen werden muss. Auf der Seite selbst steht nur der Satz, man möge die Einzelheiten der Einladung entnehmen.',
    affected:
      '[Platzhalter] Blinde und sehbehinderte Personen, weil ein ungetaggtes PDF keine Struktur hat, an der ein Screenreader entlanglesen könnte. Und alle, die die Seite unterwegs auf dem Telefon lesen: Ein Dokument im A4-Format ist dort kaum zu bedienen.',
    solution:
      '[Platzhalter] Dieselben Angaben stehen als Text auf der Seite, mit einer Überschrift und einer Liste der Programmpunkte. Das PDF bleibt daneben verfügbar — barrierefrei heißt „auch als Text", nicht „ohne Dokument".',
  },
  contentStatus: 'placeholder',
};

/**
 * Teil 2 — keine Gebärdensprachdolmetschung.
 *
 * Organisatorisch, mit leerem `standards`-Array: Die Seite ist an dieser Stelle
 * technisch einwandfrei. Sie verschweigt nichts und zeichnet nichts falsch aus
 * — es gibt schlicht nichts anzubieten, weil niemand eine Dolmetschung bestellt
 * hat. WCAG 1.2.6 („Gebärdensprache") gilt für aufgezeichnete Videoinhalte,
 * nicht für eine Präsenzveranstaltung, und wäre hier der falsche Paragraf
 * (docs/PRD.md §6.2 zur Sorgfalt bei Normbezügen).
 */
export const DOLMETSCHUNG_PART: BarrierPart = {
  id: 'dolmetschung',
  urlKey: 'dolmetschung',
  title: 'Gebärdensprachdolmetschung angeboten',
  organisational: true,
  standards: [],
  explanation: {
    problem:
      '[Platzhalter] Für die Podiumsdiskussion ist keine Gebärdensprachdolmetschung vorgesehen, und die Seite sagt dazu nichts. Wer nachfragen möchte, findet niemanden, den er fragen könnte.',
    affected:
      '[Platzhalter] Gehörlose und schwerhörige Personen. Sie können sich anmelden, hinkommen und im Saal sitzen — und von einer Diskussion über Inklusion kein Wort verstehen.',
    solution:
      '[Platzhalter] Die Veranstaltung wird durchgehend in Deutsche Gebärdensprache gedolmetscht, eine Schriftdolmetschung läuft auf einer Leinwand mit, und beides steht in der Ankündigung. Gebucht wird es bei der Planung, nicht auf Nachfrage: Wer erst nachfragen muss, kommt nicht.',
  },
  contentStatus: 'placeholder',
};

/**
 * Teil 3 — der Zugang, und die einzige physische Barriere des Werkzeugs.
 *
 * **Die digitale Barriere ist, dass die Seite den Zugang verschweigt; die
 * physische ist, dass es keine Rampe gibt** (docs/SPEC_v2.md §4.3). Der Haken
 * behebt beides auf einmal, und der Erklärtext muss diese Vereinfachung
 * benennen statt sie zu verstecken — sonst lehrt das Werkzeug, ein Satz auf
 * einer Webseite ersetze eine Rampe.
 *
 * Organisatorisch mit leerem `standards`-Array, und das ist hier die
 * anspruchsvollste Aussage des ganzen Werkzeugs: Die Seite erfüllt jedes
 * Erfolgskriterium und schließt trotzdem Menschen aus. Das **Alternativtext**
 * der Zeichnung gehört ausdrücklich nicht zu diesem Teil, sondern zur Barriere
 * `alt` (siehe dort und scenarios/csr-campaign/campaign-event/) — sonst wäre der
 * Teil eben doch ein Normverstoß, und der Erklärungsbereich behauptete das
 * Gegenteil.
 */
export const ZUGANG_PART: BarrierPart = {
  id: 'zugang',
  urlKey: 'zugang',
  title: 'Stufenloser Zugang und Angabe dazu',
  organisational: true,
  standards: [],
  explanation: {
    problem:
      '[Platzhalter] Der Eingang des Nachbarschaftstreffs hat drei Stufen und keinen Handlauf. Auf der Seite steht dazu nichts — weder dass es Stufen gibt, noch an wen man sich wenden könnte. Wer im Rollstuhl sitzt, erfährt es vor Ort.',
    affected:
      '[Platzhalter] Rollstuhlnutzende, Menschen mit Gehbehinderung, Eltern mit Kinderwagen. Betroffen ist auch, wer wegen der fehlenden Angabe gar nicht erst kommt: Eine Veranstaltung, über deren Zugang nichts dasteht, ist für viele bereits abgesagt.',
    solution:
      '[Platzhalter] Eine Rampe mit Handlauf führt neben den Stufen zur Tür, und die Seite benennt den Zugang: stufenlos, barrierefreie Toilette, induktive Höranlage, reservierte Plätze — und eine Person mit Namen und Telefonnummer für alles, was dort nicht steht. Zwei Dinge auf einmal, und sie sind nicht dasselbe: Die digitale Barriere ist, dass die Seite den Zugang verschweigt; die physische ist, dass es keine Rampe gibt. Ein Satz auf einer Webseite baut keine Rampe — aber eine Kampagne über Inklusion trägt für beides Verantwortung.',
  },
  contentStatus: 'placeholder',
};

/**
 * Die dreiteilige kombinierte Barriere des Event-Abschnitts.
 *
 * **Drei Teile, drei Behinderungsarten, keine Teillösung hilft den jeweils
 * anderen** (docs/PRD.md §6.2, docs/UX-COPY.md §9.6). Wer die Einladung als Text
 * bereitstellt, aber die Stufen lässt, hat eine gut lesbare Einladung zu einer
 * Veranstaltung, die man nicht betreten kann; wer eine Rampe baut, aber nicht
 * dolmetschen lässt, lädt gehörlose Menschen in einen Raum ein, in dem sie
 * nichts verstehen. Deshalb sind es drei Teile einer Barriere und nicht drei
 * Barrieren: Das Panel zeigt sie unter einem Elternteil, der erst behoben ist,
 * wenn alle drei es sind.
 *
 * `standards` sind die des Teils `einladung` — die einzigen, die diese Barriere
 * überhaupt bricht. Der Elternteil ist damit nicht `organisational`, obwohl zwei
 * Drittel von ihm es sind; die Einordnung gehört an den Teil, und der
 * Erklärtext des Elternteils sagt ausdrücklich, dass zwei der drei Teile gegen
 * kein Kriterium verstoßen.
 *
 * `responsibleArea: 'csr'` ist der erste Gebrauch dieses Bereichs überhaupt
 * (docs/UX-COPY.md §5.6 `area.csr`, models/domain.model.ts). Er steht am
 * Elternteil, nicht am Teil: Für `einladung` nennt docs/UX-COPY.md §5.6
 * „Kommunikation", aber ein Bereich ist eine Eigenschaft der Barriere und nicht
 * der Hälfte, die fehlt — kein View gibt für einen Teil einen Bereich aus.
 */
export const EVENT_BARRIER: Barrier = {
  id: 'event',
  urlKey: 'event',
  title: 'Event',
  shortTitle: 'Veranstaltung für alle zugänglich',
  categories: ['visual', 'auditory', 'motor', 'situational'],
  affectedGroups: [
    'blinde und sehbehinderte Personen',
    'mobile Nutzung',
    'gehörlose Personen',
    'Rollstuhlnutzende',
    'Menschen mit Gehbehinderung',
    'Eltern mit Kinderwagen',
  ],
  responsibleArea: 'csr',
  groupId: 'event',
  organisational: false,
  standards: [WCAG_1_3_1, WCAG_4_1_2],
  explanation: {
    problem:
      '[Platzhalter] Die Kampagne lädt zu einer Podiumsdiskussion über Inklusion ein und schließt dabei drei Gruppen aus: Die Einladung gibt es nur als PDF zum Herunterladen, eine Gebärdensprachdolmetschung ist nicht vorgesehen, und der Eingang hat drei Stufen, ohne dass die Seite das erwähnt.',
    affected:
      '[Platzhalter] Drei Gruppen, und was der einen hilft, hilft den anderen nicht: blinde und sehbehinderte Personen sowie alle, die die Seite unterwegs lesen, scheitern am PDF; gehörlose Personen sitzen in einem Saal, in dem sie nichts verstehen; Rollstuhlnutzende, Menschen mit Gehbehinderung und Eltern mit Kinderwagen stehen vor drei Stufen.',
    solution:
      '[Platzhalter] Die Einladung steht als Text auf der Seite und das PDF bleibt daneben; die Veranstaltung wird gedolmetscht, und die Ankündigung sagt es; der Eingang hat eine Rampe, und die Seite benennt den Zugang mit einer Ansprechperson. Nur der erste Teil verstößt gegen ein Erfolgskriterium. Die beiden anderen verstoßen gegen keines — und sind trotzdem der Grund, warum jemand nicht kommt.',
  },
  // Reihenfolge im Panel. Die Komponente liest die Konstanten oben beim Namen,
  // diese Reihenfolge ist also frei — siehe SPRACHE_BARRIER.
  parts: [EINLADUNG_PART, DOLMETSCHUNG_PART, ZUGANG_PART],
  // Manuell, und zwar für alle drei Teile. Kein Prüfwerkzeug weiß, dass eine
  // Veranstaltung stattfindet, geschweige denn ob dort gedolmetscht wird; und
  // das PDF ist für axe ein Link wie jeder andere (docs/TESTING.md §2). Prüfbar
  // ist, was auf der Seite steht und was nicht — das tun die Komponenten- und
  // die Playwright-Prüfung.
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};

// ── Bereich 5: Spendenaufruf ─────────────────────────────────────────────────
//
// Die vier Barrieren des letzten Abschnitts (docs/UX-COPY.md §9.7 bis §9.10,
// docs/PRD.md §6.2 Bereich 5, docs/SPEC_v2.md Slice 18). Sie stammen als
// einzige nicht aus dem Modul, sondern aus der Konzeption dieses Werkzeugs, und
// sie bleiben, weil sie Barrierearten abdecken, die sonst nirgends vorkämen:
// **Bewegung, Zeitdruck, Zeigergesten, Live-Aktualisierung**. Alle vier gehören
// der IT — der einzige Abschnitt der Kampagne, in dem kein redaktioneller und
// kein organisatorischer Fehler steckt, sondern vier Entscheidungen beim Bauen.
//
// Zwei von ihnen sind zeitabhängig, und das macht sie zu den einzigen des
// Projekts, die überhaupt etwas tun, während niemand sie anfasst: Der Countdown
// zählt, das Karussell wechselt. Beide werden in der Prüfung über die Uhr
// gesteuert und nie über Wartezeiten (docs/TESTING.md §10).

/**
 * Der Spendenstand als reine Grafik.
 *
 * **Muster B** (docs/ARCHITECTURE.md §11): Dieselbe Zahl in beiden Zuständen,
 * einmal ausschließlich als Beschriftung *in* der Balkengrafik, einmal
 * zusätzlich als Text daneben — und dann trägt die Grafik `aria-hidden`, weil
 * ihre Information vollständig danebensteht. Dieselbe Form wie bei der
 * Textgrafik des Bewerbungsprozesses (docs/UX-COPY.md §8.6), und aus demselben
 * Grund die zweite Barriere der Kampagne, die axe von sich aus findet: Ein
 * `img` ohne `alt` ist `image-alt` (content/axe-rule-fixtures.ts).
 *
 * **Kein `role="progressbar"`** (docs/UX-COPY.md §9.7). Der behobene Zustand
 * ist sichtbarer Text neben dem Balken, nicht ein Balken mit ARIA-Werten: Das
 * ist der einfachere und der verlässlichere Weg, und er hilft außerdem den
 * Nutzern, denen ein Screenreader gar nichts vorliest.
 */
export const FORTSCHRITT_BARRIER: Barrier = {
  id: 'fortschritt',
  urlKey: 'fortschritt',
  title: 'Fortschrittsbalken',
  shortTitle: 'Spendenstand als Text lesbar',
  categories: ['visual'],
  affectedGroups: ['blinde und sehbehinderte Personen'],
  responsibleArea: 'it',
  groupId: 'spende',
  organisational: false,
  standards: [WCAG_1_1_1, WCAG_4_1_2],
  explanation: {
    problem:
      '[Platzhalter] Der Spendenstand steht ausschließlich in einer Balkengrafik: Der Balken zeigt, wie weit die Aktion gekommen ist, und der Prozentwert steht als Beschriftung innerhalb des Bildes. Das Bild trägt keine Textalternative.',
    affected:
      '[Platzhalter] Blinde und sehbehinderte Personen erfahren den Spendenstand nicht — und der Spendenstand ist das Argument des ganzen Abschnitts. Wer nicht weiß, dass 3.600 € fehlen, hat keinen Grund zu spenden.',
    solution:
      '[Platzhalter] Derselbe Stand steht als Text neben dem Balken: „8.400 € von 12.000 € erreicht — 70 Prozent" und „Noch 3.600 € bis zum Ziel". Der Balken bleibt als Bebilderung stehen und wird für Screenreader ausgeblendet, weil daneben schon alles steht, was er sagt.',
  },
  // axe sieht ein `img` ohne `alt` (Regel `image-alt`). Weil die Barriere `alt`
  // des Medienabschnitts dieselbe Regel auslöst, prüft Lauf 2 diese hier
  // ausdrücklich **auf den Abschnitt eingegrenzt** (e2e/csr-campaign.spec.ts) —
  // sonst behauptete jede der beiden, die Fundstelle der anderen sei ihre
  // eigene.
  automatedDetection: 'axe',
  contentStatus: 'placeholder',
};

/**
 * Der Countdown ohne geeignete Live-Region.
 *
 * **Muster B**: Dieselben Zahlen, dieselbe Aktualisierung — was fehlt, ist die
 * Ansage. Behoben trägt der Countdown eine `aria-live="polite"`-Region, und die
 * spricht **im Minutentakt**, während die sichtbare Anzeige weiterläuft.
 *
 * **Der Unterschied zwischen „hat eine Live-Region" und „hat die richtige
 * Frequenz" ist hier der eigentliche Lehrinhalt** (docs/UX-COPY.md §9.8). Er ist
 * zugleich technisch zwingend: Der behobene Countdown ist die einzige
 * Live-Region außerhalb des Rahmens (docs/ARCHITECTURE.md §12.2). Spräche sie
 * sekündlich, redete sie über jede Umschaltbestätigung des Panels hinweg
 * (docs/UX-COPY.md §5.7) — und beide Ansagen wären wertlos.
 */
export const COUNTDOWN_BARRIER: Barrier = {
  id: 'countdown',
  urlKey: 'countdown',
  title: 'Countdown',
  shortTitle: 'Countdown wird vorgelesen',
  categories: ['visual', 'cognitive'],
  affectedGroups: [
    'blinde und sehbehinderte Personen',
    'kognitive Einschränkungen',
    'Screenreader-Nutzer',
  ],
  responsibleArea: 'it',
  groupId: 'spende',
  organisational: false,
  standards: [WCAG_4_1_3, WCAG_2_2_1],
  explanation: {
    problem:
      '[Platzhalter] Der Countdown zählt die verbleibende Zeit in Zahlenblöcken herunter und aktualisiert sie fortlaufend. Für einen Screenreader ändert sich dabei nichts: Es gibt keine Live-Region, also wird die Änderung nirgends angesagt.',
    affected:
      '[Platzhalter] Blinde und sehbehinderte Personen erfahren nicht, dass die Aktion überhaupt befristet ist. Für Menschen mit kognitiven Einschränkungen kommt hinzu, dass eine Zeitangabe, die man nicht mitbekommt, den Zeitdruck nicht kleiner macht, sondern nur unsichtbar.',
    solution:
      '[Platzhalter] Die verbleibende Zeit steht in einer Live-Region, die im Minutentakt ansagt, wie lange die Aktion noch läuft — nicht sekündlich. Eine Live-Region einzubauen genügt nicht: Eine, die jede Sekunde spricht, redet über jede andere Ansage hinweg und macht beide unbrauchbar.',
  },
  // Manuell. axe prüft, ob ein `aria-live`-Wert gültig ist, nicht ob es eine
  // Live-Region gibt, wo eine hingehört — und über die *Frequenz* einer Ansage
  // urteilt gar kein Werkzeug (docs/TESTING.md §2). Prüfbar ist beides über die
  // gesteuerte Uhr: dass die Region existiert und dass ihr Text sich pro Minute
  // ändert und nicht pro Sekunde (docs/TESTING.md §10).
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};

/**
 * Das Spendenformular mit reinem Ziehregler.
 *
 * **Muster A**: Zwei ausgeschriebene Fassungen desselben Formulars. Aktiv gibt
 * es einen Regler, den man ziehen muss — nicht fokussierbar, ohne Beschriftung,
 * ohne Zahlenwert als Text. Behoben stehen Voreinstellungs-Schaltflächen und ein
 * beschriftetes Zahlenfeld daneben, und **der Regler bleibt**: Er ist dann ein
 * echtes `input[type=range]`, beschriftet und mit den Pfeiltasten bedienbar.
 *
 * „Auch ohne Ziehen bedienbar" ist der Wortlaut von SC 2.5.7, und er ist der
 * Grund, warum der Regler nicht verschwindet. Wer ihn wegnimmt, repariert die
 * Barriere, indem er die Funktion entfernt — und führt damit vor, dass
 * Barrierefreiheit Möglichkeiten kostet. Genau das ist die Vorstellung, gegen
 * die das Modul anschreibt.
 */
export const SLIDER_BARRIER: Barrier = {
  id: 'slider',
  urlKey: 'slider',
  title: 'Spenden-Slider',
  shortTitle: 'Betrag auch als Eingabefeld',
  categories: ['motor', 'visual'],
  affectedGroups: [
    'motorische Einschränkungen',
    'Tastatur- und Screenreader-Nutzer',
    'Menschen mit Tremor',
  ],
  responsibleArea: 'it',
  groupId: 'spende',
  organisational: false,
  standards: [WCAG_2_1_1, WCAG_2_5_7],
  explanation: {
    problem:
      '[Platzhalter] Der Spendenbetrag lässt sich ausschließlich durch Ziehen eines Reglers einstellen. Der Regler steht nicht in der Tab-Reihenfolge, trägt keine Beschriftung, und der eingestellte Betrag steht nirgends als Zahl.',
    affected:
      '[Platzhalter] Wer nicht zielgenau ziehen kann, kann nicht spenden: Menschen mit motorischen Einschränkungen, mit Tremor, mit einer Handbedienung statt einer Maus. Screenreader-Nutzer erfahren nicht einmal, dass hier ein Betrag einzustellen wäre.',
    solution:
      '[Platzhalter] Neben dem Regler stehen Schaltflächen für die gängigen Beträge und ein beschriftetes Zahlenfeld für jeden anderen. Der Regler bleibt und wird mit den Pfeiltasten bedienbar — was per Ziehen geht, muss auch ohne Ziehen gehen, und nicht: was per Ziehen ging, fällt weg.',
  },
  // Manuell. Ein `div`, das auf `pointermove` reagiert, ist für axe ein
  // Textblock (docs/TESTING.md §2) — dieselbe Lage wie bei der Barriere
  // `tastatur` des Bewerbungsprozesses. Prüfbar ist es mit echten Tastenereig-
  // nissen: Der behobene Regler ändert seinen Wert mit den Pfeiltasten, der
  // aktive ist mit `Tab` überhaupt nicht zu erreichen (docs/TESTING.md §9).
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};

/**
 * Das automatisch wechselnde Testimonial-Karussell.
 *
 * **Muster A**: Aktiv wechselt es alle vier Sekunden und hat keine
 * Pause-Schaltfläche. Behoben steht die Pause-Schaltfläche als erstes Element
 * der Gruppe, es gibt eine Positionsanzeige, und der Wechsel hält bei Fokus oder
 * Zeigerkontakt an.
 *
 * **Die einzige Barriere des Werkzeugs, die eine Systemeinstellung ganz
 * abschaltet** (CLAUDE.md Regel 9, docs/ARCHITECTURE.md §5.5): Bei
 * `prefers-reduced-motion` wechselt nichts automatisch, und die
 * Simulationsleiste sagt, was ohne die Einstellung zu sehen wäre. Vestibuläre
 * Auslöser sind keine Lerngelegenheit — und ein Werkzeug über Barrierefreiheit,
 * das jemandem übel macht, hat sein Thema verfehlt.
 */
export const KARUSSELL_BARRIER: Barrier = {
  id: 'karussell',
  urlKey: 'karussell',
  title: 'Karussell',
  shortTitle: 'Karussell mit Pause-Schaltfläche',
  categories: ['cognitive', 'situational', 'visual'],
  affectedGroups: [
    'kognitive Einschränkungen',
    'Aufmerksamkeitsstörungen',
    'vestibuläre Störungen',
    'langsam lesende Personen',
  ],
  responsibleArea: 'it',
  groupId: 'spende',
  organisational: false,
  standards: [WCAG_2_2_2],
  explanation: {
    problem:
      '[Platzhalter] Die Zitate aus dem Stadtteil wechseln alle vier Sekunden von selbst. Es gibt keine Schaltfläche, die das anhält, keine Anzeige, an welcher Stelle man ist, und der Wechsel hält auch dann nicht an, wenn jemand gerade liest.',
    affected:
      '[Platzhalter] Wer langsamer liest, liest nie zu Ende. Für Menschen mit Aufmerksamkeitsstörungen zieht die Bewegung den Blick von allem anderen auf der Seite ab, und für Menschen mit vestibulären Störungen ist automatische Bewegung nicht anstrengend, sondern körperlich unangenehm.',
    solution:
      '[Platzhalter] Eine Pause-Schaltfläche steht vor den Zitaten, eine Positionsanzeige sagt, wo man ist, und der Wechsel hält an, sobald der Fokus oder der Zeiger im Karussell steht. Fordert das System reduzierte Bewegung an, wechselt von vornherein nichts von selbst.',
  },
  // Manuell. Dass etwas sich bewegt, sieht kein Prüfwerkzeug, und ob eine
  // Pause-Schaltfläche vorhanden ist, kann axe nicht von einer beliebigen
  // Schaltfläche unterscheiden (docs/TESTING.md §2). Prüfbar ist es über die
  // gesteuerte Uhr, in beide Richtungen: dass es wechselt, wenn es soll, und
  // dass es nicht wechselt, wenn die Systemeinstellung es verbietet
  // (docs/TESTING.md §10, §11).
  automatedDetection: 'manual',
  contentStatus: 'placeholder',
};
