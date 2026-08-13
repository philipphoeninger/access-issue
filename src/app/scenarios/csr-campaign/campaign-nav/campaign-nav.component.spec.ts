// Strukturprüfungen für die Barriere `navigation` (docs/TESTING.md §6,
// docs/UX-COPY.md §9.1): Was fehlen soll, fehlt, und was da sein soll, ist da —
// in beide Richtungen, denn eine Barriere, die sich nicht abschalten lässt, ist
// keine Demonstration.
//
// Die Barriere ist `automatedDetection: 'manual'` — axe sieht in einem `<div>`
// mit Klick-Handler gewöhnlichen Text. Diese Datei und die Tastaturprüfungen in
// e2e/csr-campaign.spec.ts sind ihre gesamte automatisierte Abdeckung: hier die
// Auszeichnung, dort das Verhalten unter echten Tastenereignissen.
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { CAMPAIGN_NAV_ITEMS, CampaignNavComponent } from './campaign-nav.component';

/**
 * Der Query-Parameter der laufenden Aufstellung. Herausgezogen, damit ein Test
 * eine Umschaltung im Panel nachstellen kann, ohne die Komponente neu zu
 * erzeugen — genau darin liegt der Unterschied, den `expanded` überleben
 * könnte.
 */
let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

/** Zustand ist ausschließlich der Query-Parameter (docs/ARCHITECTURE.md §8). */
function setup(frei?: string): ComponentFixture<CampaignNavComponent> {
  TestBed.resetTestingModule();
  queryParams = new BehaviorSubject(convertToParamMap(frei === undefined ? {} : { frei }));
  TestBed.configureTestingModule({
    imports: [CampaignNavComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { queryParamMap: queryParams } },
    ],
  });

  const fixture = TestBed.createComponent(CampaignNavComponent);
  fixture.detectChanges();
  return fixture;
}

/** Stellt eine Umschaltung im Barriere-Panel nach. */
function setBarrierState(frei?: string): void {
  queryParams.next(convertToParamMap(frei === undefined ? {} : { frei }));
}

function element(fixture: ComponentFixture<CampaignNavComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function itemLabels(fixture: ComponentFixture<CampaignNavComponent>): string[] {
  return Array.from(element(fixture).querySelectorAll('.nav-item'), (item) =>
    (item.textContent ?? '').trim(),
  );
}

const LABELS = ['Die Aktion', 'Unser Ziel', 'Stimmen', 'Mitmachen', 'Veranstaltung'];

describe('CampaignNavComponent (docs/SPEC_v2.md Slice 14)', () => {
  // docs/UX-COPY.md §9.1: dieselben fünf Ziele in beiden Zuständen. Die
  // Barriere ändert die Auszeichnung, nicht den Inhalt — das ist der
  // Unterschied zwischen Muster B und Muster A (docs/ARCHITECTURE.md §11), und
  // er ist hier nachprüfbar statt nur behauptet.
  it('offers the same five destinations in both states (docs/UX-COPY.md §9.1)', () => {
    expect(itemLabels(setup())).toEqual(LABELS);
    expect(itemLabels(setup('navigation'))).toEqual(LABELS);
    expect(CAMPAIGN_NAV_ITEMS.map((item) => item.label)).toEqual(LABELS);
  });

  describe('active (docs/UX-COPY.md §9.1)', () => {
    it('is a div construct: no nav, no links, no button', () => {
      const nav = element(setup());

      expect(nav.querySelector('nav')).toBeNull();
      expect(nav.querySelectorAll('a').length).toBe(0);
      expect(nav.querySelectorAll('button').length).toBe(0);
      expect(nav.querySelectorAll('.nav-item').length).toBe(5);
    });

    // Der Kern der Barriere: kein Element im Konstrukt kann den Fokus
    // erhalten. Deshalb ist auch kein Fokusring zu sehen — und deshalb ist
    // CLAUDE.md Regel 8 nicht verletzt: unterdrückt wird nichts, es gibt
    // schlicht nichts zu unterdrücken.
    it('contains nothing focusable', () => {
      const focusable = element(setup()).querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex], [contenteditable]',
      );
      expect(focusable.length).toBe(0);
    });

    // Ausgelassen, nicht abgefangen (CLAUDE.md Regel 6): keine Rolle, die eine
    // Bedienbarkeit behauptet, die es nicht gibt. `role="button"` wäre ein
    // zweiter Defekt über dem erklärten — angesagt als Schaltfläche, die sich
    // dann nicht auslösen lässt.
    it('claims no role it cannot honour', () => {
      const withRole = element(setup()).querySelectorAll('[role]');
      expect(withRole.length).toBe(0);
    });

    it('has no aria-expanded, because nothing here can be operated', () => {
      expect(element(setup()).querySelectorAll('[aria-expanded]').length).toBe(0);
    });
  });

  describe('resolved', () => {
    it('is a real nav with a label and real links', () => {
      const nav = element(setup('navigation')).querySelector('nav')!;

      expect(nav).not.toBeNull();
      expect(nav.getAttribute('aria-label')).toBe('Bereiche dieser Seite');

      const links = Array.from(nav.querySelectorAll('a'));
      expect(links.length).toBe(5);
      links.forEach((link, index) => {
        // appFragmentLink schreibt den aktuellen Pfad vor das Fragment, damit
        // der <base href> den Sprung nicht in einen Seitenwechsel verwandelt
        // (shared/fragment-link.directive.ts).
        expect(link.getAttribute('href')).toMatch(
          new RegExp(`#${CAMPAIGN_NAV_ITEMS[index].anchorId}$`),
        );
      });
    });

    it('starts collapsed, with the menu hidden and announced as collapsed', () => {
      const nav = element(setup('navigation'));
      const trigger = nav.querySelector('button')!;

      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-controls')).toBe('sim-nav-menu');
      expect(nav.querySelector('#sim-nav-menu')!.hasAttribute('hidden')).toBeTrue();
    });

    // docs/UX-COPY.md §9.1: „das Aufklappmenü öffnet auch bei Fokus und
    // `Enter`". Ein Klick auf die Schaltfläche ist das, was `Enter` auf einer
    // echten Schaltfläche auslöst — die Tastenprüfung mit echten Ereignissen
    // steht in e2e/csr-campaign.spec.ts.
    it('opens on the trigger and reports it in aria-expanded', async () => {
      const fixture = setup('navigation');
      const trigger = element(fixture).querySelector('button')!;

      trigger.click();
      await fixture.whenStable();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(element(fixture).querySelector('#sim-nav-menu')!.hasAttribute('hidden')).toBeFalse();
    });

    it('opens when focus enters it', async () => {
      const fixture = setup('navigation');
      const nav = element(fixture).querySelector('nav')!;

      nav.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await fixture.whenStable();

      expect(element(fixture).querySelector('button')!.getAttribute('aria-expanded')).toBe('true');
    });

    // Ohne die Prüfung auf `relatedTarget` fiele das Menü beim Weitertabben
    // von der Schaltfläche zum ersten Link in sich zusammen, und der Fokus
    // stünde auf einem Element, das es nicht mehr gibt.
    it('stays open while focus moves within it, and closes when focus leaves', async () => {
      const fixture = setup('navigation');
      const nav = element(fixture).querySelector('nav')!;
      const firstLink = nav.querySelector('a')!;

      nav.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await fixture.whenStable();

      nav.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: firstLink }));
      await fixture.whenStable();
      expect(nav.querySelector('#sim-nav-menu')!.hasAttribute('hidden')).toBeFalse();

      nav.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
      await fixture.whenStable();
      expect(nav.querySelector('#sim-nav-menu')!.hasAttribute('hidden')).toBeTrue();
    });

    // Der Fokus darf ein Menü offen halten, das der Zeiger verlassen hat.
    // Andernfalls verbirgt eine reine Zeigerbewegung das Element, auf dem
    // jemand gerade mit der Tastatur steht: Der Fokus bliebe auf einem
    // unsichtbaren Link, und der nächste `Tab` spränge an den Anfang des
    // Dokuments. Das ist der Fund, der diesen Test hat entstehen lassen.
    it('keeps the menu open when the pointer leaves while focus is inside it', async () => {
      const fixture = setup('navigation');
      const nav = element(fixture).querySelector('nav')!;
      const menu = nav.querySelector('#sim-nav-menu')!;

      nav.querySelector('button')!.click();
      await fixture.whenStable();

      const firstLink: HTMLAnchorElement = nav.querySelector('a')!;
      firstLink.focus();

      nav.dispatchEvent(new MouseEvent('mouseleave'));
      await fixture.whenStable();

      expect(menu.hasAttribute('hidden')).toBeFalse();
      expect(document.activeElement).toBe(firstLink);
    });

    it('closes on the pointer leaving when focus is elsewhere', async () => {
      const fixture = setup('navigation');
      const nav = element(fixture).querySelector('nav')!;

      nav.querySelector('button')!.click();
      await fixture.whenStable();
      nav.querySelector('button')!.blur();

      nav.dispatchEvent(new MouseEvent('mouseleave'));
      await fixture.whenStable();

      expect(nav.querySelector('#sim-nav-menu')!.hasAttribute('hidden')).toBeTrue();
    });

    // Die Barriere umzuschalten tauscht den Zweig, zerstört die Komponente
    // aber nicht. Ohne Rücksetzen stünde ein einmal geöffnetes Menü nach
    // Aus- und Wiedereinschalten unaufgefordert offen — mitten in einer
    // Vorführung ein Aufklappmenü, das sich selbst öffnet.
    it('does not carry an open menu across a barrier toggle', async () => {
      const fixture = setup('navigation');

      element(fixture).querySelector('button')!.click();
      await fixture.whenStable();
      expect(element(fixture).querySelector('#sim-nav-menu')!.hasAttribute('hidden')).toBeFalse();

      setBarrierState(undefined);
      await fixture.whenStable();
      expect(element(fixture).querySelector('nav')).toBeNull();

      setBarrierState('navigation');
      await fixture.whenStable();
      expect(element(fixture).querySelector('#sim-nav-menu')!.hasAttribute('hidden')).toBeTrue();
      expect(element(fixture).querySelector('button')!.getAttribute('aria-expanded')).toBe('false');
    });
  });

  // CLAUDE.md Regel 2 — eine doppelte Id über die Grenze hinweg bräche `for`
  // und `aria-labelledby` im Panel.
  it('prefixes every id with sim-', () => {
    for (const frei of [undefined, 'navigation']) {
      const ids = Array.from(element(setup(frei)).querySelectorAll('[id]'), (node) => node.id);
      expect(ids.filter((id) => !id.startsWith('sim-'))).toEqual([]);
    }
  });
});
