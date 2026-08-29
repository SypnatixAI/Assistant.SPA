import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ModelCatalogResponse } from '../../../domain/models/model-catalog';
import { PUBLIC_APP_CONFIG, PublicAppConfig } from '../../config/public-app-config';

@Injectable({ providedIn: 'root' })
export class ModelsApiService {
  constructor(
    private readonly httpClient: HttpClient,
    @Inject(PUBLIC_APP_CONFIG)
    private readonly publicAppConfig: PublicAppConfig,
  ) {}

  getAvailableModels(): Observable<ModelCatalogResponse> {
    const apiBaseUrl = this.publicAppConfig.apiBaseUrl.replace(/\/$/, '');

    return this.httpClient.get<ModelCatalogResponse>(`${apiBaseUrl}/api/models`);
  }
}
