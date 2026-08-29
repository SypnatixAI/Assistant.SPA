import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthenticatedSession } from '../../../domain/auth/authenticated-session';
import { ApiError } from '../../../domain/errors/api-error';
import { LaunchMode } from '../../config/public-app-config';
import { AuthenticationApiService } from '../api/authentication-api.service';
import { TechnicalErrorService } from '../errors/technical-error.service';
import { AUTHENTICATION_PROVIDER, AuthenticationProvider } from './authentication-provider';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', () => {
  const session: AuthenticatedSession = {
    organization: { id: 'organization-id', name: 'MetalPro' },
    roles: ['User'],
    user: {
      displayName: 'Marc Tremblay',
      email: 'marc@metalpro.com',
      id: 'user-id',
    },
  };
  let authenticationApiService: { authenticateUser: jasmine.Spy };
  let authenticationProvider: {
    initialize: jasmine.Spy;
    login: jasmine.Spy;
    recover: jasmine.Spy;
    logout: jasmine.Spy;
    launchMode: LaunchMode;
  };
  let technicalErrorService: { report: jasmine.Spy };

  beforeEach(() => {
    authenticationApiService = {
      authenticateUser: jasmine.createSpy('authenticateUser').and.returnValue(of(session)),
    };
    authenticationProvider = {
      initialize: jasmine.createSpy('initialize').and.returnValue(of(false)),
      login: jasmine.createSpy('login').and.returnValue(of(true)),
      recover: jasmine.createSpy('recover').and.returnValue(of(true)),
      logout: jasmine.createSpy('logout').and.returnValue(of(undefined)),
      launchMode: LaunchMode.Local,
    };
    technicalErrorService = { report: jasmine.createSpy('report') };

    TestBed.configureTestingModule({
      providers: [
        AuthenticationService,
        { provide: AuthenticationApiService, useValue: authenticationApiService },
        {
          provide: AUTHENTICATION_PROVIDER,
          useValue: authenticationProvider as AuthenticationProvider,
        },
        { provide: TechnicalErrorService, useValue: technicalErrorService },
      ],
    });
  });

  it('Given_ExpiredApiToken_When_initializeIsCalled_Then_TokenIsRecoveredAndSessionIsRetried', async () => {
    // Given
    authenticationProvider.initialize.and.returnValue(of(true));
    authenticationApiService.authenticateUser.and.returnValues(
      throwError(() => new ApiError(401, 'http_401', 'Unauthorized', null)),
      of(session),
    );
    const service = TestBed.inject(AuthenticationService);

    // When
    await service.initialize();

    // Then
    expect(authenticationProvider.recover).toHaveBeenCalledTimes(1);
    expect(authenticationApiService.authenticateUser).toHaveBeenCalledTimes(2);
    expect(service.status()).toBe('authenticated');
  });

  it('Given_ForbiddenSession_When_initializeIsCalled_Then_AccessIsMarkedAsForbidden', async () => {
    // Given
    authenticationProvider.initialize.and.returnValue(of(true));
    authenticationApiService.authenticateUser.and.returnValue(
      throwError(() => new ApiError(403, 'http_403', 'Forbidden', null)),
    );
    const service = TestBed.inject(AuthenticationService);

    // When
    await service.initialize();

    // Then
    expect(service.status()).toBe('forbidden');
    expect(service.session()).toBeNull();
    expect(technicalErrorService.report).not.toHaveBeenCalled();
  });

  it('Given_NoAccessToken_When_initializeIsCalled_Then_UserRemainsUnauthenticated', async () => {
    // Given
    const service = TestBed.inject(AuthenticationService);

    // When
    await service.initialize();

    // Then
    expect(service.status()).toBe('unauthenticated');
    expect(authenticationApiService.authenticateUser).not.toHaveBeenCalled();
  });

  it('Given_AccessToken_When_initializeIsCalled_Then_AssistantCoreSessionIsCreated', async () => {
    // Given
    authenticationProvider.initialize.and.returnValue(of(true));
    const service = TestBed.inject(AuthenticationService);

    // When
    await service.initialize();

    // Then
    expect(authenticationApiService.authenticateUser).toHaveBeenCalled();
    expect(service.session()).toEqual(session);
    expect(service.status()).toBe('authenticated');
  });

  it('Given_LocalLogin_When_loginIsCalled_Then_AssistantCoreSessionIsCreated', () => {
    // Given
    const service = TestBed.inject(AuthenticationService);

    // When
    service.login();

    // Then
    expect(authenticationProvider.login).toHaveBeenCalled();
    expect(authenticationApiService.authenticateUser).toHaveBeenCalled();
    expect(service.status()).toBe('authenticated');
  });

  it('Given_AuthenticatedSession_When_logoutIsCalled_Then_SessionAndProviderAreCleared', async () => {
    // Given
    authenticationProvider.initialize.and.returnValue(of(true));
    const service = TestBed.inject(AuthenticationService);
    await service.initialize();

    // When
    service.logout();

    // Then
    expect(service.status()).toBe('unauthenticated');
    expect(service.session()).toBeNull();
    expect(authenticationProvider.logout).toHaveBeenCalled();
  });

  it('Given_BackendFailure_When_initializeIsCalled_Then_TechnicalErrorIsReported', async () => {
    // Given
    authenticationProvider.initialize.and.returnValue(of(true));
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
