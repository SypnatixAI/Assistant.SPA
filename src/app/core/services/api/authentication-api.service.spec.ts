import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthenticationMode, LaunchMode, PUBLIC_APP_CONFIG } from '../../config/public-app-config';
import { AuthenticatedSession } from '../../../domain/auth/authenticated-session';
import { AuthenticationApiService } from './authentication-api.service';

describe('AuthenticationApiService', () => {
  const session: AuthenticatedSession = {
    organization: { id: 'organization-id', name: 'MetalPro' },
    roles: ['User'],
    user: {
      displayName: 'Marc Tremblay',
      email: 'marc@metalpro.com',
      id: 'user-id',
    },
  };

  it('Given_AuthenticatedUser_When_authenticateUserIsCalled_Then_SessionIsReturned', async () => {
    // Given
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthenticationApiService,
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
    const service = TestBed.inject(AuthenticationApiService);
    const httpTestingController = TestBed.inject(HttpTestingController);

    // When
    const action = firstValueFrom(service.authenticateUser());
    const request = httpTestingController.expectOne(
      'https://api.example.com/api/core/authenticateUser',
    );
    request.flush(session);

    // Then
    await expectAsync(action).toBeResolvedTo(session);
    expect(request.request.method).toBe('GET');
    httpTestingController.verify();
  });
});
