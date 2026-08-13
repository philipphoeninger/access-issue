#!/usr/bin/env python3
"""Quelle des PDFs zum Teil `einladung` der Event-Barriere der CSR-Kampagne.

ACHTUNG: Diese Datei wird NICHT ausgeliefert. Ausgeliefert wird das daraus
erzeugte Dokument
public/simulation/Einladung_Podiumsdiskussion_Sept2026_final.pdf.

Neu erzeugen nach jeder Textaenderung, aus dem Projektwurzelverzeichnis:

    python3 assets-src/simulation/einladung.py

Dasselbe Vorgehen und dieselbe Begruendung wie bei
assets-src/simulation/stellenausschreibung.py, nur fuer die andere PDF-Barriere
des Werkzeugs (docs/SPEC_v2.md Slice 17, docs/UX-COPY.md §9.6): Das Dokument ist
absichtlich ungetaggt - kein Strukturbaum, keine Lesereihenfolge, keine
Ueberschriftenauszeichnung, keine Dokumentsprache, nur absolut positionierte
Textzeilen. Ein Screenreader findet darin nichts, weil nichts da ist. Beide
Dokumente entstehen durch dasselbe Werkzeug (untagged_pdf.py); hier stehen nur
der Text und seine Begruendung.

Der Textkoerper ist die Fassung aus docs/UX-COPY.md §9.6 (`csr.event.basics`,
`csr.event.programme.items`, `csr.event.registration`). Aendert sich dort etwas,
gehoert das Dokument neu erzeugt - sonst behauptet der Downloadlink etwas
anderes als der behobene Zustand daneben.

Warum es diese Datei ueberhaupt gibt: Der behobene Zustand behaelt den Download
bei ("auch als Text", nicht "ohne Dokument", docs/UX-COPY.md §9.6). Ein Link,
der auf nichts zeigt, fuehrt keine Barriere vor, sondern einen Fehler 404 - und
gerade der aktive Zustand lebt davon, dass der einzige Weg zu den Angaben
tatsaechlich durch dieses Dokument fuehrt.

Die Groessenangabe im Linktext (1,2 MB, docs/UX-COPY.md §9.6) gehoert zur
Fiktion des Dateinamens und wird nicht an die Platzhalterdatei angepasst -
dieselbe Entscheidung wie bei der Stellenausschreibung.
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
    / "Einladung_Podiumsdiskussion_Sept2026_final.pdf"
)

BLOCKS: list[tuple[int, str]] = [
    (16, "Elbwerk KG - Einladung"),
    (11, "Podiumsdiskussion \"Inklusiv. Nachhaltig. Sichtbar.\""),
    (11, ""),
    (11, "Sehr geehrte Damen und Herren,"),
    (11, ""),
    (11, "im Rahmen unserer Aktion \"Elbwerk hilft\" laden wir Sie herzlich zu einer"),
    (11, "Podiumsdiskussion mit Gaesten aus dem Stadtteil ein."),
    (11, ""),
    (13, "Wann und wo"),
    (11, "Donnerstag, 24. September 2026, 18 Uhr"),
    (11, "Nachbarschaftstreff Veringstrasse, Hamburg-Wilhelmsburg"),
    (11, ""),
    (13, "Programm"),
    (11, "18:00 Uhr  Begruessung durch die Geschaeftsfuehrung"),
    (11, "18:15 Uhr  Podiumsdiskussion mit Gaesten aus dem Stadtteil"),
    (11, "19:30 Uhr  Ausklang bei Getraenken"),
    (11, ""),
    (13, "Anmeldung"),
    (11, "Anmeldung bis zum 20. September per E-Mail an event@elbwerk.de"),
    (11, ""),
    (11, "Wir freuen uns auf Sie."),
    (11, ""),
    (11, "Elbwerk KG, Unternehmenskommunikation, engagement@elbwerk.de"),
]

# Umlaute sind im Dokument bewusst umschrieben - dieselbe Begruendung wie in
# stellenausschreibung.py: eine der 14 Standardschriften ohne eingebettete
# Kodierungstabelle. Auf der Seite daneben stehen sie richtig.


def main() -> None:
    write_untagged_pdf(OUTPUT, BLOCKS)


if __name__ == "__main__":
    main()
