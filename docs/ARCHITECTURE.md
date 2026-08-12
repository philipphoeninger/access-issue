# Architecture — AccessIssue

**Project:** AccessIssue
**Source document:** `docs/PRD.md` (v1)
**Status:** Draft v1.3 — revised after architecture review, design critique and accessibility review
**Date:** August 2026

---

## 1. Scope

AccessIssue is a static, frontend-only Angular application that simulates real-world
business interfaces containing deliberate accessibility barriers. Each barrier can be
toggled between *barrierebehaftet* (barrier active) and *barrierefrei* (barrier removed).
The application itself must conform to WCAG 2.2 AA.

This document covers system structure, the domain model, state management, the URL
contract, and the architectural mechanisms that keep the application accessible while it
deliberately renders inaccessible content. It does not cover visual design (Phase 2, Figma)
or the test plan (`docs/TESTING.md`).

---

## 2. Requirements Recap

### 2.1 Functional

| ID | Requirement | PRD ref |
| --- | --- | --- |
| F1 | Home page introducing the tool, linking into scenarios | 8.1 A |
| F2 | Application process scenario, two-step flow, five barriers | 8.1 B |
| F3 | CSR campaign scenario, single landing page, six barriers | 8.1 C |
| F4 | Barrier panel: per-barrier toggles plus bulk actions | 8.1 D |
| F5 | Per-barrier explanation with standards references | 8.1 E |
| F6 | Full toggle state encoded in the URL | 8.1 F |
| F7 | Frame accessible at all times; simulation region announced | 8.1 G |
| F8 | Combined barriers whose partial repair does not fully resolve them | 6.4 |
| F9 | Third scenario (procurement) addable without structural change | 6.3, 8.2 |

### 2.2 Non-Functional

| Concern | Target | Notes |
| --- | --- | --- |
| Accessibility | WCAG 2.2 AA for frame, navigation, explanations | The single hardest constraint |
| Scale | Low hundreds of concurrent users at peak (a training cohort) | No scaling problem to solve |
| Availability | Static hosting SLA is sufficient | No backend, no runtime dependency |
| Latency | First contentful paint under 2s on a mid-range laptop | Bundle size, not server round trips |
| Privacy | No tracking, no third-party runtime requests | GDPR; publicly funded project |
| Portability | Must run on any static host | Hosting undecided (PRD 10) |
| Maintainability | New scenarios and barriers addable without touching core | Data-driven scenario definitions |

### 2.3 Constraints

- Angular 20, Angular Material/CDK, TypeScript — set by the existing `package.json`.
- No backend, no database, no server-side rendering of dynamic data.
- Single developer, no fixed deadline.
- German-only content; no i18n layer.
- Editorial content is authored by the WERTE.IT team and pasted in; it is not
  user-generated and does not change at runtime.

---

## 3. Architectural Drivers

Three forces shape every decision below.

**D1 — The frame/simulation boundary is the system.** Everything else is
conventional Angular. The one genuinely hard problem is rendering deliberately
inaccessible markup inside an application that must remain fully accessible. This
boundary must be structural, not a convention that discipline enforces.

**D2 — The URL is the state.** Reproducible screenshots and Moodle deep links require
that any reachable state be expressible as a URL. Treating the URL as the source of
truth rather than as a mirror of in-memory state eliminates an entire class of
synchronisation bugs.

**D3 — Content is data, not markup.** Barrier metadata (affected groups, standards
references, explanations) must live in typed structures so the third scenario can be
added by writing data, and so the explanation UI never needs per-barrier special cases.

---

## 4. High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│ FRAME  — always WCAG 2.2 AA, never affected by barrier state     │
│                                                                  │
│  ┌────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│  │ Header /   │  │ Barrier Panel    │  │ Explanation View   │   │
│  │ Skip links │  │ (toggles, bulk)  │  │ (problem/affected/ │   │
│  │ Nav        │  │                  │  │  standards/fix)    │   │
│  └────────────┘  └────────┬─────────┘  └────────▲───────────┘   │
│                            │ intent              │ reads        │
│  ┌─────────────────────────▼─────────────────────┴───────────┐  │
│  │ core: BarrierStateService · UrlStateSync · Announcer ·    │  │
│  │       FocusManager · ScenarioRegistry                     │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                            │ reads (one-way)                     │
│  ╔═════════════════════════▼═════════════════════════════════╗  │
│  ║ SIMULATION REGION  — deliberately non-conforming          ║  │
│  ║  role="region", labelled, bounded, escapable              ║  │
│  ║                                                            ║  │
│  ║  Scenario components (plain HTML/CSS, no Material)        ║  │
│  ╚════════════════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │ hydrates from / writes to
                    ┌────────┴────────┐
                    │  Router / URL   │  ← source of truth
                    └─────────────────┘
```

Data flow for a single toggle:

```
user activates toggle in panel
  → BarrierStateService.toggle(barrierId)
  → Router.navigate([], { queryParams: {...}, replaceUrl: true })
  → queryParamMap emits
  → barrierState signal recomputes
  → simulation components re-render (OnPush, signal-driven)
  → Announcer.polite("Barriere X ist jetzt behoben")
```

The toggle handler never mutates local state directly. It navigates. State flows in one
direction, from URL to view.

---

## 5. The Frame/Simulation Boundary

This is the load-bearing part of the architecture. Four mechanisms enforce it.

### 5.1 Structural separation

`SimulationRegionComponent` is the only component allowed to host scenario content. It
provides:

- `role="region"` with an `aria-label` naming it as a simulation
- a visible border and a heading identifying the region
- a skip link *before* the region ("Simulationsbereich überspringen") and an anchor
  after it, both rendered by the frame, outside the region's DOM subtree
- an **exit link as the first focusable element inside the region**
  ("Simulationsbereich verlassen — zurück zum Barriere-Panel"), visible on focus
- an `aria-describedby` reference to a short, **static** frame-owned sentence explaining
  what the region is (`simBar.description` in `docs/UX-COPY.md` §5.4)

**On the description.** An earlier draft pointed `aria-describedby` at a paragraph
enumerating the barriers currently active. With six active barriers, entering the region
would have played a six-item list every time — and again after every toggle, since the
description would change. A description should orient, not recite. The live count stays
visible in the simulation bar, and the full list lives in the panel where it is
navigable rather than narrated.

**On the exit mechanism.** An earlier draft used an `Escape` key handler. That was wrong
twice over. First, it hijacks a key the user agent already owns: `Escape` closes an open
`<select>`, cancels IME composition, and dismisses overlays — a user who opens a dropdown
in the simulated form and presses `Escape` would be thrown out of the form instead of
merely closing the list. Second, and more seriously, a keyboard shortcut nobody announces
is not an escape route for a screen reader user. An exit that must be guessed is not an
exit.

The exit is therefore a real link, first in the region's tab order, announced like any
other link, and testable. If `Escape` is added later as a convenience it must check
`event.defaultPrevented` first and must never be the only way out.

Scenario components are rendered exclusively through this wrapper's content projection.
There is no route that renders a scenario component directly.

### 5.2 One-way dependency

`BarrierStateService` is read by both sides, but the direction of *consequence* is
one-way: barrier state changes what the simulation renders; it never changes how the
frame behaves, is styled, or is focusable. A frame component that branched on barrier
state to alter its own semantics would be a defect. This is a review rule and should
become a lint rule if it is ever violated more than once.

Exception, and it is a narrow one: the panel displays toggle *positions*, and the
explanation view displays which barriers are active. Both read state to render text.
Neither changes its own accessibility characteristics as a result.

### 5.3 Bounded barriers

A simulated barrier must be implementable *within* the region. This rules out one class
of implementation and it is worth being explicit about why.

**Rejected:** simulating a keyboard trap by intercepting `Tab` at the document level and
preventing default. This would escape the region, break the skip links, and could strand
a keyboard user in a training tool.

**Adopted:** simulate the keyboard trap the way real broken pages produce it — a
`<div>` with a click handler and no `tabindex`, custom controls that are simply not in
the tab order. The control is unreachable; the surrounding page is not. This is both
safer and more faithful to how the barrier actually occurs in the wild.

The general rule: **barriers are implemented by omission, not by interception.** Omit
the label, omit the `tabindex`, omit the live region, omit the caption track. Never add
a global handler that fights the user agent.

### 5.4 The dual channel

Every barrier has a textual counterpart that lives in the frame and is reachable
regardless of the barrier's state. A sighted user experiences the barrier; a blind user
reads what is broken and why. Both receive the same learning content.

This is why explanations live in the frame and not inside the scenario markup. Putting
the explanation next to the barrier inside the region would make it subject to the same
barrier — the failure mode of most "accessibility demo" tools.

### 5.5 Reduced motion always wins

The CSR carousel barrier (auto-scrolling without pause control) conflicts with
`prefers-reduced-motion`. The rule: **the user's system preference overrides the
simulated barrier without exception.** When reduced motion is requested, the carousel
does not auto-advance; a frame-owned note explains that the barrier is being suppressed
because of the user's system setting, and describes what would otherwise happen.

The same principle applies to any future barrier that could cause physical harm.
Vestibular triggers are not a teaching opportunity.

**Consequence for reproducibility.** This introduces state that is not in the URL. Two
users opening the same link under different system settings see different renderings —
correctly so, but it means URL reproducibility is conditional on system settings, not
absolute (see PRD §9). Whenever a system preference suppresses a barrier, a frame-owned
note must say so explicitly and describe what would otherwise happen. A lecturer taking a
screenshot needs to understand why the result does not match the barrier description.

`forced-colors` (Windows high contrast) has the same character: it will neutralise
contrast-based barriers regardless of toggle state. The same note mechanism covers it.

### 5.6 Boundary invariants

Some WCAG properties are page-level and span the frame/simulation boundary. They cannot
be scoped away, which constrains what may be simulated. These are hard rules, not
guidance:

1. **The simulation region never contains an `h1`** and continues the page's heading
   hierarchy correctly. Broken heading structure is *not* an admissible barrier — it
   would corrupt the frame's own document outline.

   The levels are fixed, not left to each scenario: the page `h1` is the scenario title
   (frame), the region's own heading is an `h2`, and **all scenario content starts at
   `h3`**. Elbwerk's „Offene Stellen" is an `h3`, a job's subheadings are `h4`. Leaving
   this to be decided per component would produce a `heading-order` violation the first
   time two scenarios disagree, and that violation is caught by axe run 3 rather than by
   review — late, and in a suite that is supposed to stay green.
2. **Every `id` inside the simulation region carries the `sim-` prefix.** Duplicate ids
   across the boundary would break `for`/`aria-labelledby` associations in the panel.
3. **The simulation region declares no `lang` other than the document language**, unless
   a future barrier deliberately targets `3.1.2`, in which case it is scoped to a single
   element and documented.
4. **Landmarks inside the region are labelled and nested under the region**, so the
   frame's landmark structure stays unambiguous.

Rules 1 and 2 exist specifically because the axe strategy in §15 cannot catch violations
of them. They belong in `CLAUDE.md` verbatim.

---

## 6. Domain Model

```ts
type DisabilityCategory =
  | 'visual' | 'auditory' | 'motor' | 'cognitive' | 'situational';

type Standard = 'WCAG_2_2' | 'BITV_2_0' | 'EN_301_549' | 'BFSG';

interface StandardReference {
  standard: Standard;
  /** e.g. '1.3.1', '§ 3 Abs. 1' */
  criterion: string;
  level?: 'A' | 'AA' | 'AAA';
  /** German title, editorial */
  title: string;
  url?: string;
}

interface BarrierExplanation {
  problem: string;    // what is wrong
  affected: string;   // who it affects and how
  solution: string;   // what the accessible implementation looks like
}

/** A sub-aspect of a combined barrier (PRD 6.4). */
interface BarrierPart {
  id: string;
  urlKey: string;
  title: string;
  standards: StandardReference[];
  explanation: BarrierExplanation;
}

/**
 * Whether an automated tool can detect this barrier when it is active.
 * Consumed by the test layer (§15) to decide which barriers get an
 * axe-based positive assertion and which are manual-only.
 */
type AutomatedDetection = 'axe' | 'manual';

interface Barrier {
  id: string;
  /** Short, stable, human-editable key used in the URL. */
  urlKey: string;
  title: string;
  shortTitle: string;          // panel label
  categories: DisabilityCategory[];
  affectedGroups: string[];
  standards: StandardReference[];
  explanation: BarrierExplanation;
  /** Present only for combined barriers; each part toggles independently. */
  parts?: BarrierPart[];
  automatedDetection: AutomatedDetection;
}

interface ScenarioStep {
  id: string;
  path: string;                // route segment
  title: string;
  barrierIds: string[];        // barriers surfaced in this step
}

interface Scenario {
  id: string;
  path: string;
  title: string;
  summary: string;
  status: 'available' | 'planned';
  steps: ScenarioStep[];       // single-element array for one-page scenarios
  barriers: Barrier[];
}
```

Notes on the shape:

- A single-page scenario (CSR) is modelled as a scenario with one step. This removes the
  branch between "flow scenarios" and "page scenarios" everywhere downstream.
- `status: 'planned'` lets the procurement scenario exist in the registry, appear on the
  home page as not-yet-available, and be filled in later without touching routing code.
- Combined barriers carry `parts`. A barrier with `parts` is *resolved* only when every
  part is resolved. Panel representation is covered in §12.1 — the earlier plan to use an
  indeterminate slide toggle was invalid ARIA and has been replaced.
- `standards` is an array, deliberately. One barrier maps to several WCAG success
  criteria and to BITV/EN/BFSG references in parallel.
- `automatedDetection` replaces an earlier `implementation: 'variant' | 'attribute'`
  field. That field described how a template was written but no runtime code read it, so
  it would have silently drifted out of date. `automatedDetection` is consumed by the
  test layer and carries editorial value besides: barriers that no automated tool can
  find — complex language, cognitive load — are exactly the ones the module needs to
  point at when it explains why an accessibility checker is not a compliance report.

---

## 7. ADR-1 — State Management

**Decision: plain Angular signals in an injectable service. Remove `@ngrx/store`,
`@ngrx/router-store`, and `@ngrx/store-devtools`.**

**Context.** The PRD flags this as open (PRD 10). Total application state is: which
scenario is open, which step, and which of at most eleven booleans are set. All of it is
derivable from the URL. There is no async work, no server cache, no optimistic update,
no cross-feature coordination.

**Rationale.** NgRx Store's value is in taming complex asynchronous state with many
producers. Here there is one producer (the router) and one consumer (the view). Actions,
reducers, effects, and selectors for eleven booleans would be ceremony that obscures a
computation expressible in ten lines. `@ngrx/router-store` in particular exists to mirror
router state *into* the store — but here the router state *is* the state, so mirroring it
adds a hop and a second source of truth.

**Shape:**

```ts
@Injectable({ providedIn: 'root' })
export class BarrierStateService {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly registry = inject(ScenarioRegistry);

  private readonly params = toSignal(this.route.queryParamMap, { requireSync: true });

  /** urlKeys that have been switched to the accessible variant. */
  readonly resolvedKeys = computed(() => parseResolved(this.params(), this.registry));

  isResolved(urlKey: string): Signal<boolean> { /* memoised per key */ }

  toggle(urlKey: string): void { /* navigate with replaceUrl */ }
  resolveAll(): void { /* ... */ }
  resetAll(): void { /* ... */ }
}
```

**Trade-offs.** No time-travel debugging via Redux DevTools. For eleven booleans encoded
in the URL, the address bar *is* the state inspector, and it is a better one for this
project because it is also the sharing mechanism. If a future scenario introduces
genuinely complex state, `@ngrx/signals` can be introduced for that feature alone; the
service interface above would not change for its consumers.

**Also removed:** `jsonpath`, `flatted`, `typedjson`. These were provisionally included
for state serialisation (PRD 10). The URL format in ADR-2 is a comma-separated list of
short keys; it needs `String.prototype.split`. `flatted` solves circular references,
`typedjson` solves class hydration, `jsonpath` solves querying deep structures — none of
those problems occur here.

**Kept:** `@ngrx/signals` remains in `package.json` but unused for now, at zero bundle
cost, as a low-friction upgrade path. Remove it at the first dependency audit if it is
still unused.

---

## 8. ADR-2 — URL Contract

**Decision: a single query parameter listing the barriers switched to accessible.**

```
/szenario/bewerbung/formular?frei=labels,fehler
/szenario/csr-kampagne?frei=alle
/szenario/csr-kampagne                          ← all barriers active
/szenario/bewerbung/stellenanzeige?erklaerung=pdf
```

**Default state is all barriers active.** The shortest URL shows the realistic broken
version. This matches the didactic arc — encounter the problem, then repair it — and it
means a link pasted into Moodle without further thought lands on the pedagogically
correct state.

**Grammar:**

- `frei` absent → no barrier resolved
- `frei=alle` → every barrier in the scenario resolved
- `frei=k1,k2,…` → listed keys resolved, all others active
- unknown keys → **silently ignored**, valid keys still applied
- keys belonging to another scenario → ignored
- combined barriers: parts carry their own keys (`video-ut`, `video-transkript`); the
  parent key `video` is accepted as sugar for all its parts

**Second parameter: `erklaerung`.** The explanation view shows one barrier at a time, and
which one is application state. An earlier draft kept it in memory only, which contradicted
D2 and had a concrete cost: a lecturer could link to a scenario but not to *"why the PDF is
a problem"* — plausibly the more useful link for a Moodle page.

```
?erklaerung=<urlKey>    open the explanation view on that barrier
absent                  no barrier selected; the view shows its empty state
unknown key             ignored, treated as absent
```

It reuses the same `urlKey` vocabulary as `frei`, so the key-stability snapshot in §18
covers it without extension. The two parameters are independent: a barrier can be explained
while resolved, which is the normal reading order after repairing it.

**Toggling selects implicitly.** Activating a barrier's checkbox also sets `erklaerung` to
that barrier. Without this, understanding one barrier costs two interactions — toggle, then
find and follow the explanation link — and the explanation view would sit empty through the
most common path. Focus stays in the panel (§12.2); only the explanation region's content
changes, announced through the existing live region.

**Alternatives considered.**

| Option | Verdict |
| --- | --- |
| One boolean param per barrier (`?pdf=1&labels=0`) | Rejected. Eleven params make an unreadable URL and the "all active" default would still need special handling. |
| Bitmask or base64 blob (`?s=Zm9v`) | Rejected. Compact but opaque, un-editable by hand, and order-dependent — inserting a barrier invalidates every previously shared link. |
| Path segments (`/…/frei/labels/fehler`) | Rejected. Conflates state with resource identity and complicates the route config. |
| Chosen: single comma-separated `frei` param | Readable, hand-editable by lecturers, order-independent, degrades safely on unknown keys. |

**Reserved key.** `alle` is a reserved word and may never be used as a `urlKey`. Enforced
by the same test that guards key stability (§18).

**On stability.** Once URLs appear in module slides they must not break. `urlKey` is
therefore part of the public contract: it may be added to, never renamed or reused. This
belongs in `CLAUDE.md` as an explicit do-not.

**Consequence of adding barriers later.** Because absence means *active*, adding a barrier
to an existing scenario changes what previously shared links render: a link reading
`?frei=labels,fehler` will show the new barrier active. For the default direction this is
correct and desirable. But a lecturer who wants a permanent "everything accessible"
screenshot must link with `?frei=alle`, not with an enumeration — an enumeration is a
snapshot of the barrier set at the time of writing, and it decays.

This is a documentation obligation, not a code one: it belongs in the hand-off note to
the WERTE.IT team, not only in a source comment.

**On the parameter name.** German (`frei`) rather than English (`resolved`) because
lecturers will read and edit these URLs, and the entire user-facing surface is German.
This is the one place where the German/English split in the project's language convention
lands on the German side despite being technical.

---

## 9. ADR-3 — Routing and Navigation

**Routes:**

```
/                                        Home
/szenario/bewerbung/stellenanzeige       Application, step 1
/szenario/bewerbung/formular             Application, step 2
/szenario/csr-kampagne                   CSR landing page
/szenario/softwarebeschaffung            (later)
/**                                      Not found → link back to home
```

**Path-based routing**, not hash-based. It is cleaner, and hash fragments interact badly
with in-page anchors, which this application uses for skip links.

**Hosting dependency.** Path routing requires the host to rewrite unknown paths to
`index.html`. Since hosting is undecided (PRD 10), the build must not assume it:

- `base href` configurable at build time
- if the chosen host cannot rewrite, the documented fallback is GitHub Pages' `404.html`
  copy trick, and only failing that, `withHashLocation()`

Recording this now avoids a late rewrite of every published URL.

**Route change accessibility.** Angular does not move focus on navigation, which leaves
screen reader users unaware that the page changed. The frame therefore installs a
`FocusManager` that, on every `NavigationEnd`:

1. sets focus to the main heading (`h1`, `tabindex="-1"`, focus outline suppressed only
   for this programmatic case)
2. announces the new page title through a polite live region
3. resets scroll position

`withComponentInputBinding()` is enabled so route params bind directly to component
inputs and signals, avoiding manual subscription plumbing.

---

## 10. ADR-4 — History Behaviour

**Decision: toggling a barrier and selecting an explanation both use `replaceUrl: true`.
Step navigation pushes.**

**Context.** PRD 8.1 F leaves the history behaviour to this phase.

**Rationale.** A user who flips six toggles and then presses Back expects to return to
the previous *page*, not to walk backwards through six intermediate toggle states. Push
semantics would bury real navigation under state churn and make the Back button
effectively unusable — a usability regression that would hit keyboard and screen reader
users hardest, since Back is a primary navigation affordance for them.

**Trade-off.** No per-toggle undo. Mitigated by the bulk actions in the panel
("alle barrierefrei" / "alle barrierebehaftet"), which make any state reachable in one
action.

**Consequence for the flow.** Moving between step 1 and step 2 of the application process
pushes a history entry and carries the current `frei` value forward, satisfying the PRD's
requirement that state survives step changes.

---

## 11. ADR-5 — How Barriers Are Rendered

**Decision: per-barrier choice between two patterns, decided at authoring time.**

The pattern is a property of the template, not of the data. It is documented here and in
the component, not carried in the domain model — a model field that no code reads is
documentation that lies as soon as someone edits a template (see §6).

**Pattern A — `variant`.** Two authored templates, switched with `@if`. Used when the
barrier changes *what content exists*:

- job posting as PDF download vs. as HTML text
- complex bureaucratic language vs. plain language
- donation amount as a drag-only slider vs. a labelled number input plus preset buttons
- video with caption track and transcript vs. neither

**Pattern B — `attribute`.** One template, conditional bindings. Used when the barrier
changes *how existing content is exposed*:

- `<label for>` present or absent
- `tabindex` present or absent, `<button>` vs. `<div role="button">`
- `aria-live` present or absent on the countdown
- `alt` present or absent on embedded social images

**Rule: never implement the accessible variant as a fix layered over the broken one.**
Both variants are authored honestly, as a competent and an incompetent developer would
each have written them. A "repair layer" would teach that accessibility is a post-hoc
patch, which is the exact misconception the module exists to dispel — and it would show
up in the DOM as an artefact that no real page has.

**Corollary — Angular Material in the frame only.** Material components are engineered to
be accessible and resist being made otherwise; fighting them to produce a missing label
would yield contorted code and unrealistic markup. Simulation regions use plain HTML,
plain CSS, and hand-written components. The panel, navigation, and explanation views use
Material and benefit from its accessibility work.

---

## 12. Accessibility Infrastructure

### 12.1 Panel control semantics

**Decision: the barrier panel uses checkboxes throughout, not slide toggles.**

An earlier draft used `mat-slide-toggle` for simple barriers and an indeterminate parent
toggle for combined ones. The parent is invalid: an element with `role="switch"` accepts
only `aria-checked="true|false"`. `mixed` is defined for `checkbox` and
`menuitemcheckbox`, not for `switch`. Building an ARIA violation into the one component
that must be exemplary is not a trade-off worth making.

Mixing both control types — switches for simple barriers, checkboxes for combined ones —
would be correct but visually incoherent and would make the panel's interaction model
harder to learn than it needs to be. The panel therefore uses `mat-checkbox` throughout:

- simple barrier → one checkbox
- combined barrier → a `fieldset` with a `legend` naming the barrier, a parent checkbox
  bound to `indeterminate`, and one checkbox per part

The `fieldset`/`legend` grouping is the part that earns this decision beyond mere
correctness: screen readers announce group membership, so a user hears that the caption
and transcript controls belong to the same video barrier. That relationship is the entire
point of combined barriers (PRD §6.4), and a flat list of switches would have hidden it.

Trade-off: a checkbox reads as "pending until submitted" to some users, while these
changes apply instantly. Mitigated by the live-region announcement on every change
(§12.2) and by the absence of any submit affordance in the panel.

### 12.2 Frame services

Frame-owned, in `core/` and `shared/`:

| Service / component | Responsibility |
| --- | --- |
| `Announcer` | The frame's single polite `aria-live` region. Announces toggle changes, route changes, and bulk actions. Exactly one per document — see the scoping rule below. |
| `FocusManager` | Focus on route change (§9); returns focus to the panel on `Escape` within the simulation region; guarantees focus is never left on a removed element after a toggle. |
| `SkipLinksComponent` | "Zum Inhalt" and "Zum Barriere-Panel" in the page header; "Simulationsbereich überspringen" rendered immediately before the region, not in the header (a jump from the top of the page to the end of a region the user has not entered is not a useful destination). All three live outside the simulation region. |
| `SimulationRegionComponent` | The boundary (§5.1). |
| `VisuallyHidden` directive | Standard clip-rect pattern, one implementation, no ad-hoc copies. |

**Live regions are scoped, not globally unique.** An earlier draft said "one live region
only". That is right for the frame and wrong for the application, because the resolved
state of the CSR countdown barrier *is* a live region — announcing the remaining time is
the accessible behaviour being demonstrated. A rule forbidding it outright would have made
one of the eleven barriers unbuildable, and the contradiction would have surfaced as a
failing test rather than as a design decision.

The rule is therefore:

- **exactly one** polite live region in the frame, owned by `Announcer`
- **at most one** additional live region inside the simulation region, and only when a
  barrier's resolved state requires it (currently: the countdown)
- the two must not speak over each other. This is why the countdown announces on a
  per-minute cadence while frame announcements are event-driven — a per-second live region
  would talk over every toggle confirmation and make both useless

The frame's region is never removed or duplicated; a simulation-owned region exists only
while its barrier is resolved.

**Focus after toggling.** Pattern A swaps subtrees, so an element that had focus may be
destroyed. Focus originates in the panel (the toggle the user activated) and stays there;
the simulation re-renders without stealing focus. This is why the panel is not inside the
simulated content — it is also the anchor for focus stability.

**Colour and contrast.** Two token layers in SCSS custom properties: frame tokens, all
verified at AA or better, and simulation tokens, some of which deliberately fail. They
are separate token sets so no automated contrast fix can accidentally repair a barrier,
and so an audit of frame tokens is meaningful on its own.

---

## 13. ADR-6 — Content Layer

**Decision: scenario definitions as typed TypeScript constants, in dedicated content
files, compiled into the bundle.**

```
content/
  application-process/
    application-process.scenario.ts     structure, steps, barrier ids
    application-process.content.ts      German editorial prose
  csr-campaign/
    …
  standards/
    wcag.ts   bitv.ts   en301549.ts   bfsg.ts    reusable references
```

**Rationale.** Type safety at build time, no runtime fetch, no loading state, no schema
validation code, no serialisation library. Standards references are reused across
barriers and benefit from being typed constants rather than repeated string literals.

**Trade-off.** The WERTE.IT team cannot edit text without a rebuild. Given that content
is written once and reviewed rather than continuously maintained, and that a rebuild is a
single command, this is acceptable. If self-service editing becomes a requirement, the
migration path is to move the content files to JSON in `public/`, add a validator, and
keep the same interfaces — the domain model does not change.

Separating `.scenario.ts` from `.content.ts` keeps editorial review focused on prose and
lets structural changes happen without touching reviewed text.

---

## 14. Project Structure

```
src/app/
  core/                    frame-level singletons
    barrier-state.service.ts
    scenario-registry.service.ts
    announcer.service.ts
    focus-manager.service.ts
    url-state.ts           parse/serialise the `frei` parameter
  shared/
    visually-hidden.directive.ts
    skip-links/
  frame/
    app-shell/
    barrier-panel/
    explanation-view/
    simulation-region/
  scenarios/
    application-process/
      job-posting-step/
      application-form-step/
    csr-campaign/
    software-procurement/  (later)
  content/                 §13
  models/                  §6 interfaces
```

`scenarios/` components are pure presentation driven by injected barrier signals. They
own no state and perform no navigation beyond the flow's own next/back links.

---

## 15. Testing Hooks

Detail belongs in `docs/TESTING.md`; the architecture must make these possible.

**State-space strategy.** Six barriers give 64 combinations per scenario; the full power
set is not worth testing. The tested set is *n + 2* states per scenario: all active, all
resolved, and each barrier resolved individually. Combined barriers add their
partial-repair states, which is exactly where the interesting behaviour lives.

**Two axe runs per state, with opposite expectations.** This is the useful trick:

1. Scoped to the frame, **excluding** the simulation region — must report zero
   violations. This is the release gate.
2. Scoped **to** the simulation region — must report the *expected* violation when the
   barrier is active, and not report it when resolved. Applies only to barriers marked
   `automatedDetection: 'axe'`; `'manual'` barriers are asserted structurally instead
   (the element exists, the attribute is absent) and verified by hand.

**A third run, for page-level rules.** Runs 1 and 2 both scope by DOM subtree, and some
WCAG properties do not respect subtrees: heading order, landmark uniqueness, duplicate
`id`, document language. A violation straddling the boundary — an `h1` inside the
simulation, an `id` colliding with a panel control — falls through both runs.

Run 3 therefore covers the **whole document** but is restricted to the page-level rule
set (`heading-order`, `duplicate-id-active`, `duplicate-id-aria`, `landmark-*`,
`html-has-lang`, `html-lang-valid`). It must report zero violations in every tested
state. This run is what enforces the boundary invariants in §5.6, which is why those
invariants are stated as hard rules rather than as style preferences.

The second run turns axe into a positive assertion that each barrier is genuinely a
barrier. A barrier that axe cannot detect when active is either mis-implemented or is a
category (cognitive load, language complexity) that automated tools cannot see — and
knowing which is which is itself worth encoding in the barrier metadata.

**Deep-link tests.** For every tested state: serialise to URL, reload, assert the DOM
matches. This covers PRD 8.1 F directly.

**Manual passes** (NVDA, VoiceOver, keyboard-only) cannot be automated away and are
listed as release criteria in the PRD.

---

## 16. Build and Deployment

- `ng build` produces a static bundle; no SSR, no prerendering needed for two scenarios,
  though prerendering remains available if first-paint becomes a concern.
- Lazy-loaded routes per scenario. The home page should not carry the CSR video markup.
- **No third-party runtime requests.** Fonts self-hosted. Any embedded social media in
  the CSR scenario is a *simulation* of an embed — static local markup, never a real
  third-party iframe. A real embed would leak user data, contradicting the no-tracking
  requirement, and would put the barrier outside our control.
- **The campaign video is self-hosted.** A YouTube or Vimeo embed would breach the same
  rule and is excluded. The video ships as an MP4 asset played through a native
  `<video>` element with `controls`.

  This has a content consequence worth stating plainly, because it enlarges what the
  WERTE.IT team must deliver: the accessible variant of the video barrier requires a
  WebVTT caption file *and* a transcript alongside the video file. Without both, the
  combined barrier has no resolved state and the barrier cannot be built — the video is
  not one deliverable but three. Recorded as a correction in PRD §10.

  Asset size is the one place this project can plausibly regress on load time. Keep the
  video short, compress it, load it lazily with a poster image, and never place it on
  the home page.
- `@fortawesome/fontawesome-free` pulls a large icon font for what is likely a handful of
  icons. Recommend replacing with inline SVG or Material icons and dropping the
  dependency; revisit during the first bundle audit.
- Hosting-agnostic (§9). No host-specific configuration in the source tree beyond a
  documented `base href` build flag.

---

## 17. Failure Modes

| Failure | Behaviour |
| --- | --- |
| Unknown `frei` key | Ignored; valid keys applied; no error surfaced |
| Unknown `erklaerung` key | Ignored; explanation view shows its empty state |
| Malformed query string | Falls back to default state (all barriers active) |
| Unknown scenario path | Not-found route with a link home and a plain-language explanation |
| Link to a `planned` scenario | Informative page stating the scenario is not yet available |
| JavaScript disabled | Application does not run. `<noscript>` explains this and links to the module. Accepted trade-off: an SPA is the right tool for the interaction model, and WCAG does not require script-off operation. |
| Focus lost after a subtree swap | Prevented by design — focus lives in the panel (§12) |

---

## 18. Scale and Reliability

There is no scaling problem. Peak load is one training cohort; the artefact is a static
bundle behind whatever CDN the host provides. Nothing to shard, cache, queue, or fail
over. Recording this explicitly so no effort is spent on infrastructure the project does
not need.

The real reliability concern is different in kind: **published URLs must keep working**,
because they will be embedded in module slides that outlive any given deployment. That
makes `urlKey` stability (§8) and route stability (§9) the two things not to break.

A contract with no enforcement is a wish. Two cheap tests make it real:

- a snapshot test over the full set of `{scenarioPath, urlKey}` pairs that fails when an
  entry is removed or renamed — additions pass, so it never blocks new barriers
- a test asserting no `urlKey` equals the reserved word `alle` (§8)

Twenty lines, and they protect every slide already printed.

---

## 19. Trade-off Summary

| Decision | Gained | Given up |
| --- | --- | --- |
| Signals over NgRx Store | Far less ceremony, one source of truth | Redux DevTools; a familiar pattern for future contributors |
| URL as source of truth | Free deep linking, no sync bugs | State changes cost a navigation |
| `replaceUrl` on toggle | Usable Back button | Per-toggle undo |
| Authored variants over a repair layer | Honest markup, honest teaching | Some template duplication |
| Content in TypeScript | Type safety, no runtime fetch | Editors need a rebuild |
| Path routing | Clean URLs, working anchors | A host requirement to document |
| Material in frame only | Accessible controls where it matters | Two styling idioms in one codebase |
| Checkboxes throughout the panel | Valid ARIA for combined barriers, audible grouping | Instant-apply reads less obviously than a switch |
| Exit link instead of `Escape` | Discoverable, announced, testable | One more visible control inside the region |
| Heading structure excluded as a barrier | Page-level integrity stays verifiable | One plausible real-world barrier cannot be taught here |

---

## 20. Open Spikes

Small, time-boxed investigations to run before or early in Phase 1 implementation.

| Spike | Question | Box |
| --- | --- | --- |
| Zoneless change detection | Angular 20 supports `provideZonelessChangeDetection()`, and a fully signal-driven app is the ideal candidate. Verify Material 20 components behave under it. Default to zone-based if anything is off. | half a day |
| PDF barrier | Real downloadable untagged PDF, or a simulated download? A real file must be authored and maintained; a simulation cannot be opened in a screen reader, which weakens the point. Open in PRD 10. | discuss with WERTE.IT |
| Simulated keyboard trap fidelity | Confirm with NVDA and VoiceOver that the omission-based trap (§5.3) reads as a real trap without escaping the region. | half a day |
| Combined-barrier panel UX | Design settled in §12.1 (fieldset + indeterminate parent checkbox). Remaining question is comprehension: verify with NVDA and VoiceOver that the group relationship and the indeterminate state read clearly in German. | half a day |
| Exit link behaviour | Confirm the in-region exit link (§5.1) stays reachable in every barrier state, including the simulated keyboard trap, on both NVDA and VoiceOver. This is the single safety-critical path in the application. | half a day |

**Zoneless change detection — resolved, Slice 0.** `provideZonelessChangeDetection()` is
enabled. A test mounts a `mat-button` bound to a signal and asserts the DOM updates after
a real `click()`, with no manual `detectChanges()` call and no zone.js in the test
environment (`src/app/zoneless-material.spec.ts`) — green on Angular 20.3 /
Material 20.2. Material's own event bindings go through Angular's renderer, which
notifies the zoneless change-detection scheduler the same way a native `(click)` on a
plain element would; nothing about `mat-button` depends on zone.js patching. The test
stays in the suite as the regression check for this decision, not as a demo. Zoneless is
therefore the default going forward; the zone-based fallback is only reconsidered if a
*future* Material component regresses — overlay-based ones (menu, dialog, autocomplete)
are the ones worth re-checking first, since they attach listeners outside the component
tree Angular already tracks. None has shown a problem so far.

---

## 21. What to Revisit as the System Grows

- **A fourth or fifth scenario.** The registry and data model absorb these without
  change. If scenario count passes roughly six, the home page needs grouping or filtering.
- **Barrier count per scenario above ten.** The panel becomes a scanning problem; expect
  to need grouping by step or by disability category.
- **State beyond booleans.** If a future barrier needs a value rather than a flag
  (a contrast ratio, a timeout duration), the `frei` grammar needs extending —
  `key:value` pairs would be the minimal change, and the parser should be written so
  that is a local edit.
- **Editorial self-service.** The trigger is WERTE.IT asking to change text without
  involving engineering. Migration path in §13.
- **NgRx.** The trigger is genuinely concurrent async state, not scenario count.

---

## 22. References

- `docs/PRD.md` — problem definition, scenarios, requirements
- `docs/TESTING.md` — test strategy, coverage targets, CI pipeline
- `docs/DESIGN.md` — design direction, token system, frame/simulation styling split
- `docs/UX-COPY.md` — German interface strings, terminology canon, Elbwerk placeholder copy
- `ai_development_process.md` — development process
