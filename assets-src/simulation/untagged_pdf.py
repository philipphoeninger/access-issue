"""Der PDF-Schreiber hinter den beiden PDF-Barrieren des Werkzeugs.

ACHTUNG: Diese Datei wird NICHT ausgeliefert. Sie erzeugt, was ausgeliefert
wird: die Dokumente, auf die die Downloadlinks von
`stellenausschreibung.py` (Bewerbungsprozess, Barriere `pdf`) und
`einladung.py` (CSR-Kampagne, Teil `einladung`) zeigen. Beide Skripte rufen
`write_untagged_pdf` auf und bringen nur ihren eigenen Textkörper mit; erzeugt
werden die Dateien weiterhin einzeln, jede mit dem Kommando in ihrem eigenen
Kopf.

**Warum das Dokument absichtlich schlecht gemacht ist.** Es hat genau die
Eigenschaften, die docs/PRD.md §6.1 der Barriere zuschreibt: keine Tag-Struktur,
keine Lesereihenfolge, keine Ueberschriftenauszeichnung, keine Dokumentsprache —
nur absolut positionierte Textzeilen. Ein Screenreader findet darin keine
Struktur, weil keine da ist. Das ist kein Versaeumnis dieses Moduls, sondern sein
Zweck; ein sauber getaggtes PDF waere hier das Gegenteil der Aussage. Wer diesen
Schreiber „verbessert", nimmt beiden Barrieren ihren Gegenstand.

**Warum es diese Datei gibt.** Der Schreiber stand zweimal wortgleich in den
beiden Skripten. Eine Korrektur daran — ein Fehler in den xref-Offsets, ein
Seitenumbruch, der bei laengeren Dokumenten falsch rechnet — waere in einer der
beiden Kopien haengengeblieben, und die zwei Platzhalterdokumente waeren
auseinandergelaufen, ohne dass irgendetwas es gemeldet haette. Unterschiedlich
sind die Skripte in dem, was sie wirklich unterscheidet: im Text und in seiner
Begruendung.

Der Import ist ein Geschwister-Import und funktioniert, weil Python das
Verzeichnis des aufgerufenen Skripts an den Anfang von `sys.path` stellt — die
Skripte werden als `python3 assets-src/simulation/<name>.py` aus dem
Projektwurzelverzeichnis aufgerufen.
"""

from pathlib import Path

PAGE_WIDTH, PAGE_HEIGHT = 595, 842  # A4 in PostScript points
MARGIN_LEFT, MARGIN_TOP = 64, 74
LINE_HEIGHT = 15
MAX_LINES_PER_PAGE = 44

# Ein Block ist (Schriftgroesse, Text). Eine leere Zeile ist ein Absatzabstand.
# Keine Auszeichnung, keine Ebenen — im Dokument ist eine Ueberschrift nichts als
# eine etwas groessere Zeile, und genau das ist die Barriere.
Block = tuple[int, str]


def escape(text: str) -> bytes:
    """PDF-Stringliteral: Klammern und Backslash sind Steuerzeichen."""
    escaped = text.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
    return escaped.encode("ascii")


def content_stream(lines: list[Block]) -> bytes:
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


def write_untagged_pdf(output: Path, blocks: list[Block]) -> None:
    """Schreibt das Dokument und meldet, was entstanden ist."""
    pages = [
        content_stream(blocks[start : start + MAX_LINES_PER_PAGE])
        for start in range(0, len(blocks), MAX_LINES_PER_PAGE)
    ]
    output.write_bytes(build_pdf(pages))
    print(f"{output.relative_to(Path.cwd())}: {output.stat().st_size} Bytes")
