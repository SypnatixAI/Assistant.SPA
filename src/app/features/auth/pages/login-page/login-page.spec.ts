import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { ApplicationNavigationService } from '../../../../core/services/navigation/application-navigation.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  const errorMessage = signal<string | null>(null);
  const isAuthenticated = signal(false);
  const status = signal('unauthenticated');
  let applicationNavigationService: { navigateToApplication: jasmine.Spy };
  let login: jasmine.Spy;

  beforeEach(async () => {
    errorMessage.set(null);
    isAuthenticated.set(false);
    status.set('unauthenticated');
    login = jasmine.createSpy('login');
    applicationNavigationService = {
      navigateToApplication: jasmine.createSpy('navigateToApplication'),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        {
          provide: AuthenticationService,
          useValue: {
            errorMessage,
            isAuthenticated,
            login,
            status,
          },
        },
        {
          provide: ApplicationNavigationService,
          useValue: applicationNavigationService,
        },
      ],
    }).compileComponents();
  });

  it('Given_NoSession_When_ngOnInitIsCalled_Then_MicrosoftLoginStartsAutomatically', () => {
    // Given
    const fixture = createFixture();

    // When
    const button = fixture.nativeElement.querySelector('button');

    // Then
    expect(login).toHaveBeenCalled();
    expect(button).toBeNull();
  });

  it('Given_LoginInProgress_When_ngOnInitIsCalled_Then_RedirectionStatusIsAccessible', () => {
    // Given
    status.set('loading');

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
    status.set('error');

    // When
    const fixture = createFixture();
    const alert: HTMLElement = fixture.nativeElement.querySelector('[role=alert]');

    // Then
    expect(alert.textContent).toContain('La connexion a échoué.');
    expect(login).not.toHaveBeenCalled();
  });

  it('Given_AuthenticatedSession_When_ngOnInitIsCalled_Then_ApplicationNavigationStarts', () => {
    // Given
    isAuthenticated.set(true);

    // When
    createFixture();

    // Then
    expect(
      applicationNavigationService.navigateToApplication,
    ).toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
  });
});

function createFixture(): ComponentFixture<LoginPage> {
  const fixture = TestBed.createComponent(LoginPage);
  fixture.detectChanges();
  return fixture;
}
