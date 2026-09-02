import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface AuthenticationProvider {
  readonly isLocalAuthentication: boolean;

  initialize(): Observable<boolean>;
  login(): Observable<boolean>;
  recover(): Observable<boolean>;
  logout(): Observable<void>;
}

export const AUTHENTICATION_PROVIDER = new InjectionToken<AuthenticationProvider>(
  'AUTHENTICATION_PROVIDER',
);
