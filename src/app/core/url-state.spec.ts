import { BEWERBUNG_BARRIERS, VIDEO_BARRIERS, simpleBarrier } from './testing/barrier-fixtures';
import {
  combinedBarrierPartUrlKeys,
  explanationUrlKeys,
  parseExplainedKey,
  parseResolvedKeys,
  serialiseResolvedKeys,
} from './url-state';

// A scenario that does not know about the 'labels' key at all — stands in
// for "key from another scenario" (docs/TESTING.md §9): the parser is
// scenario-agnostic, so a foreign key and an unknown key are the same case.
const OTHER_SCENARIO_BARRIERS = ['spende', 'countdown'].map(simpleBarrier);

// docs/TESTING.md §9: table-driven parser test for `frei`, including every
// degenerate input named there.
describe('parseResolvedKeys (docs/TESTING.md §9)', () => {
  const table: ReadonlyArray<{
    name: string;
    frei: string | null;
    barriers: typeof BEWERBUNG_BARRIERS;
    expected: string[];
  }> = [
    { name: "'' → default, all active", frei: '', barriers: BEWERBUNG_BARRIERS, expected: [] },
    { name: 'null → default, all active', frei: null, barriers: BEWERBUNG_BARRIERS, expected: [] },
    {
      name: "'alle' → every barrier key",
      frei: 'alle',
      barriers: BEWERBUNG_BARRIERS,
      expected: ['pdf', 'sprache', 'labels', 'tastatur', 'fehler'],
    },
    {
      name: "'labels,fehler' → {labels, fehler}",
      frei: 'labels,fehler',
      barriers: BEWERBUNG_BARRIERS,
      expected: ['labels', 'fehler'],
    },
    {
      name: "'labels,,fehler' → {labels, fehler}, empty segment ignored",
      frei: 'labels,,fehler',
      barriers: BEWERBUNG_BARRIERS,
      expected: ['labels', 'fehler'],
    },
    {
      name: "'LABELS' → {}, case-sensitive, unknown ignored",
      frei: 'LABELS',
      barriers: BEWERBUNG_BARRIERS,
      expected: [],
    },
    {
      name: "'unbekannt,labels' → {labels}, unknown ignored, valid applied",
      frei: 'unbekannt,labels',
      barriers: BEWERBUNG_BARRIERS,
      expected: ['labels'],
    },
    {
      name: "'video' → all parts of the video barrier, parent-key sugar",
      frei: 'video',
      barriers: VIDEO_BARRIERS,
      expected: ['video-ut', 'video-transkript'],
    },
    {
      name: "'labels,labels' → {labels}, duplicate collapses",
      frei: 'labels,labels',
      barriers: BEWERBUNG_BARRIERS,
      expected: ['labels'],
    },
    {
      name: "'%20labels' → {labels}, trimmed",
      frei: '%20labels',
      barriers: BEWERBUNG_BARRIERS,
      expected: ['labels'],
    },
    {
      name: 'key from another scenario → {}, cross-scenario key ignored',
      frei: 'labels',
      barriers: OTHER_SCENARIO_BARRIERS,
      expected: [],
    },
    {
      name: "'a'.repeat(10_000) → {}, no crash, no hang",
      frei: 'a'.repeat(10_000),
      barriers: BEWERBUNG_BARRIERS,
      expected: [],
    },
  ];

  for (const { name, frei, barriers, expected } of table) {
    it(name, () => {
      expect(parseResolvedKeys(frei, barriers)).toEqual(new Set(expected));
    });
  }

  it('ignores an unparseable percent-escape rather than throwing', () => {
    expect(() => parseResolvedKeys('%zzlabels', BEWERBUNG_BARRIERS)).not.toThrow();
    expect(parseResolvedKeys('%zzlabels', BEWERBUNG_BARRIERS)).toEqual(new Set());
  });

  it('treats "alle" as a whole-value sentinel, not a mixable token', () => {
    // Not in the docs/TESTING.md §9 table explicitly, but "alle" is reserved
    // (ARCHITECTURE.md §8) and never appears as a real urlKey, so 'alle,labels'
    // falls through to being an unrecognised segment plus a valid one.
    expect(parseResolvedKeys('alle,labels', BEWERBUNG_BARRIERS)).toEqual(new Set(['labels']));
  });

  it('decodes the "alle" sentinel the same way every ordinary key is decoded', () => {
    // '%61lle' decodes to 'alle' — the sentinel check must not be the one
    // place in this grammar exempt from the decoding every other key gets.
    expect(parseResolvedKeys('%61lle', BEWERBUNG_BARRIERS)).toEqual(
      new Set(['pdf', 'sprache', 'labels', 'tastatur', 'fehler']),
    );
  });

  it('ignores an undefined frei the same as null (queryParamMap.get default)', () => {
    expect(parseResolvedKeys(undefined, BEWERBUNG_BARRIERS)).toEqual(new Set());
  });
});

describe('serialiseResolvedKeys', () => {
  it('serialises the empty set to "" — an absent frei means the default state', () => {
    expect(serialiseResolvedKeys(new Set(), BEWERBUNG_BARRIERS)).toBe('');
  });

  it('serialises every barrier resolved to "alle"', () => {
    const all = new Set(['pdf', 'sprache', 'labels', 'tastatur', 'fehler']);
    expect(serialiseResolvedKeys(all, BEWERBUNG_BARRIERS)).toBe('alle');
  });

  it('serialises a partial subset as a sorted comma list', () => {
    expect(serialiseResolvedKeys(new Set(['fehler', 'labels']), BEWERBUNG_BARRIERS)).toBe(
      'fehler,labels',
    );
  });

  it('drops keys that do not belong to the given scenario', () => {
    expect(serialiseResolvedKeys(new Set(['labels', 'unbekannt']), BEWERBUNG_BARRIERS)).toBe(
      'labels',
    );
  });

  it('serialises a combined barrier by its parts, never the parent sugar key', () => {
    expect(serialiseResolvedKeys(new Set(['video-ut']), VIDEO_BARRIERS)).toBe('video-ut');
  });
});

describe('round-trip property (docs/TESTING.md §9)', () => {
  function powerSet<T>(items: readonly T[]): T[][] {
    const subsets: T[][] = [];
    for (let mask = 0; mask < 2 ** items.length; mask++) {
      subsets.push(items.filter((_, index) => (mask & (1 << index)) !== 0));
    }
    return subsets;
  }

  function roundTrip(subset: string[], barriers: typeof BEWERBUNG_BARRIERS): Set<string> {
    const original = new Set(subset);
    const serialised = serialiseResolvedKeys(original, barriers);
    return new Set(parseResolvedKeys(serialised === '' ? null : serialised, barriers));
  }

  // A representative five-key set, not the full application-process barrier
  // list — that scenario has eleven barriers (docs/PRD.md §6.1), and this
  // fixture stays decoupled from editorial content on purpose (see
  // testing/barrier-fixtures.ts). The round-trip property is independent of how
  // many barriers a scenario has; 2^5 subsets exercise it.
  it('round-trips every subset of a representative barrier set', () => {
    const leafKeys = ['pdf', 'sprache', 'labels', 'tastatur', 'fehler'];
    for (const subset of powerSet(leafKeys)) {
      expect(roundTrip(subset, BEWERBUNG_BARRIERS))
        .withContext(`subset {${subset.join(',')}}`)
        .toEqual(new Set(subset));
    }
  });

  it('round-trips every subset including a combined barrier´s parts', () => {
    const leafKeys = [
      'pdf',
      'sprache',
      'labels',
      'tastatur',
      'fehler',
      'video-ut',
      'video-transkript',
    ];
    for (const subset of powerSet(leafKeys)) {
      expect(roundTrip(subset, VIDEO_BARRIERS))
        .withContext(`subset {${subset.join(',')}}`)
        .toEqual(new Set(subset));
    }
  });
});

describe('parseExplainedKey (docs/ARCHITECTURE.md §8)', () => {
  it('opens the explanation view on a known barrier urlKey', () => {
    expect(parseExplainedKey('pdf', BEWERBUNG_BARRIERS)).toBe('pdf');
  });

  it('opens the explanation view on a combined barrier part', () => {
    expect(parseExplainedKey('video-ut', VIDEO_BARRIERS)).toBe('video-ut');
  });

  it("accepts a combined barrier's own urlKey — its top-level explanation, not sugar here", () => {
    expect(parseExplainedKey('video', VIDEO_BARRIERS)).toBe('video');
  });

  it('falls back to the empty state (undefined) for an unknown key', () => {
    expect(parseExplainedKey('unbekannt', BEWERBUNG_BARRIERS)).toBeUndefined();
  });

  it('falls back to the empty state for a null, undefined, or empty value', () => {
    expect(parseExplainedKey(null, BEWERBUNG_BARRIERS)).toBeUndefined();
    expect(parseExplainedKey(undefined, BEWERBUNG_BARRIERS)).toBeUndefined();
    expect(parseExplainedKey('', BEWERBUNG_BARRIERS)).toBeUndefined();
  });

  it('trims and decodes the value before matching', () => {
    expect(parseExplainedKey('%20pdf', BEWERBUNG_BARRIERS)).toBe('pdf');
  });
});

// Exported so BarrierStateService can share this file's single definition of
// "is this barrier combined" and "what may erklaerung target", rather than
// re-deriving either from barrier.parts itself (docs/CLAUDE.md simplification
// review).
describe('combinedBarrierPartUrlKeys', () => {
  it('returns the part urlKeys for a combined barrier', () => {
    const video = VIDEO_BARRIERS.find((b) => b.urlKey === 'video')!;
    expect(combinedBarrierPartUrlKeys(video)).toEqual(['video-ut', 'video-transkript']);
  });

  it('returns undefined for a simple barrier', () => {
    const pdf = BEWERBUNG_BARRIERS.find((b) => b.urlKey === 'pdf')!;
    expect(combinedBarrierPartUrlKeys(pdf)).toBeUndefined();
  });
});

describe('explanationUrlKeys', () => {
  it('includes a combined barrier´s own key alongside its parts', () => {
    expect(explanationUrlKeys(VIDEO_BARRIERS)).toEqual(
      new Set([
        'pdf',
        'sprache',
        'labels',
        'tastatur',
        'fehler',
        'video',
        'video-ut',
        'video-transkript',
      ]),
    );
  });
});
