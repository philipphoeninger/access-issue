#!/usr/bin/env node
// Token-boundary gate for CLAUDE.md rule 5 (docs/DESIGN.md §3,
// docs/ARCHITECTURE.md §5.6): **never use a --wi-* token inside the simulation,
// or a --sim-* token in the frame.**
//
// Until this script existed the rule was held by review alone, and it is the
// one boundary rule that is invisible in a screenshot: a simulation styled with
// WERTE.IT's typeface and colours still renders, still passes every axe run,
// and quietly destroys the didactic point of the boundary — a participant is
// supposed to recognise a barrier from the behaviour, not from the styling
// (docs/DESIGN.md §2).
//
// Why a standalone script rather than a unit test: Karma tests run in a
// browser, where there is no file system to read. Same reasoning, and the same
// shape, as scripts/check-coverage.js.
//
// **Comments are stripped before matching.** Both token sets are discussed at
// length in the comments of the very files that must not use them — the
// campaign's stylesheets explain why they hold to --sim-*, the frame's explain
// why it holds to --wi-*. A checker that could not tell prose from a
// declaration would be a checker people learn to work around.
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const EXTENSIONS = ['.scss', '.css', '.html'];

// Deliberately not .ts: no component in this project carries an inline template
// or inline styles (every one uses templateUrl/styleUrl, docs/ARCHITECTURE.md
// §5), so a token can only reach the DOM through the files scanned here. If an
// inline style or a `[style.--wi-*]` binding is ever introduced, add '.ts' —
// and expect to strip its comments too.

const RULES = [
  {
    what: 'frame tokens inside the simulation',
    roots: ['src/app/scenarios'],
    forbidden: /--wi-[a-z0-9-]+/g,
    // The Simulationshinweis is the one text type that reaches from the frame
    // into the simulation (docs/UX-COPY.md §8.4), and it is the reason this
    // list would otherwise have entries: its declarations live in
    // src/styles/_simulation-note.scss, outside the tree scanned here, and the
    // scenario stylesheets only `@include` the mixin. That is what keeps this
    // rule at zero exceptions — do not add one; move the declarations into the
    // partial instead.
    exempt: [],
    hint:
      'Elbwerk is not WERTE.IT: the simulation uses --sim-* only. The one exception ' +
      'is the Simulationshinweis, whose declarations belong in ' +
      'src/styles/_simulation-note.scss (include the mixin, do not copy it).',
  },
  {
    what: 'simulation tokens in the frame',
    roots: ['src/app/frame', 'src/app/shared'],
    forbidden: /--sim-[a-z0-9-]+/g,
    // One file, and the exception is the component's whole subject: it draws
    // the boundary itself. `.skip-simulation` sits outside the region and is
    // frame-styled; `.simulation-region` and `.exit-link` are inside it and
    // must therefore carry Elbwerk's tokens. The file says so at the top.
    exempt: ['src/app/frame/simulation-region/simulation-region.component.scss'],
    hint:
      'The frame is WERTE.IT and stays --wi-*. Styling that belongs to the region ' +
      'itself goes into frame/simulation-region/simulation-region.component.scss, ' +
      'which is the one file allowed to hold both token sets.',
  },
];

/** Strips SCSS/CSS and HTML comments, preserving line count so numbers stay true. */
function stripComments(source) {
  const blanked = (match) => match.replace(/[^\n]/g, ' ');
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blanked)
    .replace(/<!--[\s\S]*?-->/g, blanked)
    .replace(/(^|\s)\/\/[^\n]*/g, (match) => match.replace(/[^\n]/g, ' '));
}

function walk(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, found);
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      found.push(full);
    }
  }
  return found;
}

function hitsIn(file, pattern) {
  const source = stripComments(fs.readFileSync(file, 'utf8'));
  const hits = [];
  source.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(pattern)) {
      hits.push({ line: index + 1, token: match[0] });
    }
  });
  return hits;
}

const problems = [];

for (const rule of RULES) {
  const exempt = new Set(rule.exempt);
  const seenExempt = new Set();

  for (const root of rule.roots) {
    const absolute = path.join(REPO_ROOT, root);
    if (!fs.existsSync(absolute)) {
      problems.push(`${root}: root does not exist — check-token-boundary.js is out of date.`);
      continue;
    }

    for (const file of walk(absolute)) {
      const relative = path.relative(REPO_ROOT, file).split(path.sep).join('/');
      const hits = hitsIn(file, rule.forbidden);
      if (hits.length === 0) {
        continue;
      }
      if (exempt.has(relative)) {
        seenExempt.add(relative);
        continue;
      }
      for (const hit of hits) {
        problems.push(`${relative}:${hit.line}  ${hit.token}  — ${rule.what}. ${rule.hint}`);
      }
    }
  }

  // A stale exemption is a rule that has quietly stopped applying to anything.
  // Failing on it is the same instinct as docs/TESTING.md §8's "restore the key
  // rather than update the snapshot": an allowlist nobody prunes is how a
  // boundary erodes without a single failing test.
  for (const relative of exempt) {
    if (!seenExempt.has(relative)) {
      problems.push(
        `${relative}: listed as an exemption for "${rule.what}" but uses no such token. ` +
          'Remove the exemption — it is protecting nothing.',
      );
    }
  }
}

if (problems.length > 0) {
  console.error('check-token-boundary: CLAUDE.md rule 5 violated\n');
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  console.error(
    `\n${problems.length} problem(s). The frame is WERTE.IT, the simulation is Elbwerk, ` +
      'and the split between them is the whole architecture.',
  );
  process.exit(1);
}

console.log('check-token-boundary: frame and simulation token sets stay on their own side ✓');
