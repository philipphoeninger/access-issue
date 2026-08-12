import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';

// ARCHITECTURE.md §20 open spike: verify Material 20 behaves under
// provideZonelessChangeDetection() before committing to it for the whole application.
// This is the recorded evidence for the "Material 20 misbehaves under zoneless change
// detection" risk in SPEC_v1.md §8 — keep it green, it is the regression test for that
// risk, not a demo component.
@Component({
  selector: 'app-zoneless-material-check',
  imports: [MatButtonModule],
  template: `<button mat-button (click)="increment()">{{ count() }}</button>`,
})
class ZonelessMaterialCheckComponent {
  readonly count = signal(0);

  increment(): void {
    this.count.set(this.count() + 1);
  }
}

describe('Zoneless change detection with Angular Material', () => {
  let fixture: ComponentFixture<ZonelessMaterialCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonelessMaterialCheckComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ZonelessMaterialCheckComponent);
    fixture.autoDetectChanges();
  });

  it('reflects a signal update triggered by a mat-button click, without zone.js', async () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.textContent?.trim()).toBe('0');

    button.click();
    await fixture.whenStable();

    expect(button.textContent?.trim()).toBe('1');
  });
});
