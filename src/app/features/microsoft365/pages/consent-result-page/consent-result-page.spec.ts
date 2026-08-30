import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { ConsentResultPage } from './consent-result-page';

describe('ConsentResultPage', () => {
  it('Given_ACompletedConsent_When_ConsentResultPageIsDisplayed_Then_SuccessAndNextStepAreVisible', async () => {
    // Given
    const fixture = await createFixture('success');

    // When
    fixture.detectChanges();

    // Then
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('h1')?.textContent).toContain('maintenant connecté');
    expect(page.textContent).toContain('Choisir un site SharePoint');
    expect(page.querySelector('.consent-result--error')).toBeNull();
  });

  it('Given_AFailedConsent_When_ConsentResultPageIsDisplayed_Then_RecoveryGuidanceIsVisible', async () => {
    // Given
    const fixture = await createFixture('error');

    // When
    fixture.detectChanges();

    // Then
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('h1')?.textContent).toContain('pas pu être connecté');
    expect(page.textContent).toContain('Vérifier le compte administrateur');
    expect(page.querySelector('.consent-result--error')).not.toBeNull();
  });
});

async function createFixture(
  consentOutcome: 'success' | 'error',
): Promise<ComponentFixture<ConsentResultPage>> {
  await TestBed.configureTestingModule({
    imports: [ConsentResultPage],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { consentOutcome } } },
      },
    ],
  }).compileComponents();

  return TestBed.createComponent(ConsentResultPage);
}
