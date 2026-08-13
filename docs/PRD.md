# PRD — AccessIssue

**Projekt:** AccessIssue
**Kontext:** Forschungsprojekt WERTE.IT — Modul 1 „Grundlagen digitaler Barrierefreiheit", Kapitel 3 „Drei Praxisbeispiele aus dem Unternehmensalltag"
**Auftraggeber-Kontext:** BSVH (Blinden- und Sehbehindertenverein Hamburg)
**Status:** Entwurf v2.1 — CSR-Kampagne vorgezogen, ohne Video
**Stand:** August 2026

---

## 1. Problemstellung

Digitale Barrierefreiheit wird in Unternehmen und öffentlichen Stellen überwiegend als abstraktes Compliance-Thema wahrgenommen — eine Liste von Normen, für die „jemand anderes" zuständig ist. Teilnehmende eines Sensibilisierungsmoduls können nicht nachvollziehen, was eine Barriere konkret bedeutet, solange sie nur beschrieben wird: Der Satz „ein PDF ohne Tag-Struktur ist für Screenreader unbrauchbar" erzeugt keine Betroffenheit.

Kapitel 3 des Moduls arbeitet deshalb mit Praxisbeispielen. Ohne ein interaktives Werkzeug bleiben diese Beispiele Text auf Folien — der Unterschied zwischen „barrierebehaftet" und „barrierefrei" wird behauptet, aber nicht gezeigt.

**Kosten des Nichtstuns:** Das Sensibilisierungsziel des Moduls wird verfehlt. Teilnehmende verlassen das Modul mit Regelwissen, aber ohne die Einsicht, dass ihre eigenen alltäglichen Entscheidungen (ein PDF hochladen, ein Formular bestellen, ein Kampagnenvideo produzieren) Barrieren erzeugen.

---

## 2. Zielgruppen

| Persona | Beschreibung | Was sie vom Tool brauchen |
| --- | --- | --- |
| **Modul-Teilnehmende ohne Behinderung** | Mitarbeitende aus Unternehmen und öffentlichen Stellen, meist ohne Vorwissen | Barrieren selbst *erleben*, nicht nur darüber lesen |
| **Modul-Teilnehmende mit Behinderung** | u. a. blinde und sehbehinderte Personen (Kernzielgruppe des BSVH) | Barrieren *verstehen* können, ohne durch die Simulation selbst ausgeschlossen zu werden |
| **Dozierende / WERTE.IT-Team** | Erstellen die Modulfolien und begleiten Schulungen | Reproduzierbare Zustände für Screenshots, verlinkbare Einstiegspunkte |
| **Redaktion WERTE.IT** | Liefert die Fachinhalte | Klar definierte Textbausteine pro Barriere |

---

## 3. Ziele

1. **Barrieren erlebbar machen** — Jede Barriere lässt sich einzeln und unmittelbar zwischen „barrierebehaftet" und „barrierefrei" umschalten, sodass der Unterschied direkt sichtbar wird.
2. **Barrieren einordnen** — Jede Barriere ist mit Erklärung, betroffenen Nutzergruppen und Normbezug (WCAG 2.2, BITV 2.0, EN 301 549, BFSG) hinterlegt. Teilnehmende können das Erlebte auf die Rechtslage abbilden.
3. **Breite statt Klischee** — Die Barrieren decken visuelle, auditive, motorische, kognitive und situative Einschränkungen ab und widerlegen die Gleichsetzung „Barrierefreiheit = Blinde + Screenreader".
4. **Selbst vollständig barrierefrei** — Das Tool ist auch für Menschen mit Behinderung vollständig nutzbar, gerade wenn Barrieren aktiv geschaltet sind.
5. **Als Foliengrundlage nutzbar** — Jeder Zustand ist über eine URL reproduzierbar und damit für Screenshots und Deep-Links aus Moodle heraus verwendbar.
6. **Erweiterbar** — Weitere Szenarien lassen sich ergänzen, ohne die Architektur zu ändern.

---

## 4. Nicht-Ziele

| Nicht-Ziel | Begründung |
| --- | --- |
| Kein echter Bewerbungs- oder Spendenprozess | Reine Simulation. Kein Backend, keine Datenverarbeitung, keine Übermittlung von Eingaben. |
| Keine Simulation von Hilfsmitteln (kein eingebauter Screenreader-Emulator, keine Sehbehinderungs-Filter) | Hilfsmittel sind Thema von Kapitel 2. Eine glaubwürdige Simulation wäre ein eigenes Projekt und pädagogisch riskant. |
| Keine Lernerfolgskontrolle, kein Quiz, kein Fortschrittsspeicher pro Nutzer | Bleibt in Moodle. Ohne Backend ohnehin nicht sinnvoll umsetzbar. |
| Keine Mehrsprachigkeit | Modul ist deutschsprachig. |
| Kein Tracking, keine Analytics | Datensparsamkeit. Grobe Zugriffszahlen liefert der Hosting-Anbieter. |
| Keine iframe-Einbettung in Moodle | Es wird nur verlinkt. Spart Fokus- und Scroll-Probleme. |
| Kein separater Präsentations- oder Screenshot-Modus | Screenshots entstehen aus der normalen Ansicht; State-in-URL reicht zur Reproduktion. |
| Keine vollständige WCAG-Abdeckung | Kuratierte, didaktisch ausgewählte Beispiele — kein Kriterienkatalog. |

---

## 5. Zentrales Gestaltungsprinzip: Simulationsbereich vs. Rahmen

Das Tool soll Barrieren zeigen **und** selbst barrierefrei sein. Dieser scheinbare Widerspruch wird durch eine strikte Trennung aufgelöst:

- **Der Rahmen** (Navigation, Barriere-Panel, Erklärtexte, Zurücksetzen) ist **immer und ausnahmslos** barrierefrei. Er wird nie Teil der Simulation.
- **Der Simulationsbereich** ist klar abgegrenzt, als solcher ausgezeichnet und angekündigt. Nur hier treten Barrieren auf.
- **Jede Barriere hat eine textliche Entsprechung**, die auch dann zugänglich bleibt, wenn die Barriere aktiv ist. Ein sehender Nutzer *erlebt* die Barriere, ein blinder Nutzer *versteht* sie — beide lernen dasselbe.
- **Der Ausstieg ist immer möglich:** Aus jedem Zustand heraus erreichbares Zurücksetzen; keine Tastaturfallen, kein Zustand, aus dem man nicht herauskommt.

Ein Tool über digitale Teilhabe, das Teilhabe verweigert, wäre inhaltlich nicht vertretbar.

---

## 6. Szenarien

Die drei Szenarien folgen der Reihenfolge des Moduls (Folien 16–32) und spielen alle in
**derselben Organisation** — der fiktiven Elbwerk KG. Das ist keine Kulisse, sondern die
Kernaussage von Kapitel 3: Barrierefreiheit ist keine Aufgabe eines Fachbereichs.

### 6.0 Verantwortungsbereiche

Jede Barriere ist einem Fachbereich zugeordnet. Das Modul stellt diesen Bezug in den Mittelpunkt:

> „Die Frage ist nicht, wer einen Fehler gemacht hat, sondern an welcher Stelle im
> gemeinsamen Prozess eine Barriere entstanden ist." (Folie 17)

| Bereich | Rolle laut Modul |
| --- | --- |
| **Personal** | gestaltet den Bewerbungsprozess, legt fest, welche Angaben nötig sind |
| **Kommunikation** | entwickelt Texte, Bilder und Inhalte |
| **IT** | stellt die technische Plattform bereit |
| **Beschaffung** | organisiert das Vergabeverfahren, bewertet Angebote |
| **Management** | verankert Zuständigkeit und Verbindlichkeit |

Die Zuordnung ist im Panel sichtbar. Wer alle Barrieren eines Szenarios behebt, sieht, dass
sie aus mehreren Bereichen stammen — keiner hätte das Problem allein lösen können. Das
trägt die didaktische Botschaft stärker als jeder Erklärtext.

### 6.1 Bewerbungsprozess (Priorität 1)

Vierstufiger Flow nach der Modulgrafik (Folie 19): Stellenanzeige → Bewerbungsformular →
Dokumente → Kommunikation → *Bewerbung scheitert*. Der Flow macht sichtbar, wie sich
Barrieren **kumulieren**: einzeln ärgerlich, zusammen führen sie zum Abbruch.

**Leitperspektive:** ein blinder Bewerber, der einen Screenreader nutzt (Folie 17). Die
Barrieren betreffen darüber hinaus weitere Gruppen — die Perspektive fokussiert, sie
verengt nicht.

**Schritt 1 — Stellenanzeige**

| Barriere | Bereich | Betroffene Nutzergruppen | Normbezug (vorläufig) |
| --- | --- | --- | --- |
| Wichtige Angaben (Gehalt, Benefits, Ablauf) ausschließlich als Textgrafik | Kommunikation | blinde und sehbehinderte Personen, Nutzer mit Vergrößerung | WCAG 1.1.1, 1.4.5 |
| Stellenbeschreibung in zu komplexer Sprache | Kommunikation | kognitive Einschränkungen, Lernbehinderungen, Nicht-Muttersprachler, geringe Literalität | WCAG 3.1.5 |

**Schritt 2 — Bewerbungsformular**

| Barriere | Bereich | Betroffene Nutzergruppen | Normbezug (vorläufig) |
| --- | --- | --- | --- |
| Fehlende Beschriftungen an den Formularfeldern | IT | blinde und sehbehinderte Personen, Spracheingabe-Nutzer | WCAG 1.3.1, 3.3.2, 4.1.2 |
| Keine vollständige Tastaturbedienung | IT | motorische Einschränkungen, Screenreader-Nutzer, temporäre Einschränkungen | WCAG 2.1.1, 2.1.2 |
| Pflichtfelder nur farblich gekennzeichnet, ohne Erläuterung | Personal | Farbfehlsichtige, Screenreader-Nutzer, kognitive Einschränkungen | WCAG 1.4.1, 3.3.2 |
| Kein Fehler-Feedback bei ungültiger Eingabe | IT | alle Gruppen, besonders kognitive Einschränkungen und Screenreader-Nutzer | WCAG 3.3.1, 3.3.3 |

**Schritt 3 — Dokumente**

| Barriere | Bereich | Betroffene Nutzergruppen | Normbezug (vorläufig) |
| --- | --- | --- | --- |
| Stellenausschreibung nur als barrierebehaftetes PDF ohne Tag-Struktur | Personal | blinde und sehbehinderte Personen, mobile Nutzung | WCAG 1.3.1, 1.3.2, 4.1.2 |
| Upload akzeptiert nur ein Format, ohne Angabe der zulässigen Formate und Größen | Personal | alle Gruppen, besonders Screenreader-Nutzer und kognitive Einschränkungen | WCAG 3.3.2 |

**Schritt 4 — Kommunikation**

| Barriere | Bereich | Betroffene Nutzergruppen | Normbezug (vorläufig) |
| --- | --- | --- | --- |
| Bestätigungsseite in Textbaustein-Deutsch, zentrale Angaben nur in einer Bildsignatur | Kommunikation | blinde Personen, kognitive Einschränkungen, geringe Literalität | WCAG 1.1.1, 3.1.5 |
| Keine namentliche Ansprechperson für Rückfragen | Personal | alle Gruppen — **kein WCAG-Bezug**, siehe unten | — |
| Kein Hinweis darauf, dass Anpassungen im Verfahren möglich sind | Personal | alle Gruppen — **kein WCAG-Bezug**, siehe unten | — |

**Zwei Barrieren ohne Normbezug — und das ist Absicht.** Fehlende Ansprechperson und
fehlender Inklusionshinweis verletzen kein WCAG-Erfolgskriterium. Sie sind organisatorische
Versäumnisse, keine technischen. Das Modul nennt sie ausdrücklich (Folie 19), und sie sind
didaktisch besonders wertvoll: Sie zeigen, dass ein normkonformes Angebot trotzdem
ausschließen kann. Ein Werkzeug, das nur normbezogene Barrieren kennt, würde genau die
Botschaft verfehlen, dass Barrierefreiheit mehr ist als Konformität.

Konsequenz fürs Datenmodell: `standards` darf leer sein, wenn die Barriere als
organisatorisch markiert ist (`ARCHITECTURE.md` §6).

### 6.2 CSR-Kampagne (Priorität 2)

Kampagnen-Landingpage unter dem Motto **„Inklusiv. Nachhaltig. Sichtbar."** (Folie 27).
Kanäle laut Modul: Landingpage, Social Media, Broschüren, öffentliches Event mit
Podiumsdiskussion. Bewusst medienreicher als die anderen Szenarien — daher die meisten
Barrieren. Die Ironie ist der Punkt: Eine Kampagne über Inklusion, die nicht alle erreicht.

**Ohne Video.** Das Kampagnenvideo entfällt in dieser Fassung — es liegt kein Material vor,
und ein Video ohne Untertiteldatei und Transkript hätte keinen barrierefreien Zustand
(`PRD.md` §10). Falls später Material kommt, lässt es sich als weitere Barriere ergänzen;
die Architektur steht dem nicht im Weg. Die Folge für das didaktische Konzept ist in §6.4
behandelt.

Die Barrieren folgen den fünf Bereichen, die Folie 29 nennt:

**Bereich 1 — Kampagnenseite**

| Barriere | Bereich | Betroffene Nutzergruppen | Normbezug (vorläufig) |
| --- | --- | --- | --- |
| Navigation nur mit der Maus bedienbar, kein sichtbarer Fokus | IT | motorische Einschränkungen, blinde Personen, Tastaturnutzer | WCAG 2.1.1, 2.4.7 |

**Bereich 2 — Texte und Inhalte** *(kombinierte Barriere, 2 Teile)*

| Teilbarriere | Bereich | Betroffene Nutzergruppen | Normbezug (vorläufig) |
| --- | --- | --- | --- |
| Kampagnentext voller Anglizismen und Marketingjargon | Kommunikation | kognitive Einschränkungen, geringe Literalität, Nicht-Muttersprachler | WCAG 3.1.5 |
| Keine Fassung in Leichter Sprache | Kommunikation | Menschen mit Lernbehinderung, geringe Literalität | BITV 2.0 § 3 |

Das Beheben nur des ersten Teils erzeugt verständliches Deutsch — das ist **nicht** dasselbe
wie Leichte Sprache, und für einen Teil der Zielgruppe reicht es nicht. Zwei verschiedene
Normen, zwei verschiedene Gruppen.

**Bereich 3 — Medien**

| Barriere | Bereich | Betroffene Nutzergruppen | Normbezug (vorläufig) |
| --- | --- | --- | --- |
| Bilder der Social-Media-Einbettung ohne Alternativtexte | Kommunikation | blinde und sehbehinderte Personen | WCAG 1.1.1 |
| Emojis ersetzen Wörter, statt sie zu ergänzen | Kommunikation | blinde Personen, kognitive Einschränkungen | WCAG 1.1.1 |
| Text-Overlay auf Bildern mit unzureichendem Kontrast | Kommunikation | Sehbehinderung, Farbfehlsichtige, ältere Nutzer | WCAG 1.4.3 |

**Bereich 4 — Event und Podiumsdiskussion** *(kombinierte Barriere, 3 Teile)*

| Teilbarriere | Bereich | Betroffene Nutzergruppen | Normbezug (vorläufig) |
| --- | --- | --- | --- |
| Einladung nur als PDF zum Download | Kommunikation | blinde und sehbehinderte Personen, mobile Nutzung | WCAG 1.3.1, 4.1.2 |
| Keine Gebärdensprachdolmetschung angeboten | CSR | gehörlose Personen | — organisatorisch |
| Zugang nur über Stufen, keine Angabe dazu auf der Seite | CSR | Rollstuhlnutzende, Menschen mit Gehbehinderung, Eltern mit Kinderwagen | — organisatorisch |

Dies ist die stärkste kombinierte Barriere des Werkzeugs: Drei Teile, drei verschiedene
Behinderungsarten, und das Beheben eines Teils hilft der jeweils anderen Gruppe nicht. Wer
die Einladung barrierefrei macht, aber die Stufen lässt, hat eine gut lesbare Einladung zu
einer Veranstaltung, die man nicht betreten kann.

**Der dritte Teil ist zugleich der einzige Fall, in dem das Werkzeug eine physische Barriere
zeigt.** Das ist Absicht. Eine CSR-Kampagne über Inklusion, die in einem Gebäude mit Stufen
stattfindet, ist ein realistischer und lehrreicher Fall — und er macht deutlich, dass die
digitale Barriere (die Seite verschweigt den Zugang) und die physische (es gibt keine Rampe)
zusammengehören.

**Bereich 5 — Spendenaufruf**

| Barriere | Bereich | Betroffene Nutzergruppen | Normbezug (vorläufig) |
| --- | --- | --- | --- |
| Spenden-Fortschrittsbalken als reine Grafik ohne Textalternative | IT | blinde und sehbehinderte Personen | WCAG 1.1.1, 4.1.2 |
| Countdown ohne geeignete Live-Region | IT | blinde und sehbehinderte Personen, kognitive Einschränkungen | WCAG 4.1.3, 2.2.1 |
| Spendenformular mit reinem Slider ohne Zahleneingabe und ohne Tastatur-Äquivalent | IT | motorische Einschränkungen, Tastatur- und Screenreader-Nutzer, Tremor | WCAG 2.1.1, 2.5.7 |
| Automatisch scrollendes Testimonial-Karussell ohne Pause-Steuerung | IT | kognitive Einschränkungen, Aufmerksamkeitsstörungen, vestibuläre Störungen | WCAG 2.2.2 |

Die vier Barrieren dieses Bereichs stammen nicht aus dem Modul, sondern aus unserer eigenen
Konzeption. Sie bleiben, weil sie Barrierearten abdecken, die sonst im ganzen Werkzeug
fehlen würden — Bewegung, Zeitdruck, Zeigergesten, Live-Aktualisierung. Für die Folien sind
sie zusätzlicher Stoff, kein Widerspruch: Das Werkzeug darf konkreter sein als die
Präsentation, solange es ihr nicht widerspricht.

**Hinweis zu den Normbezügen.** Alle Angaben sind vorläufig und vom WERTE.IT-Team fachlich
zu bestätigen. Ein Punkt ist bereits korrigiert: Der Spenden-Slider war zunächst 2.5.1
(„Zeigergesten") zugeordnet, das aber pfadbasierte Gesten wie Wischen meint. Einschlägig
ist **2.5.7 „Ziehbewegungen"**, neu in WCAG 2.2 — was per Ziehen bedienbar ist, muss auch
ohne Ziehen bedienbar sein. Da das Modul Unternehmen die Rechtslage erklärt, ist ein
falscher Paragraf ein inhaltlicher Fehler, kein Formalismus. Die übrigen Bezüge sollten bei
der Redaktion ebenfalls gegen 2.2 geprüft werden, nicht gegen 2.1.

Der Normbezug **BITV 2.0 § 3** für die Leichte-Sprache-Barriere gilt unmittelbar nur für
öffentliche Stellen. Elbwerk ist ein Unternehmen. Der Erklärtext muss das benennen, statt
einen Paragrafen zu zitieren, der auf den dargestellten Fall nicht direkt anwendbar ist —
sonst lehrt das Modul eine Rechtslage, die es so nicht gibt.

### 6.3 Softwarebeschaffung (Priorität 3)

Beschaffung eines **Ticketsystems für den IT-Support** (Folie 22–25). Ausgewählt wurde nach
Funktionsumfang, Benutzerfreundlichkeit, technischer Integration und Kosten —
Barrierefreiheit war kein Kriterium. Betroffen sind eine blinde Mitarbeiterin
(Screenreader), ein Kollege mit Sehbehinderung (Vergrößerung) und weitere Beschäftigte, die
sich eine übersichtlichere Oberfläche wünschen.

**Zweiteiliger Aufbau, und darin liegt der didaktische Kern:** Der Nutzer sieht erst die
Beschaffungsunterlagen, dann das eingekaufte System. Die Barrieren im zweiten Teil lassen
sich nur beheben, wenn die Entscheidungen im ersten Teil anders getroffen wurden. Das macht
den zentralen Satz des Moduls räumlich erfahrbar: *Die Ursache liegt früher als das
Symptom.*

**Teil A — Beschaffungsprozess**

| Barriere | Bereich | Normbezug (vorläufig) |
| --- | --- | --- |
| Lastenheft ohne Anforderungen an digitale Barrierefreiheit | Beschaffung | EN 301 549, BFSG |
| Ausschreibung ohne Nachweispflicht — Anbieter müssen nichts belegen | Beschaffung | EN 301 549 |
| Produktauswahl ohne Praxistest mit Nutzern assistiver Technologien | Beschaffung | — organisatorisch |
| Keine benannte Zuständigkeit für Barrierefreiheit im Unternehmen | Management | — organisatorisch |

**Teil B — Das eingeführte Ticketsystem**

| Barriere | Bereich | Betroffene Nutzergruppen | Normbezug (vorläufig) |
| --- | --- | --- | --- |
| Bedienelemente nicht per Tastatur erreichbar | IT | motorische Einschränkungen, blinde Personen | WCAG 2.1.1 |
| Inhalte für Screenreader nicht zuverlässig erfassbar (Tabellen ohne Kopfzellen, Status nur als Symbol) | IT | blinde Personen | WCAG 1.3.1, 1.1.1 |
| Unzureichende Farbkontraste in der Oberfläche | IT | Sehbehinderung, Farbfehlsichtige, ältere Nutzer | WCAG 1.4.3, 1.4.11 |

### 6.4 Kombinierte Barrieren

Manche Barrieren bestehen aus gekoppelten Teilaspekten, bei denen das Beheben nur eines
Teils das Problem **nicht** vollständig löst. Didaktisches Ziel: Barrierefreiheit ist keine
Liste unabhängiger Häkchen.

Referenzfall war ursprünglich das Kampagnenvideo (ohne Untertitel und ohne Transkript). Da
das Video entfällt, tragen zwei andere Barrieren dieses Prinzip:

| Kombinierte Barriere | Teile | Warum gekoppelt |
| --- | --- | --- |
| **Event und Podiumsdiskussion** (§6.2) | 3 | Einladung, Dolmetschung und Zugang betreffen drei verschiedene Gruppen; keine Teillösung hilft den anderen beiden |
| **Texte und Inhalte** (§6.2) | 2 | Verständliches Deutsch ist nicht Leichte Sprache — zwei Normen, zwei Gruppen |

Der Ersatz ist didaktisch kein Verlust, sondern ein Gewinn: Das Video koppelte zwei
Ausgabeformen desselben Inhalts. Das Event koppelt drei Barrieren für drei verschiedene
Behinderungsarten und zeigt damit deutlicher, dass Barrierefreiheit keine eindimensionale
Skala ist.

### 6.5 Umfang

| Szenario | Schritte / Bereiche | Barrieren | Schalter | davon ohne Normbezug |
| --- | --- | --- | --- | --- |
| Bewerbungsprozess | 4 Schritte | 11 | 11 | 2 |
| CSR-Kampagne | 5 Bereiche (eine Seite) | 11 | 14 | 2 |
| Softwarebeschaffung | 2 Teile | 7 | 7 | 2 |
| **Summe** | | **29** | **32** | **6** |

Die CSR-Kampagne überschreitet als **einseitiges** Szenario mit vierzehn Schaltern die
Schwelle, ab der `ARCHITECTURE.md` §21 eine Gruppierung verlangt — und die dort vorgesehene
Gruppierung nach Schritt greift hier nicht, weil es nur eine Seite gibt. Die Konsequenz ist
in `ARCHITECTURE.md` §12.1.1 behandelt.

---

## 7. User Stories

**Modul-Teilnehmende ohne Behinderung**

- Als Teilnehmende ohne Vorwissen möchte ich einzelne Barrieren an- und ausschalten, um den Unterschied unmittelbar zu sehen, statt ihn mir vorstellen zu müssen.
- Als Teilnehmende möchte ich zu jeder Barriere erfahren, wen sie betrifft und gegen welche Norm sie verstößt, um das Erlebte rechtlich einordnen zu können.
- Als Teilnehmende möchte ich einen realistischen Prozess durchlaufen statt isolierter Einzelbeispiele, um zu verstehen, wie sich Barrieren aufsummieren.
- Als Teilnehmende möchte ich jederzeit alle Barrieren auf einmal zurücksetzen, um schnell zwischen den Gesamtzuständen vergleichen zu können.

**Modul-Teilnehmende mit Behinderung**

- Als blinde Teilnehmende möchte ich auch bei aktiver Barriere eine Textbeschreibung erhalten, was gerade nicht funktioniert, um denselben Lerninhalt zu bekommen wie sehende Teilnehmende.
- Als Tastaturnutzer möchte ich das Bedienpanel jederzeit erreichen und verlassen können, auch wenn der Simulationsbereich eine Tastaturfalle demonstriert.
- Als Screenreader-Nutzer möchte ich beim Umschalten einer Barriere eine Rückmeldung erhalten, um zu wissen, dass die Aktion gewirkt hat.
- Als Teilnehmende mit vestibulären Beschwerden möchte ich, dass Bewegung respektiert wird, wenn mein System reduzierte Bewegung anfordert.

**Dozierende / WERTE.IT-Team**

- Als Dozent möchte ich einen bestimmten Zustand per URL aufrufen, um reproduzierbare Screenshots für die Folien zu erzeugen.
- Als Dozent möchte ich aus Moodle heraus direkt auf ein bestimmtes Szenario verlinken, damit Teilnehmende ohne Umwege einsteigen.

**Kanten- und Sonderfälle**

- Als Nutzer mit fehlerhafter oder veralteter URL möchte ich auf einem definierten Standardzustand landen statt auf einer Fehlerseite.
- Als Nutzer mit 400 % Zoom möchte ich alle Inhalte ohne horizontales Scrollen nutzen können.

---

## 8. Anforderungen

### 8.1 Must-Have (P0)

**A. Grundgerüst**

- Startseite mit Kurzvorstellung des Tools, seines Zwecks und der Bedienlogik; Einstieg in die Szenarien.
- Routing pro Szenario, ohne Backend, rein statisch auslieferbar.

*Akzeptanzkriterien:*
- [ ] Startseite erklärt in wenigen Sätzen, was das Tool zeigt und wie das Panel zu bedienen ist.
- [ ] Jedes verfügbare Szenario ist von der Startseite aus erreichbar.
- [ ] Noch nicht umgesetzte Szenarien sind erkennbar als solche gekennzeichnet oder nicht sichtbar (Entscheidung im Design).

**B. Szenario Bewerbungsprozess**

- Vierstufiger Flow mit den elf in Abschnitt 6.1 genannten Barrieren.

*Akzeptanzkriterien:*
- [ ] Nutzer kann von Schritt 1 zu Schritt 2 navigieren und zurück.
- [ ] Jede der fünf Barrieren ist einzeln schaltbar.
- [ ] Gegeben eine Barriere ist aktiv, wenn der Nutzer sie im Panel umschaltet, dann ändert sich der Simulationsbereich sichtbar und die Änderung wird für Screenreader angekündigt.
- [ ] Der Zustand bleibt beim Wechsel zwischen den Schritten erhalten.

**C. Szenario CSR-Kampagne**

- Einseitige Landingpage mit den elf in Abschnitt 6.2 genannten Barrieren, gegliedert in fünf Bereiche, darunter zwei kombinierte Barrieren.

*Akzeptanzkriterien:*
- [ ] Jede Barriere ist einzeln schaltbar; bei kombinierten Barrieren jeder Teil einzeln.
- [ ] Bei den kombinierten Barrieren ist erkennbar, dass die Behebung nur eines Teilaspekts das Problem nicht vollständig löst.
- [ ] Das Panel ist nach den fünf Bereichen gegliedert, nicht als flache Liste.

**D. Szenario Softwarebeschaffung**

- Zweiteiliges Szenario (Beschaffungsprozess und eingeführtes Ticketsystem) mit den sieben in Abschnitt 6.3 genannten Barrieren.

*Akzeptanzkriterien:*
- [ ] Beide Teile sind erreichbar; der Zusammenhang zwischen Beschaffungsentscheidung und späterem Symptom ist erkennbar.
- [ ] Jede Barriere ist einzeln schaltbar.
- [ ] Die vier organisatorischen Barrieren in Teil A sind auch ohne Normbezug vollständig erklärt.

**E. Barriere-Panel**

- Panel mit Einzeltoggle je Barriere sowie „alle barrierefrei" / „alle barrierebehaftet".
- Panel ist Teil des Rahmens und damit immer vollständig bedienbar.

*Akzeptanzkriterien:*
- [ ] Jeder Toggle hat ein programmatisch verknüpftes Label und einen erkennbaren Zustand.
- [ ] Sammelaktionen setzen alle Toggles des aktuellen Szenarios.
- [ ] Das Panel ist per Tastatur in sinnvoller Reihenfolge erreichbar, auch wenn im Simulationsbereich eine Tastaturfalle aktiv ist.
- [ ] Beim Umschalten wandert der Fokus nicht unkontrolliert; die Änderung wird über eine Live-Region gemeldet.

**F. Erklärung je Barriere**

- Pro Barriere: Was ist das Problem, wen betrifft es, welcher Normbezug (WCAG 2.2, BITV 2.0, EN 301 549, BFSG), was ist die barrierefreie Lösung.
- Inhalte kommen redaktionell vom WERTE.IT-Team.

*Akzeptanzkriterien:*
- [ ] Jede Barriere hat alle vier Textbestandteile.
- [ ] Die Erklärung ist unabhängig vom Toggle-Zustand zugänglich.
- [ ] Normbezüge sind als strukturierte Daten hinterlegt, nicht als Fließtext im Markup.

**G. State-in-URL**

- Der vollständige Toggle-Zustand eines Szenarios ist in der URL abgebildet.

*Akzeptanzkriterien:*
- [ ] Gegeben ein beliebiger Toggle-Zustand, wenn der Nutzer die URL kopiert und neu öffnet, dann wird derselbe Zustand hergestellt.
- [ ] Unbekannte oder fehlerhafte Parameter führen zu einem definierten Standardzustand, nicht zu einem Fehler.
- [ ] Die Browser-Zurück-Navigation verhält sich nachvollziehbar (entschieden in der Architekturphase: Umschalten ersetzt den History-Eintrag, Schrittwechsel legt einen neuen an).
- [ ] Dozierende erhalten eine kurze Handreichung, wie ein Zustand dauerhaft verlinkt wird — insbesondere, dass „alles barrierefrei" über den Sammelwert verlinkt werden muss und nicht über eine Aufzählung einzelner Barrieren, da eine Aufzählung veraltet, sobald ein Szenario um eine Barriere erweitert wird.

**H. Barrierefreiheit des Tools selbst**

- Rahmen und Erklärtexte erfüllen WCAG 2.2 Level AA.
- Der Simulationsbereich weicht bewusst ab, ist aber als solcher ausgezeichnet und angekündigt.

*Akzeptanzkriterien:*
- [ ] Vollständige Tastaturbedienbarkeit von Rahmen und Navigation.
- [ ] Sichtbarer Fokusindikator durchgängig.
- [ ] Korrekte Landmarks, Überschriftenhierarchie und Dokumentsprache.
- [ ] Kontrastanforderungen im Rahmen erfüllt.
- [ ] Reflow bei 400 % Zoom ohne horizontales Scrollen.
- [ ] `prefers-reduced-motion` hat Vorrang vor jeder Bewegungsbarriere; wird eine Barriere aus diesem Grund unterdrückt, erklärt ein Hinweis, was sonst geschehen würde.
- [ ] Der Simulationsbereich ist für Hilfsmittel als abgegrenzter Bereich erkennbar und angekündigt.
- [ ] Der Simulationsbereich ist über einen sichtbaren, fokussierbaren Link als erstes Element verlassbar — auch dann, wenn darin eine Tastaturfalle aktiv ist.
- [ ] Die Überschriftenhierarchie der Seite bleibt in jedem Barrierezustand korrekt; eine gestörte Überschriftenstruktur ist keine zulässige Barriere.
- [ ] Zurücksetzen ist aus jedem Zustand heraus per Tastatur erreichbar.

### 8.2 Nice-to-Have (P1)

- **Fortschrittsanzeige** „x von y Barrieren behoben" pro Szenario als Orientierung.
- **Corporate Design** BSVH/WERTE.IT inklusive Fördermittelhinweisen — wird nachträglich eingefügt.
- **Übersicht aller Barrieren** eines Szenarios mit Normbezügen als zusammenfassende Ansicht.
- **Automatisierte Barrierefreiheitstests** mit axe-core und Playwright in CI.

### 8.3 Zukünftige Erweiterungen (P2)

- **Video-Barriere im Bewerbungsprozess** (Erklärvideo ohne Untertitel/Transkript) — zurückgestellt, da kein Videomaterial vorliegt.
- **Weitere Barrieren im Bewerbungsprozess** aus dem Parkplatz (siehe Abschnitt 11).
- **Weitere Szenarien** über die drei geplanten hinaus.
- **Direkter Vergleichsmodus** (barrierefrei und barrierebehaftet nebeneinander) statt Umschalten.

Die Architektur soll diese Punkte nicht verbauen — insbesondere muss die Szenariodefinition datengetrieben sein, damit neue Szenarien und Barrieren ohne strukturelle Änderungen ergänzt werden können.

---

## 9. Erfolgsmessung

Es findet **kein Nutzungstracking** statt. Nutzungsmetriken im klassischen Sinne sind daher nicht erhebbar und werden bewusst nicht als Erfolgskriterien gesetzt. Stattdessen wird über prüfbare Qualitätskriterien und qualitatives Feedback gemessen.

**Prüfbare Kriterien vor Launch**

| Kriterium | Zielwert | Messmethode |
| --- | --- | --- |
| Automatisierte A11y-Verstöße im Rahmenbereich | 0 kritische und 0 schwere Verstöße | axe-core in Playwright, alle Seiten, beide Extremzustände |
| Manueller Screenreader-Durchlauf | alle P0-Flows vollständig durchführbar | NVDA (Windows) und VoiceOver (macOS/iOS) |
| Tastatur-only-Durchlauf | alle P0-Flows vollständig durchführbar | manueller Test |
| Barrieren mit vollständiger Erklärung inkl. Normbezug | 100 % | Review der Inhaltsdaten |
| Deep-Link-Reproduzierbarkeit | 100 % der Zustände bei gleichen Systemeinstellungen | automatisierter Test |
| Fachliche Freigabe der Inhalte | erteilt | Review durch WERTE.IT-Team |
| Barrierefreiheits-Review | erteilt | Review durch BSVH |

**Einschränkung der Reproduzierbarkeit.** Systemeinstellungen der Nutzer sind bewusst
nicht Teil der URL. Fordert ein System reduzierte Bewegung an (`prefers-reduced-motion`)
oder erzwingt es eigene Farben (`forced-colors`), werden die betroffenen Barrieren
unterdrückt — dieser Vorrang ist eine Sicherheitsentscheidung und keine Lücke. Dieselbe
URL kann daher auf zwei Rechnern unterschiedlich aussehen. Das Tool weist an Ort und
Stelle darauf hin, wenn eine Barriere aus diesem Grund nicht dargestellt wird, damit
Dozierende beim Anfertigen von Screenshots nicht in die Irre laufen.

**Qualitative Indikatoren nach Launch**

- Rückmeldungen aus den ersten Moduldurchläufen: Verstehen Teilnehmende die Barrieren, oder erzeugt das Tool Verwirrung?
- Nutzen die Dozierenden das Tool tatsächlich in Schulungen, oder bleiben sie bei Folien?
- Grobe Zugriffszahlen über den Hosting-Anbieter — als Orientierung, nicht als Erfolgskriterium.

---

## 10. Offene Fragen

**Blockierend vor Launch**

| Frage | Wer entscheidet |
| --- | --- |
| Fachtexte für alle Barrieren (Problem, Betroffene, Normbezug, Lösung) | WERTE.IT-Team |
| Sind Impressum und Datenschutzerklärung erforderlich? Wird eine Barrierefreiheitserklärung nach BITV 2.0 erwartet? Für ein Tool zu diesem Thema wäre ihr Fehlen mindestens erklärungsbedürftig. | Philipp / BSVH |
| Ist das barrierebehaftete PDF ein echter Download oder eine Simulation? Ein echtes PDF müsste eigens erstellt und gepflegt werden. | WERTE.IT / Engineering |
| Hosting und Domain | Philipp |

**Blockierend nur für einzelne Bausteine**

| Frage | Wer entscheidet |
| --- | --- |
| Kampagnenvideo — **zurückgestellt**, nicht blockierend. Die CSR-Kampagne wird ohne Video umgesetzt. Käme später Material, sind drei Liefergegenstände nötig: Videodatei, WebVTT-Untertitel und Transkript. Eine Einbettung über YouTube oder Vimeo bleibt ausgeschlossen (Datenabfluss an Dritte); das Video würde selbst gehostet. | WERTE.IT-Team |
| Bild des Veranstaltungsorts für die Event-Barriere (Eingang mit Stufen bzw. mit Rampe). Vorgabe in `SPEC_v2.md` §4.2: als schematische SVG-Illustration umgesetzt, damit kein externer Liefergegenstand blockiert. Ein fotorealistisches Bild kann später ersetzen. | Engineering, optional WERTE.IT |
| Corporate-Design-Assets und Fördermittelhinweise | BSVH / WERTE.IT |

**Nicht blockierend, in der Architekturphase zu klären**

| Frage | Wer entscheidet |
| --- | --- |
| NgRx Store versus Signal Store — bei diesem Umfang ist ein reiner Signal Store vermutlich ausreichend | Engineering |
| Serialisierungsformat für State-in-URL; werden jsonpath, flatted und typedjson tatsächlich benötigt? | Engineering |
| History-Verhalten beim Umschalten (Eintrag hinzufügen oder ersetzen) | Engineering |
| Wie stark darf der Simulationsbereich Hilfsmittel beeinträchtigen, ohne die Lernenden zu frustrieren? | Engineering / BSVH |

---

## 11. Parkplatz

Ideen aus dem Brainstorming, die bewusst nicht in v1 einfließen:

- Bewerbungsformular mit Session-Timeout ohne Verlängerungsmöglichkeit (WCAG 2.2.1)
- Farbe als einziger Indikator für Pflichtfelder und Fehler (WCAG 1.4.1)
- Terminbuchung als drittem Flow-Schritt mit Drittanbieter-Widget — gestrichen, da Aufwand ohne zusätzlichen Lerngewinn
- Simulation von Hilfsmitteln oder Seheinschränkungen
- Export der Barriereübersicht als PDF für Schulungsunterlagen

---

## 12. Zeitliche Einordnung und Phasen

Es sind derzeit keine harten Deadlines bekannt. Vorgeschlagene Phasierung entlang des in `docs/ai_development_process.md` beschriebenen Prozesses:

| Phase | Inhalt | Abhängigkeiten |
| --- | --- | --- |
| 1 | Grundgerüst, Rahmen-Architektur, Panel mit Fachbereichs-Gruppierung, State-in-URL, Szenario Bewerbungsprozess (4 Schritte, 11 Barrieren) | Fachtexte für Szenario 1 |
| 2 | Szenario CSR-Kampagne (5 Bereiche, 11 Barrieren, 14 Schalter) | Fachtexte |
| 3 | Szenario Softwarebeschaffung (2 Teile, 7 Barrieren) | Fachtexte |
| 4 | Corporate Design, Feinschliff, vollständige A11y-Abnahme, Deployment | CD-Assets, Hosting-Entscheidung |

Phase 1 ist die eigentliche Risikophase: Hier entscheidet sich, ob die Trennung von Rahmen und Simulationsbereich tragfähig ist. Sie sollte deshalb früh mit echten Hilfsmitteln getestet werden, nicht erst in Phase 4.

---

## 13. Verweise

- `docs/DESIGN.md` — Gestaltungsrichtung, Farb- und Typografie-Tokens
- `docs/UX-COPY.md` — Oberflächentexte, Terminologie, Elbwerk-Platzhaltertexte
- `docs/SPEC_v1.md` — Umsetzungsschnitte für Phase 1
- `docs/ai_development_process.md` — Entwicklungsprozess
- `docs/ARCHITECTURE.md` — folgt in Phase 2 des Prozesses
- `docs/TESTING.md` — Teststrategie, Abdeckungsziele, CI-Pipeline
