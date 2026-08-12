import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkipLinksComponent } from './skip-links.component';

describe('SkipLinksComponent (docs/UX-COPY.md §5.1)', () => {
  let fixture: ComponentFixture<SkipLinksComponent>;

  function links(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a'));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SkipLinksComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(SkipLinksComponent);
  });

  it('renders only the content skip link when there is no panel on the page', () => {
    fixture.detectChanges();

    const anchors = links();
    expect(anchors.length).toBe(1);
    expect(anchors[0].getAttribute('href')).toBe('#content');
    expect(anchors[0].textContent?.trim()).toBe('Zum Inhalt springen');
  });

  it('renders both links, content first, when the page has a panel', () => {
    fixture.componentRef.setInput('hasPanel', true);
    fixture.detectChanges();

    const anchors = links();
    expect(anchors.length).toBe(2);
    expect(anchors[0].getAttribute('href')).toBe('#content');
    expect(anchors[1].getAttribute('href')).toBe('#panel');
    expect(anchors[1].textContent?.trim()).toBe('Zum Barriere-Panel springen');
  });
});
