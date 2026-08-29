import { MsalService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { firstValueFrom, of, throwError } from 'rxjs';

import { LaunchMode, PublicAppConfig } from '../../config/public-app-config';
import { AuthenticationNavigationService } from '../navigation/authentication-navigation.service';
import { MicrosoftEntraAuthenticationProvider } from './microsoft-entra-authentication.provider';

const account = {
  environment: 'login.microsoftonline.com',
  homeAccountId: 'home-account-id',
  localAccountId: 'local-account-id',
  tenantId: 'tenant-id',
  username: 'marc@metalpro.com',
} as AccountInfo;
const publicAppConfig: PublicAppConfig = {
  apiBaseUrl: '/',
  authenticationUrl: '/local-auth/token',
  launchMode: LaunchMode.Certification,
  entraAuthority: 'https://login.microsoftonline.com/organizations',
  entraClientId: 'spa-client-id',
  entraScope: 'api://api-client-id/access_as_user',
};

describe('MicrosoftEntraAuthenticationProvider', () => {
  it('Given_MicrosoftRedirectResult_When_initializeIsCalled_Then_ApiTokenIsAcquired', async () => {
    // Given
    const dependencies = createDependencies();
    dependencies.msalService.handleRedirectObservable.and.returnValue(
      of({ account } as AuthenticationResult),
    );
    const provider = createProvider(dependencies);

    // When
    const authenticated = await firstValueFrom(provider.initialize());

    // Then
    expect(authenticated).toBeTrue();
    expect(dependencies.msalService.instance.setActiveAccount).toHaveBeenCalledWith(account);
    expect(dependencies.msalService.acquireTokenSilent).toHaveBeenCalledWith({
      account,
      scopes: [publicAppConfig.entraScope],
    });
  });

  it('Given_SilentTokenRequiresInteraction_When_initializeIsCalled_Then_InteractiveRedirectStarts', async () => {
    // Given
    const dependencies = createDependencies();
    dependencies.msalService.handleRedirectObservable.and.returnValue(
      of({ account } as AuthenticationResult),
    );
    dependencies.msalService.acquireTokenSilent.and.returnValue(
      throwError(() => new InteractionRequiredAuthError('interaction_required', 'correlation-id')),
    );
    const provider = createProvider(dependencies);

    // When
    const authenticated = await firstValueFrom(provider.initialize());

    // Then
    expect(authenticated).toBeFalse();
    expect(
      dependencies.authenticationNavigationService.requestTokenInteractively,
    ).toHaveBeenCalledWith(account);
  });
});

function createDependencies() {
  return {
    authenticationNavigationService: {
      login: jasmine.createSpy('login').and.returnValue(of(undefined)),
      logout: jasmine.createSpy('logout').and.returnValue(of(undefined)),
      requestTokenInteractively: jasmine
        .createSpy('requestTokenInteractively')
        .and.returnValue(of(undefined)),
    },
    msalService: {
      acquireTokenSilent: jasmine
        .createSpy('acquireTokenSilent')
        .and.returnValue(of({ account } as AuthenticationResult)),
      handleRedirectObservable: jasmine
        .createSpy('handleRedirectObservable')
        .and.returnValue(of(null)),
      instance: {
        getActiveAccount: jasmine.createSpy('getActiveAccount').and.returnValue(null),
        getAllAccounts: jasmine.createSpy('getAllAccounts').and.returnValue([]),
        setActiveAccount: jasmine.createSpy('setActiveAccount'),
      },
    },
  };
}

function createProvider(dependencies: ReturnType<typeof createDependencies>) {
  return new MicrosoftEntraAuthenticationProvider(
    dependencies.msalService as unknown as MsalService,
    publicAppConfig,
    dependencies.authenticationNavigationService as unknown as AuthenticationNavigationService,
  );
}
