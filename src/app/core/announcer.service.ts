// The frame's single polite live region (docs/ARCHITECTURE.md §12.2). Exactly
// one instance of this service exists (`providedIn: 'root'`), and exactly one
// component — AppShellComponent — renders an element bound to `message()`.
// Everything else that wants to announce something calls `announce()`; it
// never renders its own live region.
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Announcer {
  private readonly _message = signal('');

  readonly message = this._message.asReadonly();

  /**
   * Announces `text` through the frame's live region. Clears the region
   * first: a screen reader only speaks a live region when its content
   * *changes*, so announcing the same text twice in a row (e.g. two
   * `resolveAll()` calls that leave the state unchanged) would otherwise go
   * silent the second time.
   */
  announce(text: string): void {
    this._message.set('');
    queueMicrotask(() => this._message.set(text));
  }
}
