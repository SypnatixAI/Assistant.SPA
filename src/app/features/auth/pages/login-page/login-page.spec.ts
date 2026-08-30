import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { AuthenticationStatus } from '../../../../core/services/authentication/authentication-status';
import { ApplicationNavigationService } from '../../../../core/services/navigation/application-navigation.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  const errorMessage = signal<string | null>(null);
  const isAuthenticated = signal(false);
  const status = signal<AuthenticationStatus>(
    AuthenticationStatus.Unauthenticated,
  );
  let applicationNavigationService: { navigateToOnboarding: jasmine.Spy };
  let authenticationService: {
    errorMessage: typeof errorMessage;
    isAuthenticated: typeof isAuthenticated;
    isLocalAuthentication: boolean;
    login: jasmine.Spy;
    status: typeof status;
  };
  let login: jasmine.Spy;

  beforeEach(async () => {
    errorMessage.set(null);
    isAuthenticated.set(false);
    status.set(AuthenticationStatus.Unauthenticated);
    login = jasmine.createSpy('login');
    applicationNavigationService = {
      navigateToOnboarding: jasmine.createSpy('navigateToOnboarding'),
    };
    authenticationService = {
      errorMessage,
      isAuthenticated,
      isLocalAuthentication: false,
      login,
      status,
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        {
          provide: AuthenticationService,
          useValue: authenticationService,
        },
        {
          provide: ApplicationNavigationService,
          useValue: applicationNavigationService,
        },
      ],
    }).compileComponents();
  });

  it('Given_NoSessionInMicrosoftMode_When_ngOnInitIsCalled_Then_MicrosoftLoginStartsAutomatically', () => {
    // Given
    const fixture = createFixture();

    // When
    const button = fixture.nativeElement.querySelector('button');

    // Then
    expect(login).toHaveBeenCalled();
    expect(button).toBeNull();
  });

  it('Given_LocalAuthentication_When_loginIsCalled_Then_LoginStartsAfterUserAction', () => {
    // Given
    authenticationService.isLocalAuthentication = true;
    const fixture = createFixture();
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    // When
    button.click();

    // Then
    expect(login).toHaveBeenCalledTimes(1);
    expect(button.textContent).toContain('administrateur local');
  });

  it('Given_LoginInProgress_When_ngOnInitIsCalled_Then_RedirectionStatusIsAccessible', () => {
    // Given
    status.set(AuthenticationStatus.Loading);

    // When
    const fixture = createFixture();
    const statusMessage: HTMLElement =
      fixture.nativeElement.querySelector('[role=status]');

    // Then
    expect(login).not.toHaveBeenCalled();
    expect(statusMessage.textContent).toContain('Redirection');
  });

  it('Given_LoginFailure_When_ngOnInitIsCalled_Then_ErrorIsAnnouncedWithoutRedirectLoop', () => {
    // Given
    errorMessage.set('La connexion a échoué.');
    status.set(AuthenticationStatus.Error);

    // When
    const fixture = createFixture();
    const alert: HTMLElement = fixture.nativeElement.querySelector('[role=alert]');

    // Then
    expect(alert.textContent).toContain('La connexion a échoué.');
    expect(login).not.toHaveBeenCalled();
  });

  it('Given_AuthenticatedSession_When_ngOnInitIsCalled_Then_OnboardingNavigationStarts', () => {
    // Given
    isAuthenticated.set(true);

    // When
    createFixture();

    // Then
    expect(
      applicationNavigationService.navigateToOnboarding,
    ).toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
  });
});

function createFixture(): ComponentFixture<LoginPage> {
  const fixture = TestBed.createComponent(LoginPage);
  fixture.detectChanges();
  return fixture;
}
