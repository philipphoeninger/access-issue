# UX-Texte — AccessIssue

**Projekt:** AccessIssue
**Grundlagen:** `docs/PRD.md` (v1.1), `docs/ARCHITECTURE.md` (v1.1), `docs/DESIGN.md` (v1)
**Status:** Entwurf v2.0 — überarbeitet nach der fertigen Modulpräsentation
**Stand:** August 2026

> **Sprache dieses Dokuments.** Deutsch, abweichend von `ARCHITECTURE.md`, `TESTING.md`
> und `DESIGN.md`. Begründung: Dieses Dokument besteht überwiegend aus den tatsächlichen
> Oberflächentexten und wird vom WERTE.IT-Team redaktionell geprüft. Ein englischer
> Rahmen um deutsche Strings würde das Review erschweren. Die String-Schlüssel sind
> englisch, weil sie im Code stehen.

---

## 1. Geltungsbereich

| Textart | Wer schreibt | In diesem Dokument |
| --- | --- | --- |
| Rahmen-Texte (Navigation, Panel, Ansagen, Fehlerseiten) | Engineering | **Ja, final** |
| Erklärtexte je Barriere (Problem, Betroffene, Normbezug, Lösung) | WERTE.IT-Team | Nein — nur Struktur und Rubriktitel |
| Elbwerk-Inhalte in der Simulation | Engineering, Review durch WERTE.IT | **Ja, als verwendbare Platzhalter** |

Die Elbwerk-Texte in Abschnitt 8 sind so geschrieben, dass sie unverändert eingesetzt
werden können. Sie sind trotzdem als vorläufig zu betrachten: Sobald das WERTE.IT-Team
eigene Formulierungen liefert, werden sie ersetzt. Was **nicht** verhandelbar ist, ist das
Verhältnis der Varianten zueinander — die barrierebehaftete und die barrierefreie Fassung
müssen denselben Sachinhalt transportieren, sonst misst das Szenario etwas anderes als
Barrierefreiheit.

---

## 2. Stimme

**Anrede: Du.** Durchgängig, im Rahmen wie in der Simulation. Folgt dem Modul
(„Deine Rolle für die digitale Teilhabe").

**Grundregeln**

- Sentence case. Keine Versalien außer im Simulations-Chip.
- Aktive Verben. „Barrieren beheben", nicht „Behebung der Barrieren".
- Keine Ausrufezeichen im Rahmen. Das Thema trägt sich selbst.
- Kein „einfach", kein „schnell", kein „nur". Für die betroffene Person ist nichts davon
  einfach oder schnell.
- Keine Vorwürfe an Unternehmen. Das Modul sensibilisiert, es klagt nicht an. Elbwerk ist
  nicht böswillig, sondern unaufmerksam — das ist der realistischere und der lehrreichere
  Fall.
- Nie „normal" als Gegenteil von „mit Behinderung".
- Nicht „Barrierefreiheit für Menschen mit Behinderung", sondern schlicht
  „Barrierefreiheit". Der Zusatz macht es zum Sonderfall.

---

## 3. Terminologie-Kanon

Ein Begriff, eine Bedeutung, überall. Abweichungen sind Fehler, nicht Stil.

| Begriff | Bedeutung | Nicht verwenden |
| --- | --- | --- |
| **Barriere** | Ein einzelner umschaltbarer Punkt | Problem, Fehler, Mangel, Issue |
| **aktiv** | Barriere ist eingeschaltet, Hindernis besteht | an, ein, kaputt, schlecht |
| **behoben** | Barriere ist ausgeschaltet | aus, gelöst, gefixt, repariert |
| **barrierefrei** | Zustand ohne Barriere | zugänglich, accessible, optimiert |
| **Simulation** | Der nachgebildete Elbwerk-Bereich | Demo, Beispiel, Vorschau, Sandbox |
| **Szenario** | Bewerbungsprozess, CSR-Kampagne, Softwarebeschaffung | Praxisbeispiel (nur im Modul), Use Case |
| **Schritt** | Stufe innerhalb eines Szenarios | Seite, Stage, Phase |
| **Panel** | Die Bedienleiste mit den Barrieren | Sidebar, Steuerung, Menü |

**„Barrierefrei" versus „behoben".** Beide werden gebraucht, aber nicht synonym:
*behoben* beschreibt die Barriere („4 von 5 Barrieren behoben"), *barrierefrei* beschreibt
das Ergebnis („Die Stellenanzeige ist barrierefrei"). Wer das vermischt, erzeugt Sätze wie
„Die Barriere ist barrierefrei", die niemand versteht.

---

## 4. Regelkonflikt: Bedienelemente benennen

`DESIGN.md` §7 verlangt: „Ein Bedienelement sagt, was passiert." Das gilt für Buttons und
kollidiert mit Checkboxen, deren Beschriftung konventionell den **Zustand** benennt, nicht
die Aktion. Ein Kontrollkästchen mit der Beschriftung „Barriere beheben" wäre im
angehakten Zustand unlesbar: Bedeutet der Haken, dass behoben ist, oder dass behoben
werden soll?

**Auflösung, verbindlich:**

- **Kontrollkästchen** tragen eine Zustandsbeschriftung: „Stellenanzeige barrierefrei".
  Angehakt bedeutet, der Zustand liegt vor.
- **Schaltflächen** tragen eine Aktionsbeschriftung: „Alle Barrieren beheben".
- **Ansagen** nennen den erreichten Zustand, nie die Aktion: „Stellenanzeige: barrierefrei."

`DESIGN.md` §7 ist entsprechend zu präzisieren.

---

## 5. Rahmen-Texte

### 5.1 Sprunglinks und Kopfbereich

| Schlüssel | Text |
| --- | --- |
| `skip.content` | Zum Inhalt springen |
| `skip.panel` | Zum Barriere-Panel springen |
| `skip.afterSimulation` | Simulationsbereich überspringen |
| `header.projectName` | WERTE.IT |
| `header.toolName` | AccessIssue |
| `header.tagline` | Barrieren sehen, verstehen, beheben |
| `nav.label` | Szenarien |
| `nav.home` | Startseite |

**Zwei der drei Sprunglinks stehen im Seitenkopf**, in dieser Reihenfolge als erste
fokussierbare Elemente: `skip.content` und `skip.panel`.

`skip.afterSimulation` steht **nicht** dort, sondern unmittelbar vor dem Simulationsbereich
(`ARCHITECTURE.md` §5.1) und nur auf Szenarioseiten. Ein früherer Entwurf stellte alle drei
an den Seitenanfang. Vom Seitenanfang aus ans Ende der Simulation zu springen, ohne sie je
betreten zu haben, will praktisch niemand — der Link ist dafür da, einen Bereich zu
überspringen, in dem man gerade steht.

### 5.2 Startseite

| Schlüssel | Text |
| --- | --- |
| `home.h1` | AccessIssue: Barrieren sichtbar machen |
| `home.intro` | Nachgebaute Oberflächen aus dem Unternehmensalltag, wie es sie tausendfach gibt. In jeder stecken Barrieren. Du kannst sie einzeln abschalten und siehst sofort, was sich ändert — und für wen. |
| `home.howItWorks.h2` | So funktioniert es |
| `home.howItWorks.step1` | Wähle ein Szenario. Du siehst die Website eines fiktiven Unternehmens. |
| `home.howItWorks.step2` | Im Barriere-Panel steht jeder Eintrag für eine Barriere, die gerade aktiv ist. |
| `home.howItWorks.step3` | Schalte eine Barriere auf barrierefrei. Die Oberfläche ändert sich, und du erfährst, worum es ging. |
| `home.note.h2` | Was du hier siehst |
| `home.note.body` | Die simulierten Seiten sehen bewusst unauffällig aus. Genau das ist der Punkt: Barrieren erkennt man einer Website meistens nicht an. Wer nicht betroffen ist, bemerkt sie nicht. |
| `home.scenarios.h2` | Szenarien |
| `home.scenario.open` | Szenario öffnen |
| `home.scenario.plannedBadge` | In Vorbereitung |
| `home.scenario.plannedNote` | Dieses Szenario wird gerade erarbeitet und ist noch nicht verfügbar. |

**Szenario-Kurzbeschreibungen**

| Schlüssel | Text |
| --- | --- |
| `scenario.application.title` | Bewerbungsprozess |
| `scenario.application.summary` | Eine Stellenanzeige, ein Bewerbungsformular, der Upload der Unterlagen und die Rückmeldung. Die Barrieren summieren sich über vier Schritte auf, bis die Bewerbung scheitert. |
| `scenario.procurement.title` | Softwarebeschaffung |
| `scenario.procurement.summary` | Ein Ticketsystem wird eingekauft — nach Funktionsumfang, Bedienbarkeit und Preis. Erst im Arbeitsalltag zeigt sich, wer es nicht nutzen kann. |
| `scenario.csr.title` | CSR-Kampagne |
| `scenario.csr.summary` | Die Kampagne „Inklusiv. Nachhaltig. Sichtbar." mit Video, Spendenaufruf, Social Media und Event. Die Barrieren stecken überwiegend in Medien, Sprache und Bewegung. |
| `scenario.barrierCount` | {count} Barrieren |

**Keine Zahlen im Fließtext.** Ein früherer Entwurf schrieb „Fünf Barrieren" und „Sechs
Barrieren" in die Kurzbeschreibungen und „Drei nachgebaute Oberflächen" in `home.intro`.
Beides veraltet: die Zahlen, sobald eine Barriere ergänzt wird, und „drei" bereits zum
Start, weil die Softwarebeschaffung dann noch in Vorbereitung ist — der erste Satz der
Startseite wäre am Starttag falsch gewesen.

Wo eine Zahl gebraucht wird, wird sie aus den Szenariodaten erzeugt
(`scenario.barrierCount`). Das ist derselbe Alterungsmechanismus, den `ARCHITECTURE.md` §8
für aufgezählte URLs beschreibt, nur in der Copy.

### 5.3 Szenarioseite: Kopf und Schritte

| Schlüssel | Text |
| --- | --- |
| `scenario.stepIndicator` | Schritt {current} von {total} — {title} |
| `scenario.pageTitle` | {scenario}, Schritt {current} von {total} — {step} |
| `scenario.pageTitle.singleStep` | {scenario} |
| `scenario.step.next` | Weiter zu: {title} |
| `scenario.step.previous` | Zurück zu: {title} |
| `scenario.stepsNavLabel` | Schritte in diesem Szenario |
| `application.step1.title` | Stellenanzeige |
| `application.step2.title` | Bewerbungsformular |
| `application.step3.title` | Unterlagen hochladen |
| `application.step4.title` | Rückmeldung |
| `procurement.stepA.title` | Vergabeunterlagen |
| `procurement.stepB.title` | Das eingeführte Ticketsystem |

Die Schrittbeschriftung nennt immer das Ziel, nie nur die Richtung. „Weiter" allein ist
für Screenreader-Nutzer wertlos, wenn mehrere Links auf einer Seite so heißen.

**Der Schritt wird benannt, nicht nur gezählt.** `scenario.stepIndicator` hieß zunächst nur
„Schritt 2 von 4". Die `h1` trägt den Szenariotitel und ist auf allen vier Schritten
dieselbe — damit stand nirgends auf der Seite, wie der Schritt heißt, in dem man sich
befindet. Die Zählung allein beantwortet „wie weit bin ich", nicht „wo bin ich".

`scenario.pageTitle` ist derselbe Gedanke für den Seitentitel: Er füllt den Browser-Tab,
die Chronik, das Lesezeichen und den ersten Satz der Seitenwechsel-Ansage (Abschnitt 5.7).
Vorher hießen alle vier Schritte im Tab identisch „Bewerbungsprozess – AccessIssue", was
vier offene Tabs desselben Szenarios ununterscheidbar machte (WCAG 2.4.2). Bei einstufigen
Szenarien entfällt die Zählung ganz: „Schritt 1 von 1" ist keine Information.

Der Szenariotitel steht im Seitentitel vorn, weil Tab-Leisten hinten abschneiden, und im
sichtbaren Schrittindikator gar nicht, weil die `h1` unmittelbar darüber ihn schon nennt.

### 5.4 Simulationsleiste (Signatur-Element)

| Schlüssel | Text |
| --- | --- |
| `simBar.chip` | Simulation |
| `simBar.url` | elbwerk.de{path} |
| `simBar.counter.some` | {active} von {total} Barrieren aktiv |
| `simBar.counter.none` | Keine Barriere aktiv |
| `simBar.counter.all` | Alle {total} Barrieren aktiv |
| `simBar.description` | Nachbau der Website der fiktiven Elbwerk GmbH & Co. KG. Kein echtes Unternehmen, keine echte Bewerbung, keine Datenübertragung. |

`simBar.description` ist der Text, auf den `aria-describedby` des Simulationsbereichs
zeigt (`ARCHITECTURE.md` §5.1). Er ist Teil des Rahmens, nicht der Simulation.

**Der Chip steht als „Simulation" im String, nicht als „SIMULATION".** Die Versalien
entstehen über `text-transform: uppercase` im CSS. Durchgehend großgeschriebene Strings
werden von manchen Screenreadern als Abkürzung gedeutet und buchstabiert — „S-I-M-U-L-A-T-
I-O-N" ausgerechnet an der Stelle, die den Bereich kennzeichnet. Optisch identisch,
akustisch richtig.

### 5.5 Ein- und Ausstieg aus dem Simulationsbereich

| Schlüssel | Text |
| --- | --- |
| `simRegion.label` | Simulation: Website der Elbwerk GmbH & Co. KG |
| `simRegion.exitLink` | Simulation verlassen — zurück zum Barriere-Panel |
| `simRegion.endAnchor` | Ende des Simulationsbereichs |

Der Ausstiegslink ist das erste fokussierbare Element im Bereich und der einzige
sicherheitskritische Text der Anwendung (`TESTING.md` §7). Er wird ausgeschrieben, nicht
abgekürzt: „Verlassen" allein sagt nicht, wohin.

### 5.6 Barriere-Panel

| Schlüssel | Text |
| --- | --- |
| `panel.h2` | Barrieren |
| `panel.intro` | Setze ein Häkchen, um eine Barriere zu beheben. Die Simulation ändert sich sofort. |
| `panel.resolveAll` | Alle Barrieren beheben |
| `panel.activateAll` | Alle Barrieren aktivieren |
| `panel.stateActive` | Barriere aktiv |
| `panel.stateResolved` | Barrierefrei |
| `panel.statePartial` | Teilweise behoben |
| `panel.explainLink` | Was bedeutet das? |
| `panel.combinedHint` | Diese Barriere hat zwei Teile. Erst wenn beide behoben sind, ist der Inhalt barrierefrei. |
| `panel.combinedHint.many` | Diese Barriere hat {count} Teile. Erst wenn alle behoben sind, ist der Inhalt barrierefrei. |

**`panel.combinedHint.many` ist bei der Umsetzung des Panels ergänzt worden** (Slice 5). Die
ursprüngliche Fassung sagt „zwei Teile" und „beide", das Datenmodell erlaubt aber beliebig
viele Teile (`ARCHITECTURE.md` §6, Data Contract: mindestens zwei). Eine dreiteilige
kombinierte Barriere hätte damit unter drei Kontrollkästchen behauptet, es seien zwei. Die
zweiteilige Fassung bleibt unverändert die redaktionell geprüfte für den einzigen Fall, den
es heute gibt; die allgemeine greift erst ab drei Teilen.

**Beschriftungen der Kontrollkästchen** — Zustandsform nach Abschnitt 4, gruppiert nach
Schritt, mit Fachbereich als Kennzeichnung (`ARCHITECTURE.md` §12.1.1):

*Bewerbungsprozess — Schritt 1: Stellenanzeige*

| Barriere | Beschriftung | Bereich |
| --- | --- | --- |
| Textgrafik | Gehalt und Leistungen als Text, nicht als Bild | Kommunikation |
| Komplexe Sprache | Stellenbeschreibung in klarer Sprache | Kommunikation |

*Schritt 2: Bewerbungsformular*

| Barriere | Beschriftung | Bereich |
| --- | --- | --- |
| Fehlende Labels | Formularfelder mit Beschriftungen | IT |
| Keine Tastaturbedienung | Formular per Tastatur bedienbar | IT |
| Pflichtfeld-Kennzeichnung | Pflichtfelder erkennbar benannt | Personal |
| Kein Fehler-Feedback | Verständliche Fehlermeldungen | IT |

*Schritt 3: Dokumente*

| Barriere | Beschriftung | Bereich |
| --- | --- | --- |
| PDF-Stellenanzeige | Stellenanzeige als Text auf der Seite | Personal |
| Upload-Formate | Zulässige Dateiformate und Größen angegeben | Personal |

*Schritt 4: Rückmeldung*

| Barriere | Beschriftung | Bereich |
| --- | --- | --- |
| Bestätigungstext | Bestätigung in verständlicher Sprache | Kommunikation |
| Ansprechperson | Ansprechperson mit Namen und Kontakt genannt | Personal |
| Inklusionshinweis | Hinweis, dass Anpassungen möglich sind | Personal |

*Softwarebeschaffung — Teil A: Vergabe*

| Barriere | Beschriftung | Bereich |
| --- | --- | --- |
| Lastenheft | Barrierefreiheit im Lastenheft gefordert | Beschaffung |
| Nachweispflicht | Nachweis der Barrierefreiheit verlangt | Beschaffung |
| Praxistest | Praxistest mit Nutzern von Hilfsmitteln | Beschaffung |
| Zuständigkeit | Zuständigkeit für Barrierefreiheit benannt | Management |

*Teil B: Ticketsystem*

| Barriere | Beschriftung | Bereich |
| --- | --- | --- |
| Tastatur im System | Alle Bedienelemente per Tastatur erreichbar | IT |
| Screenreader-Erfassung | Tabellen und Status für Screenreader lesbar | IT |
| Kontrast im System | Ausreichende Farbkontraste | IT |

*CSR-Kampagne*

| Barriere | Beschriftung | Bereich |
| --- | --- | --- |
| Video (Sammelbegriff) | Video barrierefrei | Kommunikation |
| → Teil: Untertitel | Untertitel vorhanden | Kommunikation |
| → Teil: Transkript | Transkript vorhanden | Kommunikation |
| Anglizismen | Kampagnentext verständlich, mit Leichter Sprache | Kommunikation |
| Emojis | Emojis ergänzen den Text, statt ihn zu ersetzen | Kommunikation |
| Social-Media-Einbettung | Bilder mit Alternativtexten und gutem Kontrast | Kommunikation |
| Event-Angaben | Angaben zu Zugang und Dolmetschung beim Event | CSR |
| Fortschrittsbalken | Spendenstand als Text lesbar | IT |
| Countdown | Countdown wird vorgelesen | IT |
| Spenden-Slider | Betrag auch als Eingabefeld | IT |
| Karussell | Karussell mit Pause-Schaltfläche | IT |

Die Beschriftung benennt jeweils die **barrierefreie** Eigenschaft, weil das der Zustand
ist, den der Haken herstellt. Sie beschreibt keine Handlung und keinen Normverstoß —
die Einordnung leistet der Erklärungsbereich.

**Bereichs-Zusammenfassung unter dem Panel.** Ein Satz, immer sichtbar, der die Kernaussage
von Kapitel 3 trägt:

| Schlüssel | Text |
| --- | --- |
| `panel.areaSummary` | Diese {count} Barrieren stammen aus {areaCount} Bereichen: {areas}. |
| `panel.areaSummary.single` | Alle {count} Barrieren stammen aus einem Bereich: {area}. |
| `panel.groupLabel` | Barrieren in diesem Schritt |
| `area.personal` | Personal |
| `area.kommunikation` | Kommunikation |
| `area.it` | IT |
| `area.beschaffung` | Beschaffung |
| `area.management` | Management |
| `area.csr` | CSR |

Beispiel: „Diese 11 Barrieren stammen aus 3 Bereichen: Personal, Kommunikation, IT."

Der Satz steht bewusst als Fließtext und nicht als Gruppierung. Wer eine nach Bereichen
gruppierte Liste sieht, muss die Überschriften selbst zählen, um die Aussage zu bemerken.
Ein Satz sagt sie.

**Es gibt genau einen Zähler, und er zählt aktive Barrieren.** Ein früherer Entwurf hatte
zwei: im Panel „{resolved} von {total} behoben", in der Simulationsleiste „{active} von
{total} Barrieren aktiv". Bei fünf Barrieren und einer behobenen stand damit gleichzeitig
„1 von 5 behoben" und „4 von 5 Barrieren aktiv" auf demselben Bildschirm. Beides richtig,
zusammen eine Rechenaufgabe — und das ausgerechnet für die Gruppe, deren kognitive
Belastung das Modul selbst zum Thema macht.

Der Zählstand steht deshalb nur in der Simulationsleiste (Abschnitt 5.4), und er zählt
**aktive** Barrieren. Der Ausgangszustand ist „alle aktiv", die Zahl sinkt beim Beheben:
Fortschritt als Abbau. Die Ansagen in Abschnitt 5.7 folgen derselben Richtung.

**Teilweise behobene kombinierte Barrieren zählen als aktiv.** Sind die Untertitel
vorhanden, das Transkript aber nicht, bleibt das Video im Zähler eine aktive Barriere —
denn sie besteht ja fort. Das ist der ganze didaktische Sinn des kombinierten Falls. Der
Zustand „Teilweise behoben" ist am Panel-Eintrag sichtbar, wandert aber nicht in den
Zähler.

### 5.7 Ansagen der Live-Region

Ein Format, ohne Ausnahme: **Was ist jetzt. Wie viele bleiben.**

| Anlass | Text |
| --- | --- |
| Barriere behoben | {Barriere}: barrierefrei. Noch {n} von {total} Barrieren aktiv. |
| Barriere aktiviert | {Barriere}: Barriere aktiv. {n} von {total} Barrieren aktiv. |
| Teil einer kombinierten Barriere behoben | {Teil}: barrierefrei. {Barriere} ist noch nicht vollständig behoben. |
| Teil einer kombinierten Barriere aktiviert | {Teil}: Barriere aktiv. {Barriere} ist noch nicht vollständig behoben. |
| Kombinierte Barriere vollständig behoben | {Barriere}: barrierefrei. Noch {n} von {total} Barrieren aktiv. |
| Alle behoben | Alle Barrieren behoben. Die Seite ist jetzt barrierefrei. |
| Alle aktiviert | Alle {total} Barrieren aktiv. |
| Seitenwechsel | {Seitentitel}. {n} von {total} Barrieren aktiv. |

Beispiel: „Formularfelder mit Beschriftungen: barrierefrei. Noch 4 von 5 Barrieren aktiv."

**Die Zeile „Teil … aktiviert" ist bei der Umsetzung des Panels ergänzt worden** (Slice 5).
Die Tabelle deckte den Weg zurück nicht ab: Wer bei einer vollständig behobenen kombinierten
Barriere einen Haken wieder entfernt, hätte keine Ansage bekommen. Der Satz übernimmt die
erste Hälfte aus „Barriere aktiviert" und die zweite unverändert aus der Zeile darüber —
keine neue Formulierung, nur die fehlende Kombination. Ein Zählstand steht bewusst nicht
darin: Die Zahl ändert sich nicht, weil eine teilweise behobene kombinierte Barriere
ohnehin als aktiv zählt (Abschnitt 5.6).

**Für „Was bedeutet das?" gibt es bewusst keine Ansage** (entschieden im Review zu Slice 6).
Ein Entwurf hatte hier eine Zeile „Erklärung: {Barriere}. {Zustand}", weil der Link einen
Bereich weit weg von sich ändert. Der eigentliche Mangel war aber, dass der Link nirgendwo
ankam: Er setzt nur einen Query-Parameter, also blieb die Ansicht stehen, wo sie war, und
sehende Nutzer sahen einen Link, der scheinbar nichts tut. Der Fokus wandert jetzt in den
Erklärungsbereich, die Ansicht scrollt mit — derselbe Weg wie bei den Sprunglinks —, und
der Screenreader liest den Bereich beim Ankommen ohnehin vor. Eine Live-Region zusätzlich
würde nur über die Fokusansage reden.

Beim Umschalten bleibt der Fokus dagegen auf dem Kontrollkästchen (`ARCHITECTURE.md`
§12.2), und die Ansage macht das Panel: Umschalten wählt die Barriere implizit mit aus
(§8), sagt aber Zustand und Zählstand in einem Satz.

Zwei Sätze, weil ein Screenreader beim ersten Satz das Wichtige liefert und der zweite
auch dann nützlich bleibt, wenn der Nutzer schon weiterliest. Länger darf es nicht werden:
Ansagen, die überschrieben werden, bevor sie zu Ende gesprochen sind, verlieren genau den
Teil, der zählt.

### 5.8 Erklärungsbereich

| Schlüssel | Text |
| --- | --- |
| `explanation.h2` | Erklärung |
| `explanation.empty` | Wähle im Barriere-Panel einen Eintrag aus, um zu erfahren, worum es geht. |
| `explanation.problem.h3` | Was ist das Problem? |
| `explanation.affected.h3` | Wen betrifft es? |
| `explanation.standards.h3` | Was sagen die Normen? |
| `explanation.solution.h3` | Wie geht es barrierefrei? |
| `explanation.currentlyActive` | Diese Barriere ist gerade aktiv. |
| `explanation.currentlyResolved` | Diese Barriere ist behoben. |
| `explanation.standardLevel` | Stufe {level} |
| `explanation.noStandard.h3` | Was sagen die Normen? |
| `explanation.noStandard.body` | Zu dieser Barriere gibt es kein passendes Erfolgskriterium. Sie verstößt gegen keine Norm — und schließt trotzdem Menschen aus. Barrierefreiheit ist mehr als das Erfüllen von Vorgaben. |
| `explanation.responsibleArea` | Zuständiger Bereich: {area} |

**Normnamen als Anzeigetext.** Normbezüge werden aus strukturierten Daten gerendert, nie
als Fließtext (`PRD.md` §8.1 F). Ein Eintrag setzt sich aus vier Feldern des
`StandardReference` zusammen — Normname, Kriteriumsnummer, Titel, Stufe — und wird in
dieser Reihenfolge dargestellt:

| Schlüssel | Text |
| --- | --- |
| `standard.wcag22` | WCAG 2.2 |
| `standard.bitv20` | BITV 2.0 |
| `standard.en301549` | EN 301 549 |
| `standard.bfsg` | BFSG |

Beispiel, drei Felder in einer Zeile: „WCAG 2.2", „1.4.5 Bilder eines Textes", „Stufe AA".
Kriteriumsnummer und Titel stehen zusammen, weil die Nummer allein vorgelesen nichts sagt
und der Titel allein über Normen hinweg mehrdeutig ist.

Die vier Namen sind Eigennamen der Normen und keine redaktionelle Formulierung. Sie stehen
trotzdem hier, weil sie angezeigte Strings sind und dieser Abschnitt der Ort ist, an dem
eine prüfende Person nachsieht, was der Erklärungsbereich sagt. `explanation.standardLevel`
entfällt bei Normen ohne Stufen: BITV und BFSG kennen keine Konformitätsstufen, und
„Stufe undefined" ist kein Text.

**Barrieren ohne Normbezug behalten die Rubrik.** Fünf der 27 Barrieren verletzen kein
WCAG-Kriterium (`PRD.md` §6.1, §6.2, §6.3). Die Rubrik „Was sagen die Normen?" wird bei
ihnen nicht weggelassen, sondern beantwortet — mit der Feststellung, dass es keinen
Normbezug gibt. Das Weglassen würde wie ein Redaktionsversehen wirken; die ausdrückliche
Antwort ist der Lerninhalt.

Der Fragesatz als Rubriktitel ist Absicht: Er benennt, was der Abschnitt beantwortet, und
liest sich in der Screenreader-Überschriftenliste als sinnvolle Einheit. „Problem",
„Betroffene", „Normbezug", „Lösung" wären kürzer, aber als Sprungziele nichtssagend.

**Keine Richtungsangaben in Texten.** Frühere Entwürfe hatten je zwei Fassungen von
`panel.intro` und `explanation.empty` — „rechts" für breite, „unten" für schmale Ansichten.
Beide hingen am Breakpoint und wären bei 400 % Zoom auf einem großen Bildschirm falsch
gewesen: zwei Strings, zwei Fehlerquellen, kein Informationsgewinn. Bereiche werden
stattdessen beim Namen genannt („im Barriere-Panel"), was unabhängig von der Anordnung
stimmt und für Screenreader-Nutzer ohnehin die einzig brauchbare Angabe ist.

### 5.9 Hinweise bei unterdrückten Barrieren

Erscheint in der Simulationsleiste, wenn eine Systemeinstellung eine Barriere überstimmt
(`ARCHITECTURE.md` §5.5).

| Schlüssel | Text |
| --- | --- |
| `suppressed.reducedMotion` | Dein System fordert reduzierte Bewegung an. Diese Einstellung hat Vorrang: Das Karussell wechselt die Beiträge nicht automatisch. Ohne diese Einstellung würde es alle vier Sekunden weiterspringen, ohne dass du es anhalten kannst. |
| `suppressed.forcedColors` | Dein System erzwingt eigene Farben. Diese Einstellung hat Vorrang: Die Kontrast-Barriere wird nicht dargestellt. Ohne diese Einstellung wäre der Text auf den Bildern kaum lesbar. |
| `suppressed.label` | Hinweis zur Darstellung |

Beide Texte nennen erst die Ursache, dann die Folge, dann was sonst zu sehen wäre. Der
dritte Teil ist der wichtige: Ohne ihn hält eine dozierende Person die Barriere für kaputt
und macht einen Screenshot, der nicht zur Beschreibung passt.

### 5.10 Fehler- und Sonderzustände

| Schlüssel | Text |
| --- | --- |
| `notFound.h1` | Diese Seite gibt es nicht |
| `notFound.body` | Die Adresse führt ins Leere. Vielleicht hat sich ein Tippfehler eingeschlichen, oder der Link ist veraltet. |
| `notFound.action` | Zur Startseite |
| `planned.h1` | Dieses Szenario ist noch in Vorbereitung |
| `planned.body` | Wir arbeiten daran. Die anderen Szenarien kannst du schon durchgehen. |
| `planned.action` | Zu den verfügbaren Szenarien |
| `noscript.body` | AccessIssue braucht JavaScript, weil sich die Barrieren zur Laufzeit umschalten lassen. Bitte aktiviere JavaScript. Die Inhalte des Moduls stehen auch ohne dieses Werkzeug vollständig in Moodle zur Verfügung. |
| `simulation.loadFailed` | Die Simulation konnte nicht geladen werden. Bitte lade die Seite neu. Das Barriere-Panel und die Erklärungen funktionieren weiter. |

Keine Entschuldigung, kein „Ups", kein Fehlercode. Was ist passiert, warum, was jetzt zu
tun ist.

**`simulation.loadFailed`** steht im Rahmen, unmittelbar vor der Simulationsleiste, und
gehört zu den seltenen Texten, die überhaupt einen technischen Fehlschlag benennen: Der
Nachbau jedes Schritts wird als eigenes Paket nachgeladen, und das kann scheitern — ein
Aussetzer im Netz, oder eine Seite, die nach einem Update auf ein Paket zeigt, das es nicht
mehr gibt. Der Satz nennt deshalb zusätzlich, was *weiter* funktioniert: Panel und
Erklärungen liegen im Rahmen und sind von dem Fehlschlag nicht betroffen — und genau sie
tragen den Lehrinhalt für alle, die die Simulation ohnehin nicht sehen können.

Der Hinweis wird **nicht** über die Live-Region angesagt. Der Rahmen hat genau eine
(`ARCHITECTURE.md` §12.2), sie gehört den Ansagen zu Seitenwechsel und Umschaltung, und
eine Ansage, die unmittelbar nach dem Seitenwechsel dazwischenfunkt, würde den Seitentitel
abschneiden — ausgerechnet für die Gruppe, die ihn am dringendsten braucht.

---

## 6. Was der Rahmen niemals sagt

- Kein „Fehler" für eine Barriere. Barrieren sind hier absichtlich da.
- Keine Wertung des simulierten Unternehmens („schlecht gemacht", „Versäumnis").
- Kein Lob fürs Beheben („Super!", „Geschafft"). Es ist ein Häkchen, keine Leistung.
- Keine Fortschrittsdramaturgie („Fast geschafft"). Das Ziel ist Verständnis, nicht
  Vollständigkeit.
- Kein Hinweis auf die eigene Barrierefreiheit des Werkzeugs. Sie wird vorausgesetzt.

---

## 7. Elbwerk: Sprache der Simulation

Elbwerk klingt wie ein durchschnittliches mittelständisches Unternehmen. Nicht schlecht,
nicht besonders — gewöhnlich. Das ist die Vorgabe.

- Elbwerk siezt. Der Kontrast zum duzenden Rahmen ist ein zusätzliches, unaufdringliches
  Grenzsignal.
- Elbwerk schreibt Marketing-Deutsch: „innovativ", „Team", „Herausforderung", „spannend".
- Elbwerks Fehlermeldungen sind bei aktiver Barriere unbrauchbar — und zwar auf die
  realistische Art: technisch, vage, ohne Handlungsanweisung.
- Elbwerk entschuldigt sich nie für eine Barriere, weil Elbwerk sie nicht bemerkt hat.

---

## 8. Elbwerk-Texte: Bewerbungsprozess

### 8.1 Schritt 1 — Stellenanzeige, Rahmen der Seite

| Schlüssel | Text |
| --- | --- |
| `elbwerk.nav.brand` | Elbwerk GmbH & Co. KG |
| `elbwerk.nav.items` | Unternehmen · Leistungen · Karriere · Kontakt |
| `elbwerk.logo.alt` | Elbwerk GmbH & Co. KG |
| `elbwerk.jobs.h2` | Offene Stellen |
| `elbwerk.job.title` | IT-Projektmanager (m/w/d) |
| `elbwerk.job.meta` | Vollzeit · Hamburg-Wilhelmsburg · ab sofort |
| `elbwerk.job.teaser` | Zur Verstärkung unserer IT suchen wir zum nächstmöglichen Zeitpunkt eine engagierte Persönlichkeit. |

**Zur Ebene in den Schlüsselnamen.** `elbwerk.jobs.h2` heißt historisch so, wird aber als
`h3` ausgezeichnet: Die Überschriftenebenen im Simulationsbereich sind in
`ARCHITECTURE.md` §5.6 festgelegt (Seiten-`h1` = Szenariotitel, Bereichsüberschrift = `h2`,
**Szenarioinhalt ab `h3`**) und gehen den Schlüsselnamen vor. „Offene Stellen" ist `h3`,
der Stellentitel `h4`, die Abschnitte innerhalb der Anzeige `h5`.

**Die Navigationspunkte sind keine Links.** Die Simulation hat nur die Seiten, die das
Szenario als Schritte kennt; ein Menüpunkt, der nirgendwohin führt, wäre eine Barriere,
die niemand erklärt hat, und ein Link-Attrappen-Element wäre eine zweite. `elbwerk.nav.items`
steht deshalb als Text in der Kopfzeile. Der Weg zum nächsten Schritt liegt im Rahmen
(`scenario.stepNav`, §5.3).

**Adresse in der Simulationsleiste** (`simBar.url`, §5.4): Jeder Schritt liefert den Pfad,
den die Leiste hinter `elbwerk.de` anzeigt.

| Schritt | Pfad |
| --- | --- |
| 1 — Stellenanzeige | `/karriere/it-projektmanager` |

Die Pfade der Schritte 2 bis 4 kommen mit ihren Slices hinzu.

**Das Elbwerk-Logo.** Eine Wort-Bild-Marke (Wortmarke „ELBWERK", darunter
„GMBH & CO. KG · HAMBURG", davor ein Signet) als SVG, selbst gehostet wie alle Assets
(`ARCHITECTURE.md` §16). Es trägt `elbwerk.logo.alt` als Alternativtext — Logotypen sind
von WCAG 1.4.5 ausdrücklich ausgenommen, und ein Firmenlogo mit korrektem Alternativtext
ist genau das, was eine gewöhnliche Unternehmensseite richtig macht. Das Logo ist **keine**
der Barrieren und wird auch nie eine: Barrieren dieses Szenarios sind ausschließlich die in
`PRD.md` §6.1 gelisteten.

### 8.2 Barriere „Stellenanzeige als PDF"

**Aktiv** — die Anzeige ist nur als Download verfügbar:

| Schlüssel | Text |
| --- | --- |
| `elbwerk.job.pdfIntro` | Die vollständige Stellenbeschreibung entnehmen Sie bitte dem beigefügten Dokument. |
| `elbwerk.job.pdfLink` | Stellenausschreibung_2026_IT-Projektmanagement_final_v3.pdf (412 KB) |

Der Dateiname ist die halbe Miete: `final_v3` mit Unterstrichen ist genau das, was in der
Realität hochgeladen wird. Kein erfundenes Negativbeispiel, sondern der Normalfall.

**Behoben** — dieselbe Information als Text auf der Seite, gegliedert mit Überschriften
der Ebene 3 und darunter (nie `h1`, siehe `ARCHITECTURE.md` §5.6). Das PDF bleibt
zusätzlich verlinkt, weil das der realistische barrierefreie Zustand ist: Das Dokument
verschwindet nicht, es ist nur nicht mehr der einzige Weg.

| Schlüssel | Text |
| --- | --- |
| `elbwerk.job.htmlNote` | Sie können die Stellenbeschreibung hier lesen oder als PDF herunterladen. |

### 8.3 Barriere „Komplexe Sprache"

Beide Fassungen enthalten denselben Sachinhalt. Der Unterschied liegt ausschließlich in
Satzbau, Wortwahl und Gliederung — das ist die Bedingung dafür, dass das Szenario
Sprachkomplexität misst und nicht Informationsmenge.

**Aktiv — verschachteltes Behördendeutsch**

> **Aufgabenprofil**
>
> Im Rahmen der Ihnen obliegenden Tätigkeit verantworten Sie die eigenverantwortliche
> Steuerung sämtlicher IT-seitiger Projektvorhaben unter Berücksichtigung der
> unternehmensinternen Prozessvorgaben sowie der einschlägigen fachbereichsseitigen
> Anforderungen, wobei die Sicherstellung einer termin- und budgetgerechten Umsetzung
> unter gleichzeitiger Wahrung der Qualitätsstandards als wesentlicher Erfolgsfaktor
> anzusehen ist.
>
> Darüber hinaus obliegt Ihnen die Abstimmung mit den beteiligten Fachabteilungen
> sowie externen Dienstleistern, wobei ein hohes Maß an Eigeninitiative und
> Durchsetzungsvermögen ebenso vorausgesetzt wird wie die Fähigkeit, auch in Situationen
> erhöhten Arbeitsaufkommens strukturiert und lösungsorientiert zu agieren.
>
> **Anforderungsprofil**
>
> Vorausgesetzt wird ein abgeschlossenes Studium der Informatik bzw. eine
> vergleichbare Qualifikation nebst einschlägiger mehrjähriger Berufserfahrung in der
> Leitung von IT-Projekten, wünschenswerterweise ergänzt um vertiefte Kenntnisse
> gängiger Projektmanagement-Methoden.

**Behoben — klare Sprache, gleicher Inhalt**

> **Ihre Aufgaben**
>
> Sie leiten unsere IT-Projekte von der Planung bis zum Abschluss. Dabei achten Sie auf
> die Termine, das Budget und die Qualität.
>
> Sie stimmen sich mit anderen Abteilungen und mit externen Dienstleistern ab. Auch wenn
> viel zu tun ist, behalten Sie den Überblick.
>
> **Das bringen Sie mit**
>
> - Ein abgeschlossenes Studium der Informatik oder eine vergleichbare Qualifikation
> - Mehrere Jahre Erfahrung in der Leitung von IT-Projekten
> - Erfahrung mit gängigen Projektmanagement-Methoden ist hilfreich, aber keine Bedingung

Vier Merkmale unterscheiden die Fassungen, und sie sind genau die, die im Modul benannt
werden können: kürzere Sätze, aktive statt passiver Konstruktionen, Verben statt
Nominalisierungen („Sie bearbeiten" statt „obliegt Ihnen die Abwicklung"), und Listen statt
Schachtelsätzen.

### 8.4 Schritt 2 — Bewerbungsformular

| Schlüssel | Text |
| --- | --- |
| `elbwerk.form.h2` | Online-Bewerbung |
| `elbwerk.form.intro` | Bitte füllen Sie das Formular vollständig aus. Mit * gekennzeichnete Felder sind Pflichtfelder. |
| `elbwerk.form.submit` | Bewerbung absenden |
| `elbwerk.form.privacy` | Mit dem Absenden stimmen Sie unseren Datenschutzhinweisen zu. |
| `elbwerk.form.simulationNote` | Diese Bewerbung wird nicht übertragen. Es werden keine Daten gespeichert. |

`elbwerk.form.simulationNote` gehört zu den **Simulationshinweisen** — der einen Textsorte,
die aus dem Rahmen in die Simulation hineinragt. Es sind drei:
`elbwerk.form.simulationNote`, `csr.donate.simulationNote` und `csr.social.disclaimer`.

Die Regel dahinter: Ein Simulationshinweis steht überall dort, wo jemand echte Daten
eingeben oder eine echte Handlung auslösen könnte. Er wird im Rahmenstil gesetzt, ist
unabhängig vom Barrierezustand immer vorhanden und wird nie zur Barriere gemacht. Kommt
später ein Szenario mit einem weiteren Eingabepunkt hinzu, braucht es dort ebenfalls einen.

**Felder** — Beschriftungen sind in beiden Zuständen identisch. Der Unterschied liegt in
der programmatischen Verknüpfung, nicht im Text:

| Feld | Beschriftung |
| --- | --- |
| Vorname | Vorname * |
| Nachname | Nachname * |
| E-Mail-Adresse | E-Mail-Adresse * |
| Telefon | Telefon |
| Frühester Eintritt | Frühester Eintrittstermin |
| Gehaltsvorstellung | Gehaltsvorstellung (brutto/Jahr) |
| Anschreiben | Anschreiben |
| Lebenslauf | Lebenslauf (PDF, max. 5 MB) * |

**Barriere „Fehlende Labels" aktiv:** Die sichtbaren Texte bleiben, sind aber als
`<div>` neben dem Feld platziert statt als `<label for>`. Der Text ändert sich nicht —
Screenreader-Nutzer hören „Eingabefeld, leer".

**Barriere „Keine Tastaturbedienung" aktiv:** Die Absende-Schaltfläche ist ein `<div>` mit
Klick-Handler. Beschriftung unverändert.

### 8.5 Barriere „Kein Fehler-Feedback"

**Aktiv** — eine einzige, technisch klingende Meldung am Seitenanfang, ohne Bezug zum
Feld, ohne `role="alert"`:

| Schlüssel | Text |
| --- | --- |
| `elbwerk.form.errorGeneric` | Fehler: Die Übermittlung konnte nicht durchgeführt werden. Bitte überprüfen Sie Ihre Eingaben. (Code 422) |

**Behoben** — Sammelmeldung mit Sprunglinks, plus Meldung am Feld, `aria-invalid`,
Fokus auf das erste fehlerhafte Feld:

| Schlüssel | Text |
| --- | --- |
| `elbwerk.form.errorSummary.h3` | Die Bewerbung konnte nicht abgesendet werden |
| `elbwerk.form.errorSummary.intro` | Bitte korrigieren Sie {count} Angaben: |
| `elbwerk.form.error.emailMissing` | Bitte geben Sie Ihre E-Mail-Adresse an. |
| `elbwerk.form.error.emailInvalid` | Diese E-Mail-Adresse enthält kein @. Bitte prüfen Sie die Schreibweise. |
| `elbwerk.form.error.lastNameMissing` | Bitte geben Sie Ihren Nachnamen an. |
| `elbwerk.form.error.cvMissing` | Bitte fügen Sie Ihren Lebenslauf als PDF bei. |
| `elbwerk.form.error.cvTooLarge` | Die Datei ist {size} groß. Erlaubt sind bis zu 5 MB. |

Der Kontrast ist der Lehrinhalt: „Code 422" gegen „enthält kein @". Beides sind
Fehlermeldungen. Nur eine sagt, was zu tun ist.

---

### 8.6 Schritt 1 — Barriere „Textgrafik"

**Aktiv:** Gehalt, Leistungen und Ablauf stehen ausschließlich in einer Grafik, ohne
Alternativtext oder mit einem nichtssagenden (`grafik_benefits_final.png`).

**Behoben:** dieselben Angaben als Text mit Überschrift und Liste; die Grafik bleibt als
`aria-hidden` Dekoration erhalten.

| Schlüssel | Text |
| --- | --- |
| `elbwerk.job.benefits.h3` | Was wir bieten |
| `elbwerk.job.benefits.items` | 30 Urlaubstage · Gleitzeit · Jobrad · Zuschuss zum Deutschlandticket · Betriebliche Altersvorsorge |
| `elbwerk.job.salary` | Vergütung nach Haustarif, Entgeltgruppe 11 (58.000 – 68.000 € brutto/Jahr) |
| `elbwerk.job.process.h3` | So geht es weiter |
| `elbwerk.job.process.items` | Online bewerben · Rückmeldung innerhalb von zwei Wochen · Gespräch per Video oder vor Ort · Start nach Absprache |
| `elbwerk.job.graphicAlt` | Leistungen, Vergütung und Ablauf der Bewerbung: 30 Urlaubstage, Gleitzeit, Jobrad, Zuschuss zum Deutschlandticket, betriebliche Altersvorsorge. Vergütung nach Haustarif, Entgeltgruppe 11 (58.000 – 68.000 € brutto/Jahr). Ablauf: online bewerben, Rückmeldung innerhalb von zwei Wochen, Gespräch per Video oder vor Ort, Start nach Absprache. |

Die Gehaltsangabe ist Absicht: Wenn ausgerechnet sie in einer Grafik steckt, ist die
Auswirkung unmittelbar einleuchtend.

**Der Ablauf gehört mit in die Grafik**, und zwar aus demselben Grund. `PRD.md` §6.1 nennt
für diese Barriere ausdrücklich *Gehalt, Benefits und Ablauf* — und der Ablauf ist die
Angabe, nach der man handelt: Wer nicht erfährt, dass eine Rückmeldung binnen zwei Wochen
kommt und das Gespräch auch per Video möglich ist, kann weder nachfassen noch die
Videovariante erfragen. Eine Barriere, die nur Beschreibendes verschluckt, unterschätzt den
Effekt; eine, die auch das Handlungsleitende verschluckt, trifft ihn.

Der Alternativtext deckt **alles** ab, was die Grafik enthält — Leistungen, Vergütung und
Ablauf. Ein Alternativtext, der nur einen Teil des Bildinhalts nennt, wäre selbst ein
Negativbeispiel, und ausgerechnet an der Stelle, an der das Modul zeigt, wie es richtig
geht.

**Wozu `elbwerk.job.graphicAlt` dient — und wo er nicht steht.** Er beschreibt, wie ein
korrekter Alternativtext für genau diese Grafik lauten würde, und ist damit Lehrmaterial
für den Erklärbereich und für die manuellen Prüfdurchgänge. Im behobenen Zustand wird er
**nicht** als `alt` ausgegeben: Dort stehen dieselben Angaben bereits als Text mit
Überschrift und Liste auf der Seite, und eine zusätzlich beschriftete Grafik ließe einen
Screenreader dieselbe Aufzählung zweimal vorlesen. Die Grafik wird deshalb dekorativ
(`alt=""` plus `aria-hidden="true"`) — der richtige Umgang mit einem Bild, dessen
Information vollständig danebensteht. Im aktiven Zustand fehlt das `alt`-Attribut ganz;
Screenreader lesen dann den Dateinamen vor, und `grafik_benefits_final.png` ist genau das,
was in der Realität hochgeladen wird.

**Die Grafik ist eine Rastergrafik (PNG), kein SVG.** Das ist kein Versehen: Ein SVG würde
beim Vergrößern scharf bleiben und damit die halbe Auswirkung wegnehmen. Verpixelnde
Buchstaben bei 400 % Zoom sind der Teil der Barriere, den sehende Teilnehmende am eigenen
Bildschirm nachvollziehen können.

### 8.7 Schritt 2 — Barriere „Pflichtfelder"

**Aktiv:** Pflichtfelder sind nur durch ein rotes Sternchen markiert, ohne Legende, ohne
`required`, ohne Erwähnung im Beschriftungstext.

**Behoben:** Legende über dem Formular, das Wort „Pflichtfeld" in der Beschriftung,
`required` gesetzt.

| Schlüssel | Text |
| --- | --- |
| `elbwerk.form.requiredLegend` | Mit „Pflichtfeld" gekennzeichnete Felder müssen ausgefüllt werden. |
| `elbwerk.form.requiredSuffix` | (Pflichtfeld) |

Der Kontrast: `Vorname *` gegen `Vorname (Pflichtfeld)`. Ein Screenreader liest im ersten
Fall „Vorname Stern" oder gar nichts.

### 8.8 Schritt 3 — Unterlagen hochladen

| Schlüssel | Text |
| --- | --- |
| `elbwerk.upload.h2` | Unterlagen hochladen |
| `elbwerk.upload.intro` | Bitte laden Sie Ihre vollständigen Bewerbungsunterlagen hoch. |
| `elbwerk.upload.cvLabel` | Lebenslauf |
| `elbwerk.upload.certLabel` | Zeugnisse |
| `elbwerk.upload.submit` | Unterlagen übermitteln |

**Barriere „Upload-Formate" aktiv:** keine Angabe, welche Formate und Größen zulässig sind;
Fehlermeldung erst nach dem Absenden, ohne Nennung des Grundes.

| Schlüssel | Text |
| --- | --- |
| `elbwerk.upload.errorGeneric` | Upload fehlgeschlagen. Bitte versuchen Sie es erneut. |

**Behoben:** Formate, Größe und Hinweis zur Struktur stehen vor dem Auswahlfeld.

| Schlüssel | Text |
| --- | --- |
| `elbwerk.upload.formatHint` | Zulässig sind PDF, DOCX und ODT bis 10 MB je Datei. |
| `elbwerk.upload.structureHint` | Bitte verwenden Sie in Ihren Dokumenten echte Überschriften statt vergrößerter Textzeilen. Das erleichtert uns die Auswertung — und Ihnen die Wiederverwendung. |
| `elbwerk.upload.error.format` | Die Datei „{name}" hat das Format {ext}. Zulässig sind PDF, DOCX und ODT. |
| `elbwerk.upload.error.size` | Die Datei „{name}" ist {size} groß. Erlaubt sind bis zu 10 MB. |

`elbwerk.upload.structureHint` ist die einzige Stelle, an der Elbwerk im behobenen Zustand
selbst etwas über Barrierefreiheit sagt. Das ist bewusst: Es zeigt, dass ein Unternehmen
Zugänglichkeit auch nach außen weitergeben kann, ohne belehrend zu wirken.

### 8.9 Schritt 4 — Rückmeldung

| Schlüssel | Text |
| --- | --- |
| `elbwerk.confirm.h2` | Ihre Bewerbung ist eingegangen |

**Barriere „Bestätigungstext" aktiv** — Textbaustein-Deutsch, zentrale Angaben nur in einer
Bildsignatur:

| Schlüssel | Text |
| --- | --- |
| `elbwerk.confirm.bodyComplex` | Wir bestätigen den Eingang Ihrer Bewerbungsunterlagen und danken Ihnen für Ihr Interesse an einer Tätigkeit in unserem Hause. Nach Abschluss der Sichtung sämtlicher eingegangener Bewerbungen werden wir uns unaufgefordert mit Ihnen in Verbindung setzen. Von zwischenzeitlichen Rückfragen zum Bearbeitungsstand bitten wir abzusehen. |
| `elbwerk.confirm.signatureImageAlt` | *(fehlt bei aktiver Barriere)* |

**Behoben** — klare Sprache, Angaben als Text:

| Schlüssel | Text |
| --- | --- |
| `elbwerk.confirm.bodyPlain` | Vielen Dank für Ihre Bewerbung. Wir haben Ihre Unterlagen erhalten. Wir sichten alle Bewerbungen bis zum 15. September und melden uns danach bei Ihnen. Sie müssen nichts weiter tun. |
| `elbwerk.confirm.nextSteps.h3` | Wie es weitergeht |
| `elbwerk.confirm.nextSteps.items` | Wir prüfen Ihre Unterlagen · Bei einer Einladung erhalten Sie eine E-Mail mit Terminvorschlägen · Das Gespräch dauert etwa eine Stunde und findet in Wilhelmsburg oder online statt |

**Barriere „Ansprechperson"** — aktiv: nur ein Verweis auf `bewerbung@elbwerk.de`, kein
Name, kein Telefon. Behoben:

| Schlüssel | Text |
| --- | --- |
| `elbwerk.confirm.contact.h3` | Ihre Ansprechperson |
| `elbwerk.confirm.contact.body` | Miriam Kessler, Personalabteilung. Telefon 040 555 0123, erreichbar montags bis donnerstags von 9 bis 15 Uhr. E-Mail: m.kessler@elbwerk.de |

**Barriere „Inklusionshinweis"** — aktiv: fehlt ersatzlos. Behoben:

| Schlüssel | Text |
| --- | --- |
| `elbwerk.confirm.inclusion.h3` | Sie brauchen etwas anderes? |
| `elbwerk.confirm.inclusion.body` | Wenn Sie für das Bewerbungsgespräch eine Anpassung benötigen — etwa Unterlagen in einem bestimmten Format, mehr Zeit, eine Gebärdensprachdolmetschung oder einen barrierefreien Zugang — sagen Sie uns einfach Bescheid. Das hat keinen Einfluss auf die Bewertung Ihrer Bewerbung. |

Der letzte Satz ist der wichtigste im ganzen Szenario. Ohne ihn ist der Hinweis eine Falle:
Wer nicht sicher ist, ob eine Anfrage ihm schadet, fragt nicht.

Beide Barrieren dieses Schritts verletzen **kein** WCAG-Kriterium. Der Erklärungsbereich
muss das ausdrücklich benennen (Abschnitt 5.8) — dass eine Seite normkonform sein und
trotzdem ausschließen kann, ist der Kern dieses Schritts.

---

## 9. Elbwerk-Texte: CSR-Kampagne

### 9.1 Seitenrahmen

| Schlüssel | Text |
| --- | --- |
| `csr.h2` | Gemeinsam für ein barrierefreies Wilhelmsburg |
| `csr.lead` | Mit der Aktion „Elbwerk hilft" unterstützen wir seit 2019 gemeinnützige Projekte in unserem Stadtteil. In diesem Jahr sammeln wir für die Ausstattung des Nachbarschaftstreffs an der Veringstraße. |
| `csr.videoCaption` | Elbwerk hilft 2026: Der Nachbarschaftstreff stellt sich vor (2:14 Min.) |

### 9.2 Kombinierte Barriere „Video"

**Aktiv:** `<video>` ohne `<track>`, ohne Transkript.

**Teil „Untertitel" behoben:** WebVTT-Untertitelspur vorhanden.

| Schlüssel | Text |
| --- | --- |
| `csr.video.captionTrackLabel` | Deutsch (Untertitel) |

**Teil „Transkript" behoben:** aufklappbares Transkript unter dem Video.

| Schlüssel | Text |
| --- | --- |
| `csr.video.transcriptToggle` | Transkript anzeigen |
| `csr.video.transcriptToggleClose` | Transkript ausblenden |
| `csr.video.transcriptHeading` | Transkript des Videos |

**Wenn nur ein Teil behoben ist,** zeigt der Rahmen (nicht Elbwerk) den Hinweis aus
`panel.combinedHint`. Elbwerk selbst kommentiert das nicht — ein Unternehmen, das die
Lücke bemerkt hätte, hätte sie geschlossen.

### 9.3 Barriere „Spendenstand"

| Schlüssel | Text |
| --- | --- |
| `csr.progress.label` | Spendenstand |
| `csr.progress.text` | 8.400 € von 12.000 € erreicht — 70 Prozent |
| `csr.progress.remaining` | Noch 3.600 € bis zum Ziel |

**Aktiv:** nur die Balkengrafik, ohne `role`, ohne Textalternative. Der Prozentwert steht
ausschließlich als Beschriftung *innerhalb* der Grafik.
**Behoben:** Der Text steht als eigenes Element neben dem Balken, der Balken ist
`aria-hidden`. Kein `role="progressbar"` mit ARIA-Werten — der einfachere und
verlässlichere Weg ist sichtbarer Text.

### 9.4 Barriere „Social-Media-Einbettung"

| Schlüssel | Text |
| --- | --- |
| `csr.social.h3` | Aus unserem Instagram-Feed |
| `csr.social.disclaimer` | Nachbildung einer Social-Media-Einbettung. Es werden keine Daten an Dritte übertragen. |
| `csr.social.post1.alt` | Zwölf Mitarbeitende von Elbwerk stehen mit Malerrollen vor der frisch gestrichenen Wand des Nachbarschaftstreffs. |
| `csr.social.post1.overlay` | Aktionstag im Treff |
| `csr.social.post2.alt` | Eine Frau übergibt einen symbolischen Spendenscheck über 2.000 Euro an zwei Vertreterinnen des Nachbarschaftstreffs. |
| `csr.social.post2.overlay` | 2.000 € übergeben |
| `csr.social.post3.alt` | Kinder sitzen an einem langen Tisch im Nachbarschaftstreff und basteln. |
| `csr.social.post3.overlay` | Bastelnachmittag |

**Aktiv:** `alt` fehlt, Overlay-Text in `--sim-fail-text` (2,92:1).
**Behoben:** `alt` gesetzt, Overlay in `--sim-text` auf abgedunkeltem Verlauf.

Die Alternativtexte sind bewusst beschreibend und nicht interpretierend — sie taugen als
Muster für das, was das Modul lehrt.

### 9.5 Barriere „Countdown"

| Schlüssel | Text |
| --- | --- |
| `csr.countdown.label` | Die Aktion endet in |
| `csr.countdown.value` | {days} Tage, {hours} Stunden, {minutes} Minuten |
| `csr.countdown.units` | Tage · Stunden · Minuten |
| `csr.countdown.ended` | Die Aktion ist beendet. Vielen Dank für Ihre Unterstützung. |

**Aktiv:** Zahlenblöcke ohne `aria-live`, Aktualisierung im Sekundentakt.
**Behoben:** `aria-live="polite"`, Aktualisierung der Ansage im Minutentakt statt
sekündlich — sonst redet die Live-Region dauernd dazwischen. Die sichtbare Anzeige läuft
weiter im Sekundentakt.

Dieser Unterschied ist selbst lehrreich: Eine Live-Region einzubauen genügt nicht, sie
muss auch die richtige Frequenz haben.

Der Minutentakt ist zugleich technisch notwendig. Der behobene Countdown ist die einzige
Live-Region außerhalb des Rahmens (`ARCHITECTURE.md` §12.2). Liefe sie sekündlich, spräche
sie über jede Bestätigung aus Abschnitt 5.7 hinweg, und beide Ansagen wären wertlos.

### 9.6 Barriere „Spendenformular"

| Schlüssel | Text |
| --- | --- |
| `csr.donate.h3` | Jetzt spenden |
| `csr.donate.amountLabel` | Betrag in Euro |
| `csr.donate.presets` | 10 € · 25 € · 50 € · 100 € |
| `csr.donate.customLabel` | Anderer Betrag |
| `csr.donate.submit` | Spende bestätigen |
| `csr.donate.simulationNote` | Es wird keine Spende ausgelöst. Dies ist eine Nachbildung. |

**Aktiv:** nur ein ziehbarer Regler, nicht fokussierbar, kein Zahlenwert als Text.
**Behoben:** beschriftetes Zahlenfeld plus Voreinstellungs-Schaltflächen; der Regler bleibt
als zusätzliche Option und ist tastaturbedienbar.

### 9.7 Barriere „Testimonial-Karussell"

| Schlüssel | Text |
| --- | --- |
| `csr.carousel.h3` | Stimmen aus dem Stadtteil |
| `csr.carousel.pause` | Automatischen Wechsel anhalten |
| `csr.carousel.play` | Automatischen Wechsel fortsetzen |
| `csr.carousel.position` | Beitrag {current} von {total} |
| `csr.carousel.quote1` | „Ohne die Unterstützung hätten wir den Treff im Winter schließen müssen." — Regina Ohlsen, Leiterin des Nachbarschaftstreffs |
| `csr.carousel.quote2` | „Meine Kinder gehen zweimal die Woche zur Hausaufgabenhilfe. Das ist Gold wert." — Aylin Demir, Anwohnerin |
| `csr.carousel.quote3` | „Wir kommen aus dem Stadtteil. Da hilft man sich." — Torben Kruse, Elbwerk GmbH & Co. KG |

**Aktiv:** Wechsel alle vier Sekunden, keine Pause-Schaltfläche.
**Behoben:** Pause-Schaltfläche als erstes Element der Gruppe, Positionsanzeige, Wechsel
stoppt bei Fokus oder Zeigerkontakt.

Bei `prefers-reduced-motion` greift in beiden Zuständen der Hinweis aus Abschnitt 5.9 und
der automatische Wechsel unterbleibt.

---

### 9.8 Barriere „Anglizismen und Leichte Sprache"

**Aktiv** — Kampagnentext im Marketing-Jargon:

> Mit unserem Purpose-driven Impact-Programm committen wir uns zu nachhaltigem
> Stakeholder-Value. Unsere Diversity-&-Inclusion-Roadmap adressiert Barrieren im
> Community-Umfeld und schafft messbare Social Impact-KPIs entlang der gesamten
> Wertschöpfungskette.

**Behoben** — verständliche Fassung plus eigenständige Fassung in Leichter Sprache:

> Wir unterstützen Projekte in unserem Stadtteil. In diesem Jahr sammeln wir Geld für den
> Nachbarschaftstreff an der Veringstraße. Dort treffen sich Menschen aus dem Viertel, es
> gibt Hausaufgabenhilfe und einen Mittagstisch.

| Schlüssel | Text |
| --- | --- |
| `csr.plainLanguage.toggle` | Diesen Text in Leichter Sprache lesen |
| `csr.plainLanguage.h3` | Die Aktion in Leichter Sprache |
| `csr.plainLanguage.body` | Elbwerk ist eine Firma in Hamburg. Elbwerk sammelt Geld. Das Geld ist für den Nachbarschafts-Treff. Der Treff ist ein Haus im Stadt-Teil Wilhelmsburg. Dort treffen sich Menschen. Kinder bekommen Hilfe bei den Haus-Aufgaben. Es gibt jeden Tag ein warmes Mittag-Essen. Der Treff braucht neue Stühle und Tische. Dafür sammeln wir 12.000 Euro. |

Leichte Sprache ist kein vereinfachter Fließtext, sondern ein eigenes Regelwerk: kurze
Sätze, ein Gedanke pro Satz, Bindestriche in zusammengesetzten Wörtern, keine Metaphern.
Die Fassung oben folgt diesen Regeln annähernd — sie ist ein Platzhalter und **muss** vor
Veröffentlichung von einer Fachstelle für Leichte Sprache geprüft werden. Eine schlecht
gemachte Fassung ist in einem Modul über Barrierefreiheit schlimmer als keine.

### 9.9 Barriere „Emojis"

**Aktiv** — Emojis tragen die Information, statt sie zu begleiten:

| Schlüssel | Text |
| --- | --- |
| `csr.social.emojiPost` | Aktionstag im Treff 🎉🎉🎉 Schon 8️⃣0️⃣% 🙌 Jetzt mitmachen 👉 Link in Bio ❤️♿ |

Ein Screenreader liest daraus: *„Party-Popper, Party-Popper, Party-Popper, Schon,
Ziffer acht, Ziffer null, Prozent, erhobene Hände, Jetzt mitmachen, nach rechts zeigende
Hand, Link in Bio, rotes Herz, Rollstuhlsymbol."* Die Prozentzahl ist verloren, das
Rollstuhlsymbol soll Inklusion signalisieren und ist nicht einmal beschriftet.

**Behoben:**

| Schlüssel | Text |
| --- | --- |
| `csr.social.plainPost` | Aktionstag im Nachbarschaftstreff: Wir haben 80 Prozent des Spendenziels erreicht. Machen Sie mit — der Link steht in unserem Profil. 🎉 |

Ein Emoji bleibt stehen. Das ist Absicht: Die Lehre ist nicht „Emojis sind schlecht",
sondern „Emojis dürfen keine Information tragen". Ein schmückendes Emoji nach einem
vollständigen Satz ist unproblematisch.

### 9.10 Barriere „Event-Angaben"

**Aktiv** — die Einladung nennt Ort und Zeit, sonst nichts:

| Schlüssel | Text |
| --- | --- |
| `csr.event.h3` | Podiumsdiskussion „Inklusiv. Nachhaltig. Sichtbar." |
| `csr.event.basics` | Donnerstag, 24. September 2026, 18 Uhr, Nachbarschaftstreff Veringstraße, Hamburg-Wilhelmsburg |
| `csr.event.registration` | Anmeldung bis zum 20. September per E-Mail an event@elbwerk.de |

**Behoben** — die Angaben, die über eine Teilnahme entscheiden:

| Schlüssel | Text |
| --- | --- |
| `csr.event.access.h4` | Barrierefreiheit der Veranstaltung |
| `csr.event.access.items` | Stufenloser Zugang über den Haupteingang, Aufzug vorhanden · Barrierefreie Toilette im Erdgeschoss · Gebärdensprachdolmetschung (DGS) durchgehend · Schriftdolmetschung auf einer Leinwand neben dem Podium · Induktive Höranlage im Saal · Reservierte Plätze in der ersten Reihe für Rollstuhlnutzende und für Menschen, die auf gute Sicht zur Dolmetschung angewiesen sind |
| `csr.event.access.contact` | Sie brauchen etwas, das hier nicht steht? Melden Sie sich bei Torben Kruse, Telefon 040 555 0188. Wir versuchen es möglich zu machen. |

Dies ist die zweite organisatorische Barriere im Werkzeug und die anschaulichste: Es fehlt
keine Zeile Code. Es fehlt eine Information, die jemand hätte aufschreiben müssen — und
ohne die eine gehörlose Person nicht weiß, ob sie hingehen kann.

---

## 10. Offene Punkte

| Punkt | Wer entscheidet |
| --- | --- |
| Fachliche Freigabe aller Elbwerk-Texte | WERTE.IT-Team |
| Erklärtexte je Barriere (Abschnitt 5.8 liefert nur die Rubriken) | WERTE.IT-Team |
| ~~Prüfung „Elbwerk" gegen Handelsregister und DPMA~~ — erledigt: Eine `Elbwerk GmbH` existiert. Die Firma heißt jetzt `Elbwerk GmbH & Co. KG`, und die gibt es nicht (`DESIGN.md` §2.1) | Philipp — geschlossen |
| Sind die Personennamen in den Testimonials unbedenklich, oder sollen sie neutraler werden? | WERTE.IT-Team |
| Transkripttext des Kampagnenvideos — hängt am Videomaterial (`PRD.md` §10) | WERTE.IT-Team |
| **Prüfung der Fassung in Leichter Sprache (Abschnitt 9.8) durch eine Fachstelle.** Der Entwurf folgt den Regeln nur annähernd. Eine schlecht gemachte Fassung ist in einem Modul über Barrierefreiheit schlimmer als keine. | WERTE.IT-Team / Fachstelle |
| Namen und Kontaktdaten der fiktiven Ansprechpersonen (Miriam Kessler, Torben Kruse) — sollen sie so bleiben oder neutraler werden? | WERTE.IT-Team |
| Soll die Stellenanzeige eine reale BSVH-nahe Tätigkeit abbilden oder bewusst neutral bleiben? | WERTE.IT-Team |

**Ein Hinweis zur Prüfung.** Die beiden Sprachfassungen in Abschnitt 8.3 sind der einzige
Ort, an dem das Werkzeug eine inhaltliche Behauptung aufstellt, die es selbst nicht
beweisen kann: dass die zweite Fassung tatsächlich leichter verständlich ist. Automatisiert
ist das nicht prüfbar (`TESTING.md` §16). Wenn das WERTE.IT-Team Kontakt zu Personen mit
Lernbehinderung oder geringer Literalität hat, wäre eine kurze Rückmeldung zu diesen zwei
Absätzen wertvoller als jedes weitere Review durch Fachleute.

---

## 11. Verweise

- `docs/DESIGN.md` §7 — Textprinzipien, hier ausformuliert und in Abschnitt 4 präzisiert
- `docs/ARCHITECTURE.md` §5 — Grenze zwischen Rahmen und Simulation
- `docs/TESTING.md` §6 — die strukturellen Prüfungen, die auf diesen Varianten aufsetzen
- `docs/PRD.md` §8.1 F — Anforderung an die Erklärtexte
- `docs/SPEC_v1.md` — Umsetzungsschnitte für Phase 1
