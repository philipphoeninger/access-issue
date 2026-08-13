// docs/ARCHITECTURE.md §17, "Malformed query string → falls back to the
// default state". core/url-state.ts was written to that contract and decodes
// every segment defensively — but it never got the chance: Angular's
// DefaultUrlSerializer decodes the URL itself, before any route is matched,
// and `decodeURIComponent` throws on an incomplete escape such as
// `?frei=%E0%A4%A`. The navigation then fails as a whole, and what the user
// sees is not "the page with all barriers active" but the home page, with
// the address silently rewritten to `/`. A deep link from a module slide
// that picked up one bad character loses its scenario entirely, and nothing
// says so.
//
// This serialiser parses normally and only reacts once the default parse has
// actually thrown: the malformed pieces are re-encoded to their literal
// selves, and everything else is left exactly as it was. `?frei=labels&
// erklaerung=%E0%A4%A` therefore still resolves the labels barrier; only the
// unreadable value degrades, into a token url-state.ts then rejects like any
// other unknown key. That is the fallback §17 asks for: the page renders, the
// valid half of the URL applies, and no error page appears.
//
// Deliberately not a general "clean up the URL" layer: a URL the default
// serialiser understands is passed through untouched, so this cannot change
// the meaning of any well-formed address.
//
// One visible consequence: the router re-serialises what it parsed, so the
// address bar ends up holding the repaired form (`%25E0%25A4%25A`). That is
// the right way round — the URL a user can now copy and share is one that
// says exactly what the application understood, rather than one that breaks
// again on the next reader.
import { DefaultUrlSerializer, type UrlTree } from '@angular/router';

/**
 * The characters that structure a URL for `DefaultUrlSerializer`: path
 * separator, query and fragment introducers, parameter separators, and the
 * matrix-parameter `;`. Everything between two of them is one encoded token,
 * which is the unit that can be individually malformed — and therefore the
 * unit repaired below. Captured by `split`, so joining the parts back
 * together reproduces the URL exactly.
 */
const URL_DELIMITERS = /([/?&=#;])/;

/** Whether a token survives the decoding Angular is about to do to it. */
function isDecodable(token: string): boolean {
  try {
    // `+` means space in a query string and is turned into `%20` before
    // decoding (Angular does the same); testing the raw token without that
    // substitution would be the stricter check, not the truer one.
    decodeURIComponent(token.replace(/\+/g, '%20'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Percent-encodes exactly the tokens that cannot be decoded, leaving the
 * URL's structure and every well-formed token untouched. `%E0%A4%A` becomes
 * `%25E0%25A4%25A`, which decodes back to the literal text `%E0%A4%A` — the
 * nonsense is preserved as nonsense rather than guessed at, and the layers
 * above get a string they can reject on their own terms.
 */
export function encodeUndecodableTokens(url: string): string {
  return url
    .split(URL_DELIMITERS)
    .map((token) => (isDecodable(token) ? token : encodeURIComponent(token)))
    .join('');
}

export class TolerantUrlSerializer extends DefaultUrlSerializer {
  override parse(url: string): UrlTree {
    try {
      return super.parse(url);
    } catch {
      return super.parse(encodeUndecodableTokens(url));
    }
  }
}
