import { UrlTree } from '@angular/router';

import { AuthenticationService } from '../services/authentication/authentication.service';
import { TechnicalErrorService } from '../services/errors/technical-error.service';
import { ApplicationNavigationService } from '../services/navigation/application-navigation.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  it('Given_TechnicalFailure_When_canActivateIsCalled_Then_TechnicalErrorPageIsReturned', () => {
    // Given
    const technicalErrorUrl = {} as UrlTree;
    const authenticationService = createAuthenticationService(false, 'error');
    const technicalErrorService = createTechnicalErrorService(true);
    const applicationNavigationService = createNavigationService(
      {} as UrlTree,
      technicalErrorUrl,
    );
    const guard = new AuthGuard(
      authenticationService,
      technicalErrorService,
      applicationNavigationService,
    );

    // When
    const result = guard.canActivate();

    // Then
    expect(result).toBe(technicalErrorUrl);
  });

  it('Given_ForbiddenSession_When_canActivateIsCalled_Then_AccessDeniedPageIsReturned', () => {
    // Given
    const accessDeniedUrl = {} as UrlTree;
    const guard = new AuthGuard(
      createAuthenticationService(false, 'forbidden'),
      createTechnicalErrorService(false),
      createNavigationService({} as UrlTree, {} as UrlTree, accessDeniedUrl),
    );

    // When
    const result = guard.canActivate();

    // Then
    expect(result).toBe(accessDeniedUrl);
  });

  it('Given_ValidSession_When_canActivateIsCalled_Then_AccessIsGranted', () => {
    // Given
    const guard = new AuthGuard(
      createAuthenticationService(true),
      createTechnicalErrorService(false),
      createNavigationService({} as UrlTree, {} as UrlTree),
    );

    // When
    const result = guard.canActivate();

    // Then
    expect(result).toBeTrue();
  });
});

function createAuthenticationService(
  authenticated: boolean,
  status: 'authenticated' | 'unauthenticated' | 'forbidden' | 'error' = authenticated
    ? 'authenticated'
    : 'unauthenticated',
): AuthenticationService {
  return {
    isAuthenticated: () => authenticated,
    status: () => status,
  } as unknown as AuthenticationService;
}

function createTechnicalErrorService(
  active: boolean,
): TechnicalErrorService {
  return {
    hasTechnicalError: () => active,
  } as unknown as TechnicalErrorService;
}

function createNavigationService(
  loginUrl: UrlTree,
  technicalErrorUrl: UrlTree,
  accessDeniedUrl: UrlTree = {} as UrlTree,
): ApplicationNavigationService {
  return {
    createAccessDeniedUrlTree: () => accessDeniedUrl,
    createLoginUrlTree: () => loginUrl,
    createTechnicalErrorUrlTree: () => technicalErrorUrl,
  } as unknown as ApplicationNavigationService;
}
