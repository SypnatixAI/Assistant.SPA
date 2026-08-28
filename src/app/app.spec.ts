import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  it('Given_ApplicationStarts_When_AppIsCreated_Then_RouterOutletIsRendered', async () => {
    // Given
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();

    // When
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    // Then
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
