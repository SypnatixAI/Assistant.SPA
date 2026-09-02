import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

export const APPLICATION_ROUTES = {
  accessDenied: '/auth/forbidden',
  chat: '/app/chat',
  microsoft365Administration: '/app/settings/microsoft365',
  microsoftCallback: '/auth/microsoft/callback',
  onboarding: '/setup',
  signIn: '/auth/sign-in',
  technicalError: '/technical-error',
} as const;

/**
 * Adresse enregistrée comme redirect URI dans l'App Registration Entra. Elle
 * reste distincte de `signIn` tant que le portail n'a pas été mis à jour :
 * MSAL exige une correspondance exacte. Une fois les URIs Entra alignées sur
 * `/auth/sign-in`, cette constante peut pointer sur `APPLICATION_ROUTES.signIn`
 * et la route `/login` devenir une simple redirection.
 */
export const ENTRA_REDIRECT_ROUTE = '/login';

@Injectable({ providedIn: 'root' })
export class ApplicationNavigationService {
  constructor(
    private readonly router: Router,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  createLoginUrlTree(): UrlTree {
    return this.router.createUrlTree([APPLICATION_ROUTES.signIn]);
  }

  createAccessDeniedUrlTree(): UrlTree {
    return this.router.createUrlTree([APPLICATION_ROUTES.accessDenied]);
  }

  createTechnicalErrorUrlTree(): UrlTree {
    return this.router.createUrlTree([APPLICATION_ROUTES.technicalError]);
  }

  createOnboardingUrlTree(): UrlTree {
    return this.router.createUrlTree([APPLICATION_ROUTES.onboarding]);
  }

  getChatAbsoluteUrl(): string {
    return this.getAbsoluteUrl(APPLICATION_ROUTES.chat);
  }

  getOnboardingAbsoluteUrl(): string {
    return this.getAbsoluteUrl(APPLICATION_ROUTES.onboarding);
  }

  getLoginAbsoluteUrl(): string {
    return this.getAbsoluteUrl(ENTRA_REDIRECT_ROUTE);
  }

  getCurrentAbsoluteUrl(): string {
    return this.getAbsoluteUrl(this.router.url);
  }

  getAbsoluteUrl(path: string): string {
    return new URL(path, this.document.location.origin).toString();
  }

  navigateToTechnicalError(): void {
    if (
      this.router.url === APPLICATION_ROUTES.technicalError ||
      this.router.url.startsWith(`${APPLICATION_ROUTES.technicalError}?`)
    ) {
      return;
    }

    void this.router.navigateByUrl(
      this.router.createUrlTree([APPLICATION_ROUTES.technicalError], {
        queryParams: { returnUrl: this.router.url },
      }),
    );
  }

  navigateToAccessDenied(): void {
    if (this.router.url === APPLICATION_ROUTES.accessDenied) {
      return;
    }

    void this.router.navigateByUrl(APPLICATION_ROUTES.accessDenied);
  }

  navigateToChat(): void {
    void this.router.navigateByUrl(APPLICATION_ROUTES.chat);
  }

  navigateToOnboarding(): void {
    void this.router.navigateByUrl(APPLICATION_ROUTES.onboarding);
  }

  navigateToExternalHttpsUrl(absoluteUrl: string): void {
    const url = new URL(absoluteUrl);
    if (url.protocol !== 'https:') {
      throw new Error('External navigation requires an HTTPS URL.');
    }

    this.document.location.assign(url.href);
  }

  reloadApplication(returnUrl: string | null = null): void {
    if (returnUrl !== null && this.isApplicationUrl(returnUrl)) {
      this.document.location.assign(returnUrl);
      return;
    }

    this.document.location.reload();
  }

  private isApplicationUrl(url: string): boolean {
    const resolvedUrl = new URL(url, this.document.location.origin);

    return resolvedUrl.origin === this.document.location.origin;
  }
}
