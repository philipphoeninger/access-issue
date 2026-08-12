// Parse/serialise the `frei` and `erklaerung` query parameters
// (docs/ARCHITECTURE.md §8, ADR-2). Pure functions, scenario-scoped: every
// function takes the scenario's own `Barrier[]` rather than reading a
// registry, so this file has no dependency on Angular or on which scenario
// is "current" — that scoping is the caller's job (core/barrier-state.service.ts).
//
// Coverage note: this file avoids `?.` and `??` throughout, using explicit
// `if` instead — see the comment on ScenarioRegistry's lookup methods
// (core/scenario-registry.service.ts) for why: this project's coverage
// instrumenter does not register optional chaining as a branch, which would
// make the ≥95% branch-coverage gate on this file (docs/TESTING.md §14) a
// no-op.
import type { Barrier } from '../models/domain.model';

/** Reserved `frei` value meaning "every barrier in the scenario resolved" (ARCHITECTURE.md §8). */
export const RESOLVE_ALL_KEY = 'alle';

/**
 * A combined barrier's part urlKeys, or `undefined` for a simple barrier.
 * The single place that decides "is this barrier combined" — every other
 * function in this file and in barrier-state.service.ts goes through this
 * rather than re-checking `barrier.parts` itself, so the two files cannot
 * silently disagree on the definition.
 */
export function combinedBarrierPartUrlKeys(barrier: Barrier): readonly string[] | undefined {
  if (barrier.parts && barrier.parts.length > 0) {
    return barrier.parts.map((part) => part.urlKey);
  }
  return undefined;
}

/**
 * The urlKeys that actually carry independent toggle state: a combined
 * barrier contributes its parts, never its own key (that key is parse-time
 * sugar only, ARCHITECTURE.md §8).
 */
function leafUrlKeys(barriers: readonly Barrier[]): string[] {
  const keys: string[] = [];
  for (const barrier of barriers) {
    const partKeys = combinedBarrierPartUrlKeys(barrier);
    if (partKeys) {
      for (const partKey of partKeys) {
        keys.push(partKey);
      }
    } else {
      keys.push(barrier.urlKey);
    }
  }
  return keys;
}

/** Maps a combined barrier's own urlKey to its parts' urlKeys — the "video" → all parts sugar. */
function parentSugarMap(barriers: readonly Barrier[]): ReadonlyMap<string, readonly string[]> {
  const map = new Map<string, readonly string[]>();
  for (const barrier of barriers) {
    const partKeys = combinedBarrierPartUrlKeys(barrier);
    if (partKeys) {
      map.set(barrier.urlKey, partKeys);
    }
  }
  return map;
}

/**
 * Every urlKey a valid `erklaerung` value may target: barriers (including
 * combined parents) and parts alike. Exported so BarrierStateService can
 * validate a urlKey before writing it to `erklaerung`, the same way `frei`
 * is always filtered through serialiseResolvedKeys before being written.
 */
export function explanationUrlKeys(barriers: readonly Barrier[]): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const barrier of barriers) {
    keys.add(barrier.urlKey);
    const partKeys = combinedBarrierPartUrlKeys(barrier);
    if (partKeys) {
      for (const partKey of partKeys) {
        keys.add(partKey);
      }
    }
  }
  return keys;
}

/**
 * Decodes one comma-segment defensively. A malformed percent-escape must not
 * take down the whole parse (ARCHITECTURE.md §17: malformed input falls back
 * to the default state, it never errors) — an unparseable segment is simply
 * kept as-is, which then fails the valid-key check like any other unknown
 * token.
 */
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function splitKeys(value: string): string[] {
  return value
    .split(',')
    .map((segment) => safeDecode(segment).trim())
    .filter((segment) => segment.length > 0);
}

/**
 * Parses the `frei` query parameter into the set of leaf urlKeys resolved to
 * the accessible variant. Unknown keys, keys from another scenario, and
 * malformed input are all silently ignored — the result degrades to the
 * empty set, i.e. the default all-barriers-active state (ARCHITECTURE.md §8,
 * §17). Never throws.
 */
export function parseResolvedKeys(
  frei: string | null | undefined,
  barriers: readonly Barrier[],
): ReadonlySet<string> {
  const validLeafKeys = new Set(leafUrlKeys(barriers));

  if (!frei) {
    return new Set();
  }
  // Decoded and trimmed the same way every ordinary key is (splitKeys does
  // this per-segment below) — the sentinel must not be the one value in this
  // grammar exempt from that handling (e.g. a percent-encoded 'alle').
  if (safeDecode(frei).trim() === RESOLVE_ALL_KEY) {
    return new Set(validLeafKeys);
  }

  const sugar = parentSugarMap(barriers);
  const resolved = new Set<string>();
  for (const key of splitKeys(frei)) {
    if (validLeafKeys.has(key)) {
      resolved.add(key);
      continue;
    }
    const partKeys = sugar.get(key);
    if (partKeys) {
      for (const partKey of partKeys) {
        resolved.add(partKey);
      }
    }
  }
  return resolved;
}

/**
 * Serialises a set of resolved leaf urlKeys back into the `frei` grammar.
 * Returns `''` when nothing is resolved — callers omit the query param
 * entirely in that case, since an absent `frei` already means "no barrier
 * resolved" (ARCHITECTURE.md §8). Keys not recognised for this scenario are
 * dropped rather than round-tripped verbatim, so a stale or foreign key can
 * never leak into a freshly written URL.
 */
export function serialiseResolvedKeys(
  resolvedKeys: ReadonlySet<string>,
  barriers: readonly Barrier[],
): string {
  const validLeafKeys = leafUrlKeys(barriers);
  const resolvedValid = validLeafKeys.filter((key) => resolvedKeys.has(key));

  if (resolvedValid.length === 0) {
    return '';
  }
  if (resolvedValid.length === validLeafKeys.length) {
    return RESOLVE_ALL_KEY;
  }
  return [...resolvedValid].sort().join(',');
}

/**
 * Parses the `erklaerung` query parameter. Unlike `frei`, a combined
 * barrier's own urlKey is itself a valid target (its top-level explanation),
 * not just sugar for its parts. An unknown or absent value is treated
 * identically: the explanation view's empty state (ARCHITECTURE.md §8, §17).
 */
export function parseExplainedKey(
  erklaerung: string | null | undefined,
  barriers: readonly Barrier[],
): string | undefined {
  if (!erklaerung) {
    return undefined;
  }
  const validKeys = explanationUrlKeys(barriers);
  const key = safeDecode(erklaerung).trim();
  if (validKeys.has(key)) {
    return key;
  }
  return undefined;
}
