import { DOCUMENT } from '@angular/common';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PUBLIC_APP_CONFIG, PublicAppConfig } from '../config/public-app-config';
import { LocalAccessTokenService } from '../services/authentication/local-access-token.service';

@Injectable()
export class LocalJwtInterceptor implements HttpInterceptor {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PUBLIC_APP_CONFIG)
    private readonly publicAppConfig: PublicAppConfig,
    private readonly localAccessTokenService: LocalAccessTokenService,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const accessToken = this.localAccessTokenService.get();
    if (accessToken === null || !this.isAssistantCoreApiRequest(request.url)) {
      return next.handle(request);
    }

    return next.handle(request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }));
  }

  private isAssistantCoreApiRequest(requestUrl: string): boolean {
    const origin = this.document.location.origin;
    const apiBaseUrl = new URL(this.publicAppConfig.apiBaseUrl, origin);
    const resolvedRequestUrl = new URL(requestUrl, origin);
    const apiPath = `${apiBaseUrl.pathname.replace(/\/$/, '')}/api/`;

    return (
      resolvedRequestUrl.origin === apiBaseUrl.origin &&
      resolvedRequestUrl.pathname.startsWith(apiPath)
    );
  }
}
