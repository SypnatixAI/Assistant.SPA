import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';

import { MockAuthenticationApiService } from '../api/mock-authentication-api.service';
import { AuthenticationProvider } from './authentication-provider';
import { LocalAccessTokenService } from './local-access-token.service';

@Injectable({ providedIn: 'root' })
export class LocalJwtAuthenticationProvider implements AuthenticationProvider {
  readonly isLocalAuthentication = true;

  constructor(
    private readonly mockAuthenticationApiService: MockAuthenticationApiService,
    private readonly localAccessTokenService: LocalAccessTokenService,
  ) {}

  initialize(): Observable<boolean> {
    return of(this.localAccessTokenService.get() !== null);
  }

  login(): Observable<boolean> {
    return this.mockAuthenticationApiService.getAccessToken().pipe(
      map((response) => {
        this.localAccessTokenService.set(response.access_token);
        return true;
      }),
    );
  }

  recover(): Observable<boolean> {
    this.localAccessTokenService.clear();
    return this.login();
  }

  logout(): Observable<void> {
    this.localAccessTokenService.clear();
    return of(undefined);
  }
}
