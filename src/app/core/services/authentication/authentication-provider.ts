import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { LaunchMode } from '../../config/public-app-config';

export interface AuthenticationProvider {
  readonly launchMode: LaunchMode;

  initialize(): Observable<boolean>;
  login(): Observable<boolean>;
  recover(): Observable<boolean>;
  logout(): Observable<void>;
}

export const AUTHENTICATION_PROVIDER = new InjectionToken<AuthenticationProvider>(
  'AUTHENTICATION_PROVIDER',
);
