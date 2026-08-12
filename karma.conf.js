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
    },
    jasmineHtmlReporter: {
      suppressAll: true, // remove duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/access-issue'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }, { type: 'lcovonly' }],
      // Gated per docs/TESTING.md §14 — only these three modules are held to a
      // hard threshold; everything else is measured but not blocking.
      check: {
        each: {
          statements: 95,
          branches: 95,
          overrides: {
            'src/app/core/url-state.ts': { branches: 95 },
            'src/app/core/barrier-state.service.ts': { branches: 95 },
            'src/app/core/scenario-registry.service.ts': { branches: 95 },
          },
        },
      },
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