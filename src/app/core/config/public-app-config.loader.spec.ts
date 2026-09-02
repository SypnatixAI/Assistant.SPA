import { loadPublicAppConfig } from './public-app-config.loader';
import { AuthenticationMode, LaunchMode, PublicAppConfig } from './public-app-config';

describe('loadPublicAppConfig', () => {
  const validConfig: PublicAppConfig = {
    apiBaseUrl: 'https://api.example.com',
    authenticationMode: AuthenticationMode.MicrosoftEntra,
    authenticationUrl: '/local-auth/token',
    launchMode: LaunchMode.Certification,
    entraClientId: 'public-client-id',
    entraAuthority: 'https://login.microsoftonline.com/organizations',
    entraScope: 'api://public-client-id/access_as_user',
  };

  it('Given_ValidLocalConfig_When_loadPublicAppConfigIsCalled_Then_ConfigIsReturned', async () => {
    // Given
    const localConfig: PublicAppConfig = {
      apiBaseUrl: '/',
      authenticationMode: AuthenticationMode.LocalJwt,
      authenticationUrl: '/local-auth/token',
      entraAuthority: '',
      entraClientId: '',
      entraScope: '',
      launchMode: LaunchMode.Dev,
    };
    const fetchImplementation = jasmine
      .createSpy<typeof fetch>('fetch')
      .and.resolveTo(createResponse(true, 200, localConfig));

    // When
    const result = await loadPublicAppConfig(fetchImplementation);

    // Then
    expect(result).toEqual(localConfig);
  });

  it('Given_ValidStaticConfig_When_loadPublicAppConfigIsCalled_Then_ConfigIsReturned', async () => {
    // Given
    const fetchImplementation = jasmine
      .createSpy<typeof fetch>('fetch')
      .and.resolveTo(createResponse(true, 200, validConfig));

    // When
    const result = await loadPublicAppConfig(fetchImplementation);

    // Then
    expect(fetchImplementation).toHaveBeenCalledWith('/assets/config/config.json', {
      cache: 'no-store',
    });
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
    await expectAsync(action).toBeRejectedWithError('La configuration publique est invalide.');
  });

  it('Given_CertificationConfigWithPlaceholder_When_loadPublicAppConfigIsCalled_Then_ErrorIsThrown', async () => {
    // Given
    const fetchImplementation = jasmine.createSpy<typeof fetch>('fetch').and.resolveTo(
      createResponse(true, 200, {
        ...validConfig,
        entraClientId: 'replace-with-public-client-id',
      }),
    );

    // When
    const action = loadPublicAppConfig(fetchImplementation);

    // Then
    await expectAsync(action).toBeRejectedWithError('La configuration publique est invalide.');
  });

  it('Given_LocalConfigWithoutTokenUrl_When_loadPublicAppConfigIsCalled_Then_ErrorIsThrown', async () => {
    // Given
    const fetchImplementation = jasmine.createSpy<typeof fetch>('fetch').and.resolveTo(
      createResponse(true, 200, {
        apiBaseUrl: '/',
        authenticationMode: AuthenticationMode.LocalJwt,
        launchMode: LaunchMode.Dev,
      }),
    );

    // When
    const action = loadPublicAppConfig(fetchImplementation);

    // Then
    await expectAsync(action).toBeRejectedWithError('La configuration publique est invalide.');
  });
});

function createResponse(ok: boolean, status: number, body: unknown): Response {
  return {
    json: () => Promise.resolve(body),
    ok,
    status,
  } as Response;
}
