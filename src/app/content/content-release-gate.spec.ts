import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScenarioRegistry } from '../core/scenario-registry.service';
import { isContentReleaseGateEnabled } from './release-gate';

// Release gate, not a merge gate (docs/SPEC_v1.md §4.1). WERTE.IT has not yet
// delivered reviewed explanation prose for any barrier, so every barrier is
// still `contentStatus: 'placeholder'` — this assertion is EXPECTED to fail
// once enabled, and must keep failing until real content lands.
//
// Plain `npm test` leaves this pending, which is why it does not block
// everyday merges. Run `CONTENT_RELEASE_GATE=1 npm test` before a release to
// enable it for real.
describe('content release gate (docs/SPEC_v1.md §4.1)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('has no barrier or barrier part left as contentStatus "placeholder"', () => {
    if (!isContentReleaseGateEnabled()) {
      pending('release gate disabled — run with CONTENT_RELEASE_GATE=1 to enable');
    }

    const registry = TestBed.inject(ScenarioRegistry);
    const placeholders = registry.getAll().flatMap((scenario) =>
      scenario.barriers.flatMap((barrier) => {
        const found: string[] = [];
        if (barrier.contentStatus === 'placeholder') {
          found.push(`${scenario.path}/${barrier.urlKey}`);
        }
        for (const part of barrier.parts ?? []) {
          if (part.contentStatus === 'placeholder') {
            found.push(`${scenario.path}/${barrier.urlKey}/${part.urlKey}`);
          }
        }
        return found;
      }),
    );

    expect(placeholders).toEqual([]);
  });
});
