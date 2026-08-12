#!/usr/bin/env node
// Branch-coverage gate for the three modules docs/TESTING.md §14 holds to a
// hard 95% threshold. Reads coverage/access-issue/lcov.info, produced by
// `ng test --code-coverage` (see package.json "test:coverage-gate").
//
// This is a standalone script, not karma-coverage's own
// `coverageReporter.check` option — that option cannot work reliably in this
// project. See the comment on `coverageReporter` in karma.conf.js for the
// full story: Angular's esbuild test builder always overwrites Karma's
// `basePath` at runtime to an ephemeral temp directory, which breaks
// karma-coverage's internal per-file threshold matching so it can never
// fail no matter how little of a "gated" file is covered. Parsing the lcov
// report directly sidesteps that bug entirely.
'use strict';

const fs = require('fs');
const path = require('path');

const THRESHOLD = 95;
const REPO_ROOT = path.join(__dirname, '..');
const LCOV_PATH = path.join(REPO_ROOT, 'coverage', 'access-issue', 'lcov.info');

// Keep this list in sync with docs/TESTING.md §14. A module that does not
// exist yet (later slices) is skipped rather than failed — there is nothing
// to gate before the file is written.
const GATED_MODULES = [
  'src/app/core/url-state.ts',
  'src/app/core/barrier-state.service.ts',
  'src/app/core/scenario-registry.service.ts',
];

function parseLcov(text) {
  const records = new Map();
  let current = null;

  for (const line of text.split('\n')) {
    if (line.startsWith('SF:')) {
      current = { file: line.slice(3).trim(), branchesFound: 0, branchesHit: 0 };
    } else if (current && line.startsWith('BRF:')) {
      current.branchesFound = Number(line.slice(4));
    } else if (current && line.startsWith('BRH:')) {
      current.branchesHit = Number(line.slice(4));
    } else if (current && line.startsWith('end_of_record')) {
      records.set(current.file, current);
      current = null;
    }
  }

  return records;
}

function main() {
  const gatedModulesThatExist = GATED_MODULES.filter((relativePath) =>
    fs.existsSync(path.join(REPO_ROOT, relativePath)),
  );

  if (gatedModulesThatExist.length === 0) {
    console.log('check-coverage: none of the gated modules exist yet — nothing to check.');
    return;
  }

  if (!fs.existsSync(LCOV_PATH)) {
    console.error(`check-coverage: ${LCOV_PATH} not found. Run "ng test --code-coverage" first.`);
    process.exitCode = 1;
    return;
  }

  const records = parseLcov(fs.readFileSync(LCOV_PATH, 'utf8'));
  let failed = false;

  for (const relativePath of gatedModulesThatExist) {
    const record = records.get(relativePath);
    if (!record) {
      console.error(`check-coverage: ${relativePath} has no coverage data in lcov.info.`);
      failed = true;
      continue;
    }

    // A file with no branches at all (branchesFound === 0) is treated as
    // fully covered, matching istanbul's own convention — there is nothing
    // to be uncovered.
    const branchPct =
      record.branchesFound === 0 ? 100 : (record.branchesHit / record.branchesFound) * 100;

    if (branchPct < THRESHOLD) {
      console.error(
        `check-coverage: ${relativePath} branch coverage ${branchPct.toFixed(2)}% is below the ${THRESHOLD}% threshold required by docs/TESTING.md §14 (${record.branchesHit}/${record.branchesFound} branches).`,
      );
      failed = true;
    } else {
      console.log(
        `check-coverage: ${relativePath} branch coverage ${branchPct.toFixed(2)}% (${record.branchesHit}/${record.branchesFound}) ✓`,
      );
    }
  }

  if (failed) {
    process.exitCode = 1;
  }
}

main();
