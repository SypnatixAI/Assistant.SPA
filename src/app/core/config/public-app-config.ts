import { InjectionToken } from '@angular/core';

export enum LaunchMode {
  Dev = 'Dev',
  Certification = 'Certification',
}

export enum AuthenticationMode {
  LocalJwt = 'LocalJwt',
  MicrosoftEntra = 'MicrosoftEntra',
}

export interface PublicAppConfig {
  readonly apiBaseUrl: string;
  readonly authenticationMode: AuthenticationMode;
  readonly authenticationUrl: string;
  readonly launchMode: LaunchMode;
  readonly entraClientId: string;
  readonly entraAuthority: string;
  readonly entraScope: string;
}

export const PUBLIC_APP_CONFIG = new InjectionToken<PublicAppConfig>('PUBLIC_APP_CONFIG');
