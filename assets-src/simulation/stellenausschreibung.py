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
weil keine da ist. Das ist kein Versäumnis dieses Skripts, sondern sein Zweck;
ein sauber getaggtes PDF wäre hier das Gegenteil der Aussage.

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

OUTPUT = (
    Path(__file__).resolve().parents[2]
    / "public"
    / "simulation"
    / "Stellenausschreibung_2026_IT-Projektmanagement_final_v3.pdf"
)

PAGE_WIDTH, PAGE_HEIGHT = 595, 842  # A4 in PostScript points
MARGIN_LEFT, MARGIN_TOP = 64, 74
LINE_HEIGHT = 15
MAX_LINES_PER_PAGE = 44

# (Schriftgröße, Text). Eine leere Zeile ist ein Absatzabstand. Keine
# Auszeichnung, keine Ebenen — im Dokument ist eine Überschrift nichts als eine
# etwas größere Zeile, und genau das ist die Barriere.
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


def escape(text: str) -> bytes:
    """PDF-Stringliteral: Klammern und Backslash sind Steuerzeichen."""
    escaped = text.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
    return escaped.encode("ascii")


def content_stream(lines: list[tuple[int, str]]) -> bytes:
    """Eine Seite: absolut positionierte Textzeilen, sonst nichts."""
    out = bytearray(b"BT\n")
    y = PAGE_HEIGHT - MARGIN_TOP
    for size, text in lines:
        if text:
            out += b"/F1 %d Tf\n1 0 0 1 %d %d Tm\n(%s) Tj\n" % (
                size,
                MARGIN_LEFT,
                y,
                escape(text),
            )
        y -= LINE_HEIGHT
    out += b"ET\n"
    return bytes(out)


def build_pdf(pages: list[bytes]) -> bytes:
    """Ein PDF 1.4 ohne StructTreeRoot, ohne /Lang, ohne MarkInfo."""
    page_count = len(pages)
    # 1 Catalog, 2 Pages, dann je Seite ein Page- und ein Contents-Objekt,
    # zuletzt die Schrift.
    font_number = 3 + 2 * page_count
    page_numbers = [3 + 2 * index for index in range(page_count)]

    objects: list[bytes] = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [%s] /Count %d >>"
        % (b" ".join(b"%d 0 R" % number for number in page_numbers), page_count),
    ]
    for index, stream in enumerate(pages):
        number = page_numbers[index]
        objects.append(
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] "
            b"/Resources << /Font << /F1 %d 0 R >> >> /Contents %d 0 R >>"
            % (PAGE_WIDTH, PAGE_HEIGHT, font_number, number + 1)
        )
        objects.append(b"<< /Length %d >>\nstream\n%s\nendstream" % (len(stream), stream))
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    out = bytearray(b"%PDF-1.4\n")
    offsets: list[int] = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n%s\nendobj\n" % (number, body)

    xref_offset = len(out)
    out += b"xref\n0 %d\n" % (len(objects) + 1)
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += b"%010d 00000 n \n" % offset
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (
        len(objects) + 1,
        xref_offset,
    )
    return bytes(out)


def main() -> None:
    pages = [
        content_stream(BLOCKS[start : start + MAX_LINES_PER_PAGE])
        for start in range(0, len(BLOCKS), MAX_LINES_PER_PAGE)
    ]
    OUTPUT.write_bytes(build_pdf(pages))
    print(f"{OUTPUT.relative_to(Path.cwd())}: {OUTPUT.stat().st_size} Bytes")


if __name__ == "__main__":
    main()
