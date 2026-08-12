import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisuallyHidden } from './visually-hidden.directive';

@Component({
  imports: [VisuallyHidden],
  template: `<span appVisuallyHidden>Nur für Screenreader</span>`,
})
class HostComponent {}

describe('VisuallyHidden (docs/ARCHITECTURE.md §12.2)', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('clips the element visually while keeping its text in the DOM', () => {
    const span: HTMLElement = fixture.nativeElement.querySelector('span');

    expect(span.textContent).toBe('Nur für Screenreader');
    expect(span.style.position).toBe('absolute');
    expect(span.style.width).toBe('1px');
    expect(span.style.height).toBe('1px');
    expect(span.style.overflow).toBe('hidden');
    expect(span.style.clip).toContain('rect(');
  });
});
