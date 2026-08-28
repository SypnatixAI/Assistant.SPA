import { PublicAppConfig } from './public-app-config';

const PUBLIC_APP_CONFIG_PATH = '/assets/config/config.json';

export async function loadPublicAppConfig(
  fetchImplementation: typeof fetch = fetch,
): Promise<PublicAppConfig> {
  const response = await fetchImplementation(PUBLIC_APP_CONFIG_PATH, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Le chargement de la configuration publique a échoué (${response.status}).`,
    );
  }

  const config: unknown = await response.json();

  if (!isPublicAppConfig(config)) {
    throw new Error('La configuration publique est invalide.');
  }

  return config;
}

function isPublicAppConfig(value: unknown): value is PublicAppConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const config = value as Record<keyof PublicAppConfig, unknown>;

  return [
    config.apiBaseUrl,
    config.entraClientId,
    config.entraAuthority,
    config.entraScope,
  ].every((property) => typeof property === 'string' && property.length > 0);
}
