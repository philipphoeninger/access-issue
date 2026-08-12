// The two axe runs that apply before any barrier exists (docs/TESTING.md §5).
// Run 2 (barrier assertion, scoped to `[data-simulation-region]`) has nothing
// to assert against yet — SimulationRegionComponent is Slice 4 — and lands
// with the first barrier.
import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** Run 1 — frame gate. Scoped to exclude the simulation region; must be
 * zero violations in every state, no exceptions, no allowlist. */
export function frameGate(page: Page): AxeBuilder {
  return new AxeBuilder({ page })
    .exclude('[data-simulation-region]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);
}

/** Run 3 — page-level rules. Whole document, restricted to the rules that do
 * not respect a subtree boundary; enforces the frame/simulation boundary
 * invariants in docs/ARCHITECTURE.md §5.6. */
export function pageLevelRules(page: Page): AxeBuilder {
  return new AxeBuilder({ page }).withRules([
    'heading-order',
    'duplicate-id-active',
    'duplicate-id-aria',
    'landmark-one-main',
    'landmark-unique',
    'landmark-complementary-is-top-level',
    'html-has-lang',
    'html-lang-valid',
    'page-has-heading-one',
    'region',
  ]);
}
