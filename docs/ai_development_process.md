# AI-Assisted Development Process

> Optimized for solo web development and small projects.

---

## Phase 1 — Ideation & Discovery

1. **Capture the idea**
   - Write a rough idea brief (Word doc via `docx` skill, or plain markdown)
   - If there's a market/competitor angle: → skill: `Product Management/competitive-brief`

2. **Brainstorm & validate**
   - Think it through with Claude as a sparring partner → skill: `Product Management/product-brainstorming`
   - Output: refined concept, key assumptions, open questions

3. **Create the PRD**
   - Lightweight, non-exhaustive. Focus on problem, goals, non-goals, key flows
   - → skill: `Product Management/write-spec` (use "PRD mode" — avoid over-speccing)
   - Save this as `docs/PRD.md` in your repo

---

## Phase 2 — Architecture & Design

4. **System design**
   - Feed the PRD in → skill: `Engineering/system-design`
   - Iterate and review the proposal → skill: `Engineering/architecture`
   - Output: `docs/ARCHITECTURE.md` (tech stack, data model, service boundaries, feature slices)

5. **Define testing strategy** ← moved earlier
   - Define approach before implementation: unit/integration/e2e split, coverage targets, tooling
   - → skill: `Engineering/testing-strategy`
   - Output: `docs/TESTING.md`

6. **UI & Frontend design** ← Figma is central here
   a. Design direction and component spec → skill: `Frontend Design/frontend-design`
   b. Write UX copy for key flows → skill: `Design/ux-copy`
   c. Critique and refine the design → skill: `Design/design-critique`
   d. Accessibility review → skill: `Design/accessibility-review`

---

## Phase 3 — Specification & Planning

7. **Write the feature spec**
   - Combine PRD + architecture + design handoff into a structured spec
   - → skill: `Product Management/write-spec`
   - Output: `docs/SPEC_v1.md` (versioned, updated incrementally as the project evolves)

8. **Write CLAUDE.md**
   - Generate from the spec + architecture doc
   - This is the AI context file: project overview, conventions, stack, file structure, do's/don'ts
   - Every future Claude Code session loads this — it's your "AI onboarding doc"
   - Keep it updated as the project evolves

---

## Phase 4 — Implementation

9. **Build incrementally with Claude Code**
    - Work slice by slice, guided by CLAUDE.md
    - Keep slices small enough to review in one session
    - Run standup notes to track progress → skill: `Engineering/standup`

10. **Code review before every push**
    - → skill: `Engineering/code-review`
    - Focus: security, correctness, N+1s, missing edge cases

11. **Manage tech debt continuously**
    - Flag and categorize debt as it accumulates, don't let it pile up
    - → skill: `Engineering/tech-debt` (run periodically, e.g. end of each sprint)

12. **Debug as needed**
    - → skill: `Engineering/debug`

---

## Phase 5 — Documentation

13. **Technical documentation**
    - Generate from `CLAUDE.md` + `SPEC.md` + `ARCHITECTURE.md`
    - → skill: `Engineering/documentation`
    - Covers: API docs, runbooks, architecture decisions, setup guide
    - Output: `docs/TECHNICAL.md`

---

## Phase 6 — Quality & Delivery

14. **Write and run tests**
    - Implement the strategy defined in Phase 2
    - → skill: `Engineering/testing-strategy` (revisit if reality diverged from plan)

15. **Deploy**
    - → skill: `Engineering/deploy-checklist`
    - Covers: CI status, migrations, feature flags, rollback plan

16. **Post-launch: metrics review**
    - → skill: `Product Management/metrics-review`
    - Track against the goals defined in the PRD

17. **Incident response** (as needed)
    - → skill: `Engineering/incident-response`

---

## Key Artifacts (what lives in your repo)

| File                   | Generated from           | Purpose                                  |
| ---------------------- | ------------------------ | ---------------------------------------- |
| `docs/PRD.md`          | Brainstorming            | Problem definition, goals                |
| `docs/ARCHITECTURE.md` | System design            | Tech decisions, data model               |
| `docs/TESTING.md`      | Testing strategy         | Coverage plan, tooling                   |
| `docs/SPEC_v1.md`      | Write-spec               | Feature slices, acceptance criteria      |
| `CLAUDE.md`            | Spec + Architecture      | AI context for every Claude Code session |                |
| `docs/TECHNICAL.md`    | Documentation skill      | Developer onboarding                     |
| Figma project          | figma-generate-\* skills | Design system, screens, diagrams         |

---

## Figma Integration Summary

| When                   | What                           | Skill                    |
| ---------------------- | ------------------------------ | ------------------------ |     |
| Phase 2 — UI design    | Generate screens from spec     | `figma-generate-design`  |
| Phase 2 — UI design    | Build component/design system  | `figma-generate-library` |
| Phase 2 — Handoff      | Connect components to code     | `figma-code-connect`     |
| Ongoing                | Edit/update Figma files        | `figma-use`              |
