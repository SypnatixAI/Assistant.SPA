import { ActivatedRouteSnapshot, convertToParamMap } from '@angular/router';

import { TechnicalErrorService } from '../services/errors/technical-error.service';
import { ApplicationNavigationService } from '../services/navigation/application-navigation.service';
import { TechnicalErrorGuard } from './technical-error.guard';

describe('TechnicalErrorGuard', () => {
  let hasTechnicalError: boolean;
  let createReturnUrlTree: jasmine.Spy;
  let guard: TechnicalErrorGuard;

  function snapshot(returnUrl?: string): ActivatedRouteSnapshot {
    return {
      queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}),
    } as ActivatedRouteSnapshot;
  }

  beforeEach(() => {
    hasTechnicalError = false;
    createReturnUrlTree = jasmine.createSpy('createReturnUrlTree').and.returnValue('url-tree');
    guard = new TechnicalErrorGuard(
      { hasTechnicalError: () => hasTechnicalError } as unknown as TechnicalErrorService,
      { createReturnUrlTree } as unknown as ApplicationNavigationService,
    );
  });

  it('Given_AnActiveTechnicalError_When_canActivate_Then_ThePageIsDisplayed', () => {
    // Given
    hasTechnicalError = true;

    // When
    const result = guard.canActivate(snapshot('/app/chat'));

    // Then
    expect(result).toBeTrue();
    expect(createReturnUrlTree).not.toHaveBeenCalled();
  });

  it('Given_ARefreshWithoutActiveError_When_canActivate_Then_TheFailedDestinationIsResolved', () => {
    // Given
    hasTechnicalError = false;

    // When
    const result = guard.canActivate(snapshot('/app/settings/microsoft365'));

    // Then
    expect(createReturnUrlTree).toHaveBeenCalledOnceWith('/app/settings/microsoft365');
    expect(result).toBe('url-tree' as never);
  });

  it('Given_ARefreshWithoutReturnUrl_When_canActivate_Then_TheResolutionFallsBackOnItsOwn', () => {
    // Given
    hasTechnicalError = false;

    // When
    guard.canActivate(snapshot());

    // Then
    expect(createReturnUrlTree).toHaveBeenCalledOnceWith(null);
  });
});
