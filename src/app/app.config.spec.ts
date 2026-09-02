import { ProviderToken, Type } from '@angular/core';
import { MSAL_INSTANCE } from '@azure/msal-angular';

import { createAppConfig } from './app.config';
import {
  AuthenticationMode,
  LaunchMode,
  PublicAppConfig,
} from './core/config/public-app-config';
import { AUTHENTICATION_PROVIDER } from './core/services/authentication/authentication-provider';
import { LocalJwtAuthenticationProvider } from './core/services/authentication/local-jwt-authentication.provider';
import { MicrosoftEntraAuthenticationProvider } from './core/services/authentication/microsoft-entra-authentication.provider';

describe('createAppConfig', () => {
  it('Given_LocalLaunchMode_When_createAppConfigIsCalled_Then_OnlyMockAuthenticationIsRegistered', () => {
    // Given
    const publicAppConfig = createPublicAppConfig(AuthenticationMode.LocalJwt, LaunchMode.Dev);

    // When
    const result = createAppConfig(publicAppConfig);

    // Then
    expect(getExistingProvider(result.providers, AUTHENTICATION_PROVIDER)).toBe(
      LocalJwtAuthenticationProvider,
    );
    expect(hasProvider(result.providers, MSAL_INSTANCE)).toBeFalse();
  });

  it('Given_CertificationLaunchMode_When_createAppConfigIsCalled_Then_OnlyMicrosoftAuthenticationIsRegistered', () => {
    // Given
    const publicAppConfig = createPublicAppConfig(
      AuthenticationMode.MicrosoftEntra,
      LaunchMode.Certification,
    );

    // When
    const result = createAppConfig(publicAppConfig);

    // Then
    expect(getExistingProvider(result.providers, AUTHENTICATION_PROVIDER)).toBe(
      MicrosoftEntraAuthenticationProvider,
    );
    expect(hasProvider(result.providers, MSAL_INSTANCE)).toBeTrue();
  });
});

function createPublicAppConfig(
  authenticationMode: AuthenticationMode,
  launchMode: LaunchMode,
): PublicAppConfig {
  return {
    apiBaseUrl: '/',
    authenticationMode,
    authenticationUrl: '/local-auth/token',
    entraAuthority: 'https://login.microsoftonline.com/organizations',
    entraClientId: 'spa-client-id',
    entraScope: 'api://api-client-id/access_as_user',
    launchMode,
  };
}

function getExistingProvider(
  providers: readonly unknown[] | undefined,
  token: ProviderToken<unknown>,
): Type<unknown> | undefined {
  const provider = providers?.find(
    (candidate): candidate is { provide: ProviderToken<unknown>; useExisting: Type<unknown> } =>
      typeof candidate === 'object' &&
      candidate !== null &&
      'provide' in candidate &&
      candidate.provide === token &&
      'useExisting' in candidate,
  );

  return provider?.useExisting;
}

function hasProvider(
  providers: readonly unknown[] | undefined,
  token: ProviderToken<unknown>,
): boolean {
  return (
    providers?.some(
      (candidate) =>
        typeof candidate === 'object' &&
        candidate !== null &&
        'provide' in candidate &&
        candidate.provide === token,
    ) ?? false
  );
}
