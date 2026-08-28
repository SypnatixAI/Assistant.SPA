import { InjectionToken } from '@angular/core';

export interface PublicAppConfig {
  readonly apiBaseUrl: string;
  readonly entraClientId: string;
  readonly entraAuthority: string;
  readonly entraScope: string;
}

export const PUBLIC_APP_CONFIG = new InjectionToken<PublicAppConfig>(
  'PUBLIC_APP_CONFIG',
);
