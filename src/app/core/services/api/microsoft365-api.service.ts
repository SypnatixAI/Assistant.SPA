import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Microsoft365ConsentResponse,
  Microsoft365Drive,
  Microsoft365List,
  Microsoft365ListsResponse,
  Microsoft365OnboardingStatus,
  Microsoft365Site,
  Microsoft365SitesResponse,
} from '../../../domain/microsoft365/microsoft365';
import { PUBLIC_APP_CONFIG, PublicAppConfig } from '../../config/public-app-config';

@Injectable({ providedIn: 'root' })
export class Microsoft365ApiService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpClient: HttpClient,
    @Inject(PUBLIC_APP_CONFIG) publicAppConfig: PublicAppConfig,
  ) {
    this.baseUrl = `${publicAppConfig.apiBaseUrl.replace(/\/$/, '')}/api/microsoft365`;
  }

  startConsent(): Observable<Microsoft365ConsentResponse> {
    return this.httpClient.post<Microsoft365ConsentResponse>(`${this.baseUrl}/consent`, {});
  }

  getOnboardingStatus(): Observable<Microsoft365OnboardingStatus> {
    return this.httpClient.get<Microsoft365OnboardingStatus>(
      `${this.baseUrl}/onboarding`,
    );
  }

  getSites(): Observable<Microsoft365SitesResponse> {
    return this.httpClient.get<Microsoft365SitesResponse>(`${this.baseUrl}/sites`);
  }

  selectSite(siteId: string): Observable<Microsoft365Site> {
    return this.httpClient.post<Microsoft365Site>(
      `${this.baseUrl}/sites/${encodeURIComponent(siteId)}`,
      {},
    );
  }

  getDrives(siteId: string): Observable<readonly Microsoft365Drive[]> {
    return this.httpClient.get<readonly Microsoft365Drive[]>(
      `${this.baseUrl}/sites/${encodeURIComponent(siteId)}/drives`,
    );
  }

  getLists(siteId: string): Observable<Microsoft365ListsResponse> {
    return this.httpClient.get<Microsoft365ListsResponse>(
      `${this.baseUrl}/sites/${encodeURIComponent(siteId)}/lists`,
    );
  }

  setDriveIndexed(
    siteId: string,
    driveId: string,
    isIndexed: boolean,
  ): Observable<Microsoft365Drive> {
    return this.httpClient.patch<Microsoft365Drive>(
      `${this.baseUrl}/sites/${encodeURIComponent(siteId)}/drives/${encodeURIComponent(driveId)}`,
      { isIndexed },
    );
  }

  setListIndexed(
    siteId: string,
    listId: string,
    isIndexed: boolean,
  ): Observable<Microsoft365List> {
    return this.httpClient.patch<Microsoft365List>(
      `${this.baseUrl}/sites/${encodeURIComponent(siteId)}/lists/${encodeURIComponent(listId)}`,
      { isIndexed },
    );
  }
}
