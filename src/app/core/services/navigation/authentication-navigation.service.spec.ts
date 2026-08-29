import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { of } from 'rxjs';

import { LaunchMode, PublicAppConfig } from '../../config/public-app-config';
import { ApplicationNavigationService } from './application-navigation.service';
import { AuthenticationNavigationService } from './authentication-navigation.service';

describe('AuthenticationNavigationService', () => {
  const account = { homeAccountId: 'account-id' } as AccountInfo;
  const publicAppConfig: PublicAppConfig = {
    apiBaseUrl: '/',
    authenticationUrl: '/local-auth/token',
    launchMode: LaunchMode.Certification,
    entraAuthority: 'https://login.microsoftonline.com/organizations',
    entraClientId: 'spa-client-id',
    entraScope: 'api://api-client-id/access_as_user',
  };

  it('Given_UnauthenticatedUser_When_loginIsCalled_Then_MicrosoftRedirectStartsForAssistantCore', () => {
    // Given
    const msalService = jasmine.createSpyObj<MsalService>('MsalService', ['loginRedirect']);
    msalService.loginRedirect.and.returnValue(of(undefined));
    const applicationNavigationService = jasmine.createSpyObj<ApplicationNavigationService>(
      'ApplicationNavigationService',
      { getChatAbsoluteUrl: 'http://localhost:4200/chat' },
    );
    const service = new AuthenticationNavigationService(
      msalService,
      publicAppConfig,
      applicationNavigationService,
    );

    // When
    service.login().subscribe();

    // Then
    expect(msalService.loginRedirect).toHaveBeenCalledWith({
      redirectStartPage: 'http://localhost:4200/chat',
      scopes: [publicAppConfig.entraScope],
    });
  });

  it('Given_AuthenticatedUser_When_logoutIsCalled_Then_MicrosoftLogoutReturnsToLogin', () => {
    // Given
    const msalService = jasmine.createSpyObj<MsalService>('MsalService', ['logoutRedirect']);
    msalService.logoutRedirect.and.returnValue(of(undefined));
    const applicationNavigationService = jasmine.createSpyObj<ApplicationNavigationService>(
      'ApplicationNavigationService',
      { getLoginAbsoluteUrl: 'http://localhost:4200/login' },
    );
    const service = new AuthenticationNavigationService(
      msalService,
      publicAppConfig,
      applicationNavigationService,
    );

    // When
    service.logout(account).subscribe();

    // Then
    expect(msalService.logoutRedirect).toHaveBeenCalledWith({
      account,
      postLogoutRedirectUri: 'http://localhost:4200/login',
    });
  });
});
