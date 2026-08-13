// docs/SPEC_v1.md slice 6 acceptance and docs/TESTING.md §9. Like the panel's
// suite, these run against the real Router with a mocked Location rather than
// a Router spy: the view's whole contract is that it renders whatever
// `erklaerung` selects (docs/ARCHITECTURE.md §8, D2), so a fake URL would test
// nothing that matters.
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { APPLICATION_PROCESS_SCENARIO } from '../../content/application-process/application-process.scenario';
import { Announcer } from '../../core/announcer.service';
import { VIDEO_BARRIERS, makeScenario, simpleBarrier } from '../../core/testing/barrier-fixtures';
import type { Barrier, Scenario, StandardReference } from '../../models/domain.model';
import { AREA_LABELS } from '../area-labels';
import { ExplanationViewComponent } from './explanation-view.component';

const GRAFIK = APPLICATION_PROCESS_SCENARIO.barriers.find((barrier) => barrier.id === 'grafik')!;
/**
 * Both organisational barriers of the application process (docs/PRD.md §6.1),
 * read off the shipped content rather than fixtured: docs/SPEC_v1.md slice 10
 * asks for the no-standard answer on *both*, and a fixture would keep passing
 * if one of them ever lost its empty `standards` array.
 */
const ORGANISATIONAL = APPLICATION_PROCESS_SCENARIO.barriers.filter(
  (barrier) => barrier.organisational,
);

const COMBINED_SCENARIO: Scenario = oneStepScenario(VIDEO_BARRIERS);

/** A `StandardReference` with a url and no level — both optional fields, neither exercised by shipped content. */
const LINKED_STANDARD: StandardReference = {
  standard: 'BITV_2_0',
  criterion: '§ 3 Abs. 1',
  title: 'Barrierefreie Gestaltung',
  url: 'https://www.gesetze-im-internet.de/bitv_2_0/',
};

const LINKED_SCENARIO: Scenario = oneStepScenario([
  { ...simpleBarrier('norm'), standards: [LINKED_STANDARD] },
]);

/** `available`, with a step, but no barriers authored yet — see the suppression test. */
const EMPTY_SCENARIO: Scenario = oneStepScenario([]);

function oneStepScenario(barriers: readonly Barrier[]): Scenario {
  return makeScenario(barriers, {
    steps: [{ id: 'kampagne', path: 'kampagne', title: 'Kampagne' }],
  });
}

const ROUTE_PATH = 'szenario/bewerbung/stellenanzeige';

const currentScenario = signal<Scenario>(APPLICATION_PROCESS_SCENARIO);

@Component({
  imports: [ExplanationViewComponent],
  template: `<app-explanation-view [scenario]="scenario()" />`,
})
class HostComponent {
  protected readonly scenario = currentScenario;
}

interface Options {
  scenario?: Scenario;
  /** Query string appended to the route, e.g. `?erklaerung=grafik`. */
  query?: string;
}

async function setup(options: Options = {}): Promise<RouterTestingHarness> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([{ path: ROUTE_PATH, component: HostComponent }]),
      provideLocationMocks(),
    ],
  });

  currentScenario.set(options.scenario ?? APPLICATION_PROCESS_SCENARIO);
  const harness = await RouterTestingHarness.create(`/${ROUTE_PATH}${options.query ?? ''}`);
  harness.detectChanges();
  return harness;
}

function view(harness: RouterTestingHarness): HTMLElement {
  return harness.fixture.nativeElement.querySelector('.explanation') as HTMLElement;
}

function headings(harness: RouterTestingHarness): string[] {
  return Array.from(view(harness).querySelectorAll('h3')).map((h3) => h3.textContent!.trim());
}

function text(harness: RouterTestingHarness, selector: string): string {
  const element = view(harness).querySelector(selector);
  if (!element) {
    throw new Error(`no element matching "${selector}"`);
  }
  return element.textContent!.replace(/\s+/g, ' ').trim();
}

/**
 * Merges query params onto the current route the way the panel's explanation
 * link and BarrierStateService both do (`replaceUrl`, merge), then settles the
 * navigation and the Announcer's microtask.
 */
async function select(
  harness: RouterTestingHarness,
  queryParams: Record<string, string | null>,
): Promise<void> {
  await TestBed.inject(Router).navigate([`/${ROUTE_PATH}`], {
    queryParams,
    queryParamsHandling: 'merge',
    replaceUrl: true,
  });
  await harness.fixture.whenStable();
  harness.detectChanges();
}

function announced(): string {
  return TestBed.inject(Announcer).message();
}

describe('ExplanationViewComponent (docs/SPEC_v1.md Slice 6)', () => {
  describe('selection through the `erklaerung` parameter (docs/ARCHITECTURE.md §8)', () => {
    it('opens on the barrier a deep link names', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });

      expect(text(harness, '.barrier-name')).toBe(GRAFIK.title);
      expect(view(harness).querySelector('.empty')).toBeNull();
    });

    // docs/ARCHITECTURE.md §17: an unknown key is ignored and treated as
    // absent. Not an error page, not a blank section — the empty state.
    it('falls back to the empty state for an unknown key, with no error', async () => {
      const harness = await setup({ query: '?erklaerung=gibtesnicht' });

      expect(text(harness, '.empty')).toBe(
        'Wähle im Barriere-Panel einen Eintrag aus, um zu erfahren, worum es geht.',
      );
      expect(view(harness).querySelector('.barrier-name')).toBeNull();
    });

    it('shows the empty state when no barrier is selected', async () => {
      const harness = await setup();

      expect(view(harness).querySelector('.empty')).not.toBeNull();
      expect(headings(harness)).toEqual([]);
    });

    // A key from another scenario is filtered by core/url-state.ts exactly
    // like an unknown one — the view must not go looking for it in the
    // registry and render a barrier that is not on this page.
    it('ignores a key belonging to another scenario', async () => {
      const harness = await setup({ scenario: COMBINED_SCENARIO, query: '?erklaerung=grafik' });

      expect(view(harness).querySelector('.empty')).not.toBeNull();
    });

    it('follows a change of selection without a reload', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });
      await select(harness, { erklaerung: 'labels' });

      expect(text(harness, '.barrier-name')).toBe('Fehlende Labels');
    });

    it('explains a part of a combined barrier in its own right', async () => {
      const harness = await setup({
        scenario: COMBINED_SCENARIO,
        query: '?erklaerung=video-transkript',
      });

      expect(text(harness, '.barrier-name')).toBe('video-transkript');
      // Parts carry no responsibleArea of their own; the area is a property
      // of the barrier they belong to (docs/ARCHITECTURE.md §6).
      expect(text(harness, '.area')).toBe(`Zuständiger Bereich: ${AREA_LABELS['it']}`);
    });
  });

  describe('the four rubrics (docs/UX-COPY.md §5.8, docs/PRD.md §8.1 F)', () => {
    const RUBRICS = [
      'Was ist das Problem?',
      'Wen betrifft es?',
      'Was sagen die Normen?',
      'Wie geht es barrierefrei?',
    ];

    // Every barrier, not a sampled one: "all four parts render for every
    // barrier" is the acceptance criterion, and the data contract already
    // guarantees the prose exists (content/data-contract.spec.ts).
    it('renders all four rubrics, in order, for every barrier in the scenario', async () => {
      for (const barrier of APPLICATION_PROCESS_SCENARIO.barriers) {
        const harness = await setup({ query: `?erklaerung=${barrier.urlKey}` });

        expect(headings(harness)).withContext(barrier.urlKey).toEqual(RUBRICS);
        expect(view(harness).textContent)
          .withContext(barrier.urlKey)
          .toContain(barrier.explanation.problem);
        expect(view(harness).textContent)
          .withContext(barrier.urlKey)
          .toContain(barrier.explanation.affected);
        expect(view(harness).textContent)
          .withContext(barrier.urlKey)
          .toContain(barrier.explanation.solution);
      }
    });

    it('names the responsible area of the selected barrier', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });

      expect(text(harness, '.area')).toBe(
        `Zuständiger Bereich: ${AREA_LABELS[GRAFIK.responsibleArea]}`,
      );
    });
  });

  describe('standards references (docs/PRD.md §8.1 F)', () => {
    // Asserted part by part rather than as one concatenated string: the three
    // spans are separate flex items, so the DOM text of the `li` has no
    // separators in it, and an assertion that papered over that with a regex
    // would stop describing what is rendered.
    it('renders criterion, title and level from the structured data', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });
      const entries = Array.from(view(harness).querySelectorAll('.standards > li')).map((item) => [
        item.querySelector('.standard-name')!.textContent!.trim(),
        item.querySelector('.criterion')!.textContent!.trim(),
        item.querySelector('.level')!.textContent!.trim(),
      ]);

      expect(entries).toEqual(
        GRAFIK.standards.map((standard) => [
          'WCAG 2.2',
          `${standard.criterion} ${standard.title}`,
          `Stufe ${standard.level}`,
        ]),
      );
      expect(entries.length).toBe(2);
    });

    it('links the criterion where the reference carries a url', async () => {
      const harness = await setup({ scenario: LINKED_SCENARIO, query: '?erklaerung=norm' });
      const link = view(harness).querySelector<HTMLAnchorElement>('.standards a')!;

      expect(link.getAttribute('href')).toBe(LINKED_STANDARD.url!);
      expect(link.textContent!.trim()).toBe(
        `${LINKED_STANDARD.criterion} ${LINKED_STANDARD.title}`,
      );
      // No level on this reference — BITV cites no conformance levels.
      expect(view(harness).querySelector('.level')).toBeNull();
    });

    // Five of the 27 barriers violate no success criterion (docs/PRD.md §6.1,
    // CLAUDE.md rule 19). The rubric is answered, not dropped: omitting it
    // would read as an editorial oversight, and "conformant and still
    // excluding people" is the learning content.
    it('keeps the rubric and answers it for a barrier without a standards reference', async () => {
      // Both organisational barriers of the scenario, not one of them: they are
      // the first pair the application renders (docs/SPEC_v1.md slice 10), and
      // the acceptance criterion is that neither shows an empty rubric.
      expect(ORGANISATIONAL.length).toBe(2);

      for (const barrier of ORGANISATIONAL) {
        const harness = await setup({ query: `?erklaerung=${barrier.urlKey}` });

        expect(barrier.standards).withContext(barrier.urlKey).toEqual([]);
        expect(headings(harness)).withContext(barrier.urlKey).toContain('Was sagen die Normen?');
        expect(view(harness).querySelector('.standards')).withContext(barrier.urlKey).toBeNull();
        expect(text(harness, '.no-standard'))
          .withContext(barrier.urlKey)
          .toBe(
            'Zu dieser Barriere gibt es kein passendes Erfolgskriterium. Sie verstößt gegen keine ' +
              'Norm — und schließt trotzdem Menschen aus. Barrierefreiheit ist mehr als das ' +
              'Erfüllen von Vorgaben.',
          );
      }
    });
  });

  describe('the current-state line (docs/UX-COPY.md §5.8)', () => {
    it('says the barrier is active while it is', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });

      expect(text(harness, '.state')).toBe('Diese Barriere ist gerade aktiv.');
    });

    // "Explanation is reachable and readable regardless of the barrier's
    // state" (docs/SPEC_v1.md slice 6, docs/PRD.md §8.1 F): the same four
    // rubrics, one different sentence.
    it('says the barrier is resolved once it is, and still renders every rubric', async () => {
      const harness = await setup({ query: '?frei=grafik&erklaerung=grafik' });

      expect(text(harness, '.state')).toBe('Diese Barriere ist behoben.');
      expect(headings(harness).length).toBe(4);
    });

    // A partially resolved combined barrier still stands, so it reads as
    // active — the same rule that keeps it in the counter (docs/UX-COPY.md
    // §5.6). §5.8 has two state lines, and this is the right one.
    it('calls a partially resolved combined barrier active', async () => {
      const harness = await setup({
        scenario: COMBINED_SCENARIO,
        query: '?frei=video-ut&erklaerung=video',
      });

      expect(text(harness, '.state')).toBe('Diese Barriere ist gerade aktiv.');
    });

    it('reads the state of the part, not of its parent, when a part is selected', async () => {
      const harness = await setup({
        scenario: COMBINED_SCENARIO,
        query: '?frei=video-ut&erklaerung=video-ut',
      });

      expect(text(harness, '.state')).toBe('Diese Barriere ist behoben.');
    });
  });

  // The link has to arrive somewhere: it merges a query parameter, which
  // moves neither scroll nor focus, and the section sits below both columns.
  // Focusing it scrolls it into view — the same pattern the skip links use.
  describe('arriving from „Was bedeutet das?"', () => {
    it('focuses its section when the selection changes on its own', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });
      await select(harness, { erklaerung: 'labels' });

      expect(document.activeElement).toBe(view(harness));
    });

    // FocusManager has just put focus on the h1 (docs/ARCHITECTURE.md §9).
    // Taking it away here would skip the heading and the panel on every
    // shared link.
    it('does not take focus on the first render of a deep link', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });

      expect(view(harness).querySelector('.barrier-name')).not.toBeNull();
      expect(document.activeElement).not.toBe(view(harness));
    });

    // The hard constraint of docs/ARCHITECTURE.md §12.2: toggling selects the
    // barrier implicitly (§8), and focus stays on the checkbox the user
    // activated. This is the case `resolvedSignature` exists to recognise.
    it('leaves focus alone when a toggle moved the state', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });
      await select(harness, { frei: 'labels', erklaerung: 'labels' });

      expect(text(harness, '.barrier-name')).toBe('Fehlende Labels');
      expect(document.activeElement).not.toBe(view(harness));
    });

    it('leaves focus alone when the selection is cleared by a bulk action', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });
      await select(harness, { frei: 'alle', erklaerung: null });

      expect(view(harness).querySelector('.empty')).not.toBeNull();
      expect(document.activeElement).not.toBe(view(harness));
    });

    it('leaves focus alone when the same barrier is selected again', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });
      await select(harness, { erklaerung: 'grafik' });

      expect(document.activeElement).not.toBe(view(harness));
    });

    // Announcing as well would put a polite live region and a focus change on
    // the same event, and they would talk over each other (§12.2). The panel
    // still announces its own toggles; this component announces nothing.
    it('announces nothing of its own', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });
      const announce = spyOn(TestBed.inject(Announcer), 'announce').and.callThrough();

      await select(harness, { erklaerung: 'labels' });

      expect(announce).not.toHaveBeenCalled();
      expect(announced()).toBe('');
    });
  });

  describe('the boundary (docs/ARCHITECTURE.md §5.4, §5.6)', () => {
    it('renders no h1 and starts its content at h3 under one h2', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });
      const element = view(harness);

      expect(element.querySelectorAll('h1').length).toBe(0);
      expect(element.querySelectorAll('h2').length).toBe(1);
      expect(element.querySelector('h2')!.textContent!.trim()).toBe('Erklärung');
    });

    it('names its section by its own heading', async () => {
      const harness = await setup();
      const element = view(harness);

      expect(element.tagName).toBe('SECTION');
      expect(element.getAttribute('aria-labelledby')).toBe(element.querySelector('h2')!.id);
      // Programmatically focusable, never in the tab order — it is a
      // destination, not a control.
      expect(element.getAttribute('tabindex')).toBe('-1');
    });

    // „Wähle im Barriere-Panel einen Eintrag aus" is an instruction nobody can
    // follow on a page whose panel offers nothing. A scenario can be
    // `available` with steps but no barriers yet — the data contract requires
    // a step, never a barrier — and BarrierPanelComponent already suppresses
    // its own summary and bulk actions for exactly that state.
    it('renders nothing at all for a scenario without barriers', async () => {
      const harness = await setup({ scenario: EMPTY_SCENARIO });

      expect(view(harness)).toBeNull();
      expect(harness.fixture.nativeElement.textContent).not.toContain('Erklärung');
    });

    // Frame code, so no `sim-` prefix — that rule applies inside the
    // simulation region (docs/ARCHITECTURE.md §5.6 rule 2).
    it('carries no simulation-prefixed ids', async () => {
      const harness = await setup({ query: '?erklaerung=grafik' });
      const ids = Array.from(view(harness).querySelectorAll('[id]')).map((element) => element.id);

      expect(ids.some((id) => id.startsWith('sim-'))).toBeFalse();
    });
  });
});
