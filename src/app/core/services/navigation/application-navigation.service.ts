import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

export const APPLICATION_ROUTES = {
  application: '/app',
  login: '/login',
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

  createTechnicalErrorUrlTree(): UrlTree {
    return this.router.createUrlTree([APPLICATION_ROUTES.technicalError]);
  }

  getApplicationAbsoluteUrl(): string {
    return this.getAbsoluteUrl(APPLICATION_ROUTES.application);
  }

  getLoginAbsoluteUrl(): string {
    return this.getAbsoluteUrl(APPLICATION_ROUTES.login);
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

  navigateToApplication(): void {
    void this.router.navigateByUrl(APPLICATION_ROUTES.application);
  }

  reloadApplication(): void {
    this.document.location.reload();
  }
}
