// docs/ARCHITECTURE.md §17, docs/TESTING.md §12 (the malformed-query case).
// These run against the real DefaultUrlSerializer rather than a stub: the
// bug being fixed is in what *it* does to an incomplete escape, so a fake
// would test the wrong thing.
import { DefaultUrlSerializer } from '@angular/router';
import { TolerantUrlSerializer, encodeUndecodableTokens } from './tolerant-url-serializer';

const STEP = '/szenario/bewerbung/stellenanzeige';

describe('TolerantUrlSerializer (docs/ARCHITECTURE.md §17)', () => {
  const serializer = new TolerantUrlSerializer();

  // The premise. If Angular ever stops throwing here, this class has no
  // reason to exist any more and this is the test that says so.
  it('exists because the default serialiser throws on an incomplete escape', () => {
    expect(() => new DefaultUrlSerializer().parse(`${STEP}?frei=%E0%A4%A`)).toThrow();
  });

  it('parses a malformed query string instead of throwing', () => {
    const tree = serializer.parse(`${STEP}?frei=%E0%A4%A`);

    expect(tree.toString()).toContain('/szenario/bewerbung/stellenanzeige');
  });

  // The point of the exercise: the page still renders, and the barrier state
  // degrades to "unknown key" — which url-state.ts already ignores, i.e. the
  // default all-barriers-active state.
  it('keeps the path and the well-formed parameters beside the broken one', () => {
    const tree = serializer.parse(`${STEP}?frei=labels&erklaerung=%E0%A4%A`);

    expect(tree.queryParams['frei']).toBe('labels');
    expect(tree.queryParams['erklaerung']).toBe('%E0%A4%A');
  });

  it('leaves a well-formed URL exactly as the default serialiser reads it', () => {
    const url = `${STEP}?frei=labels,pdf&erklaerung=pdf#panel`;

    expect(serializer.parse(url).toString()).toBe(new DefaultUrlSerializer().parse(url).toString());
  });

  // A malformed *path* is not §17's case, but it must not fail differently:
  // it is an address that resolves to nothing, which is the not-found route's
  // job and not a dead navigation's.
  it('parses a malformed path segment, leaving it to the wildcard route', () => {
    const tree = serializer.parse('/szenario/%E0%A4%A');

    expect(tree.toString()).toBeTruthy();
  });
});

describe('encodeUndecodableTokens', () => {
  it('preserves the nonsense as literal text rather than guessing at it', () => {
    expect(decodeURIComponent(encodeUndecodableTokens('%E0%A4%A'))).toBe('%E0%A4%A');
  });

  it('touches nothing in a URL whose tokens all decode', () => {
    const url = '/szenario/bewerbung/stellenanzeige?frei=labels%2Cpdf&erklaerung=pdf#panel';

    expect(encodeUndecodableTokens(url)).toBe(url);
  });

  it('repairs only the broken token, keeping the URL structure intact', () => {
    expect(encodeUndecodableTokens('/a/b?x=%E0%A4%A&y=ok#f')).toBe('/a/b?x=%25E0%25A4%25A&y=ok#f');
  });

  // `+` is a space in a query string, and Angular substitutes it before
  // decoding; a token that only looks broken without that substitution must
  // not be re-encoded, or a legitimate space would turn into a literal '+'.
  it('reads `+` as the space it is', () => {
    expect(encodeUndecodableTokens('/a?x=zwei+worte')).toBe('/a?x=zwei+worte');
  });
});
