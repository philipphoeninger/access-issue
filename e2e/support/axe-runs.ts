// The three axe runs of docs/TESTING.md §5. They differ in scope and in
// expectation: runs 1 and 3 must be clean in every state, run 2 must find
// exactly what the active barrier planted.
import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { AXE_RULE_FIXTURES } from '../../src/app/content/axe-rule-fixtures';

/** Run 1 — frame gate. Scoped to exclude the simulation region; must be
 * zero violations in every state, no exceptions, no allowlist. */
export function frameGate(page: Page): AxeBuilder {
  return new AxeBuilder({ page })
    .exclude('[data-simulation-region]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);
}

/**
 * Run 2 — barrier assertion. Scoped **to** the simulation region, and run only
 * for barriers with `automatedDetection: 'axe'`: the expected rule must fire
 * while the barrier is active and must be gone once it is resolved. A barrier
 * nobody can detect while it is switched on was not implemented.
 *
 * Unfiltered by tag on purpose — this run asks whether one specific rule
 * fired, not whether the region conforms. It does not, by design.
 */
export function barrierAssertion(page: Page): AxeBuilder {
  return new AxeBuilder({ page }).include('[data-simulation-region]');
}

/**
 * The axe rule that proves a given barrier is present, from the fixture the
 * content layer owns (docs/TESTING.md §5: rule ids are axe's vocabulary, not
 * the project's, so they stay out of the domain model).
 *
 * Throws rather than skips when an `'axe'` barrier has no entry — a silently
 * skipped barrier assertion is a green suite that proves nothing. The data
 * contract test in src/app/content/data-contract.spec.ts catches the same
 * omission earlier; this is the backstop for anyone who reads only this file.
 */
export function expectedRuleFor(barrierId: string): string {
  const rule = AXE_RULE_FIXTURES[barrierId];
  if (rule === undefined) {
    throw new Error(
      `No axe rule fixture for barrier "${barrierId}". Add one in ` +
        `src/app/content/axe-rule-fixtures.ts — see docs/TESTING.md §5, run 2.`,
    );
  }
  return rule;
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
