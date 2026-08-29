import { firstValueFrom, of } from 'rxjs';

import { MockAuthenticationApiService } from '../api/mock-authentication-api.service';
import { LocalAccessTokenService } from './local-access-token.service';
import { LocalJwtAuthenticationProvider } from './local-jwt-authentication.provider';

describe('LocalJwtAuthenticationProvider', () => {
  it('Given_LocalIdentity_When_loginIsCalled_Then_AccessTokenIsKeptInMemory', async () => {
    // Given
    const mockAuthenticationApiService = {
      getAccessToken: jasmine.createSpy('getAccessToken').and.returnValue(
        of({
          access_token: 'local-access-token',
          expires_in: 28_800,
          token_type: 'Bearer',
        }),
      ),
    } as unknown as MockAuthenticationApiService;
    const localAccessTokenService = new LocalAccessTokenService();
    const provider = new LocalJwtAuthenticationProvider(
      mockAuthenticationApiService,
      localAccessTokenService,
    );

    // When
    const authenticated = await firstValueFrom(provider.login());

    // Then
    expect(authenticated).toBeTrue();
    expect(localAccessTokenService.get()).toBe('local-access-token');
  });

  it('Given_LocalAccessToken_When_logoutIsCalled_Then_AccessTokenIsRemoved', async () => {
    // Given
    const localAccessTokenService = new LocalAccessTokenService();
    localAccessTokenService.set('local-access-token');
    const provider = new LocalJwtAuthenticationProvider(
      {} as MockAuthenticationApiService,
      localAccessTokenService,
    );

    // When
    await firstValueFrom(provider.logout());

    // Then
    expect(localAccessTokenService.get()).toBeNull();
  });
});
