import { Inject, Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { catchError, defaultIfEmpty, map, Observable, of, switchMap, throwError } from 'rxjs';

import { LaunchMode, PUBLIC_APP_CONFIG, PublicAppConfig } from '../../config/public-app-config';
import { AuthenticationNavigationService } from '../navigation/authentication-navigation.service';
import { AuthenticationProvider } from './authentication-provider';

@Injectable({ providedIn: 'root' })
export class MicrosoftEntraAuthenticationProvider implements AuthenticationProvider {
  readonly launchMode = LaunchMode.Certification;

  constructor(
    private readonly msalService: MsalService,
    @Inject(PUBLIC_APP_CONFIG)
    private readonly publicAppConfig: PublicAppConfig,
    private readonly authenticationNavigationService: AuthenticationNavigationService,
  ) {}

  initialize(): Observable<boolean> {
    return this.msalService.handleRedirectObservable().pipe(
      switchMap((result) => {
        const account = this.selectActiveAccount(result);
        return account === null ? of(false) : this.acquireToken(account);
      }),
      defaultIfEmpty(false),
    );
  }

  login(): Observable<boolean> {
    return this.authenticationNavigationService.login().pipe(
      map(() => false),
      defaultIfEmpty(false),
    );
  }

  logout(): Observable<void> {
    return this.authenticationNavigationService.logout(
      this.msalService.instance.getActiveAccount(),
    );
  }

  private selectActiveAccount(result: AuthenticationResult | null): AccountInfo | null {
    const account =
      result?.account ??
      this.msalService.instance.getActiveAccount() ??
      this.msalService.instance.getAllAccounts()[0] ??
      null;

    if (account !== null) {
      this.msalService.instance.setActiveAccount(account);
    }

    return account;
  }

  private acquireToken(account: AccountInfo): Observable<boolean> {
    return this.msalService
      .acquireTokenSilent({
        account,
        scopes: [this.publicAppConfig.entraScope],
      })
      .pipe(
        map(() => true),
        catchError((error: unknown) => {
          if (!(error instanceof InteractionRequiredAuthError)) {
            return throwError(() => error);
          }

          return this.authenticationNavigationService.requestTokenInteractively(account).pipe(
            map(() => false),
            defaultIfEmpty(false),
          );
        }),
      );
  }
}
