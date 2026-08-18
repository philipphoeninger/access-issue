# Testing Strategy — AccessIssue

**Project:** AccessIssue
**Source documents:** `docs/PRD.md` (v1.1), `docs/ARCHITECTURE.md` (v1.1)
**Status:** Draft v2.1 — state matrix extended for the CSR campaign
**Date:** August 2026

---

## 1. Why This Project Tests Differently

Most test suites assert that an application is correct. This one has to assert two
opposite things at once:

- the **frame** contains zero accessibility violations, in every reachable state
- the **simulation region** contains exactly the violations we intended, and no others

A suite that only checks the first is useless here, because a barrier that fails to be a
barrier is a silent content defect: the lecturer shows a slide claiming "this form has no
labels", and the form has labels. Nothing crashes. Nobody notices until a training
session goes wrong.

Two consequences run through this whole document. First, **absence of violations is a
gate, presence of violations is an assertion** — both are tests, and they need opposite
expectations. Second, the tests are driven by the scenario data, not hand-written per
barrier, so that adding a barrier automatically adds its tests.

---

## 2. The Automation Ceiling

This is the most important number in this document, and it should be stated before any
tooling: **of the twenty-eight barriers across three scenarios, eight are detectable by
axe.** Two thirds are not.

| Detectable by axe | Scenario | axe rule |
| --- | --- | --- |
| Salary/benefits as unlabelled image | Application | `image-alt` |
| Missing form labels | Application | `label` |
| Image signature without alt | Application | `image-alt` |
| Social embed without alt text | CSR | `image-alt` |
| Low-contrast text overlay | CSR | `color-contrast` |
| Progress bar as pure graphic | CSR | `image-alt` |
| Ticket system: tables without header cells | Procurement | `th-has-data-cells` |
| Ticket system: insufficient contrast | Procurement | `color-contrast` |

The first six are built and their rule ids come from `src/app/content/axe-rule-fixtures.ts`,
which is what run 2 reads (§5) — the table above is a summary of that file, never a second
source. The last two are `PRD.md` §6.3's, and will be checked against the fixture when the
procurement scenario is built.

This table listed nine until `SPEC_v2.md` slice 19. Two of the nine were stale rather than
wrong at the time: the campaign video was dropped for want of material (`PRD.md` §6.2), and
the progress bar turned out to plant `image-alt` rather than `svg-img-alt` when it was
built.

**Not detectable — the majority.** Untagged PDF, overly complex language, no keyboard
operation, required fields marked by colour alone, no error feedback, missing upload format
information, boilerplate confirmation text, no named contact, no note that adjustments are
possible, anglicisms and missing plain-language version, emojis carrying information,
missing event accessibility details, countdown without live region, slider without keyboard
equivalent, carousel without pause, no accessibility criteria in the tender, no proof
required, no practical test, no assigned responsibility, keyboard traps in the purchased
system.

Two of these are worth calling out separately, because they are invisible to *every*
tool: **no named contact person** and **no note that adjustments are possible**
(`PRD.md` §6.1). They violate no success criterion at all. Nothing automated can find them,
and no conformance audit would flag them — which is precisely why the module includes them.

The `automatedDetection` field in the domain model (`ARCHITECTURE.md` §6) records this
per barrier and drives which test path each one takes.

Two things follow.

**For the test strategy:** manual passes are not a nice-to-have appended after the
automated suite. They are the primary evidence for two thirds of the barriers. The
automated suite is a regression net, not a proof. Barriers marked
`automatedDetection: 'manual'` get structural assertions instead (§6), which verify that
the expected markup is present or absent — necessary, but weaker evidence than a tool that
independently recognises the defect.

**For the module itself:** this table is teaching material. A company that runs an
automated checker, sees green, and declares itself compliant has verified less than half
of what this small training tool deliberately gets wrong. Worth handing to the WERTE.IT
team for Chapter 4.

---

## 3. Test Layers

```
        ┌──────────────────────────────────────────┐
        │ Manual passes                            │  release criteria
        │ NVDA · VoiceOver · keyboard · zoom       │  not automatable
        ├──────────────────────────────────────────┤
        │ E2E + accessibility (Playwright + axe)   │  ~40 spec files worth
        │ 3 axe runs · deep links · focus · keys   │  the real safety net
        ├──────────────────────────────────────────┤
        │ Component tests (TestBed)                │  frame components
        │ panel semantics · region · announcer     │
        ├──────────────────────────────────────────┤
        │ Unit + data contract tests (Jasmine)     │  many, fast
        │ URL parser · state service · content     │
        └──────────────────────────────────────────┘
```

The pyramid is deliberately top-heavy compared to a typical web app. There is no business
logic to speak of — eleven booleans and a URL parser. The risk lives in rendering and
interaction, which is where Playwright operates.

**Tooling:**

| Layer | Tool | Rationale |
| --- | --- | --- |
| Unit, component | Karma + Jasmine | Already configured in `package.json` |
| E2E, accessibility | Playwright + `@axe-core/playwright` | Emulates `prefers-reduced-motion` and `forced-colors`, has a clock API for the countdown, real keyboard events |
| Manual | NVDA, VoiceOver, browser zoom | No substitute exists |

Playwright is added as a dev dependency in this phase. Karma stays for unit and component
tests rather than migrating to Vitest/Jest — the existing setup works, and a migration
would spend the project's limited time on tooling instead of coverage.

---

## 4. State Space

Full combinations are not worth testing: nine barriers give 512 states in the CSR scenario
alone, and the barriers are independent by construction. The tested set per scenario is **n + 2**:

- all barriers active (the default state, and the pedagogical entry point)
- all barriers resolved
- each barrier resolved individually, all others active

Combined barriers add their **partial-repair states**, which is precisely where the
interesting behaviour lives (`PRD.md` §6.4): the video barrier with captions but no
transcript, and with transcript but no captions.

Concrete counts for v1:

| Scenario | Step / section | Barriers | Tested states |
| --- | --- | --- | --- |
| Application | 1 Job posting | 2 | 4 |
| Application | 2 Form | 4 | 6 |
| Application | 3 Documents | 2 | 4 |
| Application | 4 Response | 3 | 5 |
| CSR | Campaign page | 1 | 3 |
| CSR | Texts (combined, 2 parts) | 1 | 4 + 2 partial |
| CSR | Media | 3 | 8 (see below) |
| CSR | Event (combined, 3 parts) | 1 | 5 + 6 partial |
| CSR | Donation appeal | 4 | 6 |
| Procurement | A Tender | 4 | 6 |
| Procurement | B Ticket system | 3 | 5 |
| **Total** | | **28** | **64** |

The barrier total read 29 until `SPEC_v2.md` slice 19, one more than its own column adds
up to and one more than `PRD.md` §6.2 specifies; the same off-by-one stood in `PRD.md`
§6.5 and was corrected there at the same time. Nothing is missing from the application —
every barrier the PRD lists is built.

**The tested-states column adds up per row, not per scenario.** Rows share their two
outermost states: „all active" and „all resolved" are one page load each for a whole
scenario, not one per section. The campaign's five rows come to 34 that way and to
**25 distinct states**, which is what `e2e/support/campaign-states.ts` declares and what
`e2e/csr-integration.spec.ts` checks against the content.

The CSR campaign is a single page, so its rows are page sections rather than routing steps
(`ARCHITECTURE.md` §12.1.1). Its partial-repair states outnumber the others: a three-part
combined barrier has six of them, and they are where the teaching happens.

State carries across steps, so step transitions are tested separately from the per-step
matrix.

Sixty-four states, each running three axe passes plus structural assertions. That is
roughly triple the original estimate and pushes the suite past the point where it stays
comfortably inside an eight-minute pull-request budget on Chromium.

Two mitigations, in this order: shard the Playwright suite by scenario across parallel CI
jobs (cheap, no loss of coverage), and only if that is not enough, move the per-barrier
matrix of the *completed* scenarios to a nightly job while pull requests run the frame
gate, the page-level run and the scenario under active development. Do not reach for
reducing the state set — n + 2 is already the minimum that covers each barrier in
isolation.

**The first mitigation is in place** since `SPEC_v2.md` slice 19, when the campaign's
twenty-five states brought the suite to 431 tests. Four shards, selected by the
`E2E_SHARD` environment variable and declared in `playwright.config.ts`:
`application`, `campaign`, `frame`, and `exit-link` — the last on its own because the
safety-critical path (§7) runs across every state of every scenario and belongs to no
single one. Without the variable, every file runs; a local `npx playwright test` is
unchanged.

Playwright's own `--shard=i/n` would balance the four more evenly. It is not used, because
it splits by count rather than by subject: a red check named „shard 2 of 4" says nothing
about what broke, and the weekly cross-browser run cannot ask it for one scenario.

**A spec file that belongs to no shard would silently stop running in CI** while every
check stayed green — so `playwright.config.ts` checks the membership against the directory
on every run, local ones included, and refuses to load rather than reporting it. The second
mitigation stays unused while this one fits.

**Why not the full power set.** Barriers are implemented independently and share no
state; an interaction bug between two of them would be a defect in the state service, not
in a scenario, and the state service is unit-tested directly. If a future barrier ever
reads another barrier's state, that pair gets its own combination test and this rationale
is void for that pair.

**The media section is the one exception, and it is deliberate.** `SPEC_v2.md` slice 16
asks for all eight combinations of its three barriers by name, and the row above was
changed from 5 to 8 when that slice was built rather than the spec being trimmed to match.
The reason it is worth the three extra page loads: `alt`, `emoji` and `kontrast` are three
barriers in *one* component and one stylesheet, which is the situation the independence
argument above does not cover on its face — `alt`'s `image-alt` violation has to appear
whether or not `kontrast` is repaired, and the caption's contrast is computed over markup
the `alt` branch rewrites. Do not read this as licence to power-set the donation section's
four; that would be sixteen states of barriers that genuinely do not touch each other.

---

## 5. The Three axe Runs

Every tested state runs all three. They differ in scope and in expectation.

### Run 1 — Frame gate (must be clean)

```ts
await new AxeBuilder({ page })
  .exclude('[data-simulation-region]')
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
  .analyze();
// expect: violations.length === 0
```

Zero violations, no exceptions, no allowlist. This is the release gate from `PRD.md` §9.
If a frame violation is ever "temporarily accepted", it belongs in a tracked issue with a
deadline, not in a test exclusion.

### Run 2 — Barrier assertion (must find what we planted)

Scoped **to** the simulation region, run only for barriers with
`automatedDetection: 'axe'`:

```ts
const results = await new AxeBuilder({ page })
  .include('[data-simulation-region]')
  .analyze();
// barrier active   → expect a violation with the expected rule id
// barrier resolved → expect no violation with that rule id
```

The mapping from barrier to axe rule id lives in a **test fixture**, not in the domain
model:

```ts
// src/app/content/axe-rule-fixtures.ts — scenario path, then Barrier.id
export const AXE_RULE_FIXTURES: Record<string, Record<string, string>> = {
  bewerbung: { labels: 'label', grafik: 'image-alt' },
  'csr-kampagne': { alt: 'image-alt', kontrast: 'color-contrast' },
};
```

Keeping it out of `Barrier` is deliberate. Rule ids are axe's vocabulary, not the
project's; axe renames and splits rules between major versions, and a rename would
otherwise force an edit to editorially reviewed content files. The domain model records
*whether* a barrier is machine-detectable; the test layer records *how*.

**The key is two-level, and it has to be.** A `Barrier.id` is unique within its scenario
and nowhere else — `sprache` names a barrier in both the application process and the
campaign — so a flat map would let one entry answer for two different barriers while the
"every axe barrier has a fixture entry" check passed for both.

It lives under `src/app/content/` rather than beside the Playwright suite so that the
contract tests can read it as a Karma unit test, and so it sits with the content it maps
to; `expectedRuleFor(scenarioPath, barrierId)` in `e2e/support/axe-runs.ts` is the only
way run 2 obtains a rule id.

A missing entry for a barrier marked `'axe'` fails the suite, and so does an entry naming
a barrier its scenario does not declare. That prevents the fixture from falling behind the
content in either direction.

### Run 3 — Page-level rules (whole document)

Runs 1 and 2 both scope by DOM subtree. Some WCAG properties do not respect subtrees, and
a violation straddling the boundary falls through both:

```ts
await new AxeBuilder({ page })
  .withRules([
    'heading-order', 'duplicate-id-active', 'duplicate-id-aria',
    'landmark-one-main', 'landmark-unique', 'landmark-complementary-is-top-level',
    'html-has-lang', 'html-lang-valid', 'page-has-heading-one', 'region',
  ])
  .analyze();
// expect: violations.length === 0, in every state
```

This run is what enforces the boundary invariants in `ARCHITECTURE.md` §5.6. Without it,
an `h1` inside the simulation region or an `id` collision between a simulated form field
and a panel checkbox would pass the entire suite while corrupting the document outline
for every screen reader user.

---

## 6. Structural Assertions for Manual-Only Barriers

The seven barriers axe cannot see still get automated coverage — just not from axe. Each
is asserted structurally: the thing that should be missing is missing, and the thing that
should be present is present.

| Barrier | Assertion when active | Assertion when resolved |
| --- | --- | --- |
| PDF-only job posting | a download link exists; no equivalent HTML posting is present in the region | posting text is in the DOM as headings and paragraphs |
| Complex language | rendered text matches the complex variant fixture | rendered text matches the plain-language variant |
| No keyboard operation | the submit control is not reachable by `Tab` from the region start within N presses; it has no `tabindex` and is not a `<button>` | control is a `<button>`, reachable by `Tab`, activatable by `Enter` and `Space` |
| No error feedback | submitting invalid input produces no `[role="alert"]`, no `aria-invalid`, no `aria-describedby` | error message present, `aria-invalid="true"`, field programmatically associated, focus moved to the first error |
| Countdown without live region | countdown element has no `aria-live` and no `role="timer"` | `aria-live="polite"` present and value updates announced |
| Slider without keyboard equivalent | no `<input type="number">`, no preset buttons, slider not focusable | number input present with a label; arrow keys change the value |
| Carousel without pause | no pause control; slide index advances after the clock is advanced | pause control present and operable; pausing halts advancement |

The keyboard assertions are the ones that matter most, and they need real key events —
`page.keyboard.press('Tab')` in a loop, reading `document.activeElement` — not a synthetic
focus call. A simulated keyboard trap that a test can bypass by calling `.focus()` is not
being tested at all.

---

## 7. The Safety-Critical Path

`ARCHITECTURE.md` §5.1 makes one promise above all others: **a user can always leave the
simulation region.** If that promise breaks, a training tool about digital participation
has trapped someone — the worst possible failure for this project, and worse than any
number of missing labels.

It therefore gets its own spec file, run against **every** tested state including the
simulated keyboard trap:

```
for each scenario, for each tested state:
  1. focus the element preceding the simulation region
  2. press Tab once
     → expect focus on the exit link ("Simulationsbereich verlassen")
  3. press Enter
     → expect focus in the barrier panel
  4. from the region start, press Tab up to 50 times
     → expect focus to have left the region at least once
     → expect no infinite cycle within the region
```

Step 4 is the trap detector. The simulated trap is supposed to make *one control*
unreachable (`ARCHITECTURE.md` §5.3), never to hold the user inside the region. If Tab
cycles indefinitely within the region, the barrier was implemented by interception rather
than by omission, and that is a bug regardless of how convincing the demonstration looks.

The suite also asserts that the exit link, when focused, carries a visible focus indicator
(`--sim-focus-ring`) and is not clipped or overlapped. An exit that is reachable but
invisible is only half an exit, and a missing focus ring is never an admissible barrier
here.

---

## 8. Data Contract Tests

Cheap, fast, and they protect things no runtime code checks. All are unit tests over the
real scenario registry, so they scale automatically with content.

| Test | Rationale |
| --- | --- |
| Every barrier has non-empty `problem`, `affected`, `solution` | `PRD.md` §8.1 F requires all four parts; missing prose ships as a blank panel |
| Every barrier has at least one `StandardReference` **unless** `organisational` is true | `PRD.md` §6.1 — six barriers legitimately have none; an unconditional rule would have made them unbuildable |
| No barrier has an empty `standards` array while `organisational` is false | The inverse guard: without it, "organisational" becomes a way to skip editorial work |
| Every **part** of a combined barrier has non-empty `problem`, `affected`, `solution` | The explanation view renders a selected part's prose from `part.*`, never from its parent — the guarantee has to reach the shape with the most content to get wrong |
| No **part** has an empty `standards` array while its own `organisational` is false | The same inverse guard one level down. `BarrierPart` carries the flag itself since `SPEC_v2.md` slice 17 (`ARCHITECTURE.md` §6): the event barrier is technical in one part and organisational in two, and the view states „verstößt gegen keine Norm" off an empty array |
| No barrier whose parts are **all** organisational is marked `automatedDetection: 'axe'` | A part has no detection mode of its own, so the parent's reaches it. All parts organisational means no state can produce a finding. Deliberately `every`, not `some`: a mixed barrier — one detectable technical part beside organisational ones — is legitimate, and forbidding it would drop run-2 coverage for the part a tool really does find |
| Every barrier has a valid `responsibleArea` | Drives the panel grouping label and the area summary line |
| `urlKey` unique within a scenario | Collisions silently merge two barriers into one toggle |
| No `urlKey` equals `alle` | Reserved word, `ARCHITECTURE.md` §8 |
| `urlKey` matches `/^[a-z0-9-]+$/` | Commas, spaces and umlauts would break the comma-separated grammar or force encoding that lecturers cannot hand-edit |
| Snapshot of all `{scenarioPath, urlKey}` pairs | Fails on removal or rename, passes on addition — protects already-printed slides |
| Every `groupId` resolves to a group the scenario declares | The panel fills its fieldsets by matching `groupId`; a typo renders a barrier nobody can switch off |
| Every declared group holds at least one barrier | An empty group is a legend promising controls that are not there — and, in a single-page scenario, an anchor to a section whose barriers went elsewhere |
| Group ids unique within a scenario and matching `/^[a-z0-9-]+$/` | They reach the DOM as `barrier-group-{id}-title`/`-anchor`, which the anchor link's `aria-labelledby` references |
| Every group `anchorId` carries the `sim-` prefix | It targets an element inside the simulation region, so it obeys the region's id rule (`ARCHITECTURE.md` §5.6 rule 2) |
| Every combined barrier has ≥ 2 parts, each with a unique `urlKey` | A one-part combined barrier is a modelling error |
| Every barrier with `automatedDetection: 'axe'` has a fixture entry | Prevents the fixture drifting behind content |
| Scenario `path` values unique | Routing collision |

The snapshot test deserves a note on discipline: when it fails, the correct response is
almost always to restore the key, not to update the snapshot. A comment in the test file
should say so, because the reflex is the opposite.

### 8.1 The token boundary

`scripts/check-token-boundary.js`, run by `npm run check:tokens` and in CI before the
build. It enforces `CLAUDE.md` rule 5 over the stylesheets and templates of both trees:

| Scope | Forbidden | Exceptions |
| --- | --- | --- |
| `src/app/scenarios/**` | `--wi-*` | none |
| `src/app/frame/**`, `src/app/shared/**` | `--sim-*` | `frame/simulation-region/simulation-region.component.scss` |

Three things about it are deliberate:

- **Comments are stripped before matching.** Both token sets are discussed at length in
  the comments of precisely the files that must not *use* them. A checker that could not
  tell prose from a declaration is one people learn to work around.
- **The simulation side has no exceptions**, and that is what the shared partial buys:
  the Simulationshinweis (`UX-COPY.md` §8.4) is the one text type that reaches from the
  frame into the simulation, and its `--wi-*` declarations live in
  `src/styles/_simulation-note.scss` — outside the scanned tree — with the scenario
  stylesheets only including the mixin. Adding an exception here is the wrong repair;
  moving declarations into the partial is the right one.
- **A stale exemption fails the check.** If the exempted file stops using the token it was
  exempted for, the script says so rather than carrying the entry forever. Same instinct
  as the snapshot test above: an allowlist nobody prunes is how a boundary erodes without
  a single failing test.

The one frame exception is the component that draws the boundary itself: `.skip-simulation`
sits outside the region and is frame-styled, while `.simulation-region` and `.exit-link`
are inside it and must carry Elbwerk's tokens. The file states this at the top.

This is the only rule in `CLAUDE.md` §Boundary that no other test can see. A simulation
set in WERTE.IT's typeface and colours renders correctly, passes all three axe runs and
every structural assertion — and destroys the didactic point of the boundary, because a
participant is meant to recognise a barrier from the behaviour, not from the styling
(`DESIGN.md` §2).

---

## 9. Unit and Component Tests

**`url-state.ts` (parser/serialiser)** — the single piece of real logic, and the one place
where a bug corrupts published links. Table-driven, including every degenerate input:

```
''                    → {}                         (default: all active)
'alle'                → all barrier keys
'labels,fehler'       → {labels, fehler}
'labels,,fehler'      → {labels, fehler}           empty segment ignored
'LABELS'              → {}                          case-sensitive, unknown ignored
'unbekannt,labels'    → {labels}                    unknown ignored, valid applied
'video'               → all parts of the video barrier   parent-key sugar
'labels,labels'       → {labels}                    duplicate collapses
'%20labels'           → {labels}                    trimmed
key from another scenario → {}                      cross-scenario key ignored
'a'.repeat(10_000)    → {}                          no crash, no hang
```

Round-trip property: for any subset of a scenario's barriers, `parse(serialise(s))`
equals `s`. Worth a lightweight property test — the subsets are small enough to enumerate
exhaustively for scenarios of this size, which is better than random sampling.

**`BarrierStateService`** — toggle, `resolveAll`, `resetAll`, and the combined-barrier
rule that a parent is resolved only when every part is. Router navigation is asserted via
a `Router` spy, checking that `replaceUrl: true` is set on toggles and absent on step
navigation (`ARCHITECTURE.md` §10). That single assertion protects the Back button.

**Component tests** (TestBed, real DOM assertions rather than snapshot comparison):

- `BarrierPanelComponent` — each checkbox has an accessible name; combined barriers render
  `fieldset`/`legend`; the parent reflects `indeterminate` when parts disagree; the panel
  renders no `<form>`, no submit control, and no counter of its own
- Barrier count — exactly one counter exists in the document, it counts *active* barriers,
  and a partially resolved combined barrier counts as active (`UX-COPY.md` §5.6). The last
  clause is the one worth asserting: it is a judgement call that a later refactor could
  silently invert
- Area summary — the line under the panel names the distinct `responsibleArea` values of
  the current scenario, correctly pluralised, and updates when the scenario changes. Assert
  the *set*, not a hard-coded sentence: the whole point is that it reflects the data
- Grouping — one `fieldset` per declared `BarrierGroup`, each with a `legend`; a scenario
  declaring one group renders one rather than none. The application process's four legends
  and its eleven checkbox labels are asserted as literals, not derived from the scenario:
  slice 13 replaced the mechanism underneath them, and an expectation computed the way the
  component computes its output would have agreed with whatever the new one produced
- Section anchors — a group with an `anchorId` renders a same-document link whose
  accessible name is its own visible text followed by the group title; a group without one
  renders no link and no id on its legend. The link stands *beside* the legend, never
  inside it: a fieldset is named from its legend's subtree, so a link in there renames the
  group to „Medien Zu diesem Bereich springen" and screen readers repeat that as they move
  through its checkboxes. No axe rule reports this, which is why it has an assertion
- `ExplanationViewComponent` — all four rubrics render for every barrier in the registry,
  in the order of `UX-COPY.md` §5.8; standards render criterion, level and title from the
  `StandardReference`; a barrier with no standards reference keeps the rubric and gets the
  `explanation.noStandard.body` answer; an unknown or foreign `erklaerung` key falls back
  to the empty state. The last two are the ones worth having: dropping the rubric for the
  five barriers without a criterion would look like an editorial oversight rather than the
  point (`PRD.md` §6.1), and an unknown key must never become an error state
  (`ARCHITECTURE.md` §17)
- Arriving at the explanation — following „Was bedeutet das?" focuses the section, so the
  browser scrolls it into view; a *toggle* changing the same parameter does not, because
  focus belongs to the checkbox (`ARCHITECTURE.md` §12.2). Both halves need asserting: a
  link that only rewrites the URL looks broken to a sighted user, and a selection that
  steals focus breaks the panel's focus guarantee. Neither is visible in a screenshot
- `SimulationRegionComponent` — `role="region"`, an `aria-label`, the exit link as the
  first focusable child, `aria-describedby` pointing at a frame-owned element that exists
  and whose text does **not** change with barrier state (`ARCHITECTURE.md` §5.1); the
  region contains no `h1` and its first heading is an `h2`
- `Announcer` — exactly one live region exists **in the frame** at all times; announcing
  twice in quick succession does not create a second region. The assertion is scoped to
  the frame, not the document: the resolved countdown legitimately adds one inside the
  simulation region (`ARCHITECTURE.md` §12.2). A document-wide uniqueness assertion would
  fail as soon as that barrier is repaired — and the tempting fix, dropping the countdown's
  live region, would silently delete the accessible variant the barrier exists to show
- `FocusManager` — on simulated `NavigationEnd`, focus lands on the `h1`

The "exactly one live region" test looks pedantic and is not: two competing polite regions
produce interleaved, unintelligible speech, and the defect is invisible without a screen
reader.

---

## 10. Time-Dependent Barriers

The countdown and the carousel are the only sources of flakiness in the suite. Both are
handled by controlling the clock rather than by waiting:

```ts
await page.clock.install({ time: new Date('2026-09-01T10:00:00') });
await page.clock.fastForward('00:30');
```

No `waitForTimeout`, anywhere, for any reason. A test that sleeps for the carousel
interval is a test that fails on a loaded CI runner and gets marked flaky, then skipped,
then deleted.

The carousel test asserts the slide index advances after the clock moves — and, in the
reduced-motion run, that it does **not**.

---

## 11. System Preference Tests

`ARCHITECTURE.md` §5.5 gives the user's system settings priority over any simulated
barrier. That priority is itself a requirement and needs tests, run once per relevant
barrier rather than across the full state matrix:

| Emulated setting | Expectation |
| --- | --- |
| `prefers-reduced-motion: reduce` | Carousel does not auto-advance even when its barrier is active; the frame-owned suppression note is present and names the reason |
| `forced-colors: active` | Contrast barriers are neutralised; the suppression note is present; the frame remains fully operable |
| `prefers-reduced-motion: no-preference` | Carousel auto-advances when the barrier is active (the negative control) |

The negative control matters: without it, a bug that disables the carousel unconditionally
would pass the reduced-motion test and quietly remove a barrier from the module.

---

## 12. Deep-Link Tests

Directly covers `PRD.md` §8.1 G. For every tested state:

1. reach the state by activating panel controls
2. read `page.url()`
3. open the URL in a fresh context
4. assert the DOM matches the first context — same toggle positions, same rendered variant

Plus the degenerate cases: unknown key, malformed query string, key from another scenario,
and a link to a `planned` scenario. Each must land on a defined state with no error page
(`ARCHITECTURE.md` §17).

**The `erklaerung` parameter** gets the same treatment: a link carrying
`?erklaerung=<urlKey>` opens the explanation view on that barrier, and an unknown value
falls back to the empty state rather than an error. One further assertion covers the
implicit selection rule — after toggling a barrier, the URL carries that barrier's key in
`erklaerung` and the explanation region shows it, while focus remains on the checkbox that
was activated.

One caveat, carried from `PRD.md` §9: reproducibility holds **at equal system settings**.
The deep-link suite therefore runs with system preferences at their defaults, and the
preference interactions are tested separately in §11.

---

## 13. Manual Test Passes

Required before each release. These produce the evidence that the automated suite cannot.

**Screen readers** — NVDA + Firefox (Windows), VoiceOver + Safari (macOS), VoiceOver
(iOS). Per scenario, in both extreme states:

1. Navigate by landmark. The simulation region is announced as a region and identified as
   a simulation.
2. Navigate by heading. The outline is coherent; no `h1` inside the region.
3. Reach the panel, toggle a barrier, confirm the change is announced once, in German,
   intelligibly.
4. On a combined barrier, confirm the group relationship is announced and the
   indeterminate state is comprehensible.
5. From inside the region, use the exit link. Confirm it is announced and works.
6. Read a barrier explanation while the barrier is active. Confirm the dual channel
   (`ARCHITECTURE.md` §5.4) actually delivers the learning content.

Step 6 is the one that decides whether this project met its own goal. Everything else can
be green while a blind participant still learns nothing.

**Keyboard-only** — unplug the mouse, complete both scenarios end to end: every frame
control reachable, focus indicator always visible, no trap outside the intended
single-control omission, exit link always available.

**Zoom and reflow** — 200 % and 400 % browser zoom, 320 px viewport width. No horizontal
scrolling, no clipped content, no overlapping controls in the frame. The simulation region
may look bad if that is its barrier; the frame may not.

**The two WCAG 2.2 criteria that automation misses.** Both are new at AA in 2.2 and neither
is fully covered by axe, so they are manual checks with an automated assist:

- **2.5.8 Target Size.** Measure the smallest interactive targets rather than assuming the
  framework handles it: the nested part checkboxes of a combined barrier, the carousel
  pause control, and the donation preset buttons. Automated assist: a Playwright assertion
  over `getBoundingClientRect()` for every focusable element in the frame, expecting
  ≥ 24 px on both axes. Run at 400 % zoom too, where cramped layouts shrink first.
- **2.4.11 Focus Not Obscured.** Tab through each scenario and confirm the focused element
  is fully visible at every step. The current design has nothing sticky (`DESIGN.md` §5),
  so this should pass trivially — the check exists to catch the day someone makes the
  simulation bar sticky because it looks better, which would cover the exit link first.

**Recording.** Each pass is logged with date, tool version, browser version, and outcome,
in a short file per release under `docs/test-reports/`. Screen reader behaviour changes
between versions, and a finding without a version number cannot be reproduced later.

---

## 14. Coverage Targets

No global percentage gate. A repository-wide threshold on a project this size rewards
tests that execute lines without asserting anything, and the modules that matter here are
few enough to name explicitly.

**Gated (must stay at or above 95 % branch coverage):**

- `core/url-state.ts`
- `core/barrier-state.service.ts`
- `core/scenario-registry.service.ts`
- `core/tolerant-url-serializer.ts`

These four are where a bug corrupts published links or silently drops a barrier. The
serialiser joined them in slice 11: it is the layer that decides whether a URL is read at
all, and its failure mode is the quietest one in the application — a deep link that lands
on the wrong page with the address rewritten behind it (`ARCHITECTURE.md` §17).

**Measured, reported, not gated:** everything else. Coverage is generated on every CI run
and visible in the job summary so a downward trend is noticeable, but it does not block a
merge.

**Explicitly not covered:** Angular Material internals, the Angular Router, and the exact
editorial prose. Asserting on German copy would make every content review from the
WERTE.IT team break the build — the contract tests in §8 assert that text *exists* and is
structurally complete, never what it says.

---

## 15. CI Pipeline

GitHub Actions, since the repository is already on GitHub. Hosting remains undecided
(`PRD.md` §10) and CI does not depend on it.

**On every pull request** (target: under 8 minutes), as two sets of jobs running side by
side. The budget is wall-clock time, so the split is what buys it: five jobs, none waiting
on another.

```
build-and-test                       one job
1. install, `npm run lint`, `prettier --check`, `npm run check:tokens`
   Template a11y rules run as errors in the frame; `src/app/scenarios/**` is exempt
   (deliberate barriers — see `SPEC_v1.md` slice 0)
   The token boundary (§8.1) is static, so it runs here rather than after the build
2. ng build                          catches template and type errors early
3. ng test --watch=false             unit + component + data contract tests
4. scripts/check-coverage.js         the branch-coverage gate of §14

e2e                                  four jobs, one per shard (§4)
   E2E_SHARD=application  playwright test --project=chromium
   E2E_SHARD=campaign     …
   E2E_SHARD=frame        …
   E2E_SHARD=exit-link    …
   ├── frame gate           (run 1, all states)
   ├── barrier assertions   (run 2, axe-detectable barriers)
   ├── page-level rules     (run 3, all states)
   ├── structural assertions for manual-only barriers
   ├── exit-link suite      (§7)
   ├── deep links           (§12)
   └── system preferences   (§11)
```

All of it blocks the merge. A failing accessibility gate in this project is not a warning.

The shards do not cancel each other on failure (`fail-fast: false`): „the campaign is red"
and „everything is red" are different diagnoses, and a cancelled job cannot tell them
apart. Each uploads its report under its own name.

**Weekly, and on release tags:** the same Playwright suite on Firefox and WebKit. Engine
differences show up in focus handling and in `forced-colors`, but rarely enough that
running them on every push would cost more waiting than it catches. Failures open an issue
rather than blocking the merge that happened to precede them.

**Artefacts:** Playwright traces and the full axe JSON for every failure, retained 30
days. The axe JSON matters — "3 violations" in a log tells you nothing; the JSON tells you
which node, which rule, and which state.

**Not in CI:** the manual passes in §13. They are release criteria tracked in a checklist,
not automation, and pretending otherwise would let a release slip through on a green tick.

---

## 16. What This Suite Does Not Prove

Stated plainly because this project of all projects should not overclaim.

- **Automated accessibility testing catches a minority of WCAG issues.** For this
  application specifically, roughly two thirds of the 28 barriers are invisible to axe, and
two violate no success criterion at all (§2). A
  green pipeline means no regression in the automatable subset. It does not mean the frame
  is accessible.
- **Screen reader behaviour is not standardised.** NVDA, JAWS and VoiceOver differ in what
  they announce and when. Passing with NVDA and VoiceOver is evidence, not proof. JAWS is
  out of scope for cost reasons and this is a known gap, not an oversight.
- **Cognitive accessibility is not testable by machine at all.** Whether the plain-language
  variant is genuinely easier to understand is an editorial judgement by the WERTE.IT team
  and, ideally, a check with actual target users.
- **The suite cannot tell whether the tool teaches anything.** That is what the qualitative
  feedback in `PRD.md` §9 is for.

---

## 17. Phasing

Testing is written alongside implementation, not after. Aligned with `PRD.md` §12:

| Phase | Test work |
| --- | --- |
| 1 | Playwright set up; frame gate and page-level run wired before the first barrier exists; data contract tests; `url-state` unit tests; exit-link suite as soon as the simulation region does anything |
| 2 | Barrier assertions and structural assertions per barrier as each is built; time-dependent and system-preference tests with the CSR carousel and countdown |
| 3 | Procurement scenario inherits every data-driven suite for free — the point of the data-driven design |
| 4 | Full manual passes, cross-browser run, release checklist against `PRD.md` §9 |

The frame gate belongs in Phase 1, before any barrier is written. It is far easier to keep
a frame clean than to clean one, and the whole architecture rests on that boundary holding
from the first commit.

---

## 18. References

- `docs/PRD.md` — requirements, release criteria
- `docs/ARCHITECTURE.md` — boundary invariants, domain model, testing hooks
- `docs/DESIGN.md` — design direction, contrast verification
- `docs/SPEC_v1.md` — phase 1 implementation slices
- `docs/ai_development_process.md` — development process
