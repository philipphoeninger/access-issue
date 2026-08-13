// Reusable BITV 2.0 StandardReference constants. Same rule as wcag.ts: only
// the paragraphs a shipped barrier actually cites exist here — do not
// pre-populate.
//
// **A correction to docs/PRD.md §6.2.** That table assigns the barrier
// „Keine Fassung in Leichter Sprache" to „BITV 2.0 § 3". § 3 is titled
// „Anzuwendende Standards" and says nothing about Leichte Sprache; the
// paragraph that requires it — together with Deutsche Gebärdensprache — is
// § 4. Checked against the consolidated text at gesetze-im-internet.de in
// August 2026 (docs/SPEC_v2.md slice 15).
//
// PRD.md §6.2 marks every Normbezug as provisional and sets the precedent for
// exactly this: the donation slider was moved from SC 2.5.1 to 2.5.7 with the
// reasoning that „ein falscher Paragraf ein inhaltlicher Fehler [ist], kein
// Formalismus", because the module explains the legal situation to companies.
// The same reasoning applies here, so the reference below cites § 4 and the
// correction is recorded in PRD.md §6.2 and UX-COPY.md §10.
//
// **What BITV 2.0 does not settle** is whether it binds Elbwerk at all: it
// applies to öffentliche Stellen des Bundes, and Elbwerk is a fictional
// private company. Naming the norm that defines the requirement is still the
// right reference — it is where Leichte Sprache is specified in German law —
// but the explanation prose has to say which obligation actually reaches a
// private firm, and that is an editorial question for WERTE.IT
// (docs/UX-COPY.md §10), not one this file can answer with a constant.
import type { StandardReference } from '../../models/domain.model';

/**
 * No `level`: BITV knows no conformance levels, and the explanation view
 * omits „Stufe {level}" for exactly this case (docs/UX-COPY.md §5.8).
 */
export const BITV_2_0_4: StandardReference = {
  standard: 'BITV_2_0',
  criterion: '§ 4',
  title: 'Erläuterungen in Deutscher Gebärdensprache und Leichter Sprache',
};
