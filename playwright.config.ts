// docs/TESTING.md §15: Chromium on every pull request; Firefox and WebKit are
// a weekly/release-tag job, not a merge gate (docs/SPEC_v1.md §3 "Out of
// Scope for v1" — cross-browser suite is Phase 4). Only the chromium project
// is declared here for that reason; add the other two engines when that
// phase starts.
import { readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4310;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * The test directory, as an absolute path.
 *
 * `testDir` below resolves relative to *this file*; anything read with `fs`
 * resolves relative to the working directory the command was started in. A
 * relative `'./e2e'` in both places therefore looks consistent and is not: it
 * works from the repository root and throws `ENOENT` from anywhere else — an
 * IDE runner with its own cwd, or `playwright test --config ../playwright.config.ts`.
 * Failing to *list* the suite is a worse failure than any test failure, because
 * it happens before there is anything to report.
 */
const E2E_DIR = join(__dirname, 'e2e');

/**
 * The suite, split by scenario across parallel CI jobs (docs/TESTING.md §4,
 * §15) — the first of the two mitigations §4 names for a state matrix that has
 * outgrown the pull-request budget, and the one that costs no coverage at all.
 * The second (moving completed scenarios to a nightly run) is not in use and
 * should not be reached for while this one still fits.
 *
 * **Reducing the state set is not on that list.** The campaign alone is
 * twenty-five states, and every one of them covers a barrier or a partial
 * repair nothing else covers (e2e/support/campaign-states.ts).
 *
 * Selected with `E2E_SHARD=<name>`; without it every file runs, which is what
 * a local `npx playwright test` should keep doing. Playwright's own `--shard`
 * would balance more evenly, but it splits by count rather than by subject: a
 * failing job would name „shard 2 of 4" where this one names the scenario, and
 * the weekly Firefox/WebKit run can pick a single scenario when a report is
 * about one.
 *
 * `exit-link` is its own shard rather than part of `frame`. It is the safety-
 * critical path (docs/TESTING.md §7) and it runs across every tested state of
 * every scenario, so it belongs to no single one — and it is the shard whose
 * failure has to be legible at a glance in the checks list.
 *
 * **Entries are paths relative to `e2e/`**, not bare file names: the suite is
 * flat today, but a shard that matched on the file name alone would claim
 * `sub/frame-gate.spec.ts` for `frame` without anyone deciding that, and would
 * let two files with one name sit in two directories and one shard.
 */
const SHARDS: Record<string, readonly string[]> = {
  application: [
    'job-posting.spec.ts',
    'application-form.spec.ts',
    'document-upload.spec.ts',
    'confirmation.spec.ts',
  ],
  campaign: ['csr-campaign.spec.ts', 'csr-integration.spec.ts'],
  frame: [
    'barrier-panel.spec.ts',
    'error-states.spec.ts',
    'explanation-view.spec.ts',
    'focus-management.spec.ts',
    'frame-gate.spec.ts',
    'reflow.spec.ts',
    'simulation-boundary.spec.ts',
    'skip-links.spec.ts',
    'target-size.spec.ts',
  ],
  'exit-link': ['exit-link.spec.ts'],
};

/**
 * Every spec file belongs to exactly one shard — checked here, on every run,
 * local ones included.
 *
 * A new spec file that no shard claims would simply never run in CI, and the
 * checks list would be as green as it is now while a whole suite had stopped
 * existing. That is the failure mode this project cannot afford (the same
 * reasoning as the generator controls in e2e/barrier-panel.spec.ts), and it is
 * exactly the kind of omission nobody notices — so the config refuses to load
 * rather than reporting it.
 *
 * **The walk is recursive, because `testDir` is.** A first version listed the
 * top level only, which left the one hole the check exists to close: a spec
 * under `e2e/sub/` ran locally, tripped nothing here, and matched no shard — so
 * it ran in no CI job at all, with every check green.
 */
function shardedFiles(): readonly string[] {
  const declared = Object.values(SHARDS).flat();
  const present = readdirSync(E2E_DIR, { recursive: true })
    .map((entry) => entry.toString().split(sep).join('/'))
    .filter((entry) => entry.endsWith('.spec.ts'));

  const unassigned = present.filter((file) => !declared.includes(file));
  const missing = declared.filter((file) => !present.includes(file));
  const duplicated = declared.filter((file, index) => declared.indexOf(file) !== index);

  if (unassigned.length > 0 || missing.length > 0 || duplicated.length > 0) {
    throw new Error(
      'playwright.config.ts: every e2e spec file must belong to exactly one shard ' +
        '(docs/TESTING.md §4).' +
        (unassigned.length > 0 ? `\n  claimed by no shard: ${unassigned.join(', ')}` : '') +
        (missing.length > 0 ? `\n  named by a shard but absent: ${missing.join(', ')}` : '') +
        (duplicated.length > 0 ? `\n  named by two shards: ${duplicated.join(', ')}` : ''),
    );
  }
  return declared;
}

shardedFiles();

const shard = process.env['E2E_SHARD'];
if (shard !== undefined && SHARDS[shard] === undefined) {
  throw new Error(
    `playwright.config.ts: unknown E2E_SHARD "${shard}". ` +
      `Known shards: ${Object.keys(SHARDS).join(', ')}.`,
  );
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  // The HTML report is the "full axe JSON for every failure" artefact
  // docs/TESTING.md §15 asks CI to retain — traces and attachments included.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Unset without `E2E_SHARD`, which leaves Playwright's default: the whole
      // suite. A local run is not a CI job and should not have to know which
      // shard the file being edited lives in.
      //
      // Absolute paths, built from the same `E2E_DIR` the membership check
      // walks: a `**/name.spec.ts` glob would match that name in any directory,
      // which is precisely the looseness the check above stopped allowing.
      testMatch: shard === undefined ? undefined : SHARDS[shard].map((file) => join(E2E_DIR, file)),
    },
  ],
  webServer: {
    command: `npx ng serve --port ${PORT} --configuration development`,
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
