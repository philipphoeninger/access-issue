#!/usr/bin/env python3
"""Quelle des PDFs zur Barriere `pdf` in Schritt 3 des Bewerbungsprozesses.

ACHTUNG: Diese Datei wird NICHT ausgeliefert. Ausgeliefert wird das daraus
erzeugte Dokument
public/simulation/Stellenausschreibung_2026_IT-Projektmanagement_final_v3.pdf.

Neu erzeugen nach jeder Textänderung, aus dem Projektwurzelverzeichnis:

    python3 assets-src/simulation/stellenausschreibung.py

Warum das Dokument absichtlich schlecht gemacht ist. Es ist die Datei, auf die
der Downloadlink der aktiven Barriere zeigt, und es hat genau die Eigenschaften,
die docs/PRD.md §6.1 der Barriere zuschreibt: keine Tag-Struktur, keine
Lesereihenfolge, keine Überschriftenauszeichnung, keine Dokumentsprache — nur
absolut positionierte Textzeilen. Ein Screenreader findet darin keine Struktur,
weil keine da ist. Das ist kein Versäumnis, sondern der Zweck; ein sauber
getaggtes PDF wäre hier das Gegenteil der Aussage. Erzeugt wird es von
untagged_pdf.py, das sich dieses Werkzeug mit einladung.py teilt — hier stehen
nur der Text und seine Begründung.

Der Textkörper ist eine Kopie der Fassung aus docs/UX-COPY.md §8.3 (aktive
Sprachbarriere) samt den Angaben aus §8.1 und §8.6. Ändert sich dort etwas,
gehört das Dokument neu erzeugt — sonst behauptet der Downloadlink etwas
anderes als die Seite daneben.

Offener Punkt (docs/SPEC_v1.md §4.2, docs/PRD.md §10): Ob für die
Veröffentlichung ein echtes, redaktionell erstelltes PDF an diese Stelle tritt,
entscheidet WERTE.IT. Bis dahin steht hier ein Dokument, das den Weg vollständig
abbildet — der Link lädt eine echte Datei herunter, die sich in einem
Screenreader tatsächlich öffnen lässt. Es ist kleiner als die im Linktext
genannten 412 KB; die Größenangabe gehört zur Fiktion des Dateinamens
(docs/UX-COPY.md §8.2) und wird nicht an die Platzhalterdatei angepasst.
"""

from pathlib import Path

# Geschwister-Import: Python stellt das Verzeichnis des aufgerufenen Skripts
# an den Anfang von sys.path. Der Schreiber steht dort und nicht hier, damit
# eine Korrektur an ihm beide Dokumente erreicht (untagged_pdf.py).
from untagged_pdf import write_untagged_pdf

OUTPUT = (
    Path(__file__).resolve().parents[2]
    / "public"
    / "simulation"
    / "Stellenausschreibung_2026_IT-Projektmanagement_final_v3.pdf"
)

BLOCKS: list[tuple[int, str]] = [
    (16, "Elbwerk KG - Stellenausschreibung"),
    (11, "IT-Projektmanager (m/w/d)"),
    (11, "Vollzeit - Hamburg-Wilhelmsburg - ab sofort"),
    (11, ""),
    (11, "Zur Verstaerkung unserer IT suchen wir zum naechstmoeglichen Zeitpunkt eine"),
    (11, "engagierte Persoenlichkeit."),
    (11, ""),
    (13, "Aufgabenprofil"),
    (11, "Im Rahmen der Ihnen obliegenden Taetigkeit verantworten Sie die"),
    (11, "eigenverantwortliche Steuerung saemtlicher IT-seitiger Projektvorhaben unter"),
    (11, "Beruecksichtigung der unternehmensinternen Prozessvorgaben sowie der"),
    (11, "einschlaegigen fachbereichsseitigen Anforderungen, wobei die Sicherstellung"),
    (11, "einer termin- und budgetgerechten Umsetzung unter gleichzeitiger Wahrung der"),
    (11, "Qualitaetsstandards als wesentlicher Erfolgsfaktor anzusehen ist."),
    (11, ""),
    (11, "Darueber hinaus obliegt Ihnen die Abstimmung mit den beteiligten"),
    (11, "Fachabteilungen sowie externen Dienstleistern, wobei ein hohes Mass an"),
    (11, "Eigeninitiative und Durchsetzungsvermoegen ebenso vorausgesetzt wird wie die"),
    (11, "Faehigkeit, auch in Situationen erhoehten Arbeitsaufkommens strukturiert und"),
    (11, "loesungsorientiert zu agieren."),
    (11, ""),
    (13, "Anforderungsprofil"),
    (11, "Vorausgesetzt wird ein abgeschlossenes Studium der Informatik bzw. eine"),
    (11, "vergleichbare Qualifikation nebst einschlaegiger mehrjaehriger"),
    (11, "Berufserfahrung in der Leitung von IT-Projekten, wuenschenswerterweise"),
    (11, "ergaenzt um vertiefte Kenntnisse gaengiger Projektmanagement-Methoden."),
    (11, ""),
    (13, "Was wir bieten"),
    (11, "30 Urlaubstage - Gleitzeit - Jobrad - Zuschuss zum Deutschlandticket -"),
    (11, "Betriebliche Altersvorsorge"),
    (11, "Verguetung nach Haustarif, Entgeltgruppe 11 (58.000 - 68.000 EUR brutto/Jahr)"),
    (11, ""),
    (13, "So geht es weiter"),
    (11, "Online bewerben - Rueckmeldung innerhalb von zwei Wochen - Gespraech per"),
    (11, "Video oder vor Ort - Start nach Absprache"),
    (11, ""),
    (11, "Elbwerk KG, Personalabteilung, bewerbung@elbwerk.de"),
]

# Umlaute sind im Dokument bewusst umschrieben. Es ist mit einer der 14
# Standardschriften gesetzt, ohne eingebettete Kodierungstabelle - eine
# Werkzeugkette, mit der Umlaute in der Praxis regelmaessig als falsches
# Zeichen oder gar nicht ankommen. Auf der Seite daneben stehen sie richtig.


def main() -> None:
    write_untagged_pdf(OUTPUT, BLOCKS)


if __name__ == "__main__":
    main()
