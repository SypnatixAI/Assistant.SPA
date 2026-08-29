import { HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';

import { LaunchMode, PublicAppConfig } from '../config/public-app-config';
import { LocalAccessTokenService } from '../services/authentication/local-access-token.service';
import { LocalJwtInterceptor } from './local-jwt.interceptor';

describe('LocalJwtInterceptor', () => {
  const publicAppConfig: PublicAppConfig = {
    apiBaseUrl: '/',
    authenticationUrl: '/local-auth/token',
    entraAuthority: '',
    entraClientId: '',
    entraScope: '',
    launchMode: LaunchMode.Local,
  };

  it('Given_LocalAccessToken_When_interceptIsCalled_Then_BearerTokenIsAddedToApiRequest', async () => {
    // Given
    const accessTokenService = new LocalAccessTokenService();
    accessTokenService.set('local-access-token');
    const document = {
      location: { origin: 'http://localhost:4200' },
    } as Document;
    const interceptor = new LocalJwtInterceptor(document, publicAppConfig, accessTokenService);
    let forwardedRequest: HttpRequest<unknown> | null = null;
    const next = {
      handle: (request: HttpRequest<unknown>) => {
        forwardedRequest = request;
        return of(new HttpResponse({ status: 200 }));
      },
    } as HttpHandler;

    // When
    await firstValueFrom(interceptor.intercept(new HttpRequest('GET', '/api/models'), next));

    // Then
    expect(forwardedRequest!.headers.get('Authorization')).toBe('Bearer local-access-token');
  });

  it('Given_LocalAccessToken_When_interceptIsCalledForMockIdentity_Then_BearerTokenIsNotAdded', async () => {
    // Given
    const accessTokenService = new LocalAccessTokenService();
    accessTokenService.set('local-access-token');
    const document = {
      location: { origin: 'http://localhost:4200' },
    } as Document;
    const interceptor = new LocalJwtInterceptor(document, publicAppConfig, accessTokenService);
    let forwardedRequest: HttpRequest<unknown> | null = null;
    const next = {
      handle: (request: HttpRequest<unknown>) => {
        forwardedRequest = request;
        return of(new HttpResponse({ status: 200 }));
      },
    } as HttpHandler;

    // When
    await firstValueFrom(interceptor.intercept(new HttpRequest('GET', '/local-auth/token'), next));

    // Then
    expect(forwardedRequest!.headers.has('Authorization')).toBeFalse();
  });
});
