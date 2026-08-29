import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { LaunchMode, PUBLIC_APP_CONFIG } from '../../config/public-app-config';
import { MockAuthenticationApiService } from './mock-authentication-api.service';

describe('MockAuthenticationApiService', () => {
  it('Given_MockAuthenticationUrl_When_getAccessTokenIsCalled_Then_TokenIsReturned', async () => {
    // Given
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MockAuthenticationApiService,
        {
          provide: PUBLIC_APP_CONFIG,
          useValue: {
            apiBaseUrl: '/',
            authenticationUrl: '/local-auth/token',
            entraAuthority: '',
            entraClientId: '',
            entraScope: '',
            launchMode: LaunchMode.Local,
          },
        },
      ],
    });
    const service = TestBed.inject(MockAuthenticationApiService);
    const httpTestingController = TestBed.inject(HttpTestingController);
    const response = {
      access_token: 'mock-access-token',
      expires_in: 3600,
      token_type: 'Bearer',
    };

    // When
    const action = firstValueFrom(service.getAccessToken());
    const request = httpTestingController.expectOne('/local-auth/token');
    request.flush(response);

    // Then
    await expectAsync(action).toBeResolvedTo(response);
    expect(request.request.method).toBe('GET');
    httpTestingController.verify();
  });
});
