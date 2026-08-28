import { computed, Inject, Injectable, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import {
  catchError,
  defaultIfEmpty,
  ignoreElements,
  lastValueFrom,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import {
  PUBLIC_APP_CONFIG,
  PublicAppConfig,
} from '../../config/public-app-config';
import { AuthenticatedSession } from '../../../domain/auth/authenticated-session';
import { AuthenticationApiService } from '../api/authentication-api.service';
import { TechnicalErrorService } from '../errors/technical-error.service';
import { AuthenticationNavigationService } from '../navigation/authentication-navigation.service';
import {
  getAuthenticationErrorMessage,
  isRecoverableAuthenticationError,
} from './authentication-error';

export type AuthenticationStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

interface AuthenticationState {
  readonly status: AuthenticationStatus;
  readonly session: AuthenticatedSession | null;
  readonly errorMessage: string | null;
}

const INITIAL_STATE: AuthenticationState = {
  errorMessage: null,
  session: null,
  status: 'loading',
};

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly state = signal<AuthenticationState>(INITIAL_STATE);

  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly isAuthenticated = computed(
    () => this.state().status === 'authenticated',
  );
  readonly session = computed(() => this.state().session);
  readonly status = computed(() => this.state().status);

  constructor(
    private readonly authenticationApiService: AuthenticationApiService,
    private readonly msalService: MsalService,
    @Inject(PUBLIC_APP_CONFIG)
    private readonly publicAppConfig: PublicAppConfig,
    private readonly authenticationNavigationService: AuthenticationNavigationService,
    private readonly technicalErrorService: TechnicalErrorService,
  ) {}

  async initialize(): Promise<void> {
    this.state.set(INITIAL_STATE);

    const initialization = this.msalService.handleRedirectObservable().pipe(
      switchMap((result) => this.initializeAssistantCoreSession(result)),
      catchError((error: unknown) => {
        this.handleError(error);
        return of(undefined);
      }),
      defaultIfEmpty(undefined),
    );

    await lastValueFrom(initialization);
  }

  login(): void {
    this.state.set(INITIAL_STATE);
    this.authenticationNavigationService
      .login()
      .subscribe({ error: (error: unknown) => this.handleError(error) });
  }

  logout(): void {
    this.state.set({
      errorMessage: null,
      session: null,
      status: 'unauthenticated',
    });
    this.authenticationNavigationService
      .logout(this.msalService.instance.getActiveAccount())
      .subscribe({ error: (error: unknown) => this.handleError(error) });
  }

  private initializeAssistantCoreSession(result: AuthenticationResult | null) {
    const account = this.selectActiveAccount(result);

    if (account === null) {
      this.state.set({
        errorMessage: null,
        session: null,
        status: 'unauthenticated',
      });
      return of(undefined);
    }

    return this.acquireAssistantCoreToken(account).pipe(
      switchMap(() => this.authenticationApiService.authenticateUser()),
      tap((session) => {
        this.state.set({
          errorMessage: null,
          session,
          status: 'authenticated',
        });
      }),
    );
  }

  private selectActiveAccount(
    result: AuthenticationResult | null,
  ): AccountInfo | null {
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

  private acquireAssistantCoreToken(account: AccountInfo) {
    return this.msalService
      .acquireTokenSilent({
        account,
        scopes: [this.publicAppConfig.entraScope],
      })
      .pipe(
        catchError((error: unknown) => {
          if (!(error instanceof InteractionRequiredAuthError)) {
            return throwError(() => error);
          }

          return this.authenticationNavigationService
            .requestTokenInteractively(account)
            .pipe(ignoreElements());
        }),
      );
  }

  private setError(error: unknown): void {
    this.state.set({
      errorMessage: getAuthenticationErrorMessage(error),
      session: null,
      status: 'error',
    });
  }

  private handleError(error: unknown): void {
    if (isRecoverableAuthenticationError(error)) {
      this.setError(error);
      return;
    }

    this.technicalErrorService.report(error);
  }
}
