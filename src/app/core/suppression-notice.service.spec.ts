// The seam between a barrier that a system preference has overridden and the
// one place that may say so (docs/UX-COPY.md §5.9, CLAUDE.md rule 9).
//
// What matters here is the pairing. A `urlKey` is unique within its scenario
// and nowhere else, so this service keys on {scenarioPath, urlKey} — the same
// scoping every other lookup in this application uses. The tests below are
// written against the case that makes it real: two scenarios whose contrast
// barriers both, quite legitimately, call themselves `kontrast`
// (docs/PRD.md §6.2 and §6.3).
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SuppressionNoticeService } from './suppression-notice.service';

const CAMPAIGN = 'csr-kampagne';
const PROCUREMENT = 'softwarebeschaffung';
const KONTRAST = 'kontrast';

describe('SuppressionNoticeService', () => {
  let service: SuppressionNoticeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    service = TestBed.inject(SuppressionNoticeService);
  });

  it('starts empty', () => {
    expect(service.all()).toEqual([]);
  });

  it('publishes a note under the scenario and barrier it belongs to', () => {
    service.publish(CAMPAIGN, KONTRAST, 'Farben erzwungen');

    expect(service.all()).toEqual([
      { scenarioPath: CAMPAIGN, urlKey: KONTRAST, note: 'Farben erzwungen' },
    ]);
  });

  it('replaces its own note rather than stacking copies of it', () => {
    service.publish(CAMPAIGN, KONTRAST, 'erste Fassung');
    service.publish(CAMPAIGN, KONTRAST, 'zweite Fassung');

    expect(service.all().length).toBe(1);
    expect(service.all()[0].note).toBe('zweite Fassung');
  });

  it('retracts a note when the publisher passes undefined', () => {
    service.publish(CAMPAIGN, KONTRAST, 'Farben erzwungen');
    service.publish(CAMPAIGN, KONTRAST, undefined);

    expect(service.all()).toEqual([]);
  });

  // The reason the key is a pair. Both scenarios have a contrast barrier and
  // both may call it `kontrast` — ids and urlKeys are scoped by the scenario
  // that declares them (content/csr-campaign.content.ts on `sprache`).
  describe('two scenarios using the same urlKey', () => {
    it('keeps both notes apart', () => {
      service.publish(CAMPAIGN, KONTRAST, 'Kampagne');
      service.publish(PROCUREMENT, KONTRAST, 'Beschaffung');

      expect(service.all()).toEqual([
        { scenarioPath: CAMPAIGN, urlKey: KONTRAST, note: 'Kampagne' },
        { scenarioPath: PROCUREMENT, urlKey: KONTRAST, note: 'Beschaffung' },
      ]);
    });

    // The failure that a bare-urlKey map would produce, and the one that would
    // be hardest to spot: not a wrong note, but a *missing* one. One
    // component's retraction on destroy would clear a note the other component
    // is still responsible for, and the bar would fall silent on a page whose
    // barrier really is being suppressed.
    it('does not let one scenario retract the other scenario as it is destroyed', () => {
      service.publish(CAMPAIGN, KONTRAST, 'Kampagne');
      service.publish(PROCUREMENT, KONTRAST, 'Beschaffung');

      service.publish(PROCUREMENT, KONTRAST, undefined);

      expect(service.all()).toEqual([
        { scenarioPath: CAMPAIGN, urlKey: KONTRAST, note: 'Kampagne' },
      ]);
    });
  });

  // Republishing the identical note must not notify: the only caller is a
  // component effect that runs on every change-detection pass, and a fresh
  // signal value each time would wake the frame for nothing. Asserted on the
  // signal's *identity* rather than on a render count, because that is what
  // Angular compares.
  describe('signal identity', () => {
    it('does not change when the same note is published again', () => {
      service.publish(CAMPAIGN, KONTRAST, 'Farben erzwungen');
      const before = service.all();

      service.publish(CAMPAIGN, KONTRAST, 'Farben erzwungen');

      expect(service.all()).toBe(before);
    });

    it('does not change when an absent note is retracted again', () => {
      const before = service.all();

      service.publish(CAMPAIGN, KONTRAST, undefined);

      expect(service.all()).toBe(before);
    });

    it('does change when the note itself changes', () => {
      service.publish(CAMPAIGN, KONTRAST, 'erste Fassung');
      const before = service.all();

      service.publish(CAMPAIGN, KONTRAST, 'zweite Fassung');

      expect(service.all()).not.toBe(before);
    });
  });
});
