import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PUBLIC_APP_CONFIG, PublicAppConfig } from '../../config/public-app-config';

export interface MockAccessTokenResponse {
  readonly access_token: string;
  readonly expires_in: number;
  readonly token_type: string;
}

@Injectable({ providedIn: 'root' })
export class MockAuthenticationApiService {
  constructor(
    private readonly httpClient: HttpClient,
    @Inject(PUBLIC_APP_CONFIG)
    private readonly publicAppConfig: PublicAppConfig,
  ) {}

  getAccessToken(): Observable<MockAccessTokenResponse> {
    return this.httpClient.get<MockAccessTokenResponse>(this.publicAppConfig.authenticationUrl);
  }
}
