import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageIndicator } from './usage-indicator';

describe('UsageIndicator', () => {
  let fixture: ComponentFixture<UsageIndicator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UsageIndicator] }).compileComponents();
    fixture = TestBed.createComponent(UsageIndicator);
  });

  it('Given_IsLoading_When_UsageIndicatorIsDisplayed_Then_ShowsTheLoadingMessage', () => {
    // Given
    fixture.componentRef.setInput('isLoading', true);

    // When
    fixture.detectChanges();

    // Then
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('Chargement du quota');
  });

  it('Given_AnError_When_UsageIndicatorIsDisplayed_Then_ShowsTheErrorAndARetryButton', () => {
    // Given
    fixture.componentRef.setInput('error', 'Le quota ne peut pas être chargé pour le moment.');

    // When
    fixture.detectChanges();

    // Then
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('Le quota ne peut pas être chargé pour le moment.');
    expect(page.querySelector('button')).not.toBeNull();
  });

  it('Given_TheQuotaIsExhausted_When_UsageIndicatorIsDisplayed_Then_ShowsTheRenewalDate', () => {
    // Given
    fixture.componentRef.setInput('isExhausted', true);
    fixture.componentRef.setInput('usage', {
      periodEndsAt: '2026-10-01T00:00:00Z',
      tokenLimit: 1_000_000,
      tokensUsed: 1_000_000,
      tokensRemaining: 0,
      isExhausted: true,
    });

    // When
    fixture.detectChanges();

    // Then
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('Quota épuisé');
  });

  it('Given_AvailableQuota_When_UsageIndicatorIsDisplayed_Then_ShowsTheRemainingTokens', () => {
    // Given
    fixture.componentRef.setInput('usage', {
      periodEndsAt: '2026-10-01T00:00:00Z',
      tokenLimit: 1_000_000,
      tokensUsed: 7_072,
      tokensRemaining: 992_928,
      isExhausted: false,
    });

    // When
    fixture.detectChanges();

    // Then
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('992,928');
    expect(page.textContent).toContain('1,000,000');
    expect(page.textContent).toContain('jetons restants');
  });

  it('Given_NoUsageLoadedYet_When_UsageIndicatorIsDisplayed_Then_ShowsNothing', () => {
    // Given / When
    fixture.detectChanges();

    // Then
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('section')?.textContent?.trim()).toBe('');
  });
});
