import {
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  PublicClientApplication,
} from '@azure/msal-browser';

import { PublicAppConfig } from '../../config/public-app-config';
import { ApplicationNavigationService } from '../navigation/application-navigation.service';

/**
 * MSAL (Microsoft Authentication Library) handles the Entra authorization code
 * flow with PKCE and owns the browser token cache.
 */
export function createMsalInstance(
  publicAppConfig: PublicAppConfig,
  applicationNavigationService: ApplicationNavigationService,
): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      authority: publicAppConfig.entraAuthority,
      clientId: publicAppConfig.entraClientId,
      postLogoutRedirectUri:
        applicationNavigationService.getLoginAbsoluteUrl(),
      redirectUri: applicationNavigationService.getLoginAbsoluteUrl(),
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage,
    },
  });
}

export function createMsalGuardConfig(
  publicAppConfig: PublicAppConfig,
): MsalGuardConfiguration {
  return {
    authRequest: {
      scopes: [publicAppConfig.entraScope],
    },
    interactionType: InteractionType.Redirect,
    loginFailedRoute: '/login',
  };
}

export function createMsalInterceptorConfig(
  publicAppConfig: PublicAppConfig,
  applicationNavigationService: ApplicationNavigationService,
): MsalInterceptorConfiguration {
  const apiBaseUrl = applicationNavigationService.getAbsoluteUrl(
    publicAppConfig.apiBaseUrl,
  );
  const protectedResourceMap = new Map<string, string[]>();

  protectedResourceMap.set(
    `${apiBaseUrl.replace(/\/$/, '')}/api/*`,
    [publicAppConfig.entraScope],
  );

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}
