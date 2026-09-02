import { InteractionType } from '@azure/msal-browser';

import { AuthenticationMode, LaunchMode, PublicAppConfig } from '../../config/public-app-config';
import { ApplicationNavigationService } from '../navigation/application-navigation.service';
import { createMsalGuardConfig, createMsalInterceptorConfig } from './msal-config.factory';

describe('MSAL configuration factories', () => {
  const publicAppConfig: PublicAppConfig = {
    apiBaseUrl: 'https://api.example.com',
    authenticationMode: AuthenticationMode.MicrosoftEntra,
    authenticationUrl: '/local-auth/token',
    launchMode: LaunchMode.Certification,
    entraAuthority: 'https://login.microsoftonline.com/organizations',
    entraClientId: 'spa-client-id',
    entraScope: 'api://api-client-id/access_as_user',
  };

  const applicationNavigationService = jasmine.createSpyObj<ApplicationNavigationService>(
    'ApplicationNavigationService',
    {
      getAbsoluteUrl: 'https://api.example.com',
      getLoginAbsoluteUrl: 'http://localhost:4200/login',
    },
  );

  it('Given_PublicConfiguration_When_createMsalGuardConfigIsCalled_Then_AssistantCoreScopeIsRequested', () => {
    // Given
    const expectedScope = publicAppConfig.entraScope;

    // When
    const result = createMsalGuardConfig(publicAppConfig);

    // Then
    expect(result.interactionType).toBe(InteractionType.Redirect);
    expect(result.authRequest).toEqual({ scopes: [expectedScope] });
    expect(result.loginFailedRoute).toBe('/login');
  });

  it('Given_PublicConfiguration_When_createMsalInterceptorConfigIsCalled_Then_OnlyAssistantCoreApiIsProtected', () => {
    // Given
    const expectedEndpoint = 'https://api.example.com/api/*';

    // When
    const result = createMsalInterceptorConfig(publicAppConfig, applicationNavigationService);

    // Then
    expect(result.interactionType).toBe(InteractionType.Redirect);
    expect(result.protectedResourceMap.size).toBe(1);
    expect(result.protectedResourceMap.get(expectedEndpoint)).toEqual([publicAppConfig.entraScope]);
  });
});
