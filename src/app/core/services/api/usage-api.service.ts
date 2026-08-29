import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { TokenUsageResponse } from '../../../domain/usage/token-usage';
import { PUBLIC_APP_CONFIG, PublicAppConfig } from '../../config/public-app-config';

@Injectable({ providedIn: 'root' })
export class UsageApiService {
  constructor(
    private readonly httpClient: HttpClient,
    @Inject(PUBLIC_APP_CONFIG)
    private readonly publicAppConfig: PublicAppConfig,
  ) {}

  getTokenUsage(): Observable<TokenUsageResponse> {
    const apiBaseUrl = this.publicAppConfig.apiBaseUrl.replace(/\/$/, '');

    return this.httpClient.get<TokenUsageResponse>(`${apiBaseUrl}/api/usage`);
  }
}
