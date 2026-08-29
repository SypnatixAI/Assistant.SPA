import { getSafeExternalUrl } from './safe-external-url';

describe('getSafeExternalUrl', () => {
  it('Given_AnHttpsUrl_When_getSafeExternalUrl_Then_ReturnsTheNormalizedUrl', () => {
    // Given
    const url = 'https://contoso.sharepoint.com/politique';

    // When
    const result = getSafeExternalUrl(url);

    // Then
    expect(result).toBe(url);
  });

  it('Given_AnUnsafeUrl_When_getSafeExternalUrl_Then_ReturnsNull', () => {
    // Given
    const url = 'javascript:alert(1)';

    // When
    const result = getSafeExternalUrl(url);

    // Then
    expect(result).toBeNull();
  });
});
