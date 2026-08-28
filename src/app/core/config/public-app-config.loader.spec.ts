import { loadPublicAppConfig } from './public-app-config.loader';
import { PublicAppConfig } from './public-app-config';

describe('loadPublicAppConfig', () => {
  const validConfig: PublicAppConfig = {
    apiBaseUrl: 'https://api.example.com',
    entraClientId: 'public-client-id',
    entraAuthority: 'https://login.microsoftonline.com/organizations',
    entraScope: 'api://public-client-id/access_as_user',
  };

  it('Given_ValidStaticConfig_When_loadPublicAppConfigIsCalled_Then_ConfigIsReturned', async () => {
    // Given
    const fetchImplementation = jasmine
      .createSpy<typeof fetch>('fetch')
      .and.resolveTo(createResponse(true, 200, validConfig));

    // When
    const result = await loadPublicAppConfig(fetchImplementation);

    // Then
    expect(fetchImplementation).toHaveBeenCalledWith(
      '/assets/config/config.json',
      { cache: 'no-store' },
    );
    expect(result).toEqual(validConfig);
  });

  it('Given_UnavailableStaticConfig_When_loadPublicAppConfigIsCalled_Then_ErrorIsThrown', async () => {
    // Given
    const fetchImplementation = jasmine
      .createSpy<typeof fetch>('fetch')
      .and.resolveTo(createResponse(false, 404, {}));

    // When
    const action = loadPublicAppConfig(fetchImplementation);

    // Then
    await expectAsync(action).toBeRejectedWithError(
      'Le chargement de la configuration publique a échoué (404).',
    );
  });

  it('Given_InvalidStaticConfig_When_loadPublicAppConfigIsCalled_Then_ErrorIsThrown', async () => {
    // Given
    const fetchImplementation = jasmine
      .createSpy<typeof fetch>('fetch')
      .and.resolveTo(createResponse(true, 200, { apiBaseUrl: '' }));

    // When
    const action = loadPublicAppConfig(fetchImplementation);

    // Then
    await expectAsync(action).toBeRejectedWithError(
      'La configuration publique est invalide.',
    );
  });
});

function createResponse(ok: boolean, status: number, body: unknown): Response {
  return {
    json: () => Promise.resolve(body),
    ok,
    status,
  } as Response;
}
