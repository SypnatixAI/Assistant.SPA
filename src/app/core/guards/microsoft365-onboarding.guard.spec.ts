import { UrlTree } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';

import { Microsoft365ApiService } from '../services/api/microsoft365-api.service';
import { ApplicationNavigationService } from '../services/navigation/application-navigation.service';
import { Microsoft365OnboardingGuard } from './microsoft365-onboarding.guard';

describe('Microsoft365OnboardingGuard', () => {
  it('Given_CompletedOnboarding_When_canActivateIsCalled_Then_ChatAccessIsGranted', async () => {
    // Given
    const guard = createGuard(true);

    // When
    const result = await firstValueFrom(guard.canActivate());

    // Then
    expect(result).toBeTrue();
  });

  it('Given_IncompleteOnboarding_When_canActivateIsCalled_Then_OnboardingPageIsReturned', async () => {
    // Given
    const onboardingUrl = {} as UrlTree;
    const guard = createGuard(false, onboardingUrl);

    // When
    const result = await firstValueFrom(guard.canActivate());

    // Then
    expect(result).toBe(onboardingUrl);
  });

  it('Given_StatusFailure_When_canActivateIsCalled_Then_TechnicalErrorPageIsReturned', async () => {
    // Given
    const technicalErrorUrl = {} as UrlTree;
    const apiService = {
      getOnboardingStatus: () => throwError(() => new Error('Unavailable')),
    } as unknown as Microsoft365ApiService;
    const navigationService = {
      createOnboardingUrlTree: () => ({} as UrlTree),
      createTechnicalErrorUrlTree: () => technicalErrorUrl,
    } as unknown as ApplicationNavigationService;
    const guard = new Microsoft365OnboardingGuard(apiService, navigationService);

    // When
    const result = await firstValueFrom(guard.canActivate());

    // Then
    expect(result).toBe(technicalErrorUrl);
  });
});

function createGuard(
  isComplete: boolean,
  onboardingUrl: UrlTree = {} as UrlTree,
): Microsoft365OnboardingGuard {
  const apiService = {
    getOnboardingStatus: () => of({ isComplete }),
  } as unknown as Microsoft365ApiService;
  const navigationService = {
    createOnboardingUrlTree: () => onboardingUrl,
    createTechnicalErrorUrlTree: () => ({} as UrlTree),
  } as unknown as ApplicationNavigationService;
  return new Microsoft365OnboardingGuard(apiService, navigationService);
}
