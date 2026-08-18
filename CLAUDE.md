# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## What this project is

AccessIssue is a static Angular application that simulates real company interfaces
containing **deliberate accessibility barriers**. Each barrier can be toggled between
*barrierebehaftet* (active) and *barrierefrei* (resolved). It is teaching material for the
WERTE.IT qualification module on digital accessibility, commissioned in the context of the
BSVH (Blinden- und Sehbehindertenverein Hamburg).

The application therefore does two opposite things at once, and the split between them is
the whole architecture:

- the **frame** — navigation, barrier panel, explanations — is WCAG 2.2 AA, always, no
  exceptions
- the **simulation region** is deliberately non-conforming while a barrier is active

If you only remember one thing from this file: **never let a barrier escape the simulation
region.**

---

## Language convention

| Where | Language |
| --- | --- |
| Code, comments, commit messages, `CLAUDE.md`, `ARCHITECTURE.md`, `SPEC_v1.md`, `TESTING.md` | English |
| `PRD.md`, `UX-COPY.md`, user-facing documentation, all UI strings | German |
| Conversation with the maintainer | German |

UI strings are German; the keys that hold them are English. `DESIGN.md` is English;
`UX-COPY.md` is German because WERTE.IT reviews it editorially.

No i18n layer. The application is German-only by decision (`PRD.md` §4).

---

## Commands

```bash
npm start              # dev server
npm run build          # production build
npm test               # unit + component tests (Karma/Jasmine)
npm run lint           # angular-eslint, template a11y rules as errors
npm run check:tokens   # frame/simulation token boundary (rule 5)
npx prettier --check . # formatting (printWidth 100, singleQuote)
npx playwright test    # e2e + accessibility suites (whole suite)
```

CI runs Playwright as **four parallel jobs, sharded by scenario** — `application`,
`campaign`, `frame`, `exit-link` — selected with `E2E_SHARD=<name>`
(`playwright.config.ts`, `TESTING.md` §4). Without the variable every file runs, which is
what a local run should keep doing; `E2E_SHARD=campaign npx playwright test` reproduces one
CI job. **A new spec file has to be added to a shard**: the config checks membership
against the directory on every run and refuses to load otherwise, because a file no shard
claims would silently never run in CI.

`npm test` resolves Chromium via Puppeteer (`karma.conf.js`), not via a system install or
`CHROME_BIN`. **`karma.conf.js` only takes effect if `angular.json`'s `test` architect
target references it via `karmaConfig`** — Angular's test builder otherwise builds its
Karma config in memory and silently ignores the file. If `npm test` ever reports it can't
find a browser, check that wiring before touching the file itself.

This project uses the **esbuild-based test builder** (`@angular/build`, not
`@angular-devkit/build-angular` — that package is intentionally absent, see
`ARCHITECTURE.md` §7). `karma.conf.js` must therefore stay plain Karma + Jasmine: no
`'@angular-devkit/build-angular'` framework entry, no
`@angular-devkit/build-angular/plugins/karma` plugin. Adding either back throws
`Cannot find module`, or is silently ignored if the package happens to be present.

`karma.conf.js`'s exported config function is `async`, because Puppeteer's
`executablePath()` returns a Promise rather than a string as of a breaking change. If it
is ever rewritten as a plain synchronous function, `CHROME_BIN` silently becomes the
string `"[object Promise]"` and every test run fails to find a browser — a regression
that is easy to reintroduce and non-obvious to diagnose from the error alone.

Playwright runs Chromium on pull requests. Firefox and WebKit run weekly and on release
tags (`TESTING.md` §15).

---

## Documents, and which one answers what

Read the relevant one before changing behaviour. Do not re-derive a decision that is
already recorded.

| Question | Document |
| --- | --- |
| Why does this exist, who is it for, what ships | `docs/PRD.md` |
| How is it built, why this way, what are the invariants | `docs/ARCHITECTURE.md` |
| Colours, type, layout, focus, target size | `docs/DESIGN.md` |
| Every German string, terminology, Elbwerk copy | `docs/UX-COPY.md` |
| What is tested and how | `docs/TESTING.md` |
| What to build next, in what order | `docs/SPEC_v1.md` |
| How this project is run | `docs/ai_development_process.md` |

---

## Hard rules

These are not style preferences. Breaking one is a defect, and most of them are invisible
in a screenshot.

### Boundary

1. **The simulation region never contains an `h1`.** Page `h1` is the scenario title
   (frame), the region's own heading is `h2`, **all scenario content starts at `h3`**.
   Broken heading structure is not an admissible barrier.
2. **Every `id` inside the simulation region carries the `sim-` prefix.** Duplicate ids
   across the boundary break `for` and `aria-labelledby` in the panel.
3. **The region declares no `lang` other than the document language**, unless a future
   barrier deliberately targets SC 3.1.2 — scoped to one element, documented.
4. **Frame code never reads barrier state to change its own accessibility.** The panel and
   explanation read state to render *text*; nothing in the frame changes how it is
   focusable, labelled, or styled because a barrier is active.
5. **Never use a `--wi-*` token inside the simulation, or a `--sim-*` token in the frame.**
   One named exception, and no others: the **Simulationshinweis** — the note that stands
   wherever someone could enter real data — is set in frame style with `--wi-*` tokens.
   `UX-COPY.md` §8.4 designates it as the one text type that reaches from the frame into
   the simulation, and the reason is the point of it: a warning that nothing is
   transmitted, set in Elbwerk's own typeface and colours, reads as part of the fiction it
   exists to interrupt. There are four of them (`elbwerk.form.simulationNote`,
   `elbwerk.upload.simulationNote`, `csr.donate.simulationNote`, `csr.social.disclaimer`); a
   new input point gets a fifth.
   Nothing else in a scenario component may reach across, and the exception does not run
   the other way — no `--sim-*` token in the frame, ever.

   **The exception has exactly one implementation**: `src/styles/_simulation-note.scss`.
   Scenario stylesheets `@include note.simulation-note` and never write a `--wi-*` token
   themselves — which is what keeps the simulation side of this rule at zero exceptions.
   If a note needs a different look, change the partial.

   `npm run check:tokens` enforces all of this and runs in CI (`TESTING.md` §8.1). It
   strips comments before matching, so discussing a token is always allowed; it fails on a
   stale exemption as well as on a violation. The frame's single exemption is
   `frame/simulation-region/simulation-region.component.scss`, the component that draws the
   boundary itself and therefore legitimately holds both sets.

### Barriers

6. **Barriers are implemented by omission, never by interception.** Omit the label, omit
   the `tabindex`, omit the caption track, use a `<div>` where a `<button>` belongs. Never
   add a global handler that fights the user agent — no `preventDefault` on `Tab`, no
   document-level key capture. A real broken page does not intercept; it just fails.
7. **The exit link always works.** First focusable element in the region, in every barrier
   state. This is the one safety-critical path in the application.
8. **A missing focus indicator is never a barrier.** Use `--sim-focus-ring` inside the
   region. `outline: none` is forbidden everywhere.
9. **System preferences beat simulated barriers.** `prefers-reduced-motion` and
   `forced-colors` always win, and the frame shows a note saying what was suppressed and
   what would otherwise happen.
10. **Write both variants honestly.** The accessible variant is authored as a competent
    developer would write it — not as a repair layer bolted onto the broken one. A "fix"
    applied on top teaches that accessibility is a patch, which is the misconception the
    module exists to dispel.

### URL contract

11. **`urlKey` values are public API.** They appear in module slides. Add freely; never
    rename, never reuse, never delete. The snapshot test guards this — when it fails,
    restore the key rather than update the snapshot.
12. **`alle` is reserved** and may not be used as a `urlKey`.
13. **The URL is the source of truth.** Toggling navigates; it does not mutate local
    state. `replaceUrl: true` on toggles and explanation selection, push on step
    navigation.

### Content and copy

14. **Do not invent editorial content.** Barrier explanations (problem, affected, standards,
    solution) come from the WERTE.IT team. Scaffolding text is marked
    `contentStatus: 'placeholder'` and blocks release, not merge.
15. **Use the exact strings from `UX-COPY.md`.** If a string is missing, add it there
    first. Follow the terminology canon (§3): *Barriere*, *aktiv*, *behoben*,
    *barrierefrei*, *Simulation*, *Szenario*, *Schritt*, *Panel* — one term, one meaning.
16. **Address the user as "Du" in the frame.** Elbwerk (the fictional company) uses "Sie".
    The contrast is an intentional boundary signal.
17. **One counter only**, in the simulation bar, counting *active* barriers. A partially
    resolved combined barrier counts as active.
18. **Every barrier names a responsible business area.** The panel groups by `groupId` —
    flow steps in multi-step scenarios, page sections in single-page ones — and
    labels each barrier with its area; a summary line states how many areas a scenario
    spans. This is chapter 3's actual thesis — barriers arise between departments, not
    inside one — so it is not decoration. No area filter: letting a user hide other
    departments' barriers is the exact reflex the module argues against.
19. **Barriers without a standards reference are legitimate.** Six of the 28 violate no
    WCAG criterion — no named contact person, no note that adjustments are possible, no
    accessibility criteria in a tender, no assigned responsibility, no sign-language
    interpreting, no event access details. They carry `organisational: true` and an empty
    `standards` array, and the explanation view says so explicitly rather than hiding the
    rubric. A conformant page that still excludes people is the point, not an edge case.

    **A `BarrierPart` carries the flag itself and never inherits it.** The last two in
    that list are parts of the campaign's event barrier, whose third part *is* a technical
    defect; a part that borrowed its parent's classification would make one of the two
    claims false. An empty `standards` array requires the flag at whichever level it sits,
    and `content/data-contract.spec.ts` enforces both. `responsibleArea` is the opposite
    case and stays barrier-level.

---

## Stack and conventions

- **Angular 20**, standalone components, signals, `OnPush`
- **State**: plain signals in injectable services. No NgRx Store — removed deliberately
  (`ARCHITECTURE.md` §7). `@ngrx/signals` is present but unused.
- **Angular Material in the frame only.** Simulation components are hand-written plain
  HTML and CSS with a system font stack — Material resists being made inaccessible, and
  fighting it would produce unrealistic markup.
- **Barrier panel uses checkboxes throughout**, not slide toggles. Combined barriers are a
  `fieldset` + `legend` + indeterminate parent. `role="switch"` does not accept
  `aria-checked="mixed"`.
- **A scenario step reaches the page through `scenarios/scenario-step-views.ts`.** That map
  gives each `{scenario.id}/{step.id}` a dynamically imported component and the fictional
  Elbwerk path the simulation bar shows; `ScenarioPageComponent` projects the component
  into the region. A new step is an entry there, not a route change and not a field on
  `ScenarioStep` — the content layer has to stay serialisable (`ARCHITECTURE.md` §13, §14).
- **No third-party runtime requests.** Fonts self-hosted, video self-hosted, social embeds
  simulated with local markup. No analytics, no tracking.
- **Assets a stylesheet references live in `src/`; assets markup references live in
  `public/` and are addressed with a relative URL.** `public/` can only be reached by a
  root-absolute path, which 404s under a configurable `base href` (`ARCHITECTURE.md` §16).
  The Poppins WOFF2 files sit in `src/styles/fonts/` for exactly that reason. Never write
  a leading `/` into an asset URL.
- **Two PNGs under `public/simulation/` are generated** from SVG sources in
  `assets-src/simulation/`; each source header carries its own regeneration command, and
  neither source ships. `grafik_benefits_final.png` (`UX-COPY.md` §8.6) is a raster image
  on purpose — an SVG would stay sharp under magnification and take half of the
  text-graphic barrier away. `signatur_personalabteilung_final.png` (§8.9) is one because a
  signature is: built once in a graphics program, then pasted into every template. Editing
  either copy section means re-rendering the file *and* updating the resolved text variant,
  which is the only thing keeping both barrier states carrying the same substance.
  **Two PDFs are generated the same way** — `stellenausschreibung.py` and `einladung.py`,
  both on the shared writer in `untagged_pdf.py` — and they are the files the two PDF-only
  barriers link to. Both are deliberately untagged; that is the barrier, and a tagged
  document would be the opposite of the statement, so do not "improve" that writer. A
  download link that 404s demonstrates nothing, so the file always ships with the barrier.
  The campaign's three post images (`public/simulation/csr-post-*.svg`) are **not**
  generated — they are hand-authored SVGs that ship as they are, with no source in
  `assets-src/`. They stay vector because nothing about them depends on being raster:
  what teaches there is the alternative text (`UX-COPY.md` §9.3), not the pixels.
- **No backend.** Nothing is submitted, stored, or transmitted.
- **No browser storage** — no `localStorage`, no `sessionStorage`. State lives in the URL.
- Prettier: `printWidth: 100`, `singleQuote: true`.

---

## Testing expectations

Tests are part of the slice, not a follow-up.

- **Frame gate**: axe scoped to the frame, excluding the simulation region — zero
  violations, no allowlist, ever.
- **Barrier assertion**: axe scoped *to* the region — the expected violation must appear
  when the barrier is active and disappear when resolved. Only for barriers marked
  `automatedDetection: 'axe'`.
- **Page-level run**: whole document, restricted to `heading-order`, `duplicate-id-*`,
  `landmark-*`, `html-has-lang` — this is what enforces the boundary rules above.
- **Keyboard tests use real key events.** `page.keyboard.press('Tab')` in a loop, reading
  `document.activeElement`. A simulated trap that a test bypasses with `.focus()` is not
  being tested.
- **Never `waitForTimeout`.** Use `page.clock` for the countdown and carousel.
- **Branch coverage ≥ 95 %** on `url-state.ts`, `barrier-state.service.ts`,
  `scenario-registry.service.ts`. No global threshold elsewhere.

Roughly **two thirds of the 28 barriers are invisible to axe** (`TESTING.md` §2), and two
violate no success criterion at all. A
green pipeline means no regression in the automatable subset — it does not mean the
application is accessible. Manual passes with NVDA and VoiceOver are the primary evidence.

---

## Lint override you will encounter

`src/app/scenarios/**` disables the template accessibility rules. This is intentional:
those components contain deliberate barriers, and the linter would otherwise make them
unbuildable. The override is scoped as narrowly as possible and carries a comment
explaining why. **Do not widen it, and do not remove it.** Everything outside that path is
linted with the a11y rules as errors.

---

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), in English:

```
feat(panel): add indeterminate state for combined barriers
fix(url-state): ignore keys from other scenarios
test(exit-link): assert focus leaves region under keyboard trap
docs(architecture): record zoneless change detection decision
```

Scopes follow the folder structure: `core`, `frame`, `panel`, `simulation`, `scenarios`,
`content`, `tokens`, `e2e`.

---

## When something here is wrong

These rules encode decisions made in the documents listed above, each with a recorded
rationale. If a rule blocks something that seems right, the rule may genuinely be wrong —
several already changed during review.

Say so and explain the conflict. Do not quietly work around it: an undocumented exception
to a boundary rule is exactly the kind of defect this project cannot afford, because the
people it would fail are the people it exists to serve.
