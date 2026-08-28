import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { LoginPage } from './features/auth/pages/login-page/login-page';
import { NotFoundPage } from './shared/pages/not-found-page/not-found-page';
import { routes } from './app.routes';
import { AuthenticationService } from './core/services/authentication/authentication.service';
import { TechnicalErrorService } from './core/services/errors/technical-error.service';
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
            status: () => 'unauthenticated',
          },
        },
        {
          provide: TechnicalErrorService,
          useValue: { hasTechnicalError: () => false },
        },
      ],
    });
  });

  it('Given_PublicRoute_When_NavigateByUrlIsCalled_Then_LoginPageIsDisplayed', async () => {
    // Given
    const harness = await RouterTestingHarness.create();

    // When
    await harness.navigateByUrl('/login', LoginPage);

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
    await harness.navigateByUrl('/app', LoginPage);

    // Then
    expect(location.path()).toBe('/login');
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
});
