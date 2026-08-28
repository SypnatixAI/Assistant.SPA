import { HttpErrorResponse } from '@angular/common/http';
import { AuthError } from '@azure/msal-browser';

import { getAuthenticationErrorMessage } from './authentication-error';

describe('getAuthenticationErrorMessage', () => {
  it('Given_CancelledMicrosoftLogin_When_getAuthenticationErrorMessageIsCalled_Then_CancellationIsExplained', () => {
    // Given
    const error = new AuthError('user_cancelled', 'correlation-id');

    // When
    const message = getAuthenticationErrorMessage(error);

    // Then
    expect(message).toContain('annulée');
  });

  it('Given_RefusedConsent_When_getAuthenticationErrorMessageIsCalled_Then_ConsentIsExplained', () => {
    // Given
    const error = new AuthError('access_denied', 'correlation-id');

    // When
    const message = getAuthenticationErrorMessage(error);

    // Then
    expect(message).toContain('consentement');
  });

  it('Given_InvalidEntraConfiguration_When_getAuthenticationErrorMessageIsCalled_Then_ConfigurationIsExplained', () => {
    // Given
    const error = new AuthError('invalid_client', 'correlation-id');

    // When
    const message = getAuthenticationErrorMessage(error);

    // Then
    expect(message).toContain('mal configurée');
  });

  it('Given_ForbiddenAssistantCoreSession_When_getAuthenticationErrorMessageIsCalled_Then_AuthorizationIsExplained', () => {
    // Given
    const error = new HttpErrorResponse({ status: 403 });

    // When
    const message = getAuthenticationErrorMessage(error);

    // Then
    expect(message).toContain('pas autorisé');
  });
});
