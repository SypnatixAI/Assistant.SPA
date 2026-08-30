import { LocalAccessTokenService } from './local-access-token.service';

describe('LocalAccessTokenService', () => {
  let service: LocalAccessTokenService;

  beforeEach(() => {
    service = new LocalAccessTokenService();
    service.clear();
  });

  afterEach(() => service.clear());

  it('Given_LocalAccessToken_When_NewServiceReadsToken_Then_TokenSurvivesReload', () => {
    // Given
    service.set('local-access-token');

    // When
    const token = new LocalAccessTokenService().get();

    // Then
    expect(token).toBe('local-access-token');
  });

  it('Given_LocalAccessToken_When_clearIsCalled_Then_TokenIsRemoved', () => {
    // Given
    service.set('local-access-token');

    // When
    service.clear();

    // Then
    expect(service.get()).toBeNull();
  });

  it('Given_EmptyAccessToken_When_setIsCalled_Then_ErrorIsThrown', () => {
    // Given
    const emptyAccessToken = '';

    // When / Then
    expect(() => service.set(emptyAccessToken)).toThrowError(
      'The local access token cannot be empty.',
    );
  });
});
