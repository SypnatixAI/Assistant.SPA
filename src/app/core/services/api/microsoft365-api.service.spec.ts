import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthenticationMode, LaunchMode, PUBLIC_APP_CONFIG } from '../../config/public-app-config';
import { Microsoft365ApiService } from './microsoft365-api.service';

describe('Microsoft365ApiService', () => {
  let httpTestingController: HttpTestingController;
  let service: Microsoft365ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        Microsoft365ApiService,
        {
          provide: PUBLIC_APP_CONFIG,
          useValue: {
            apiBaseUrl: 'https://api.example.com/',
            authenticationMode: AuthenticationMode.LocalJwt,
            authenticationUrl: '/local-auth/token',
            launchMode: LaunchMode.Dev,
            entraAuthority: '',
            entraClientId: '',
            entraScope: '',
          },
        },
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(Microsoft365ApiService);
  });

  afterEach(() => httpTestingController.verify());

  it('Given_Microsoft365Configuration_When_startConsentIsCalled_Then_ConsentIsRequested', async () => {
    // Given
    const response = { authorizationUrl: 'https://localhost:9443/consent' };

    // When
    const action = firstValueFrom(service.startConsent());
    const request = httpTestingController.expectOne(
      'https://api.example.com/api/microsoft365/consent',
    );
    request.flush(response);

    // Then
    await expectAsync(action).toBeResolvedTo(response);
    expect(request.request.method).toBe('POST');
  });

  it('Given_AuthenticatedSession_When_getOnboardingStatusIsCalled_Then_ProgressIsRequested', () => {
    // Given
    const status = {
      isAdministrator: true,
      connectionStatus: 'Active',
      isConsentComplete: true,
      hasSelectedSite: true,
      hasIndexedSource: false,
      isComplete: false,
    };

    // When
    service.getOnboardingStatus().subscribe();

    // Then
    const request = httpTestingController.expectOne(
      'https://api.example.com/api/microsoft365/onboarding',
    );
    expect(request.request.method).toBe('GET');
    request.flush(status);
  });

  it('Given_ACompositeSiteId_When_getDrivesIsCalled_Then_SiteIdIsEncoded', () => {
    // Given
    const siteId = 'tenant.example.com,site id,web id';

    // When
    service.getDrives(siteId).subscribe();

    // Then
    const request = httpTestingController.expectOne(
      'https://api.example.com/api/microsoft365/sites/tenant.example.com%2Csite%20id%2Cweb%20id/drives',
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('Given_AListSelection_When_setListIndexedIsCalled_Then_IndexingStateIsPatched', () => {
    // Given
    const siteId = 'site-id';
    const listId = 'list-id';

    // When
    service.setListIndexed(siteId, listId, true).subscribe();

    // Then
    const request = httpTestingController.expectOne(
      'https://api.example.com/api/microsoft365/sites/site-id/lists/list-id',
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ isIndexed: true });
    request.flush({
      siteId,
      listId,
      displayName: 'Liste',
      webUrl: null,
      status: 'Enabled',
      isIndexed: true,
    });
  });
});
