import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PUBLIC_APP_CONFIG,
  PublicAppConfig,
} from '../../config/public-app-config';
import { AuthenticatedSession } from '../../../domain/auth/authenticated-session';

@Injectable({ providedIn: 'root' })
export class AuthenticationApiService {
  constructor(
    private readonly httpClient: HttpClient,
    @Inject(PUBLIC_APP_CONFIG)
    private readonly publicAppConfig: PublicAppConfig,
  ) {}

  authenticateUser(): Observable<AuthenticatedSession> {
    const apiBaseUrl = this.publicAppConfig.apiBaseUrl.replace(/\/$/, '');

    return this.httpClient.get<AuthenticatedSession>(
      `${apiBaseUrl}/api/core/authenticateUser`,
    );
  }
}
