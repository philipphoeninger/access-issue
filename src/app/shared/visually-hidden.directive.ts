// Standard clip-rect pattern, one implementation, no ad-hoc copies
// (docs/ARCHITECTURE.md §12.2). Content stays in the accessibility tree and
// readable by assistive technology, but is not visually rendered — used for
// text that only a screen reader needs, such as the frame's live region.
import { Directive } from '@angular/core';

@Directive({
  selector: '[appVisuallyHidden]',
  host: {
    style: `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `,
  },
})
export class VisuallyHidden {}
