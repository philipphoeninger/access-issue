import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SkipLinksComponent } from './skip-links.component';

describe('SkipLinksComponent (docs/UX-COPY.md §5.1)', () => {
  let fixture: ComponentFixture<SkipLinksComponent>;

  function links(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a'));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SkipLinksComponent],
      // The links resolve their href through FragmentLink, which needs the
      // real Router and Location — the bare fragment they used to carry
      // resolved against `<base href>` and left the page (see the directive).
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    fixture = TestBed.createComponent(SkipLinksComponent);
  });

  it('renders only the content skip link when there is no panel on the page', () => {
    fixture.detectChanges();

    const anchors = links();
    expect(anchors.length).toBe(1);
    expect(anchors[0].getAttribute('href')).toMatch(/#content$/);
    expect(anchors[0].textContent?.trim()).toBe('Zum Inhalt springen');
  });

  it('renders both links, content first, when the page has a panel', () => {
    fixture.componentRef.setInput('hasPanel', true);
    fixture.detectChanges();

    const anchors = links();
    expect(anchors.length).toBe(2);
    expect(anchors[0].getAttribute('href')).toMatch(/#content$/);
    expect(anchors[1].getAttribute('href')).toMatch(/#panel$/);
    expect(anchors[1].textContent?.trim()).toBe('Zum Barriere-Panel springen');
  });
});
