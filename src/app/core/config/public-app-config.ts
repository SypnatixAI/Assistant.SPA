import { InjectionToken } from '@angular/core';

export enum LaunchMode {
  Local = 'Local',
  Certification = 'Certification',
}

export interface PublicAppConfig {
  readonly apiBaseUrl: string;
  readonly authenticationUrl: string;
  readonly launchMode: LaunchMode;
  readonly entraClientId: string;
  readonly entraAuthority: string;
  readonly entraScope: string;
}

export const PUBLIC_APP_CONFIG = new InjectionToken<PublicAppConfig>('PUBLIC_APP_CONFIG');
