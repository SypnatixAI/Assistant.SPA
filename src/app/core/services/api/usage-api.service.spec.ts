import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthenticationMode, LaunchMode, PUBLIC_APP_CONFIG } from '../../config/public-app-config';
import { TokenUsageResponse } from '../../../domain/usage/token-usage';
import { UsageApiService } from './usage-api.service';

describe('UsageApiService', () => {
  it('Given_AConfiguredApi_When_getTokenUsageIsCalled_Then_UsageIsRequested', async () => {
    // Given
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UsageApiService,
        {
          provide: PUBLIC_APP_CONFIG,
          useValue: {
            apiBaseUrl: 'https://api.example.com/',
            authenticationMode: AuthenticationMode.MicrosoftEntra,
            authenticationUrl: '/local-auth/token',
            launchMode: LaunchMode.Certification,
            entraAuthority: 'https://login.microsoftonline.com/organizations',
            entraClientId: 'client-id',
            entraScope: 'api://api-client-id/access_as_user',
          },
        },
      ],
    });
    const service = TestBed.inject(UsageApiService);
    const httpTestingController = TestBed.inject(HttpTestingController);
    const response: TokenUsageResponse = {
      periodStartsAt: '2026-08-01T00:00:00Z',
      periodEndsAt: '2026-09-01T00:00:00Z',
      tokenLimit: 1_000_000,
      tokensUsed: 428_000,
      tokensRemaining: 572_000,
      isExhausted: false,
    };

    // When
    const action = firstValueFrom(service.getTokenUsage());
    const request = httpTestingController.expectOne('https://api.example.com/api/usage');
    request.flush(response);

    // Then
    await expectAsync(action).toBeResolvedTo(response);
    expect(request.request.method).toBe('GET');
    httpTestingController.verify();
  });
});
