# Spec v2 — Phase 2: CSR Campaign

**Project:** AccessIssue
**Scope:** `PRD.md` §12 phase 2 — the CSR campaign scenario, one page, five sections,
ten barriers, thirteen switches
**Source documents:** `PRD.md` (v2.1), `ARCHITECTURE.md` (v2.1), `DESIGN.md`,
`TESTING.md`, `UX-COPY.md` (v2.1)
**Status:** Draft v1
**Date:** August 2026

---

## 1. What This Document Is

The second scenario. `SPEC_v1.md` built the frame, the panel, the URL contract and the
application process; this one adds content on top of infrastructure that already exists and
is tested. It adds no new requirements beyond what `PRD.md` §6.2 specifies, and it links
rather than restates.

**Order changed.** The CSR campaign was originally phase 3 behind software procurement. It
moved forward because procurement is content-heavy and unbuilt, while the campaign's copy is
written and its blocking dependency — the video — has been dropped rather than waited on.
Procurement becomes `SPEC_v3.md`.

**Phase 1 is not formally complete.** Slice 12 of `SPEC_v1.md` — the manual NVDA, VoiceOver
and keyboard-only passes — is deliberately deferred for time, not cancelled. §8 explains why
that matters more with each scenario added, and what to do about it.

---

## 2. In Scope

| | Deliverable | Source |
| --- | --- | --- |
| A | `BarrierGroup` model, panel grouping for single-page scenarios, section anchors | `ARCHITECTURE.md` §12.1.1 |
| B | CSR page shell, five sections, navigation barrier | `PRD.md` §6.2, `UX-COPY.md` §9.1 |
| C | Texts section — combined barrier, 2 parts | `UX-COPY.md` §9.2 |
| D | Media section — 3 barriers | `UX-COPY.md` §9.3–9.5 |
| E | Event section — combined barrier, 3 parts, incl. the venue illustration | `UX-COPY.md` §9.6 |
| F | Donation section — 4 barriers | `UX-COPY.md` §9.7–9.10 |
| G | Time-dependent behaviour: countdown, carousel, reduced motion | `TESTING.md` §10, §11 |

## 3. Out of Scope

| Not in this spec | Why | Where it goes |
| --- | --- | --- |
| Software procurement scenario | Fully specified in `PRD.md` §6.3, not yet built | `SPEC_v3.md` |
| Campaign video and its combined barrier | No material; no captions or transcript means no accessible state | Deferred indefinitely (`PRD.md` §10) |
| Slice 12 of `SPEC_v1.md` — manual accessibility passes | Deferred for time by decision | Tracked in §8 |
| Corporate design polish, hosting | Unchanged from `SPEC_v1.md` §3 | Phase 4 |
| Photorealistic venue image | Would bind the build to an external deliverable | §4.2 |

---

## 4. Three Decisions This Spec Has to Make

### 4.1 The panel grouping mechanism changes

`ARCHITECTURE.md` §12.1.1 previously said single-page scenarios collapse to one panel group.
That was written when the campaign had six barriers. It has thirteen switches, and the
panel renders fifteen checkboxes for them — one per barrier, plus one per part of the two
combined ones. One flat group of fifteen is precisely the scanning problem the architecture
warns about.

**Decision.** `Barrier` gains `groupId`; `Scenario` declares `BarrierGroup[]`. For
multi-step scenarios the groups mirror the steps one-to-one; for single-page scenarios they
mirror the page's sections. One mechanism, not two.

This is a **change to a model the application process already uses**, so it is slice 0 of
this spec and it must not alter application-process behaviour. Its groups become explicit
where they were previously derived from steps — the rendered result is identical, and the
existing tests are the proof.

Each group heading in a single-page scenario also carries an anchor link into the
corresponding section of the simulation region. With five sections on one long page, a user
who resolves an event barrier needs a way to reach the part that changed.

### 4.2 The venue illustration is an SVG, not a photograph

The event barrier's third part shows a building entrance — with steps when active, with a
ramp when resolved. A photorealistic image would have to be produced, which binds the build
to an external deliverable and repeats exactly the problem that killed the video.

**Decision.** Two hand-authored schematic SVG illustrations, inline, self-hosted, using
`--sim-*` tokens. Simple enough to draw as geometry: entrance, door, three steps, handrail;
the resolved version adds a ramp. A photograph can replace them later without touching the
component — the barrier reads the same either way, because what teaches here is the
*difference* between the two images plus the alternative text, not photographic realism.

Both variants carry real alternative text (`UX-COPY.md` §9.6) when the alt-text barrier is
resolved. When it is active the active-state image has no `alt` at all.

### 4.3 Physical barriers get an explicit frame

The third part of the event barrier is the only **physical** barrier in the tool: an
entrance with steps. Everything else is digital.

This needs saying out loud in the explanation text, because the tool otherwise implies that
adding a sentence to a web page fixes a staircase. **The digital barrier is that the page
does not state the access situation. The physical barrier is that there is no ramp.** The
toggle resolves both at once, which is a simplification the explanation must name rather
than hide.

Handled as content (`UX-COPY.md` §9.6) and flagged for the WERTE.IT team, since it is the
one place where the tool makes a claim beyond web accessibility.

---

## 5. Slices

Numbering continues from `SPEC_v1.md`; slices below are 13 onward, so that a slice number
identifies one piece of work across the whole project.

---

### Slice 13 — Barrier groups

**Delivers.** The grouping model from §4.1, applied to both scenarios.

- `BarrierGroup` interface, `groupId` on `Barrier` (`ARCHITECTURE.md` §6, §12.1.1)
- Application process: four groups declared explicitly, mirroring its four steps
- Panel renders one `fieldset` per group with the group title as `legend`
- Group heading carries an anchor link when the scenario declares `anchorId`
- Contract tests: every `groupId` resolves to a declared group; every group contains at
  least one barrier

**Acceptance criteria.**
- [ ] Application process renders identically to before — same groups, same order, same
      labels; its existing component and e2e tests pass unchanged
- [ ] A scenario with no `steps` still renders grouped
- [ ] Anchor link moves focus to the section heading inside the simulation region and does
      not trap it
- [ ] Area summary line still reports areas for the whole scenario, not per group
- [ ] axe runs 1 and 3 green

**Depends on.** `SPEC_v1.md` slices 1, 5.

**Note.** This is the only slice that touches shipped code. Treat a change in
application-process rendering as a defect in this slice, not as an acceptable side effect.

---

### Slice 14 — CSR page shell and navigation barrier

**Delivers.** The campaign page skeleton and its first barrier.

- Route `/szenario/csr-kampagne`, single step, registered in the scenario registry
- Page shell per `UX-COPY.md` §9, five sections with `h3` headings and anchor targets
- Elbwerk page frame consistent with the application process (`UX-COPY.md` §8.1): same
  header, same logo, same typography, `/engagement/inklusiv-nachhaltig-sichtbar` in the
  simulation bar
- Barrier `navigation` — pattern B: `<div>` with click handlers, no `tabindex`, hover-only
  dropdown vs. real `<nav>` with links, focus ring, `Enter` support.
  `automatedDetection: 'manual'`

**Acceptance criteria.**
- [ ] Home page lists the campaign as available; procurement still shows as planned
- [ ] Five sections render with correct heading levels — `h2` for the region, `h3` per
      section, nothing higher inside the region
- [ ] Every `id` inside the region carries the `sim-` prefix, including anchor targets
- [ ] With `navigation` active: the nav is not reachable by Tab, **and** Tab still leaves
      the region — the trap detector from `TESTING.md` §7 passes
- [ ] With `navigation` resolved: links are focusable, ordered, and show `--sim-focus-ring`
- [ ] Panel shows five groups; anchors reach the matching section
- [ ] Deep link reproduces state

**Depends on.** Slice 13.

---

### Slice 15 — Texts section: combined language barrier

**Delivers.** The first two-part combined barrier that actually ships (the video never did).

- Barrier `sprache` with parts `jargon` and `leichte-sprache` (`UX-COPY.md` §9.2)
- Part `jargon` — pattern A: marketing-jargon variant vs. plain German
- Part `leichte-sprache` — pattern A: absent vs. a disclosure-style panel with an
  independent easy-language version
- Parent checkbox with `indeterminate`, `fieldset` + `legend`, per `ARCHITECTURE.md` §12.1

**Acceptance criteria.**
- [ ] Parent shows `indeterminate` when exactly one part is resolved
- [ ] Partially resolved counts as **active** in the simulation bar counter
- [ ] `panel.combinedHint` is shown, and its wording makes clear plain German is not easy
      language
- [ ] The easy-language panel is a real disclosure — button, `aria-expanded`, focusable,
      not a CSS-only toggle
- [ ] Both language variants of the main text carry the same substance — reviewed by hand
- [ ] Easy-language text is marked `contentStatus: 'placeholder'` until a specialist
      review exists (`UX-COPY.md` §9.2, §10)

**Depends on.** Slice 14.

---

### Slice 16 — Media section

**Delivers.** Three barriers, two of which axe can detect — a welcome change after the
application process, where most were manual.

- Simulated social embed, static local markup, no third-party iframe
  (`ARCHITECTURE.md` §16)
- Barrier `alt` — pattern B: `alt` absent vs. present. `automatedDetection: 'axe'`,
  rule `image-alt`
- Barrier `emoji` — pattern A: emoji-carrying post vs. plain sentence with one decorative
  emoji. `automatedDetection: 'manual'`
- Barrier `kontrast` — pattern B: `--sim-fail-text` overlay vs. `--sim-text` on a darkened
  gradient. `automatedDetection: 'axe'`, rule `color-contrast`

**Acceptance criteria.**
- [ ] axe run 2 reports `image-alt` with `alt` active, `color-contrast` with `kontrast`
      active, and neither when resolved
- [ ] Fixture entries exist for both axe-detectable barriers
- [ ] No network request leaves the page in any state
- [ ] The resolved emoji post keeps exactly one decorative emoji — the lesson is placement,
      not abstinence
- [ ] All eight tested states of this section pass runs 1 and 3

**Depends on.** Slice 14 (parallel with 15).

---

### Slice 17 — Event section: three-part combined barrier

**Delivers.** The strongest teaching artefact in the tool, and the only physical barrier.

- Event block per `UX-COPY.md` §9.6
- Barrier `event` with parts `einladung`, `dolmetschung`, `zugang`
- Part `einladung` — pattern A: PDF-only download vs. programme as text, PDF retained
- Part `dolmetschung` — pattern A: absent vs. stated. `organisational: true`, empty
  `standards`
- Part `zugang` — pattern A: steps illustration without alt and no access information vs.
  ramp illustration with alt plus an access list. `organisational: true`
- Two schematic SVG illustrations per §4.2

**Acceptance criteria.**
- [ ] Parent shows `indeterminate` for any one or two resolved parts
- [ ] All three parts toggle independently; the parent resolves only when all three do
- [ ] The explanation names the digital/physical distinction from §4.3 explicitly
- [ ] Explanation view renders `explanation.noStandard` for `dolmetschung` and `zugang`
- [ ] SVG illustrations use `--sim-*` tokens only and render correctly under
      `forced-colors`
- [ ] The steps illustration has no `alt` while its part is active; the ramp illustration
      carries the full alternative text when resolved
- [ ] Contract test: a combined barrier's parts may each carry their own
      `organisational` flag independently of the parent

**Depends on.** Slice 14.

**Note.** The last criterion is the one to watch. `BarrierPart` was modelled before
organisational barriers existed; verify it carries `organisational` and `standards` per part
rather than inheriting from the parent, and fix the model here if not.

---

### Slice 18 — Donation section

**Delivers.** Four barriers, including both time-dependent ones.

- Barrier `fortschritt` — pattern B: graphic-only vs. adjacent text, graphic
  `aria-hidden`. `automatedDetection: 'axe'`
- Barrier `countdown` — pattern B: no live region vs. `aria-live="polite"` on a per-minute
  cadence while the visible display ticks per second (`UX-COPY.md` §9.8).
  `automatedDetection: 'manual'`
- Barrier `slider` — pattern A: drag-only slider vs. labelled number input plus presets,
  slider retained and keyboard-operable. `automatedDetection: 'manual'`
- Barrier `karussell` — pattern A: auto-advance without pause vs. pause control, position
  indicator, stop on focus or hover. `automatedDetection: 'manual'`
- `csr.donate.simulationNote` present in every state

**Acceptance criteria.**
- [ ] Countdown's live region announces per minute, never per second, and never while a
      frame announcement is in flight (`ARCHITECTURE.md` §12.2)
- [ ] Exactly one live region in the frame plus at most one in the simulation
- [ ] Carousel tests use `page.clock`, never `waitForTimeout` (`TESTING.md` §10)
- [ ] Under `prefers-reduced-motion`: carousel does not auto-advance in either state, and
      the suppression note names what would otherwise happen
- [ ] Negative control passes: with no preference set and the barrier active, the carousel
      does advance
- [ ] Slider resolved: arrow keys change the value, number input has an associated label
- [ ] Simulation note present in all states, never subject to a barrier

**Depends on.** Slice 14.

---

### Slice 19 — Scenario integration and state matrix

**Delivers.** The whole-scenario behaviour that only exists once the sections are built.

- Full state matrix for the scenario per `TESTING.md` §4 — twelve states plus the
  partial-repair states of both combined barriers
- Area summary line reporting the campaign's areas (Kommunikation, IT, CSR)
- Deep links across all sections
- Playwright sharding if the suite exceeds the pull-request budget (`TESTING.md` §4)

**Acceptance criteria.**
- [ ] Every tested state passes axe runs 1 and 3
- [ ] Every axe-detectable barrier passes run 2 in both directions
- [ ] Deep link reproduces every state at default system settings
- [ ] `?frei=alle` resolves all thirteen switches including all parts of both combined
      barriers
- [ ] Area summary names exactly the areas present in this scenario
- [ ] Pull-request suite stays within budget, or sharding is in place

**Depends on.** Slices 15, 16, 17, 18.

**Note.** The counts above were corrected while this slice was built. This document, the
`PRD.md` §6.5 scope table, `ARCHITECTURE.md` §12.1.1 and §21, `TESTING.md` §2 and §4 and
`CLAUDE.md` rule 19 all carried an off-by-one for the campaign — eleven barriers and
fourteen switches, against the ten and thirteen its own barrier tables in `PRD.md` §6.2
specify — and the totals inherited it. Nothing was missing from the application; the
arithmetic was wrong. It surfaced because this slice derives its assertions from the
content files rather than from a written-down number, which is also why it cannot recur
silently.

---

## 6. Sequencing

```
13 ── 14 ─┬─ 15 ─┐
          ├─ 16 ─┼─ 19
          ├─ 17 ─┤
          └─ 18 ─┘
```

Slices 15 to 18 are independent of each other — each owns one page section and one set of
barriers, and none reads another's state. This is the first time the project has genuine
parallelism, and it is a direct result of the section-based structure.

Slice 13 must come first and alone: it changes a model the shipped application process
depends on.

---

## 7. Definition of Done for Phase 2

- [ ] Every slice's acceptance criteria pass
- [ ] CI green, including the expanded state matrix
- [ ] Application-process behaviour unchanged — verified, not assumed
- [ ] `contentStatus` release gate still fails where placeholders remain, easy-language
      text among them
- [ ] `CLAUDE.md` updated if any hard rule changed
- [ ] `PRD.md` §6.5 scope table matches what was actually built

**Not required for phase 2:** the manual passes (§8), procurement, corporate design,
hosting.

---

## 8. The Deferred Manual Passes

Slice 12 of `SPEC_v1.md` is deferred by decision. This section exists so the decision stays
visible rather than quietly becoming permanent.

**What is being deferred.** NVDA, VoiceOver and keyboard-only runs over the built scenarios.
`TESTING.md` §2 puts the automation ceiling at roughly a third of barriers; for everything
else the automated suite asserts that the expected markup is present or absent, which is
weaker evidence than a tool or a person independently recognising the defect.

**Why it compounds.** Each scenario added without a manual pass increases what a single
later session has to cover, and increases the chance that a systemic problem — an
announcement pattern that reads badly, a grouping that confuses — has been replicated three
times before anyone hears it. The application process and the campaign share the panel, the
announcer and the region component, so a defect in any of them is now duplicated.

**The pragmatic minimum**, if a full pass stays out of reach: one hour with NVDA on the
campaign's event barrier and the panel's combined-barrier grouping. Those two carry the most
novel interaction in the scenario, and they exercise the shared components. It is not a
substitute for slice 12 and should not be recorded as one.

**Release position.** `PRD.md` §9 lists the manual passes as release criteria. Phase 2 can
complete without them; a **release** cannot. If a training session is scheduled before the
passes happen, that is a decision to take deliberately and with the BSVH informed — not one
to arrive at by default.

---

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Slice 13 changes application-process rendering | Medium | High — shipped, tested behaviour | Existing e2e suite is the gate; a diff in its output is a defect, not a new baseline |
| `BarrierPart` cannot carry `organisational` per part | Medium | Medium — blocks two event parts | Verify early in slice 17; the model change is small if needed |
| Easy-language placeholder ships unreviewed | Medium | High — a bad easy-language version in an accessibility module | `contentStatus` release gate; flagged in `UX-COPY.md` §10 |
| State matrix pushes CI past its budget | High | Low | Shard by scenario (`TESTING.md` §4); do not shrink the matrix |
| Deferred manual passes never happen | Medium | High | §8; revisit before any release, not after |

---

## 10. Open Questions

**Blocking a slice**

| Question | Slice | Owner |
| --- | --- | --- |
| Explanation prose for the ten campaign barriers | 14–18 | WERTE.IT — scaffolding proceeds under `SPEC_v1.md` §4.1 |
| Specialist review of the easy-language version | 15 | WERTE.IT / Fachstelle für Leichte Sprache |

**Not blocking**

| Question | Owner |
| --- | --- |
| Whether the physical-barrier framing in §4.3 is how WERTE.IT wants it taught | WERTE.IT |
| Whether a photorealistic venue image should replace the SVG later | WERTE.IT |
| Imprint, privacy policy, BITV 2.0 accessibility statement — still open from `SPEC_v1.md` | Philipp / BSVH |
| Campaign video, if material ever appears | WERTE.IT |
| Hosting and `base href` | Philipp, phase 4 |

---

## 11. References

- `docs/PRD.md` §6.2 — the campaign's barriers and their rationale
- `docs/ARCHITECTURE.md` §12.1.1 — panel grouping, §6 — domain model
- `docs/UX-COPY.md` §9 — every German string for this scenario
- `docs/TESTING.md` §4, §10, §11 — state matrix, clock control, system preferences
- `docs/SPEC_v1.md` — phase 1, including the deferred slice 12
- `CLAUDE.md` — working rules
