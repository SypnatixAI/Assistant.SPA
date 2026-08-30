import { LaunchMode, PublicAppConfig } from './public-app-config';
import { PUBLIC_APP_CONFIG_PATH } from './public-app-config-path';

export async function loadPublicAppConfig(
  fetchImplementation: typeof fetch = fetch,
): Promise<PublicAppConfig> {
  const response = await fetchImplementation(PUBLIC_APP_CONFIG_PATH, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Le chargement de la configuration publique a échoué (${response.status}).`);
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
  if (!isNonEmptyString(config.apiBaseUrl) || !isNonEmptyString(config.authenticationUrl)) {
    return false;
  }

  if (config.launchMode === LaunchMode.Local) {
    return true;
  }

  return (
    config.launchMode === LaunchMode.Certification &&
    isConfiguredValue(config.entraClientId) &&
    isConfiguredValue(config.entraAuthority) &&
    isConfiguredValue(config.entraScope)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isConfiguredValue(value: unknown): value is string {
  return isNonEmptyString(value) && !value.startsWith('replace-with-');
}
