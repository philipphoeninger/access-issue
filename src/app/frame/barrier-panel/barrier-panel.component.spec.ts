// docs/TESTING.md §9 (component tests for BarrierPanelComponent, the area
// summary and the step grouping) and docs/SPEC_v1.md slice 5 acceptance.
//
// These run against the real Router with a mocked Location rather than a
// Router spy: the panel's whole contract is that toggling *navigates* and the
// UI re-derives from the URL (docs/ARCHITECTURE.md §7, D2). A spy would
// assert that navigate() was called and prove nothing about what the user
// then sees — and the announcements are read off the state the navigation
// produced, so a fake URL would make them untestable.
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Announcer } from '../../core/announcer.service';
import {
  VIDEO_BARRIERS,
  combinedBarrier,
  makeScenario,
  simpleBarrier,
} from '../../core/testing/barrier-fixtures';
import { APPLICATION_PROCESS_SCENARIO } from '../../content/application-process/application-process.scenario';
import type { Barrier, Scenario } from '../../models/domain.model';
import { AREA_LABELS } from '../area-labels';
import { BarrierPanelComponent } from './barrier-panel.component';

// A combined barrier still exists only as a fixture: the CSR video barrier is
// a `status: 'planned'` stub (docs/SPEC_v1.md §3). One step, so this doubles
// as the single-step-scenario case for the grouping tests.
const COMBINED_SCENARIO: Scenario = oneStepScenario(VIDEO_BARRIERS);

/** Three parts — the case the two-part wording of `panel.combinedHint` would misdescribe. */
const THREE_PART_SCENARIO: Scenario = oneStepScenario([
  simpleBarrier('einfach'),
  combinedBarrier('video', ['video-ut', 'video-transkript', 'video-ad']),
]);

/**
 * `parts: []` — not a combined barrier (core/url-state.ts owns that
 * decision). Unreachable in shipped content, where the data contract demands
 * at least two parts; the panel must not disagree with the state layer about
 * it all the same.
 */
const EMPTY_PARTS_SCENARIO: Scenario = oneStepScenario([
  { ...simpleBarrier('leer'), parts: [] },
  simpleBarrier('einfach'),
]);

/** A scenario that is `available` and has a step, but no barriers authored yet. */
const EMPTY_SCENARIO: Scenario = oneStepScenario([]);

function oneStepScenario(barriers: readonly Barrier[]): Scenario {
  return makeScenario(barriers, {
    steps: [
      {
        id: 'kampagne',
        path: 'kampagne',
        title: 'Kampagne',
        barrierIds: barriers.map((barrier) => barrier.id),
      },
    ],
  });
}

const ROUTE_PATH = 'szenario/bewerbung/stellenanzeige';

// The host is instantiated by the router, so the scenario under test is
// handed to it through a signal rather than through a fixture input.
const currentScenario = signal<Scenario>(APPLICATION_PROCESS_SCENARIO);

@Component({
  imports: [BarrierPanelComponent],
  template: `<app-barrier-panel [scenario]="scenario()" />`,
})
class HostComponent {
  protected readonly scenario = currentScenario;
}

interface Options {
  scenario?: Scenario;
  /** Query string appended to the route, e.g. `?frei=labels`. */
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

function panel(harness: RouterTestingHarness): HTMLElement {
  return harness.fixture.nativeElement.querySelector('.panel') as HTMLElement;
}

function checkboxes(harness: RouterTestingHarness): HTMLInputElement[] {
  return Array.from(panel(harness).querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
}

/** The text of the `<label for>` a checkbox is programmatically associated with. */
function accessibleName(input: HTMLInputElement): string {
  const label = input.ownerDocument.querySelector(`label[for="${input.id}"]`);
  return label ? label.textContent!.trim() : '';
}

function checkboxByName(harness: RouterTestingHarness, name: string): HTMLInputElement {
  const match = checkboxes(harness).find((input) => accessibleName(input) === name);
  if (!match) {
    throw new Error(`no checkbox labelled "${name}"`);
  }
  return match;
}

function buttonByText(harness: RouterTestingHarness, text: string): HTMLButtonElement {
  const match = Array.from(panel(harness).querySelectorAll('button')).find(
    (button) => button.textContent!.trim() === text,
  );
  if (!match) {
    throw new Error(`no button labelled "${text}"`);
  }
  return match as HTMLButtonElement;
}

/** Clicks a control and lets both the navigation and the Announcer's microtask settle. */
async function click(harness: RouterTestingHarness, element: HTMLElement): Promise<void> {
  element.click();
  await harness.fixture.whenStable();
  harness.detectChanges();
}

function announced(): string {
  return TestBed.inject(Announcer).message();
}

describe('BarrierPanelComponent (docs/SPEC_v1.md Slice 5)', () => {
  describe('checkbox semantics (docs/ARCHITECTURE.md §12.1)', () => {
    it('gives every checkbox a programmatically associated accessible name', async () => {
      const harness = await setup();
      const inputs = checkboxes(harness);

      expect(inputs.length).toBe(APPLICATION_PROCESS_SCENARIO.barriers.length);
      for (const input of inputs) {
        expect(accessibleName(input)).withContext(input.id).not.toBe('');
      }
    });

    // docs/UX-COPY.md §4: checkboxes carry a *state* label ("Formularfelder
    // mit Beschriftungen"), never an action label ("Beschriftungen ergänzen").
    // Ticked means the state holds.
    it("labels each checkbox with the barrier's panel label, in flow order", async () => {
      const harness = await setup();
      const expected = APPLICATION_PROCESS_SCENARIO.steps.flatMap((step) =>
        step.barrierIds.map(
          (id) =>
            APPLICATION_PROCESS_SCENARIO.barriers.find((barrier) => barrier.id === id)!.shortTitle,
        ),
      );

      expect(checkboxes(harness).map(accessibleName)).toEqual(expected);
    });

    it('ticks the checkboxes of barriers resolved in the URL, and only those', async () => {
      const harness = await setup({ query: '?frei=labels,pdf' });
      const ticked = checkboxes(harness)
        .filter((input) => input.checked)
        .map(accessibleName);

      expect(ticked).toEqual([
        'Formularfelder mit Beschriftungen',
        'Stellenanzeige als Text auf der Seite',
      ]);
    });

    it('renders no form, no submit control and no counter of its own', async () => {
      const harness = await setup({ query: '?frei=labels' });
      const element = panel(harness);

      expect(element.querySelector('form')).toBeNull();
      expect(element.querySelector('[type="submit"]')).toBeNull();
      // The one counter in the application is the simulation bar's
      // (docs/UX-COPY.md §5.6). "{n} von {total}" must not appear here.
      expect(element.textContent).not.toMatch(/\d+\s+von\s+\d+/);
    });
  });

  describe('grouping by step (docs/ARCHITECTURE.md §12.1.1)', () => {
    it('renders one fieldset per flow step, each with a legend naming it', async () => {
      const harness = await setup();
      const groups = Array.from(panel(harness).querySelectorAll('fieldset.group'));

      expect(groups.map((group) => group.querySelector('legend')!.textContent!.trim())).toEqual(
        APPLICATION_PROCESS_SCENARIO.steps.map((step) => step.title),
      );
    });

    it('keeps every barrier of the scenario in exactly one group', async () => {
      const harness = await setup();
      const grouped = Array.from(panel(harness).querySelectorAll('fieldset.group')).flatMap(
        (group) => Array.from(group.querySelectorAll('li.barrier')),
      );

      expect(grouped.length).toBe(APPLICATION_PROCESS_SCENARIO.barriers.length);
    });

    // docs/ARCHITECTURE.md §12.1.1: "For single-step scenarios the step
    // grouping collapses to one group" — one group, not none.
    it('renders a single group for a one-step scenario', async () => {
      const harness = await setup({ scenario: COMBINED_SCENARIO });
      const groups = Array.from(panel(harness).querySelectorAll('fieldset.group'));

      expect(groups.length).toBe(1);
      expect(groups[0].querySelector('legend')!.textContent!.trim()).toBe(
        'Barrieren in diesem Schritt',
      );
    });
  });

  describe('combined barriers (docs/PRD.md §6.4)', () => {
    it('renders a fieldset with a legend naming the barrier', async () => {
      const harness = await setup({ scenario: COMBINED_SCENARIO });
      const combined = panel(harness).querySelector('fieldset.combined')!;

      expect(combined.querySelector('legend')!.textContent!.trim()).toBe('video');
      expect(combined.querySelectorAll('input[type="checkbox"]').length).toBe(3); // parent + two parts
    });

    it('shows the parent as indeterminate while its parts disagree', async () => {
      const harness = await setup({ scenario: COMBINED_SCENARIO, query: '?frei=video-ut' });
      const parent = checkboxByName(harness, 'video');

      expect(parent.indeterminate).toBeTrue();
      expect(parent.checked).toBeFalse();
      expect(panel(harness).textContent).toContain('Teilweise behoben');
    });

    it('ticks the parent only once every part is resolved', async () => {
      const harness = await setup({
        scenario: COMBINED_SCENARIO,
        query: '?frei=video-ut,video-transkript',
      });
      const parent = checkboxByName(harness, 'video');

      expect(parent.checked).toBeTrue();
      expect(parent.indeterminate).toBeFalse();
    });

    it('toggles every part together when the parent is used', async () => {
      const harness = await setup({ scenario: COMBINED_SCENARIO });
      await click(harness, checkboxByName(harness, 'video'));

      expect(checkboxByName(harness, 'video-ut').checked).toBeTrue();
      expect(checkboxByName(harness, 'video-transkript').checked).toBeTrue();
    });

    // The hint is rendered from the part count, not written into the
    // template: the two-part wording would otherwise claim there are two of
    // something the user can see three of (docs/UX-COPY.md §5.6).
    it('says "zwei Teile" for a two-part barrier', async () => {
      const harness = await setup({ scenario: COMBINED_SCENARIO });

      expect(panel(harness).querySelector('.hint')!.textContent!.trim()).toBe(
        'Diese Barriere hat zwei Teile. Erst wenn beide behoben sind, ist der Inhalt barrierefrei.',
      );
    });

    it('counts the parts when there are more than two', async () => {
      const harness = await setup({ scenario: THREE_PART_SCENARIO });

      expect(panel(harness).querySelector('.hint')!.textContent!.trim()).toBe(
        'Diese Barriere hat 3 Teile. Erst wenn alle behoben sind, ist der Inhalt barrierefrei.',
      );
      expect(panel(harness).querySelectorAll('fieldset.combined input[type="checkbox"]').length)
        // parent + three parts
        .toBe(4);
    });

    // `parts: []` is not a combined barrier — url-state.ts owns that decision
    // and both halves of the application have to read it from there. Reading
    // `barrier.parts` directly here would render a group promising parts,
    // with a parent checkbox, for a barrier BarrierStateService treats as
    // simple.
    it('treats a barrier with an empty parts array as a simple barrier', async () => {
      const harness = await setup({ scenario: EMPTY_PARTS_SCENARIO });

      expect(panel(harness).querySelector('fieldset.combined')).toBeNull();
      expect(checkboxes(harness).length).toBe(EMPTY_PARTS_SCENARIO.barriers.length);
    });
  });

  describe('state coding (docs/DESIGN.md §3.3)', () => {
    it('names the state in text beside every barrier, never in colour alone', async () => {
      const harness = await setup({ query: '?frei=labels' });
      const states = Array.from(panel(harness).querySelectorAll('.state')).map((state) =>
        state.textContent!.trim(),
      );

      expect(states).toContain('Barrierefrei');
      expect(states).toContain('Barriere aktiv');
      expect(states.length).toBe(APPLICATION_PROCESS_SCENARIO.barriers.length);
    });

    it('renders a symbol shape alongside the state text', async () => {
      const harness = await setup();
      const symbols = panel(harness).querySelectorAll('.state svg[aria-hidden="true"]');

      expect(symbols.length).toBe(APPLICATION_PROCESS_SCENARIO.barriers.length);
    });
  });

  describe('the area summary (docs/UX-COPY.md §5.6)', () => {
    // Asserted as a set derived from the data, not as a fixed sentence: the
    // whole point of the line is that it reflects what the scenario contains.
    it('names the distinct responsible areas of the scenario', async () => {
      const harness = await setup();
      const summary = panel(harness).querySelector('.area-summary')!.textContent!.trim();
      const areas = [
        ...new Set(APPLICATION_PROCESS_SCENARIO.barriers.map((b) => b.responsibleArea)),
      ].map((area) => AREA_LABELS[area]);

      expect(summary).toBe(
        `Diese ${APPLICATION_PROCESS_SCENARIO.barriers.length} Barrieren stammen aus ` +
          `${areas.length} Bereichen: ${areas.join(', ')}.`,
      );
    });

    it('uses the singular sentence when every barrier comes from one area', async () => {
      const harness = await setup({ scenario: COMBINED_SCENARIO }); // fixtures are all `it`
      const summary = panel(harness).querySelector('.area-summary')!.textContent!.trim();

      expect(summary).toBe(
        `Alle ${COMBINED_SCENARIO.barriers.length} Barrieren stammen aus einem Bereich: IT.`,
      );
    });

    // "Diese 0 Barrieren stammen aus 0 Bereichen: ." is not a sentence, and
    // buttons offering to resolve nothing are not an affordance. A scenario
    // can be `available` with steps but no barriers yet — the data contract
    // requires a step, never a barrier.
    it('renders neither the summary nor the bulk actions without barriers', async () => {
      const harness = await setup({ scenario: EMPTY_SCENARIO });

      expect(panel(harness).querySelector('.area-summary')).toBeNull();
      expect(panel(harness).querySelector('.bulk-actions')).toBeNull();
      expect(panel(harness).textContent).not.toContain('0 Barrieren');
      // The panel itself stays: it is the `#panel` skip-link target.
      expect(panel(harness).querySelector('h2')!.textContent!.trim()).toBe('Barrieren');
    });

    it('labels every barrier with its responsible area', async () => {
      const harness = await setup();
      const areas = Array.from(panel(harness).querySelectorAll('.area')).map((area) =>
        area.textContent!.replace('Zuständiger Bereich: ', '').trim(),
      );

      expect(areas).toEqual(
        APPLICATION_PROCESS_SCENARIO.steps.flatMap((step) =>
          step.barrierIds.map(
            (id) =>
              AREA_LABELS[
                APPLICATION_PROCESS_SCENARIO.barriers.find((barrier) => barrier.id === id)!
                  .responsibleArea
              ],
          ),
        ),
      );
    });
  });

  describe('toggling (docs/ARCHITECTURE.md §7, §12.2)', () => {
    it('writes the resolved barrier to the URL rather than to local state', async () => {
      const harness = await setup();
      await click(harness, checkboxByName(harness, 'Formularfelder mit Beschriftungen'));

      // Both halves matter: the URL carries the state, and the checkbox is
      // ticked because it read it back from there (docs/ARCHITECTURE.md D2).
      // Toggling also selects the barrier for the explanation view (§8).
      expect(TestBed.inject(Router).url).toBe(`/${ROUTE_PATH}?frei=labels&erklaerung=labels`);
      expect(checkboxByName(harness, 'Formularfelder mit Beschriftungen').checked).toBeTrue();
    });

    // Every write re-derives the resolved set from the URL, so two writes
    // that overlap both read the old one and the second silently drops the
    // first barrier — and since the dropped barrier's `checked` expression
    // never changes value, Angular does not re-write the input and the box
    // stays ticked next to a barrier the URL calls active. The panel
    // serialises its writes so the second toggle sees the first one's URL.
    it('applies both toggles when two are dispatched before the first lands', async () => {
      const harness = await setup();
      const first = checkboxByName(harness, 'Gehalt und Leistungen als Text, nicht als Bild');
      const second = checkboxByName(harness, 'Stellenbeschreibung in klarer Sprache');

      first.click();
      second.click();
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(TestBed.inject(Router).url).toContain('frei=grafik,sprache');
      expect(first.checked).toBeTrue();
      expect(second.checked).toBeTrue();
    });

    it('leaves a checkbox toggled twice in a row matching the URL', async () => {
      const harness = await setup();
      const box = checkboxByName(harness, 'Gehalt und Leistungen als Text, nicht als Bild');

      box.click();
      box.click();
      await harness.fixture.whenStable();
      harness.detectChanges();

      expect(TestBed.inject(Router).url).not.toContain('frei=');
      expect(box.checked).toBeFalse();
    });

    it('keeps focus on the checkbox the user activated', async () => {
      const harness = await setup();
      const input = checkboxByName(harness, 'Formularfelder mit Beschriftungen');
      input.focus();
      await click(harness, input);

      expect(document.activeElement).toBe(
        checkboxByName(harness, 'Formularfelder mit Beschriftungen'),
      );
    });
  });

  describe('announcements (docs/UX-COPY.md §5.7)', () => {
    it('announces the resolved state and how many barriers remain', async () => {
      const harness = await setup();
      await click(harness, checkboxByName(harness, 'Formularfelder mit Beschriftungen'));

      expect(announced()).toBe(
        'Formularfelder mit Beschriftungen: barrierefrei. Noch 10 von 11 Barrieren aktiv.',
      );
    });

    it('announces the active state when a barrier is switched back on', async () => {
      const harness = await setup({ query: '?frei=labels' });
      await click(harness, checkboxByName(harness, 'Formularfelder mit Beschriftungen'));

      expect(announced()).toBe(
        'Formularfelder mit Beschriftungen: Barriere aktiv. 11 von 11 Barrieren aktiv.',
      );
    });

    // A part that leaves its barrier incomplete reports what is still
    // missing instead of a count — the count did not change, because a
    // partially resolved combined barrier stays active (docs/UX-COPY.md §5.6).
    it('announces a resolved part as not yet completing its barrier', async () => {
      const harness = await setup({ scenario: COMBINED_SCENARIO });
      await click(harness, checkboxByName(harness, 'video-ut'));

      expect(announced()).toBe('video-ut: barrierefrei. video ist noch nicht vollständig behoben.');
    });

    it('announces the barrier, not the part, once the last part is resolved', async () => {
      const harness = await setup({ scenario: COMBINED_SCENARIO, query: '?frei=video-ut' });
      await click(harness, checkboxByName(harness, 'video-transkript'));

      expect(announced()).toBe('video: barrierefrei. Noch 5 von 6 Barrieren aktiv.');
    });

    it('announces a part switched back on', async () => {
      const harness = await setup({
        scenario: COMBINED_SCENARIO,
        query: '?frei=video-ut,video-transkript',
      });
      await click(harness, checkboxByName(harness, 'video-ut'));

      expect(announced()).toBe(
        'video-ut: Barriere aktiv. video ist noch nicht vollständig behoben.',
      );
    });
  });

  describe('bulk actions (docs/UX-COPY.md §5.6, §5.7)', () => {
    it('resolves every barrier in the scenario and announces once', async () => {
      const harness = await setup();
      await click(harness, buttonByText(harness, 'Alle Barrieren beheben'));

      expect(checkboxes(harness).every((input) => input.checked)).toBeTrue();
      expect(announced()).toBe('Alle Barrieren behoben. Die Seite ist jetzt barrierefrei.');
    });

    it('activates every barrier again and announces once', async () => {
      const harness = await setup({ query: '?frei=alle' });
      await click(harness, buttonByText(harness, 'Alle Barrieren aktivieren'));

      expect(checkboxes(harness).some((input) => input.checked)).toBeFalse();
      expect(announced()).toBe('Alle 11 Barrieren aktiv.');
    });

    // "Announce once, not per barrier" (docs/SPEC_v1.md slice 5). Reading the
    // live region's text cannot tell eleven announcements from one, because
    // only the last would still be there — this needs the call count.
    it('announces a bulk change once, not once per barrier', async () => {
      const harness = await setup();
      const announce = spyOn(TestBed.inject(Announcer), 'announce').and.callThrough();

      await click(harness, buttonByText(harness, 'Alle Barrieren beheben'));

      expect(announce).toHaveBeenCalledTimes(1);
    });

    it('resolves the parts of a combined barrier too', async () => {
      const harness = await setup({ scenario: COMBINED_SCENARIO });
      await click(harness, buttonByText(harness, 'Alle Barrieren beheben'));

      expect(checkboxes(harness).every((input) => input.checked)).toBeTrue();
      expect(panel(harness).textContent).not.toContain('Teilweise behoben');
    });
  });

  describe('the explanation link (docs/UX-COPY.md §5.6 `panel.explainLink`)', () => {
    it('offers one link per barrier, pointing at that barrier', async () => {
      const harness = await setup();
      const links = Array.from(panel(harness).querySelectorAll<HTMLAnchorElement>('a.explain'));

      expect(links.length).toBe(APPLICATION_PROCESS_SCENARIO.barriers.length);
      expect(links[0].getAttribute('href')).toContain('erklaerung=grafik');
    });

    // Eleven links reading "Was bedeutet das?" would be indistinguishable in
    // a screen reader's link list (SC 2.4.4). The name is composed from the
    // link's own text plus the barrier label, so the visible text stays part
    // of the accessible name (SC 2.5.3).
    it('names each link by its own text plus the barrier label', async () => {
      const harness = await setup();
      const link = panel(harness).querySelector<HTMLAnchorElement>('a.explain')!;
      const [selfId, labelId] = link.getAttribute('aria-labelledby')!.split(' ');

      expect(selfId).toBe(link.id);
      expect(link.textContent!.trim()).toBe('Was bedeutet das?');
      expect(panel(harness).querySelector(`#${labelId}`)!.textContent!.trim()).toBe(
        APPLICATION_PROCESS_SCENARIO.barriers[0].shortTitle,
      );
    });

    it('also offers a link for each part of a combined barrier', async () => {
      const harness = await setup({ scenario: COMBINED_SCENARIO });
      const hrefs = Array.from(panel(harness).querySelectorAll<HTMLAnchorElement>('a.explain')).map(
        (link) => link.getAttribute('href'),
      );

      expect(hrefs.some((href) => href!.includes('erklaerung=video-ut'))).toBeTrue();
      expect(hrefs.some((href) => href!.includes('erklaerung=video-transkript'))).toBeTrue();
    });
  });
});
