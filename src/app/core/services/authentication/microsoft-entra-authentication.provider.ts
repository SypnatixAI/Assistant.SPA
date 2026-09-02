import { Inject, Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { catchError, defaultIfEmpty, map, Observable, of, switchMap, throwError } from 'rxjs';

import { PUBLIC_APP_CONFIG, PublicAppConfig } from '../../config/public-app-config';
import { AuthenticationNavigationService } from '../navigation/authentication-navigation.service';
import { AuthenticationProvider } from './authentication-provider';

@Injectable({ providedIn: 'root' })
export class MicrosoftEntraAuthenticationProvider implements AuthenticationProvider {
  readonly isLocalAuthentication = false;

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

  login(redirectStartPage?: string): Observable<boolean> {
    return this.authenticationNavigationService.login(redirectStartPage).pipe(
      map(() => false),
      defaultIfEmpty(false),
    );
  }

  recover(redirectStartPage?: string): Observable<boolean> {
    const account = this.msalService.instance.getActiveAccount();
    if (account === null) {
      return this.login(redirectStartPage);
    }

    return this.acquireToken(account, true, redirectStartPage);
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

  private acquireToken(
    account: AccountInfo,
    forceRefresh = false,
    redirectStartPage?: string,
  ): Observable<boolean> {
    return this.msalService
      .acquireTokenSilent({
        account,
        forceRefresh,
        scopes: [this.publicAppConfig.entraScope],
      })
      .pipe(
        map(() => true),
        catchError((error: unknown) => {
          if (!(error instanceof InteractionRequiredAuthError)) {
            return throwError(() => error);
          }

          return this.authenticationNavigationService
            .requestTokenInteractively(account, redirectStartPage)
            .pipe(
              map(() => false),
              defaultIfEmpty(false),
            );
        }),
      );
  }
}
