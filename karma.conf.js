// Karma configuration for AccessIssue.
//
// Must be wired up explicitly in angular.json's "test" architect target
// (option "karmaConfig": "karma.conf.js") — Angular's test builder otherwise
// constructs its Karma config in memory and never reads this file.
//
// This project uses the newer esbuild-based test builder (@angular/build:karma
// or @angular/build:unit-test with runner: "karma" — check angular.json), not
// the legacy @angular-devkit/build-angular:karma builder. That package is not
// a dependency here, and it must not be. The esbuild builder compiles Angular
// code itself; it does NOT use the '@angular-devkit/build-angular' framework
// entry or the '@angular-devkit/build-angular/plugins/karma' plugin — including
// either one throws "Cannot find module", and even if the package were
// installed the newer builder ignores it with a warning ("Ignoring framework
// ... because it's not compatible with the application builder"). This file
// is therefore intentionally plain Karma plus Jasmine, nothing Angular-specific.
//
// CHROME_BIN is resolved from Puppeteer's bundled Chromium rather than relying
// on a system install or a manually exported environment variable. This makes
// `npm test` behave identically on every machine and in CI, regardless of
// which browser (if any) is installed system-wide.
//
// Puppeteer's executablePath() became asynchronous (returns a Promise rather
// than a string) in a breaking change after this file was first written —
// assigning it directly produced "[object Promise]" as CHROME_BIN. Karma has
// supported an async config function since v6.3, so the fix is to await it
// rather than to pin an older Puppeteer version.
const path = require('path');

module.exports = async function (config) {
  process.env.CHROME_BIN = await require('puppeteer').executablePath();

  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    client: {
      jasmine: {},
      clearContext: false, // leave Jasmine Spec Runner output visible in the browser
      // Release gate (docs/SPEC_v1.md §4.1): the contentStatus check in
      // content-release-gate.spec.ts is a release gate, not a merge gate, and
      // stays pending() unless explicitly enabled. Run
      // `CONTENT_RELEASE_GATE=1 npm test` to enable it. Karma serialises
      // `client.args` into the browser as `window.__karma__.config.args`.
      args: [process.env.CONTENT_RELEASE_GATE === '1' ? 'content-release-gate' : ''],
    },
    jasmineHtmlReporter: {
      suppressAll: true, // remove duplicated traces
    },
    coverageReporter: {
      dir: path.join(__dirname, './coverage/access-issue'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }, { type: 'lcovonly' }],
      // The per-file threshold gate for the three modules docs/TESTING.md §14
      // names lives in scripts/check-coverage.js, run as a separate step
      // after `ng test --code-coverage`, NOT in karma-coverage's own
      // `coverageReporter.check` option. That option is unusable in this
      // project: karma-coverage matches each `check.each.overrides` key
      // against `path.relative(basePath, coverageMapKey)`, but Angular's
      // esbuild test builder always overwrites `basePath` at runtime to an
      // ephemeral `dist/test-out/<uuid>` directory it creates for that run —
      // ignoring whatever this file sets — three path segments below the
      // project root. That yields a normalised key like
      // '../../../src/app/core/scenario-registry.service.ts', and minimatch
      // never matches a `*`/`**` pattern across a literal '..' segment, so
      // no `overrides` entry can ever match and the threshold silently
      // falls back to 0 (always passes) for every file, no matter how
      // little of it is covered. Confirmed by instrumenting
      // node_modules/karma-coverage/lib/reporter.js locally and logging the
      // actual basePath/key/override values it computed at runtime — this
      // is not a hypothesis. Parsing the generated lcov.info directly in
      // scripts/check-coverage.js sidesteps the bug entirely.
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['ChromeHeadlessCI'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        // Sandbox flags are required in most CI containers; harmless locally.
        flags: ['--no-sandbox', '--disable-gpu'],
      },
    },
    restartOnFileChange: true,
    singleRun: true, // overridden to false by `ng test --watch` locally
  });
};
