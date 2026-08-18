// Reusable WCAG 2.2 StandardReference constants for the criteria named in
// docs/PRD.md §6.1. Criterion numbers and levels are checked against WCAG 2.2,
// not 2.1 — see PRD.md §6.1 note on the donation-slider correction, which is
// the reason this project insists on 2.2 rather than the more commonly cited
// 2.1.
//
// Only the criteria the application-process scenario needs exist here.
// Add more as later scenarios (CSR campaign, procurement) need them — do not
// pre-populate criteria nothing references yet.
import type { StandardReference } from '../../models/domain.model';

function wcag(
  criterion: string,
  level: NonNullable<StandardReference['level']>,
  title: string,
): StandardReference {
  return { standard: 'WCAG_2_2', criterion, level, title };
}

export const WCAG_1_1_1 = wcag('1.1.1', 'A', 'Nicht-Text-Inhalte');
export const WCAG_1_3_1 = wcag('1.3.1', 'A', 'Info und Beziehungen');
export const WCAG_1_3_2 = wcag('1.3.2', 'A', 'Sinnvolle Reihenfolge');
export const WCAG_1_4_1 = wcag('1.4.1', 'A', 'Benutzung von Farbe');
export const WCAG_1_4_3 = wcag('1.4.3', 'AA', 'Kontrast (Minimum)');
export const WCAG_1_4_5 = wcag('1.4.5', 'AA', 'Bilder eines Textes');
export const WCAG_2_1_1 = wcag('2.1.1', 'A', 'Tastatur');
export const WCAG_2_1_2 = wcag('2.1.2', 'A', 'Keine Tastaturfalle');
export const WCAG_2_2_1 = wcag('2.2.1', 'A', 'Zeiteinteilung anpassbar');
export const WCAG_2_2_2 = wcag('2.2.2', 'A', 'Pausieren, Beenden, Ausblenden');
export const WCAG_2_4_7 = wcag('2.4.7', 'AA', 'Fokus sichtbar');
// 2.5.7 is new in WCAG 2.2 and is the correction docs/PRD.md §6.2 records: the
// donation slider was first filed under 2.5.1 („Zeigergesten"), which is about
// path-based gestures such as swiping. What is dragged must also be operable
// without dragging — that is 2.5.7, and citing the wrong paragraph in a module
// that explains the legal position to companies is a factual error, not a
// formality.
export const WCAG_2_5_7 = wcag('2.5.7', 'AA', 'Ziehbewegungen');
export const WCAG_3_1_5 = wcag('3.1.5', 'AAA', 'Lesbarkeit');
export const WCAG_3_3_1 = wcag('3.3.1', 'A', 'Fehlererkennung');
export const WCAG_3_3_2 = wcag('3.3.2', 'A', 'Beschriftungen oder Anweisungen');
export const WCAG_3_3_3 = wcag('3.3.3', 'AA', 'Vorschläge bei Fehlern');
export const WCAG_4_1_2 = wcag('4.1.2', 'A', 'Name, Rolle, Wert');
export const WCAG_4_1_3 = wcag('4.1.3', 'AA', 'Statusmeldungen');
