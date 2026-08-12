# Spec v1 — Phase 1: Frame and Application Process

**Project:** AccessIssue
**Scope:** `PRD.md` §12 phase 1 — foundation, frame architecture, panel, state-in-URL,
application process scenario
**Source documents:** `PRD.md` (v1.2), `ARCHITECTURE.md` (v1.3), `DESIGN.md` (v1.2),
`TESTING.md` (v1.2), `UX-COPY.md` (v1.2)
**Status:** Draft v2.0 — re-sliced after the finished module deck
**Date:** August 2026

---

## 1. What This Document Is

The preceding five documents describe *what* AccessIssue is and *why* each decision was
made. This one describes *what gets built, in what order, and how we know a slice is
done*. It adds no new requirements. Where a detail is already specified elsewhere, this
document links rather than restates — a requirement written twice is a requirement that
will eventually contradict itself.

Slices are sized to be implemented and reviewed in one Claude Code session each, per
`ai_development_process.md` phase 4. They are ordered by dependency, and the order is not
negotiable in two places, called out where they occur.

**Phase 1 delivers a complete, publishable application** with one scenario. That is
deliberate: if the frame/simulation boundary does not hold, the project has a problem
worth discovering now rather than after three scenarios exist (`PRD.md` §12).

**Scope grew after the module deck was finished.** The application process went from two
steps and five barriers to four steps and eleven, following the deck's own process graphic
(`PRD.md` §6.1). Phase 1 is correspondingly larger — thirteen slices rather than eleven —
and the four scenario slices (7–10) are each smaller than the two they replace, which keeps
them reviewable in one session. The change is content-driven, not scope creep: the deck is
the authority on what chapter 3 teaches, and the tool has to match it.

---

## 2. In Scope

| | Deliverable | Source |
| --- | --- | --- |
| A | Dependency cleanup, tokens, self-hosted font, CI skeleton | `ARCHITECTURE.md` §7, §16 |
| B | Domain model, scenario registry, content layer | `ARCHITECTURE.md` §6, §13 |
| C | URL contract: parser, serialiser, state service | `ARCHITECTURE.md` §8 |
| D | App shell: routing, focus, announcements, skip links, home page | `ARCHITECTURE.md` §9, §12 |
| E | Simulation region and simulation bar | `ARCHITECTURE.md` §5, `DESIGN.md` §6 |
| F | Barrier panel | `ARCHITECTURE.md` §12.1, `UX-COPY.md` §5.6 |
| G | Explanation view | `PRD.md` §8.1 F, `UX-COPY.md` §5.8 |
| H | Application process, step 1 — job posting, 2 barriers | `PRD.md` §6.1 |
| I | Application process, step 2 — form, 4 barriers | `PRD.md` §6.1 |
| J | Application process, step 3 — documents, 2 barriers | `PRD.md` §6.1 |
| K | Application process, step 4 — response, 3 barriers | `PRD.md` §6.1 |
| L | Error and special states | `ARCHITECTURE.md` §17 |
| M | Phase 1 acceptance: manual passes | `TESTING.md` §13 |

## 3. Out of Scope for v1

| Not in this spec | Why | Where it goes |
| --- | --- | --- |
| Software procurement scenario | Now fully specified (`PRD.md` §6.2) but out of phase 1 scope | `SPEC_v2.md` |
| CSR campaign scenario | Blocked on video, caption file and transcript (`PRD.md` §10) | `SPEC_v3.md` |
| Corporate design polish, funding notices | Assets pending; tokens already carry the palette | Phase 4 |
| Hosting and deployment configuration | Host undecided; build stays host-agnostic | Phase 4 |
| Cross-browser suite on Firefox and WebKit | Weekly job, not a merge gate (`TESTING.md` §15) | Phase 4 |
| Barrier overview page, comparison mode | P1/P2 in `PRD.md` §8.2, §8.3 | Later |

The architecture must not foreclose any of these. The registry already models a `planned`
scenario, so the home page shows procurement as unavailable from day one without a code
change.

---

## 4. Two Decisions This Spec Has to Make

Both are open in `PRD.md` §10 and both block a phase 1 slice. Waiting on them would idle
the work, so each gets a default that is cheap to reverse.

### 4.1 Editorial placeholders must not ship silently

`PRD.md` §8.1 F requires four text parts per barrier, authored by WERTE.IT. Those texts do
not exist yet. `UX-COPY.md` §8 supplies usable Elbwerk copy, but *not* the explanation
prose — that is explicitly editorial.

The contract test in `TESTING.md` §8 asserts every barrier has non-empty `problem`,
`affected` and `solution`. A placeholder satisfies it. So the suite would go green on
content that must never reach a training session.

**Decision.** Add one field to `Barrier` and `BarrierPart`:

```ts
/** Editorial state. 'placeholder' text is written by engineering as scaffolding
 *  and must be replaced by WERTE.IT before release. */
contentStatus: 'placeholder' | 'approved';
```

Two tests follow. The existing one keeps checking that prose exists. A new one, tagged as
a **release gate rather than a merge gate**, asserts that no barrier is still
`'placeholder'`. It fails loudly on a release tag and is skipped on pull requests.

This is the smallest mechanism that lets implementation proceed on scaffolding text while
making it impossible to forget. It costs one field and one test.

### 4.2 The PDF barrier starts simulated

Whether the job posting downloads a real untagged PDF is open (`ARCHITECTURE.md` §20).
A real file has to be authored, kept in sync with the HTML variant, and maintained; a
simulated one cannot be opened in a screen reader, which weakens the demonstration.

**Decision for phase 1:** a link that looks and reads exactly like a real download —
correct filename, size, file-type indication in the link text (`UX-COPY.md` §8.2) — but
resolves to a static asset that may initially be a placeholder PDF. The barrier's teaching
value in the tool comes from *the posting being unavailable as text*, which works either
way.

Structure the component so the target is a single asset path. Swapping in a genuinely
untagged PDF later is then a one-line change plus a file, not a rework.

---

## 5. Slices

Each slice lists what it delivers, what must be true before it starts, and how it is
verified. "Done" means the acceptance criteria pass **and** the tests named in the slice
are written and green — tests are part of the slice, not a follow-up
(`TESTING.md` §17).

---

### Slice 0 — Project foundation

**Delivers.** A buildable, lintable, testable skeleton with the dependency decisions from
`ARCHITECTURE.md` §7 applied.

- Remove `@ngrx/store`, `@ngrx/router-store`, `@ngrx/store-devtools`, `jsonpath`,
  `flatted`, `typedjson`, `reflect-metadata`, `comment-json`
- Keep `@ngrx/signals` (unused, zero bundle cost, documented upgrade path)
- Remove `@fortawesome/fontawesome-free`; state symbols ship as inline SVG
  (`DESIGN.md` §9)
- Add `@playwright/test` and `@axe-core/playwright` as dev dependencies
- Add `angular-eslint` and configure `npm run lint`. Enable the template accessibility
  rules — `@angular-eslint/template/alt-text`, `elements-content`, `label-has-associated-
  control`, `valid-aria`, `click-events-have-key-events`, `interactive-supports-focus`,
  `no-autofocus`, `table-scope`, `role-has-required-aria` — as **errors**, not warnings.
  They catch a subset of accessibility defects at authoring time, before axe runs.

  These rules must be **disabled for the simulation components only**, via an ESLint
  override scoped to `src/app/scenarios/**`. Barriers there are deliberate, and a linter
  that forbids them would make the scenarios unbuildable. The override is the lint-level
  counterpart of the token split in `ARCHITECTURE.md` §12.2, and it needs the same comment
  explaining why it exists — otherwise someone will "fix" it.
- Self-host Poppins 400/600/700 as WOFF2, `font-display: swap` (`DESIGN.md` §4)
- Wire `src/styles/_tokens.scss` into the global stylesheet
- `withComponentInputBinding()` in the router config
- GitHub Actions workflow per `TESTING.md` §15, minus the suites that do not exist yet
- Add `puppeteer` as a dev dependency and wire `karma.conf.js` to it, so `npm test`
  resolves a Chromium binary identically on every machine and in CI, rather than
  depending on a system install or a manually exported `CHROME_BIN`

  **This must be wired into `angular.json`.** Angular's test builder constructs its
  Karma configuration in memory from `angular.json` by default; a `karma.conf.js` file
  that exists but isn't referenced via the `test` architect target's `karmaConfig`
  option is silently never loaded. Confirmed the hard way during the first
  implementation session: `CHROME_BIN` exported in the shell worked, the identical
  setting written inside an unwired `karma.conf.js` did nothing. Verify with
  `grep -A 15 '"test"' angular.json` before assuming the file takes effect.

  **`karma.conf.js` must not reference `@angular-devkit/build-angular`.** This project
  uses the newer esbuild-based test builder (`package.json` has `@angular/build`, not
  `@angular-devkit/build-angular`). That builder compiles Angular code itself and does
  not use the classic `@angular-devkit/build-angular/plugins/karma` plugin — requiring
  it throws `Cannot find module` because the package isn't installed, and even
  installing it would only produce a warning that the builder ignores it. `karma.conf.js`
  in this project is plain Karma + Jasmine, with no Angular-specific framework entry.
- Run the zoneless spike (`ARCHITECTURE.md` §20): try
  `provideZonelessChangeDetection()`, verify Material 20 behaves, default to zone-based
  if anything is off. Time-box: half a day. Record the outcome in `ARCHITECTURE.md`.

**Acceptance criteria.**
- [ ] `ng build` succeeds; `npm run lint` and `prettier --check` pass
- [ ] `npm test` runs headless via Puppeteer's Chromium on a machine with no browser
      installed and no `CHROME_BIN` set — the wiring, not just the file, is verified
- [ ] Template accessibility lint rules are errors in the frame and overridden in
      `src/app/scenarios/**`, with the reason documented in the config
- [ ] No font requested from a third-party origin at runtime (network tab is empty of
      external hosts)
- [ ] CI runs on pull requests and blocks on failure
- [ ] Zoneless decision recorded with a one-paragraph rationale

**Note.** Removing `reflect-metadata` and `comment-json` is not in `ARCHITECTURE.md` §7 —
they entered `package.json` alongside `typedjson` and the JSON tooling and have no
remaining consumer. Verify before removing; if something depends on them, keep and record
why.

---

### Slice 1 — Domain model and content layer

**Delivers.** Types from `ARCHITECTURE.md` §6 plus the `contentStatus` field from §4.1
above, the `ScenarioRegistry`, and the application-process scenario as data — structure
and Elbwerk copy real, explanation prose as marked placeholders.

- `models/` — the interfaces, verbatim from `ARCHITECTURE.md` §6
- `content/standards/` — reusable `StandardReference` constants for the criteria named in
  `PRD.md` §6.1, against **WCAG 2.2** (`PRD.md` §6.3 note)
- `content/application-process/` — `.scenario.ts` and `.content.ts`, split per
  `ARCHITECTURE.md` §13
- `content/csr-campaign/` and `content/software-procurement/` — registry entries with
  `status: 'planned'` only, no barriers
- `ScenarioRegistry` — lookup by path, by step, by `urlKey`

**Acceptance criteria.**
- [ ] All data contract tests from `TESTING.md` §8 written and green
- [ ] `urlKey` snapshot test in place, with the comment explaining that a failure means
      restore the key, not update the snapshot
- [ ] Reserved-word test (`alle`) green
- [ ] Release-gate test for `contentStatus` written and correctly **failing** while
      placeholders exist
- [ ] Procurement scenario resolves as `planned` with no barriers and no route

**Depends on.** Slice 0.

---

### Slice 2 — URL contract

**Delivers.** `core/url-state.ts` and `core/barrier-state.service.ts` — the only real
logic in the application.

- Parse and serialise `frei` per the grammar in `ARCHITECTURE.md` §8
- Parse `erklaerung` (same vocabulary, independent parameter)
- `BarrierStateService` per §7: signal-derived, navigation-driven, `replaceUrl: true` on
  toggle and on explanation selection
- Combined-barrier rule: parent resolved only when every part is
- Toggling a barrier also sets `erklaerung` to that barrier (§8, implicit selection)

**Acceptance criteria.**
- [ ] Every row of the table-driven parser test in `TESTING.md` §9 passes, including the
      degenerate inputs and the 10 000-character input
- [ ] Round-trip property holds for every subset of the scenario's barriers
- [ ] `Router` spy confirms `replaceUrl: true` on toggle, absent on step navigation
- [ ] Branch coverage ≥ 95 % on `url-state.ts` and `barrier-state.service.ts`
      (`TESTING.md` §14)

**Depends on.** Slice 1.

**Order note.** This slice must precede every UI slice. Building panel or scenario
components against a provisional state shape and retrofitting the URL contract afterwards
is the single most likely way to end up with in-memory state that drifts from the URL —
the class of bug `ARCHITECTURE.md` D2 exists to eliminate.

---

### Slice 3 — App shell and frame

**Delivers.** Everything outside the simulation region: routing, focus management,
announcements, skip links, header, home page.

- Routes per `ARCHITECTURE.md` §9, lazy-loaded per scenario, `base href` configurable
- `FocusManager` — focus the `h1` on `NavigationEnd`, announce the page title, reset
  scroll
- `Announcer` — the frame's single polite live region (§12.2), announcement format from
  `UX-COPY.md` §5.7
- `SkipLinksComponent` — two links in the header; the third is rendered by slice 4
- Header, scenario navigation, home page per `UX-COPY.md` §5.1–5.2
- `VisuallyHidden` directive
- Layout per `DESIGN.md` §5: panel column left, single column below 1024 px, nothing
  sticky

**Acceptance criteria.**
- [ ] Home page lists both available scenarios and procurement as `In Vorbereitung`
- [ ] Barrier counts on the home page come from scenario data, never from literals
      (`UX-COPY.md` §5.2)
- [ ] axe run 1 (frame gate) and run 3 (page-level rules) green on home and on a bare
      scenario route
- [ ] Focus lands on the `h1` after every navigation; page title announced once
- [ ] Exactly one live region in the frame; announcing twice does not create a second
- [ ] Keyboard: skip links are the first two focusable elements and both work
- [ ] Reflow at 400 % zoom and 320 px width without horizontal scrolling
- [ ] Every interactive target ≥ 24 × 24 px, asserted over all focusable frame elements
      (`TESTING.md` §13)

**Depends on.** Slice 2.

**Order note.** The frame gate must be green here, before any barrier exists
(`TESTING.md` §17). Keeping a clean frame clean is far cheaper than cleaning one later,
and every subsequent slice inherits the gate.

---

### Slice 4 — Simulation region and simulation bar

**Delivers.** The boundary — the load-bearing component of the whole architecture
(`ARCHITECTURE.md` §5).

- `SimulationRegionComponent`: `role="region"`, `aria-label`, visible border, `h2` heading
- Exit link as the first focusable element inside the region (`UX-COPY.md` §5.5)
- `aria-describedby` → the short, static `simBar.description`; the text does not change
  with barrier state (§5.1)
- `skip.afterSimulation` rendered immediately before the region, plus the end anchor
- Simulation bar per `DESIGN.md` §6: chip, fictional address, active-barrier count
- Suppression note slot for `prefers-reduced-motion` / `forced-colors` (`UX-COPY.md` §5.9)
- Simulation token set applied; `--sim-focus-ring` on every focusable element inside

**Acceptance criteria.**
- [ ] Exit-link suite from `TESTING.md` §7 green, including the 50-press trap detector
- [ ] Exit link carries a visible focus indicator and is neither clipped nor overlapped
- [ ] Region contains no `h1`; its first heading is an `h2`; scenario content starts at
      `h3` (`ARCHITECTURE.md` §5.6)
- [ ] Every `id` inside the region carries the `sim-` prefix
- [ ] The counter counts *active* barriers and is the only counter in the document
      (`UX-COPY.md` §5.6)
- [ ] `simBar.chip` is `Simulation` in the string; uppercase comes from CSS
- [ ] axe run 3 green with the region present and empty

**Depends on.** Slice 3.

---

### Slice 5 — Barrier panel

**Delivers.** The control surface, and the component that has to be exemplary because it
teaches by example.

- `mat-checkbox` throughout (`ARCHITECTURE.md` §12.1)
- Combined barriers as `fieldset` + `legend` + indeterminate parent + one box per part
- State labels per `UX-COPY.md` §5.6; three-way state coding — text, symbol, colour
  (`DESIGN.md` §3.3)
- Bulk actions: `panel.resolveAll`, `panel.activateAll`
- Announcement on every change, per `UX-COPY.md` §5.7
- Explanation link per barrier
- No `<form>`, no submit control, no counter of its own

**Acceptance criteria.**
- [ ] Every checkbox has a programmatically associated accessible name
- [ ] Combined barrier renders `fieldset`/`legend`; parent shows `indeterminate` when
      parts disagree
- [ ] Partially resolved combined barrier counts as **active** in the simulation bar
- [ ] Focus stays on the activated checkbox after a toggle; the simulation re-renders
      without stealing focus
- [ ] Nested part checkboxes still meet 24 × 24 px — indentation reduces offset, not
      target (`DESIGN.md` §5)
- [ ] Panel is fully keyboard operable in a sensible order
- [ ] Bulk actions set every toggle in the current scenario and announce once, not per
      barrier
- [ ] axe runs 1 and 3 green in every panel state

**Depends on.** Slice 4.

---

### Slice 6 — Explanation view

**Delivers.** The dual channel (`ARCHITECTURE.md` §5.4) — the reason a blind participant
gets the same learning content as a sighted one.

- Four rubrics per `UX-COPY.md` §5.8, as question headings
- Standards references rendered from structured data, never prose
  (`PRD.md` §8.1 F)
- Current-state line: active or resolved
- Empty state, direction-neutral
- Driven by the `erklaerung` parameter; content changes announce through the frame's
  existing live region

**Acceptance criteria.**
- [ ] `?erklaerung=<urlKey>` opens the view on that barrier; unknown value falls back to
      the empty state with no error
- [ ] Toggling a barrier sets `erklaerung` and updates the view, while focus stays on the
      checkbox
- [ ] All four parts render for every barrier; missing prose is impossible by contract
      test
- [ ] Explanation is reachable and readable regardless of the barrier's state
- [ ] Standards render with criterion, level and title from `StandardReference`

**Depends on.** Slice 5.

---

### Slice 7 — Application process, step 1: job posting

**Delivers.** The first real simulation content, and the first two barriers.

- Elbwerk page frame per `UX-COPY.md` §8.1, plain HTML and CSS, system font stack, no
  Angular Material inside the region (`ARCHITECTURE.md` §11)
- Barrier `grafik` — pattern A: salary and benefits as an unlabelled image vs. as text with
  a heading and list (`UX-COPY.md` §8.6). `automatedDetection: 'axe'`, rule `image-alt`
- Barrier `sprache` — pattern A: bureaucratic vs. plain-language variant, identical
  substance (`UX-COPY.md` §8.3). `automatedDetection: 'manual'`
- Step navigation to step 2, carrying `frei` forward, pushing a history entry

**Acceptance criteria.**
- [ ] Structural assertions from `TESTING.md` §6 for both barriers, active and resolved
- [ ] axe run 2 reports `image-alt` when `grafik` is active and not when resolved
- [ ] All four tested states (n + 2) pass axe runs 1 and 3
- [ ] Deep link reproduces every state exactly (`TESTING.md` §12)
- [ ] Headings inside the region start at `h3` and nest correctly
- [ ] Both language variants carry the same factual content — reviewed by hand, recorded
      in the slice review
- [ ] Step navigation preserves toggle state and pushes history

**Depends on.** Slice 6.

---

### Slice 8 — Application process, step 2: application form

**Delivers.** Four barriers, including the two that are hardest to implement honestly.

- Form per `UX-COPY.md` §8.4, eight fields, simulation note always present
- Barrier `labels` — pattern B: `<label for>` vs. adjacent `<div>`.
  `automatedDetection: 'axe'`, rule `label`
- Barrier `tastatur` — pattern B: submit as `<div>` with click handler vs. `<button>`.
  **By omission, never by interception** (`ARCHITECTURE.md` §5.3).
  `automatedDetection: 'manual'`
- Barrier `pflichtfeld` — pattern B: red asterisk only vs. legend plus „(Pflichtfeld)" in
  the label plus `required` (`UX-COPY.md` §8.7). `automatedDetection: 'manual'`
- Barrier `fehler` — pattern A: opaque `Code 422` message vs. error summary with jump
  links, `aria-invalid`, field association, focus to first error (`UX-COPY.md` §8.5).
  `automatedDetection: 'manual'`
- No submission, no persistence, no network request

**Acceptance criteria.**
- [ ] axe run 2 reports rule `label` when `labels` is active and not when resolved
- [ ] Fixture entry exists for every `'axe'` barrier; a missing entry fails the suite
- [ ] Keyboard assertions use real key events, not `.focus()` (`TESTING.md` §6)
- [ ] With `tastatur` active: the submit control is unreachable by Tab, **and** Tab still
      leaves the region — the trap detector passes
- [ ] With `fehler` resolved: invalid submission produces `role="alert"`, `aria-invalid`,
      programmatic association, and focus on the first error
- [ ] With `pflichtfeld` active: no `required`, no textual marker — the asterisk carries the
      meaning alone
- [ ] All six tested states of step 2 pass runs 1 and 3
- [ ] Toggle state survives navigation between steps in both directions

**Depends on.** Slice 7.

**Order note.** This is the riskiest slice in phase 1. The keyboard barrier is the one
place where a plausible implementation (`preventDefault` on Tab) would violate the
architecture and endanger users. If it cannot be made convincing by omission alone, that
is a finding to record, not a rule to bend.

---

### Slice 9 — Application process, step 3: document upload

**Delivers.** The upload step and the PDF barrier, relocated here from step 1 to match the
module deck (`PRD.md` §6.1).

- Upload page per `UX-COPY.md` §8.8
- Barrier `pdf` — pattern A: posting available only as an untagged PDF download vs. as HTML
  text with the PDF still offered alongside. `automatedDetection: 'manual'`
- Barrier `upload` — pattern A: no format or size information plus an opaque failure
  message vs. formats, size limit, structure hint and specific error messages.
  `automatedDetection: 'manual'`

**Acceptance criteria.**
- [ ] Structural assertions for both barriers, active and resolved
- [ ] The resolved `pdf` variant still offers the download — the accessible state is "also
      as text", not "PDF removed"
- [ ] All four tested states pass runs 1 and 3
- [ ] Deep link reproduces every state

**Depends on.** Slice 8.

---

### Slice 10 — Application process, step 4: response

**Delivers.** The three barriers of the final step, two of which have no standards
reference at all — the first time the application renders that case.

- Confirmation page per `UX-COPY.md` §8.9
- Barrier `bestaetigung` — pattern A: boilerplate German with key details in an image
  signature vs. plain language with details as text. `automatedDetection: 'axe'` when the
  image lacks alt (`image-alt`), otherwise manual
- Barrier `ansprechperson` — pattern A: generic mailbox vs. named person with phone and
  hours. `organisational: true`, empty `standards`, `automatedDetection: 'manual'`
- Barrier `inklusionshinweis` — pattern A: absent vs. present, including the sentence that
  asking has no bearing on the application. `organisational: true`, empty `standards`

**Acceptance criteria.**
- [ ] Explanation view renders `explanation.noStandard` for both organisational barriers
      rather than an empty rubric (`UX-COPY.md` §5.8)
- [ ] Contract test permits an empty `standards` array **only** when `organisational` is
      true, and fails when it is empty otherwise
- [ ] All five tested states pass runs 1 and 3
- [ ] The flow is completable end to end from step 1 to step 4 with state carried through

**Depends on.** Slice 9.

---

### Slice 11 — Error and special states

**Delivers.** The defined behaviour for everything that is not a happy path
(`ARCHITECTURE.md` §17).

- Not-found route, `UX-COPY.md` §5.10
- `planned` scenario page
- `<noscript>` block
- Malformed query strings falling back to the default state

**Acceptance criteria.**
- [ ] Unknown route, unknown `frei` key, unknown `erklaerung` key, malformed query string
      and a link to a planned scenario each land on a defined state with no error page
- [ ] Every error page has an `h1`, receives focus on navigation, and offers a way back
- [ ] axe runs 1 and 3 green on every error state

**Depends on.** Slice 3 (can run in parallel with 7–10).

---

### Slice 12 — Phase 1 acceptance

**Delivers.** The evidence that automation cannot produce (`TESTING.md` §13).

- NVDA + Firefox, VoiceOver + Safari, VoiceOver iOS — full pass on all four scenario steps
  in both extreme states
- Keyboard-only run, mouse unplugged
- Zoom 200 % and 400 %, width 320 px
- Manual measurement of the smallest targets, including nested part checkboxes
- Test report filed under `docs/test-reports/` with dates and tool versions

**Acceptance criteria.**
- [ ] Region announced as a region and identified as a simulation
- [ ] Panel step grouping and the area summary line are comprehensible on both screen
      readers; the summary states the correct areas for the current scenario
- [ ] Exit link announced and functional from inside the region, in every barrier state
- [ ] **A barrier explanation read while the barrier is active delivers the same learning
      content as the visual experience** — the criterion that decides whether phase 1 met
      its purpose
- [ ] The two organisational barriers are understandable as barriers, despite having no
      standards reference to point at
- [ ] `PRD.md` §9 release criteria checked off for the phase 1 surface

**Depends on.** Slices 10 and 11.

---

## 6. Sequencing

```
0 ── 1 ── 2 ── 3 ── 4 ── 5 ── 6 ── 7 ── 8 ── 9 ── 10 ── 12
               └───────────────────── 11 ─────────────┘
```

Only slice 11 parallelises. Everything else is a genuine dependency chain, because each
layer needs the one beneath it to exist before it can be tested — and testing is part of
each slice.

Two orderings are load-bearing:

- **Slice 2 before any UI.** The URL contract has to be settled before components read
  state, or in-memory state will drift from the URL.
- **Slice 3's frame gate before slice 7's first barrier.** A clean frame is cheap to keep
  and expensive to restore.

---

## 7. Definition of Done for Phase 1

Phase 1 is complete when all of the following hold:

- [ ] Every slice's acceptance criteria pass
- [ ] CI green: build, lint, unit, component, data contract, and the four Playwright
      suites (frame gate, barrier assertions, page-level rules, exit link)
- [ ] Branch coverage ≥ 95 % on the three gated core modules
- [ ] Manual passes recorded under `docs/test-reports/`
- [ ] `CLAUDE.md` written and current (`ai_development_process.md` step 8)
- [ ] Open questions in §9 below either answered or explicitly deferred with an owner

**Not required for phase 1:** corporate design polish, hosting, the two remaining
scenarios, the P1 items in `PRD.md` §8.2.

---

## 8. Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Simulated keyboard trap cannot be made convincing by omission alone | Medium | High — it is a P0 barrier | Spike in slice 8; if it fails, record the finding and replace the barrier rather than intercepting `Tab` |
| Placeholder explanation prose reaches a training session | Medium | High — wrong content in a teaching tool | `contentStatus` release gate (§4.1) |
| Material 20 misbehaves under zoneless change detection | Low | Low | Time-boxed spike in slice 0; fall back to zone-based |
| Frame gate accumulates exceptions as slices land | Medium | High — the gate stops meaning anything | No allowlist, ever; a frame violation is a tracked issue with a deadline (`TESTING.md` §5) |
| WERTE.IT texts arrive with a different structure than the four-part model | Low | Medium | The model is data-driven; adapting means editing content files, not components |

The first risk is the one worth watching. Everything else has a fallback; that one may
require replacing a barrier the PRD names explicitly.

---

## 9. Open Questions

**Blocking a slice**

| Question | Slice | Owner |
| --- | --- | --- |
| Explanation prose for the five application-process barriers | 6, 7, 8 | WERTE.IT — scaffolding proceeds under §4.1 |
| Is a real untagged PDF required, or is the simulated download acceptable for release? | 7 | WERTE.IT — default in §4.2 unblocks the build |

**Not blocking**

| Question | Owner |
| --- | --- |
| Imprint, privacy policy, and a BITV 2.0 accessibility statement — for a tool on this subject, their absence needs explaining | Philipp / BSVH |
| `Elbwerk` checked against the trade register and DPMA | Philipp |
| Whether the job posting should mirror a real BSVH-adjacent role or stay neutral | WERTE.IT |
| Hosting and `base href` value | Philipp, phase 4 |

---

## 10. References

- `docs/PRD.md` — problem, scenarios, requirements, release criteria
- `docs/ARCHITECTURE.md` — boundary, domain model, URL contract, ADRs
- `docs/DESIGN.md` — tokens, layout, focus, target size
- `docs/UX-COPY.md` — every German string, Elbwerk placeholder copy
- `docs/TESTING.md` — the suites each slice has to satisfy
- `CLAUDE.md` — working rules for implementation sessions
- `ai_development_process.md` — process this spec sits in
