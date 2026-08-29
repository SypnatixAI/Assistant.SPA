import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

export const APPLICATION_ROUTES = {
  chat: '/chat',
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

  getChatAbsoluteUrl(): string {
    return this.getAbsoluteUrl(APPLICATION_ROUTES.chat);
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

  navigateToChat(): void {
    void this.router.navigateByUrl(APPLICATION_ROUTES.chat);
  }

  reloadApplication(): void {
    this.document.location.reload();
  }
}
