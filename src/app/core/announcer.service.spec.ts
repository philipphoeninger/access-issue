import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Announcer } from './announcer.service';

describe('Announcer (docs/ARCHITECTURE.md §12.2)', () => {
  let service: Announcer;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    service = TestBed.inject(Announcer);
  });

  it('starts empty', () => {
    expect(service.message()).toBe('');
  });

  it('exposes an announced message', async () => {
    service.announce('Barrierefrei.');
    await Promise.resolve();
    expect(service.message()).toBe('Barrierefrei.');
  });

  it('clears the region before re-announcing the same text, so a screen reader speaks it again', async () => {
    service.announce('Alle Barrieren aktiv.');
    await Promise.resolve();
    expect(service.message()).toBe('Alle Barrieren aktiv.');

    service.announce('Alle Barrieren aktiv.');
    // The synchronous clear happens immediately, before the microtask resets the text.
    expect(service.message()).toBe('');
    await Promise.resolve();
    expect(service.message()).toBe('Alle Barrieren aktiv.');
  });

  it('the latest announcement wins when two are made in quick succession', async () => {
    service.announce('Erste Ansage.');
    service.announce('Zweite Ansage.');
    await Promise.resolve();
    expect(service.message()).toBe('Zweite Ansage.');
  });
});
