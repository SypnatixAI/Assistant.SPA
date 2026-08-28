import { TestBed } from '@angular/core/testing';
import { MsalService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { of, throwError } from 'rxjs';

import { PUBLIC_APP_CONFIG } from '../../config/public-app-config';
import { AuthenticatedSession } from '../../../domain/auth/authenticated-session';
import { AuthenticationApiService } from '../api/authentication-api.service';
import { TechnicalErrorService } from '../errors/technical-error.service';
import { AuthenticationNavigationService } from '../navigation/authentication-navigation.service';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', () => {
  const account = {
    environment: 'login.microsoftonline.com',
    homeAccountId: 'home-account-id',
    localAccountId: 'local-account-id',
    tenantId: 'tenant-id',
    username: 'marc@metalpro.com',
  } as AccountInfo;
  const authenticationResult = { account } as AuthenticationResult;
  const session: AuthenticatedSession = {
    organization: { id: 'organization-id', name: 'MetalPro' },
    roles: ['User'],
    user: {
      displayName: 'Marc Tremblay',
      email: 'marc@metalpro.com',
      id: 'user-id',
    },
  };
  let activeAccount: AccountInfo | null;
  let authenticationApiService: {
    authenticateUser: jasmine.Spy;
  };
  let authenticationNavigationService: {
    login: jasmine.Spy;
    logout: jasmine.Spy;
    requestTokenInteractively: jasmine.Spy;
  };
  let technicalErrorService: { report: jasmine.Spy };
  let msalService: {
    acquireTokenSilent: jasmine.Spy;
    handleRedirectObservable: jasmine.Spy;
    instance: {
      getActiveAccount: jasmine.Spy;
      getAllAccounts: jasmine.Spy;
      setActiveAccount: jasmine.Spy;
    };
  };

  beforeEach(() => {
    activeAccount = null;
    authenticationApiService = {
      authenticateUser: jasmine
        .createSpy('authenticateUser')
        .and.returnValue(of(session)),
    };
    authenticationNavigationService = {
      login: jasmine.createSpy('login').and.returnValue(of(undefined)),
      logout: jasmine.createSpy('logout').and.returnValue(of(undefined)),
      requestTokenInteractively: jasmine
        .createSpy('requestTokenInteractively')
        .and.returnValue(of(undefined)),
    };
    technicalErrorService = { report: jasmine.createSpy('report') };
    msalService = {
      acquireTokenSilent: jasmine
        .createSpy('acquireTokenSilent')
        .and.returnValue(of(authenticationResult)),
      handleRedirectObservable: jasmine
        .createSpy('handleRedirectObservable')
        .and.returnValue(of(null)),
      instance: {
        getActiveAccount: jasmine
          .createSpy('getActiveAccount')
          .and.callFake(() => activeAccount),
        getAllAccounts: jasmine
          .createSpy('getAllAccounts')
          .and.returnValue([]),
        setActiveAccount: jasmine
          .createSpy('setActiveAccount')
          .and.callFake((selectedAccount: AccountInfo) => {
            activeAccount = selectedAccount;
          }),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        AuthenticationService,
        { provide: AuthenticationApiService, useValue: authenticationApiService },
        {
          provide: AuthenticationNavigationService,
          useValue: authenticationNavigationService,
        },
        { provide: MsalService, useValue: msalService },
        { provide: TechnicalErrorService, useValue: technicalErrorService },
        {
          provide: PUBLIC_APP_CONFIG,
          useValue: {
            apiBaseUrl: 'https://api.example.com',
            entraAuthority: 'https://login.microsoftonline.com/organizations',
            entraClientId: 'client-id',
            entraScope: 'api://api-client-id/access_as_user',
          },
        },
      ],
    });
  });

  it('Given_NoMicrosoftAccount_When_initializeIsCalled_Then_UserRemainsUnauthenticated', async () => {
    // Given
    const service = TestBed.inject(AuthenticationService);

    // When
    await service.initialize();

    // Then
    expect(service.status()).toBe('unauthenticated');
    expect(authenticationApiService.authenticateUser).not.toHaveBeenCalled();
  });

  it('Given_MicrosoftRedirectResult_When_initializeIsCalled_Then_AssistantCoreSessionIsCreated', async () => {
    // Given
    msalService.handleRedirectObservable.and.returnValue(
      of(authenticationResult),
    );
    const service = TestBed.inject(AuthenticationService);

    // When
    await service.initialize();

    // Then
    expect(msalService.instance.setActiveAccount).toHaveBeenCalledWith(account);
    expect(msalService.acquireTokenSilent).toHaveBeenCalledWith({
      account,
      scopes: ['api://api-client-id/access_as_user'],
    });
    expect(authenticationApiService.authenticateUser).toHaveBeenCalled();
    expect(service.session()).toEqual(session);
    expect(service.status()).toBe('authenticated');
  });

  it('Given_CachedMicrosoftAccount_When_initializeIsCalled_Then_AssistantCoreSessionIsRefreshed', async () => {
    // Given
    activeAccount = account;
    const service = TestBed.inject(AuthenticationService);

    // When
    await service.initialize();

    // Then
    expect(msalService.acquireTokenSilent).toHaveBeenCalled();
    expect(authenticationApiService.authenticateUser).toHaveBeenCalled();
    expect(service.status()).toBe('authenticated');
  });

  it('Given_SilentTokenRequiresInteraction_When_initializeIsCalled_Then_RedirectIsStarted', async () => {
    // Given
    msalService.handleRedirectObservable.and.returnValue(
      of(authenticationResult),
    );
    msalService.acquireTokenSilent.and.returnValue(
      throwError(
        () =>
          new InteractionRequiredAuthError(
            'interaction_required',
            'correlation-id',
          ),
      ),
    );
    const service = TestBed.inject(AuthenticationService);

    // When
    await service.initialize();

    // Then
    expect(
      authenticationNavigationService.requestTokenInteractively,
    ).toHaveBeenCalledWith(account);
    expect(authenticationApiService.authenticateUser).not.toHaveBeenCalled();
  });

  it('Given_AuthenticatedSession_When_logoutIsCalled_Then_LocalSessionIsClearedAndMicrosoftLogoutStarts', async () => {
    // Given
    msalService.handleRedirectObservable.and.returnValue(
      of(authenticationResult),
    );
    const service = TestBed.inject(AuthenticationService);
    await service.initialize();

    // When
    service.logout();

    // Then
    expect(service.status()).toBe('unauthenticated');
    expect(service.session()).toBeNull();
    expect(authenticationNavigationService.logout).toHaveBeenCalledWith(account);
  });

  it('Given_BackendFailure_When_initializeIsCalled_Then_TechnicalErrorIsReported', async () => {
    // Given
    msalService.handleRedirectObservable.and.returnValue(
      of(authenticationResult),
    );
    authenticationApiService.authenticateUser.and.returnValue(
      throwError(() => new Error('Backend unavailable')),
    );
    const service = TestBed.inject(AuthenticationService);

    // When
    await service.initialize();

    // Then
    expect(technicalErrorService.report).toHaveBeenCalled();
    expect(service.isAuthenticated()).toBeFalse();
  });
});
