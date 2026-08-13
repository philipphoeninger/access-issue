// docs/UX-COPY.md §5.10, docs/ARCHITECTURE.md §17 "Unknown scenario path".
// The wildcard route's page: what happened, why it might have happened, and
// one way onwards. No error code, no apology, no "Ups".
//
// It renders a component rather than redirecting home, which is the whole
// point of the slice: a redirect swallows the address the user actually
// followed, so a mistyped or outdated link from a module slide silently
// becomes the home page and nobody ever learns the link is broken. Staying
// on the URL keeps it visible and copyable for whoever has to fix the slide.
//
// Focus and document title are not this component's business: FocusManager
// (core/focus-manager.service.ts) focuses the `h1` of whatever route was just
// activated and titles the page from it, so this page inherits both by having
// exactly one `h1` like every other route.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.scss',
})
export class NotFoundPageComponent {}
