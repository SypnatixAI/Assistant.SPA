import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthenticationService } from '../services/authentication/authentication.service';
import { ApplicationNavigationService } from '../services/navigation/application-navigation.service';
import { unauthorizedInterceptor } from './unauthorized.interceptor';

describe('unauthorizedInterceptor', () => {
  const messagesUrl = 'https://api.onpremia.test/api/messages';
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let handleUnauthorized: jasmine.Spy;
  let navigateToAccessDenied: jasmine.Spy;

  beforeEach(() => {
    handleUnauthorized = jasmine.createSpy('handleUnauthorized').and.returnValue(of(false));
    navigateToAccessDenied = jasmine.createSpy('navigateToAccessDenied');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([unauthorizedInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthenticationService, useValue: { handleUnauthorized } },
        {
          provide: ApplicationNavigationService,
          useValue: { navigateToAccessDenied },
        },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('Given_AValidResponse_When_AProtectedApiIsCalled_Then_NoRecoveryIsTriggered', () => {
    // Given
    let received: unknown = null;

    // When
    httpClient.get(messagesUrl).subscribe((response) => (received = response));
    httpTestingController.expectOne(messagesUrl).flush({ ok: true });

    // Then
    expect(received).toEqual({ ok: true });
    expect(handleUnauthorized).not.toHaveBeenCalled();
  });

  it('Given_ARenewableToken_When_AProtectedApiReturns401_Then_TheCallIsRetried', () => {
    // Given
    handleUnauthorized.and.returnValue(of(true));
    let received: unknown = null;

    // When
    httpClient.get(messagesUrl).subscribe((response) => (received = response));
    httpTestingController
      .expectOne(messagesUrl)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    httpTestingController.expectOne(messagesUrl).flush({ ok: true });

    // Then
    expect(handleUnauthorized).toHaveBeenCalledTimes(1);
    expect(received).toEqual({ ok: true });
  });

  it('Given_AnInteractiveLoginIsRequired_When_AProtectedApiReturns401_Then_TheErrorIsPropagated', () => {
    // Given
    handleUnauthorized.and.returnValue(of(false));
    let failed = false;

    // When
    httpClient.get(messagesUrl).subscribe({ error: () => (failed = true) });
    httpTestingController
      .expectOne(messagesUrl)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    // Then
    expect(handleUnauthorized).toHaveBeenCalledTimes(1);
    expect(failed).toBeTrue();
  });

  it('Given_ASessionBuildCall_When_ItReturns401_Then_TheInterceptorStaysOut', () => {
    // Given
    const authenticateUserUrl = 'https://api.onpremia.test/api/core/authenticateUser';

    // When
    httpClient.get(authenticateUserUrl).subscribe({ error: () => undefined });
    httpTestingController
      .expectOne(authenticateUserUrl)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    // Then
    expect(handleUnauthorized).not.toHaveBeenCalled();
  });

  it('Given_AForbiddenIdentity_When_AProtectedApiReturns403_Then_AccessDeniedIsDisplayed', () => {
    // Given
    let failed = false;

    // When
    httpClient.get(messagesUrl).subscribe({ error: () => (failed = true) });
    httpTestingController
      .expectOne(messagesUrl)
      .flush({}, { status: 403, statusText: 'Forbidden' });

    // Then
    expect(navigateToAccessDenied).toHaveBeenCalledTimes(1);
    expect(handleUnauthorized).not.toHaveBeenCalled();
    expect(failed).toBeTrue();
  });

  it('Given_ATechnicalFailure_When_AProtectedApiReturns500_Then_NoSessionRecoveryIsTriggered', () => {
    // Given
    let failed = false;

    // When
    httpClient.get(messagesUrl).subscribe({ error: () => (failed = true) });
    httpTestingController
      .expectOne(messagesUrl)
      .flush({}, { status: 500, statusText: 'Server Error' });

    // Then
    expect(handleUnauthorized).not.toHaveBeenCalled();
    expect(navigateToAccessDenied).not.toHaveBeenCalled();
    expect(failed).toBeTrue();
  });
});
