# Design Direction — AccessIssue

**Project:** AccessIssue
**Source documents:** `docs/PRD.md` (v1.1), `docs/ARCHITECTURE.md` (v1.1)
**Status:** Draft v1.3 — revised after the finished module deck
**Date:** August 2026

---

## 1. The Brief in One Sentence

A German training tool where a WERTE.IT-branded frame surrounds a *convincingly ordinary*
company website, so that participants discover barriers the way real users do — by hitting
them, not by being pointed at them.

Two audiences share one screen: participants without prior knowledge, who must *experience*
the barrier, and blind and partially sighted participants (the BSVH's core constituency),
who must *understand* it without being excluded by the demonstration itself.

---

## 2. The Governing Idea: Two Identities, One Page

The PRD's decision that simulated states look **deceptively real** (not obviously broken)
has a consequence that shapes everything below.

**The simulation region must not look like WERTE.IT.**

If the simulated careers page appears in navy, magenta and Poppins, it reads as part of the
teaching tool, and the point dies. The point is: *this looks like every other corporate
site, and it still shuts people out.* A participant who recognises the barrier only because
it is styled as a warning has learned nothing transferable.

Therefore two token sets, never mixed:

| | Frame | Simulation |
| --- | --- | --- |
| Identity | WERTE.IT corporate design | Elbwerk, a fictional company |
| Palette | Navy, electric blue, magenta | Muted corporate blue, greys |
| Typeface | Poppins | System sans stack (Arial / Helvetica) |
| Personality | Deliberate, institutional | Unremarkable, competent-looking |
| Accessibility | WCAG 2.2 AA, no exceptions | Deliberately non-conforming where a barrier is active |

**The typeface switch is the strongest signal.** It marks the boundary before anyone
consciously registers the frame, and it does so *visually* — which means the boundary is
not announced only through ARIA. Sighted users get a real cue, screen reader users get the
region announcement, and neither depends on the other.

**The risk being taken, stated plainly.** Half of this application is deliberately designed
to be unremarkable. That is a choice, not an oversight. It is justified by the didactic
goal and it is the reason the design brief cannot be evaluated by "does the simulation look
good" — the correct evaluation is "does the simulation look like nothing in particular".

### 2.1 Elbwerk

One fictional company across all three scenarios — careers, CSR campaign, and later
procurement are three departments of the same firm. This makes "Unternehmensalltag"
concrete and lets the module make a stronger claim: *one company, three teams, three ways
to exclude people.*

Elbwerk is a mid-sized Hamburg engineering and services firm. The name carries a local
connection to the BSVH without being a real company. Fictional domain: `elbwerk.de`, used
in the simulation bar only — never as a live link.

The legal form is **GmbH & Co. KG**, and it is the one part of the name that was not a free
choice: an `Elbwerk GmbH` turned out to exist. The name itself carries the local connection
and is relied on by the module deck and by `elbwerk.de`, so the company keeps it and changes
only its form.

`GmbH & Co. KG` rather than `AG`, and the reason is characterisation rather than law. An
Aktiengesellschaft in Wilhelmsburg would quietly contradict the premise: chapter 3 is about
the *Mittelstand*, and an AG reads as a listed corporation with a legal department that
somebody would have asked. `GmbH & Co. KG` is the commonest form for a firm of this size in
Germany, which keeps Elbwerk in the category the module is actually talking about — and
keeps the barriers reading as ordinary neglect rather than as corporate malice.

Two consequences worth stating, because both are easy to undo by accident. The legal form
appears in the logo wordmark, so the logo carries `GMBH & CO. KG · HAMBURG`; and it appears
inside the generated benefits graphic, where it is pixels and has to be re-rendered rather
than edited (`CLAUDE.md`, "Stack and conventions"). A rename that misses either leaves the
real company's name visible in a picture, where no search finds it — which is exactly how
this one survived the first pass.

The check that produced all of this — trade register and DPMA — was the open item here and
is now closed.

---

## 3. Colour

### 3.1 Frame palette (WERTE.IT corporate design)

Values read directly from the project logo, the Moodle slide deck, and the
`theme-color` meta of werte.it. These are not proposals; they are the existing identity.

| Token | Hex | Role |
| --- | --- | --- |
| `--wi-navy` | `#172C3F` | Header, footer, simulation bar, primary text on light surfaces |
| `--wi-navy-deep` | `#01192A` | Slide-style gradient partner for navy, large areas only |
| `--wi-blue` | `#0004FF` | Interactive accent: focus rings, links, active controls |
| `--wi-indigo` | `#051869` | Icon fills and headings on light surfaces |
| `--wi-magenta` | `#DA0983` | Barrier-active state, **surfaces and icons only** |
| `--wi-magenta-text` | `#AB0767` | Barrier-active state, **text only** (see 3.3) |
| `--wi-pink` | `#FF70FB` | Decorative circle motif, **only on navy** |
| `--wi-mist` | `#F1F1F8` | Page background |
| `--wi-card` | `#EEF5FE` | Card and panel surfaces |
| `--wi-rose` | `#FDEFF8` | Tinted surface behind barrier-active items |
| `--wi-white` | `#FFFFFF` | Content surfaces |

### 3.2 Measured contrast, and what it forbids

Every pairing below was computed, not estimated. Three results constrain the design:

| Pairing | Ratio | Verdict |
| --- | --- | --- |
| Navy on white | 14.30:1 | AAA — default text pairing |
| Navy on mist | 12.72:1 | AAA |
| Indigo on white | 15.66:1 | AAA — headings |
| Electric blue on white | 8.53:1 | AAA — links, focus |
| White on electric blue | 8.53:1 | AAA — filled buttons |
| **Electric blue on navy** | **1.68:1** | **Fails.** Decorative only — never text, never a focus ring on navy |
| Magenta on white | 4.83:1 | AA, but with almost no margin |
| **Magenta on mist** | **4.30:1** | **Fails** for body text |
| **Magenta on navy** | **2.96:1** | **Fails.** Not usable on the header or simulation bar |
| Magenta-text on white | 7.10:1 | AAA |
| Magenta-text on mist | 6.31:1 | AA |
| Pink on navy | 6.10:1 | AA — usable |
| **Pink on white** | **2.34:1** | **Fails.** Navy surfaces only |

The rule this produces, and it belongs in `CLAUDE.md`: **every accent colour has exactly
one surface family it is permitted on.** Electric blue and magenta live on light surfaces;
pink lives on navy. Nothing crosses.

`--wi-magenta-text` (`#AB0767`) exists because the corporate magenta cannot carry body text
on the mist background. It is a darkened derivative of the identity colour, not a new one —
the brand reads as unchanged while the text passes AA on every frame surface.

### 3.3 State semantics — never colour alone

The module slides already use magenta for failure ("Bewerbung scheitert", the warning
markers). AccessIssue inherits that meaning: **magenta = barrier active.**

For "resolved" there is no green in the corporate design, and inventing one would be a
brand violation. Resolved states use `--wi-indigo` instead. This is better than green
anyway: red/green is the single most common colour-vision confusion, and a tool about
accessibility should not stake its core state distinction on it.

Every barrier state is expressed **three times over** — text label, symbol shape, and
colour:

| State | Text | Symbol | Colour |
| --- | --- | --- | --- |
| Barrier active | „Barriere aktiv" | filled circle with exclamation | `--wi-magenta` surface, `--wi-magenta-text` text |
| Barrier resolved | „Barrierefrei" | outlined circle with check | `--wi-indigo` |
| Partially resolved | „Teilweise behoben" | half-filled circle | `--wi-indigo` on `--wi-rose` |

WCAG 1.4.1 requires this. More to the point: a tool that taught the rule and then broke it
would be self-refuting.

### 3.4 Simulation palette (Elbwerk)

Deliberately generic. Chosen to look like an unremarkable corporate site and to pass AA
*when no barrier is active* — because the accessible variant must be genuinely accessible,
not merely less bad.

| Token | Hex | On white | Role |
| --- | --- | --- | --- |
| `--sim-brand` | `#1F3A5F` | 11.48:1 | Elbwerk primary |
| `--sim-text` | `#33475B` | 9.58:1 | Body text |
| `--sim-muted` | `#5A6B7B` | 5.49:1 | Secondary text |
| `--sim-surface` | `#F5F6F7` | — | Section background |
| `--sim-border` | `#D8DDE2` | — | Rules and field borders |

Plus two tokens that **exist to fail**, used only when a contrast barrier is active:

| Token | Hex | On white | Purpose |
| --- | --- | --- | --- |
| `--sim-fail-text` | `#8A99A8` | 2.92:1 | Low-contrast overlay text (CSR) |
| `--sim-fail-faint` | `#B7C2CC` | 1.81:1 | Barely-visible label variant |

These live in a separate token block with a comment saying why. `ARCHITECTURE.md` §12.2
requires the split so that an automated contrast fix can never accidentally repair a
barrier, and so that auditing the frame tokens is meaningful on its own.

---

## 4. Typography

Poppins is set by the corporate design. Two consequences follow.

**Self-host it.** No Google Fonts CDN — that would breach the no-third-party-request rule
in `ARCHITECTURE.md` §16 for a publicly funded accessibility project. Three weights are
enough: 400, 600, 700, as WOFF2, with `font-display: swap` and a matched fallback metric.

**Compensate for its weaknesses in the settings.** Poppins is geometric: single-storey `a`,
tight apertures, uniform stroke. It is excellent for headings and merely acceptable for
sustained reading, and this tool asks people to read explanatory prose about accessibility.
Since the typeface is not negotiable, the type *settings* carry the load: body text at
17 px / 1.65, measure capped at 70 characters, nothing below 16 px anywhere in the frame.

### 4.1 Frame scale

| Role | Size / line-height | Weight | Notes |
| --- | --- | --- | --- |
| Display | 40 / 1.15 | 700 | Home page only |
| H1 | 32 / 1.2 | 700 | One per page, focus target on route change |
| H2 | 24 / 1.3 | 600 | Section headings |
| H3 | 19 / 1.4 | 600 | Panel groups, explanation subheadings |
| Body | 17 / 1.65 | 400 | Explanations, running text |
| Meta | 15 / 1.5 | 400 | Standards references, counters, captions |
| Control | 16 / 1.4 | 600 | Buttons, checkbox labels |

**Only 400, 600 and 700 exist.** An earlier draft of this table used weight 500 for meta
and control text while the font loading section shipped three weights — the browser would
have synthesised 500, and faux-bold Poppins is visibly wrong at 15 and 16 px. Meta text
drops to 400, control labels rise to 600 (they need the emphasis anyway). There is no
`--wi-weight-medium` token; adding one would reintroduce the defect.

All sizes in `rem` so browser text-size settings apply. Spacing on a 4 px base scale:
4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.

### 4.2 Simulation typography

System stack, `16px / 1.5`, default spacing, no distinctive scale. The instruction to
whoever implements it: *make it look like nobody thought about it very hard.*

The one hard rule from `ARCHITECTURE.md` §5.6 applies regardless of styling: the simulation
region never contains an `h1`, and its headings continue the page outline correctly.
Broken heading structure is not an admissible barrier here.

---

## 5. Layout

```
≥ 1024 px                                     panel left = DOM order
┌──────────────────────────────────────────────────────────────┐
│ skip links · WERTE.IT header · scenario navigation           │  navy
├────────────────────┬─────────────────────────────────────────┤
│ BARRIEREN          │  ─ simulation bar ─────────────────────  │
│                    │   Simulation · elbwerk.de/karriere       │  ← signature
│ ┌ Schritt 2 ─────┐ │   9 von 11 Barrieren aktiv  ← only counter│
│ │☐ Beschriftungen│ │  ┌──────────────────────────────────────┐│
│ │  · IT          │ │  │ [Simulation verlassen] (focus-first) ││
│ │☐ Tastatur · IT │ │  │                                      ││
│ │☐ Pflichtfelder │ │  │   Elbwerk: other typeface, muted      ││
│ │  · Personal    │ │  │   blue, ordinary in every respect    ││
│ └────────────────┘ │  │                                      ││
│ Diese 11 Barrieren │  └──────────────────────────────────────┘│
│ stammen aus 3      │                                          │
│ Bereichen: …       │                                          │
│ [Alle beheben]     │                                          │
├────────────────────┴─────────────────────────────────────────┤
│ ERKLÄRUNG ZUR AUSGEWÄHLTEN BARRIERE                          │  white
│ Problem · Betroffene · Normbezug · Lösung                    │
└──────────────────────────────────────────────────────────────┘

< 1024 px and at 400 % zoom: single column, panel before simulation, same order
```

**The panel sits on the left, not the right.** Visual order must match DOM order
(WCAG 1.3.2, 2.4.3). A right-hand panel that comes first in the source is exactly the
defect this tool exists to teach about, and it would be indefensible here.

**Reflow.** The layout collapses to one column below 1024 px and at 400 % zoom, with no
horizontal scrolling and no loss of function (PRD §8.1 H). The panel stays above the
simulation in the single-column order, so the controls are always encountered before the
thing they control.

**Focus visibility.** A 3 px `--wi-blue` ring with a 2 px white offset on light surfaces
(8.53:1), and a 3 px white ring on navy (14.30:1). Never `outline: none`. The only
programmatic focus that suppresses the visible ring is the `h1` on route change
(`ARCHITECTURE.md` §9), which is not user-initiated.

**The simulation has its own focus ring**, `--sim-focus-ring` (2 px, `--sim-brand`,
11.48:1 on white). It is deliberately not a frame token — the boundary rule forbids
crossing, and a different ring is one more quiet signal that the region has changed.
A missing focus ring is **not** an admissible barrier: the exit link is the safety-critical
path and has to stay locatable in every state.

**Target size.** Minimum 24 × 24 px for every interactive target, frame and resolved
simulation alike (WCAG 2.2 SC 2.5.8, new at AA in 2.2). 44 px where the layout allows.
The clickable area may extend beyond the visible control. The place this is easiest to get
wrong is the indented part checkboxes of a combined barrier — indentation must reduce the
offset, never the target.

**Nothing sticks.** Header, scenario navigation and simulation bar all scroll with the
page. A sticky bar would sit exactly where the focused element appears while tabbing
through the simulation and would cover it, breaking SC 2.4.11 (Focus Not Obscured, also
new in 2.2) — and it would cover the exit link first, since that link sits at the top of
the region. If a sticky treatment is ever introduced, every focusable element needs
`scroll-margin-top` matching the sticky height, and the exit-link suite in `TESTING.md` §7
needs a visibility assertion, not just a focus assertion.

---

## 6. Signature Element: The Simulation Bar

A narrow navy band immediately above the simulation region, carrying three things:

```
┌──────────────────────────────────────────────────────────────┐
│ ◗ SIMULATION   elbwerk.de/karriere        4 von 5 aktiv       │
└──────────────────────────────────────────────────────────────┘
```

- a **Simulation** chip, so the region is labelled visually as well as programmatically
- the fictional address, low-emphasis, establishing that what follows is a company site
- the live barrier count, right-aligned

**This is the only counter in the application, and it counts what is still active.** The
panel deliberately carries no progress figure of its own: two counters running in opposite
directions on one screen ("1 of 5 resolved" beside "4 of 5 barriers active") would turn a
status display into arithmetic. Reasoning in `docs/UX-COPY.md` §5.6.

**The panel groups by flow step and labels by responsible area** (`ARCHITECTURE.md`
§12.1.1). The area label sits under the barrier name in meta type, quiet enough not to
compete with the checkbox label but present on every row. The summary line beneath the
panel — *„Diese 11 Barrieren stammen aus 3 Bereichen: Personal, Kommunikation, IT."* — is
set in body type, not meta: it is the sentence the whole chapter is built around, and
setting it as fine print would bury it.

**Why this is the signature.** It is the one place where the load-bearing architectural
idea — the boundary between frame and simulation (`ARCHITECTURE.md` §5) — becomes visible.
It anchors the live region that announces toggle changes, it hosts the suppression note
when `prefers-reduced-motion` or `forced-colors` overrides a barrier (§5.5), and it is what
someone remembers about the application. It is functional rather than decorative, which is
the only kind of signature worth having in a tool like this.

The corporate pink circle motif appears once per page as a partial circle bleeding off the
navy header edge — the single decorative gesture, borrowed directly from the slide deck,
and permitted only on navy where its contrast is adequate.

---

## 7. UX Copy Principles

Copy is teaching material here, so it gets the same care as the layout. Full strings follow
in the UX copy pass; these are the rules that generate them.

- **Sentence case throughout.** German capitalisation rules only.
- **A control says what happens — with one refinement.** Buttons take an action label
  („Alle Barrieren beheben"). Checkboxes take a *state* label („Stellenanzeige als Text auf
  der Seite"), because a checked box labelled with an action is ambiguous: does the tick
  mean it is done, or that it should be done? Announcements always name the resulting
  state. Worked through in `docs/UX-COPY.md` §4.
- **State is named, never implied.** „Barriere aktiv" and „Barrierefrei" are written out,
  because a checkbox position alone is not a state description for a screen reader user.
- **The simulation never apologises.** Elbwerk's error messages are as unhelpful as real
  ones when the barrier is active — that is the lesson. The *frame* never behaves that way.
- **Announcements are short and complete.** „Beschriftungen: barrierefrei. 3 von 5 Barrieren
  aktiv." Long enough to be unambiguous, short enough not to be cut off mid-speech.
- **No exclamation marks in the frame.** The subject carries its own weight.

---

## 8. Quality Floor

Not negotiable, and not announced in the UI:

- Responsive to 320 px; usable at 400 % zoom without horizontal scrolling
- Visible keyboard focus on every interactive element, frame *and* simulation
- Focus never obscured by a sticky or overlapping element (2.4.11)
- Every interactive target at least 24 × 24 px (2.5.8)
- `prefers-reduced-motion` honoured, including over simulated motion barriers (§5.5)
- `forced-colors` supported: the frame stays operable, and the suppression note explains
  what the mode has neutralised
- No text below 16 px, no fixed pixel heights on text containers
- Motion in the frame limited to state transitions under 200 ms; no ambient animation

---

## 9. What Was Deliberately Not Done

- **No obvious "broken" styling** in the simulation — see §2. The whole design rests on it.
- **No green for the resolved state.** Not in the corporate design, and red/green is the
  worst available axis for a colour-vision-safe distinction.
- **No new brand colours.** `--wi-magenta-text` is a darkened derivative for contrast
  compliance, not an addition to the identity.
- **No icon font.** `@fortawesome/fontawesome-free` is recommended for removal in
  `ARCHITECTURE.md` §16; the handful of state symbols ship as inline SVG with
  `aria-hidden="true"`, since the text label already carries the meaning.
- **No dark mode.** The corporate design has one light and one navy surface treatment, and
  a second full theme would double the contrast audit for no stated need. `forced-colors`
  covers the accessibility case that matters.

---

## 10. References

- `docs/PRD.md` — audiences, goals, the deceptively-real decision
- `docs/ARCHITECTURE.md` — frame/simulation boundary, token split, boundary invariants
- `docs/TESTING.md` — contrast and focus verification
- `docs/SPEC_v1.md` — phase 1 implementation slices
- `src/styles/_tokens.scss` — the implementation of §3 and §4
- `docs/UX-COPY.md` — the strings this design has to accommodate
