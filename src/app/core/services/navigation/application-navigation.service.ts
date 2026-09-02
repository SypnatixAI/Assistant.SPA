import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

export const APPLICATION_ROUTES = {
  accessDenied: '/access-denied',
  chat: '/chat',
  login: '/login',
  microsoft365Administration: '/administration/microsoft365',
  onboarding: '/onboarding',
  technicalError: '/technical-error',
} as const;

@Injectable({ providedIn: 'root' })
export class ApplicationNavigationService {
  constructor(
    private readonly router: Router,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  createLoginUrlTree(): UrlTree {
    return this.router.createUrlTree([APPLICATION_ROUTES.login]);
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
    return this.getAbsoluteUrl(APPLICATION_ROUTES.login);
  }

  getCurrentAbsoluteUrl(): string {
    return this.getAbsoluteUrl(this.router.url);
  }

  getAbsoluteUrl(path: string): string {
    return new URL(path, this.document.location.origin).toString();
  }

  navigateToTechnicalError(): void {
    if (this.router.url === APPLICATION_ROUTES.technicalError) {
      return;
    }

    void this.router.navigateByUrl(APPLICATION_ROUTES.technicalError);
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

  reloadApplication(): void {
    this.document.location.reload();
  }
}
