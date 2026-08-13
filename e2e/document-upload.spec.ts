// Step 3 of the application process — the upload step and the PDF barrier
// (docs/SPEC_v1.md slice 9).
//
// The four tested states are the n + 2 set of docs/TESTING.md §4: both
// barriers active, both resolved, and each resolved on its own. Runs 1 and 3
// must be clean in all four.
//
// **There is no run 2 here.** Both barriers are `automatedDetection: 'manual'`
// (src/app/content/application-process/application-process.content.ts), which
// is not a gap in this file but the fact the project is built around: a PDF
// with no tag structure and a file field that names no formats are invisible
// to axe, and roughly two thirds of the twenty-seven barriers are
// (docs/TESTING.md §2). Their coverage is structural and lives in
// document-upload-step.component.spec.ts, where it runs in milliseconds.
//
// What is here is what only a real browser can answer: what axe sees on the
// assembled page, whether the download link resolves to a file that actually
// exists, what a deep link reproduces, and what survives a step change.
import { expect, test } from '@playwright/test';
import { frameGate, pageLevelRules } from './support/axe-runs';
import { gotoRendered } from './support/goto';

const PATH = '/szenario/bewerbung/dokumente';
const FORM_PATH = '/szenario/bewerbung/formular';

/** docs/TESTING.md §4 — n + 2 for the two barriers of this step. */
const STATES: Array<{ name: string; query: string }> = [
  { name: 'both barriers active (default)', query: '' },
  { name: 'both barriers resolved', query: '?frei=alle' },
  { name: 'only `pdf` resolved', query: '?frei=pdf' },
  { name: 'only `upload` resolved', query: '?frei=upload' },
];

const PDF_HREF = 'simulation/Stellenausschreibung_2026_IT-Projektmanagement_final_v3.pdf';

/** Small enough that size is never the reason a file is rejected. */
const REJECTED_FILE = Buffer.from('Lebenslauf');

for (const { name, query } of STATES) {
  test.describe(`Document upload — ${name}`, () => {
    test('run 1: frame gate reports zero violations', async ({ page }) => {
      await gotoRendered(page, `${PATH}${query}`);
      const results = await frameGate(page).analyze();
      expect(results.violations).toEqual([]);
    });

    test('run 3: page-level rules report zero violations', async ({ page }) => {
      await gotoRendered(page, `${PATH}${query}`);
      const results = await pageLevelRules(page).analyze();
      expect(results.violations).toEqual([]);
    });

    // Runs 1 and 3 again after a rejected upload: the error output is the half
    // of this step that only exists after an interaction. A boundary that
    // holds on load and breaks on submit holds for nobody.
    test('runs 1 and 3 stay clean after a rejected upload', async ({ page }) => {
      await gotoRendered(page, `${PATH}${query}`);

      // A format neither variant accepts, so both produce their output.
      await page.locator('#sim-upload-cv').setInputFiles({
        name: 'lebenslauf.rtf',
        mimeType: 'application/rtf',
        buffer: REJECTED_FILE,
      });
      await page.locator('[data-simulation-region] .submit-button').click();
      await expect(
        page.locator(
          '[data-simulation-region] .error-generic, [data-simulation-region] .field-error',
        ),
      ).toHaveCount(1);

      expect((await frameGate(page).analyze()).violations).toEqual([]);
      expect((await pageLevelRules(page).analyze()).violations).toEqual([]);
    });

    // docs/SPEC_v1.md slice 9: "The resolved `pdf` variant still offers the
    // download — the accessible state is 'also as text', not 'PDF removed'."
    // Asserted in every state, because the link is the one thing that may
    // never depend on the barrier.
    test('offers the download, and the file behind it exists', async ({ page }) => {
      await gotoRendered(page, `${PATH}${query}`);

      const link = page.locator('[data-simulation-region] .document-download a');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAttribute('href', PDF_HREF);

      // A link text that promises a PDF and a 404 behind it would be a barrier
      // nobody declared — and the one participants would hit first. The URL
      // fetched is the one the *browser* resolved: the attribute is relative
      // so that it survives a deployment under a subpath
      // (docs/ARCHITECTURE.md §16), and resolving it here by hand would test
      // this file's idea of `<base href>` rather than the page's.
      const resolved = await link.evaluate((anchor) => (anchor as HTMLAnchorElement).href);
      const response = await page.request.get(resolved);
      expect(response.status()).toBe(200);
      expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
    });
  });
}

// Fail, then resolve the barrier in the panel and read the page again — the
// move the whole tool is built for, and the one that shows whether the error
// output is derived from the current state or kept from the last submission.
// The component spec asserts the same thing on the signals; this asserts it
// through the real panel checkbox, which is how a participant gets there.
test.describe('Toggling `upload` after a failed submission', () => {
  test('never rejects a format the resolved variant declares acceptable', async ({ page }) => {
    await gotoRendered(page, PATH);

    await page.locator('#sim-upload-cv').setInputFiles({
      name: 'lebenslauf.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: REJECTED_FILE,
    });
    await page.locator('[data-simulation-region] .submit-button').click();
    await expect(page.locator('[data-simulation-region] .error-generic')).toContainText(
      'Upload fehlgeschlagen',
    );

    await page
      .getByRole('checkbox', { name: /Zulässige Dateiformate und Größen angegeben/ })
      .click();

    // DOCX is one of the three formats the hint now names. A message rejecting
    // it would contradict the sentence two lines above it — and would be
    // announced, because the message carries role="alert".
    await expect(page.locator('[data-simulation-region] .format-hint')).toContainText(
      'Zulässig sind PDF, DOCX und ODT',
    );
    await expect(page.locator('[data-simulation-region] .field-error')).toHaveCount(0);
    await expect(page.locator('[data-simulation-region] [aria-invalid]')).toHaveCount(0);
  });
});

// docs/TESTING.md §12: reach a state through the panel, read the URL, open it
// in a fresh page, and assert the DOM matches.
test.describe('Deep link (docs/TESTING.md §12)', () => {
  test('a state reached by toggling reproduces exactly from its URL', async ({ page }) => {
    await gotoRendered(page, PATH);

    await page.getByRole('checkbox', { name: /Stellenanzeige als Text auf der Seite/ }).click();

    // Web-first, on something the toggle actually changes: the posting text
    // appears beside the download.
    await expect(page.locator('[data-simulation-region] h5').first()).toBeVisible();

    const url = new URL(page.url());
    expect(url.searchParams.get('frei')).toBe('pdf');

    const reopened = await page.context().newPage();
    await gotoRendered(reopened, `${url.pathname}${url.search}`);

    await expect(reopened.locator('[data-simulation-region] h5')).toHaveCount(2);
    await expect(reopened.locator('[data-simulation-region] .document-download a')).toHaveCount(1);
    // `upload` is untouched: no format hint, one format in the picker.
    await expect(reopened.locator('[data-simulation-region] .format-hint')).toHaveCount(0);
    await expect(reopened.locator('#sim-upload-cv')).toHaveAttribute('accept', '.pdf');

    await expect(
      reopened.getByRole('checkbox', { name: /Stellenanzeige als Text auf der Seite/ }),
    ).toBeChecked();
    await expect(
      reopened.getByRole('checkbox', { name: /Zulässige Dateiformate und Größen angegeben/ }),
    ).not.toBeChecked();

    await reopened.close();
  });

  test('every one of the four states reproduces from its URL', async ({ page }) => {
    for (const { query } of STATES) {
      await gotoRendered(page, `${PATH}${query}`);

      const postingResolved = query === '?frei=alle' || query === '?frei=pdf';
      const uploadResolved = query === '?frei=alle' || query === '?frei=upload';

      await expect(page.locator('[data-simulation-region] h5')).toHaveCount(
        postingResolved ? 2 : 0,
      );
      await expect(page.locator('[data-simulation-region] .format-hint')).toHaveCount(
        uploadResolved ? 1 : 0,
      );
    }
  });
});

// Barrier state is scoped to the scenario, not the step (docs/ARCHITECTURE.md
// §8), so a key set on step 2 has to survive the walk to step 3 and back.
test.describe('Step navigation (docs/ARCHITECTURE.md §10)', () => {
  test('carries `frei` from step 2 to step 3 and back', async ({ page }) => {
    await gotoRendered(page, `${FORM_PATH}?frei=labels,pdf`);

    await page.getByRole('link', { name: 'Weiter zu: Unterlagen hochladen' }).click();
    await expect(page.locator('.step-indicator')).toHaveText(
      'Schritt 3 von 4 — Unterlagen hochladen',
    );
    expect(new URL(page.url()).pathname).toBe(PATH);
    expect(new URL(page.url()).searchParams.get('frei')).toBe('labels,pdf');

    // The step-3 key is in effect here …
    await expect(page.locator('[data-simulation-region] h5').first()).toBeVisible();

    await page.getByRole('link', { name: 'Zurück zu: Bewerbungsformular' }).click();
    expect(new URL(page.url()).searchParams.get('frei')).toBe('labels,pdf');

    // … and the step-2 key is still in effect there.
    await expect(page.locator('[data-simulation-region] label')).toHaveCount(8);

    // A push, not a replace.
    await page.goBack();
    expect(new URL(page.url()).pathname).toBe(PATH);
  });

  // docs/UX-COPY.md §8.2: the posting on this page is the same document as on
  // step 1, so it answers to `sprache` — a barrier the panel lists under step
  // 1. docs/TESTING.md §4 asks for a combination test wherever one part of a
  // scenario depends on another barrier's state; the component spec asserts
  // the wording, this asserts that the panel toggle for step 1 reaches it.
  test('resolving the step-1 language barrier changes the posting text here', async ({ page }) => {
    await gotoRendered(page, `${PATH}?frei=pdf`);
    await expect(page.locator('[data-simulation-region] h5').first()).toHaveText('Aufgabenprofil');

    await page.getByRole('checkbox', { name: /Stellenbeschreibung in klarer Sprache/ }).click();

    await expect(page.locator('[data-simulation-region] h5').first()).toHaveText('Ihre Aufgaben');
    expect(new URL(page.url()).searchParams.get('frei')).toBe('pdf,sprache');
  });
});
