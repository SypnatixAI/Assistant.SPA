import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { LoginPage } from './features/auth/pages/login-page/login-page';
import { Microsoft365AdministrationPage } from './features/microsoft365/pages/microsoft365-administration-page/microsoft365-administration-page';
import { NotFoundPage } from './shared/pages/not-found-page/not-found-page';
import { routes } from './app.routes';
import { AuthenticationService } from './core/services/authentication/authentication.service';
import { AuthenticationStatus } from './core/services/authentication/authentication-status';
import { TechnicalErrorService } from './core/services/errors/technical-error.service';
import { Microsoft365ApiService } from './core/services/api/microsoft365-api.service';
import { TechnicalErrorPage } from './shared/pages/technical-error-page/technical-error-page';

describe('Application routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: AuthenticationService,
          useValue: {
            errorMessage: () => null,
            isAuthenticated: () => false,
            login: jasmine.createSpy('login'),
            status: () => AuthenticationStatus.Unauthenticated,
          },
        },
        {
          provide: TechnicalErrorService,
          useValue: { hasTechnicalError: () => false },
        },
        {
          provide: Microsoft365ApiService,
          useValue: {
            getOnboardingStatus: () => of({
              isAdministrator: true,
              connectionStatus: 'Active',
              isConsentComplete: true,
              hasSelectedSite: false,
              hasIndexedSource: false,
              isComplete: false,
            }),
            getSites: () => of({ sites: [] }),
          },
        },
      ],
    });
  });

  it('Given_PublicRoute_When_NavigateByUrlIsCalled_Then_LoginPageIsDisplayed', async () => {
    // Given
    const harness = await RouterTestingHarness.create();

    // When
    await harness.navigateByUrl('/auth/sign-in', LoginPage);

    // Then
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Connexion en cours',
    );
  });

  it('Given_TechnicalErrorRoute_When_NavigateByUrlIsCalled_Then_TechnicalErrorPageIsDisplayed', async () => {
    // Given
    const harness = await RouterTestingHarness.create();

    // When
    await harness.navigateByUrl('/technical-error', TechnicalErrorPage);

    // Then
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'erreur technique',
    );
  });

  it('Given_ProtectedRoute_When_NavigateByUrlIsCalled_Then_UserIsRedirectedToLogin', async () => {
    // Given
    const harness = await RouterTestingHarness.create();
    const location = TestBed.inject(Location);

    // When
    await harness.navigateByUrl('/app/chat', LoginPage);

    // Then
    expect(location.path()).toBe('/auth/sign-in');
  });

  it('Given_AuthenticatedAdmin_When_NavigateByUrlIsCalled_Then_ConsentSuccessReturnsToOnboarding', async () => {
    // Given
    TestBed.overrideProvider(AuthenticationService, {
      useValue: {
        isAuthenticated: () => true,
        status: () => AuthenticationStatus.Authenticated,
      },
    });
    const harness = await RouterTestingHarness.create();

    // When
    await harness.navigateByUrl(
      '/microsoft365/consent/success',
      Microsoft365AdministrationPage,
    );

    // Then
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Préparez votre organisation',
    );
    expect(harness.routeNativeElement?.textContent).toContain(
      'Autorisation confirmée',
    );
  });

  it('Given_AuthenticatedAdmin_When_Microsoft365AdministrationIsOpened_Then_ConfigurationPageIsDisplayed', async () => {
    // Given
    TestBed.overrideProvider(AuthenticationService, {
      useValue: {
        isAuthenticated: () => true,
        status: () => AuthenticationStatus.Authenticated,
      },
    });
    const harness = await RouterTestingHarness.create();

    // When
    await harness.navigateByUrl(
      '/app/settings/microsoft365',
      Microsoft365AdministrationPage,
    );

    // Then
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Préparez votre organisation',
    );
  });

  it('Given_UnknownRoute_When_NavigateByUrlIsCalled_Then_NotFoundPageIsDisplayed', async () => {
    // Given
    const harness = await RouterTestingHarness.create();

    // When
    await harness.navigateByUrl('/adresse-inconnue', NotFoundPage);

    // Then
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Page introuvable',
    );
  });

  it('Given_TheRootAddress_When_NavigateByUrlIsCalled_Then_TheGuardsDecideWhereToGo', async () => {
    // Given
    const harness = await RouterTestingHarness.create();
    const location = TestBed.inject(Location);

    // When
    await harness.navigateByUrl('/', LoginPage);

    // Then
    expect(location.path()).toBe('/auth/sign-in');
  });

  it('Given_ALegacyChatAddress_When_NavigateByUrlIsCalled_Then_ItRedirectsToTheApplicationSpace', async () => {
    // Given
    TestBed.overrideProvider(AuthenticationService, {
      useValue: {
        isAuthenticated: () => true,
        status: () => AuthenticationStatus.Authenticated,
      },
    });
    const harness = await RouterTestingHarness.create();
    const location = TestBed.inject(Location);

    // When
    await harness.navigateByUrl('/chat');

    // Then
    expect(location.path()).toBe('/setup');
  });

  it('Given_ALegacyOnboardingAddress_When_NavigateByUrlIsCalled_Then_SetupIsDisplayed', async () => {
    // Given
    TestBed.overrideProvider(AuthenticationService, {
      useValue: {
        isAuthenticated: () => true,
        status: () => AuthenticationStatus.Authenticated,
      },
    });
    const harness = await RouterTestingHarness.create();
    const location = TestBed.inject(Location);

    // When
    await harness.navigateByUrl('/onboarding', Microsoft365AdministrationPage);

    // Then
    expect(location.path()).toBe('/setup');
  });

  it('Given_ALegacyAdministrationAddress_When_NavigateByUrlIsCalled_Then_SettingsAreDisplayed', async () => {
    // Given
    TestBed.overrideProvider(AuthenticationService, {
      useValue: {
        isAuthenticated: () => true,
        status: () => AuthenticationStatus.Authenticated,
      },
    });
    const harness = await RouterTestingHarness.create();
    const location = TestBed.inject(Location);

    // When
    await harness.navigateByUrl(
      '/administration/microsoft365',
      Microsoft365AdministrationPage,
    );

    // Then
    expect(location.path()).toBe('/app/settings/microsoft365');
  });

  it('Given_ALegacyAccessDeniedAddress_When_NavigateByUrlIsCalled_Then_ForbiddenPageIsDisplayed', async () => {
    // Given
    const harness = await RouterTestingHarness.create();
    const location = TestBed.inject(Location);

    // When
    await harness.navigateByUrl('/access-denied');

    // Then
    expect(location.path()).toBe('/auth/forbidden');
  });

  it('Given_TheEntraRedirectAddress_When_NavigateByUrlIsCalled_Then_TheSignInPageIsStillServed', async () => {
    // Given
    const harness = await RouterTestingHarness.create();

    // When
    await harness.navigateByUrl('/login', LoginPage);

    // Then
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Connexion en cours',
    );
  });

  it('Given_ASuccessfulConsent_When_TheUnifiedCallbackIsOpened_Then_TheOutcomeIsRead', async () => {
    // Given
    TestBed.overrideProvider(AuthenticationService, {
      useValue: {
        isAuthenticated: () => true,
        status: () => AuthenticationStatus.Authenticated,
      },
    });
    const harness = await RouterTestingHarness.create();

    // When
    await harness.navigateByUrl(
      '/auth/microsoft/callback?status=success',
      Microsoft365AdministrationPage,
    );

    // Then
    expect(harness.routeNativeElement?.textContent).toContain('Autorisation confirmée');
  });

  it('Given_ALegacyConsentAddress_When_ItIsOpened_Then_TheOutcomeIsStillRead', async () => {
    // Given
    TestBed.overrideProvider(AuthenticationService, {
      useValue: {
        isAuthenticated: () => true,
        status: () => AuthenticationStatus.Authenticated,
      },
    });
    const harness = await RouterTestingHarness.create();

    // When
    await harness.navigateByUrl(
      '/microsoft365/consent/success',
      Microsoft365AdministrationPage,
    );

    // Then
    expect(harness.routeNativeElement?.textContent).toContain('Autorisation confirmée');
  });
});
