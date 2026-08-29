import { computed, Inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  defaultIfEmpty,
  lastValueFrom,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { AuthenticatedSession } from '../../../domain/auth/authenticated-session';
import { ApiError } from '../../../domain/errors/api-error';
import { LaunchMode } from '../../config/public-app-config';
import { AuthenticationApiService } from '../api/authentication-api.service';
import { TechnicalErrorService } from '../errors/technical-error.service';
import { AUTHENTICATION_PROVIDER, AuthenticationProvider } from './authentication-provider';
import {
  getAuthenticationErrorMessage,
  isRecoverableAuthenticationError,
} from './authentication-error';
import { AuthenticationStatus } from './authentication-status';

interface AuthenticationState {
  readonly status: AuthenticationStatus;
  readonly session: AuthenticatedSession | null;
  readonly errorMessage: string | null;
}

const INITIAL_STATE: AuthenticationState = {
  errorMessage: null,
  session: null,
  status: AuthenticationStatus.Loading,
};

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly state = signal<AuthenticationState>(INITIAL_STATE);

  readonly errorMessage = computed(() => this.state().errorMessage);
  readonly isAuthenticated = computed(
    () => this.state().status === AuthenticationStatus.Authenticated,
  );
  readonly isLocalAuthentication: boolean;
  readonly session = computed(() => this.state().session);
  readonly status = computed(() => this.state().status);

  constructor(
    private readonly authenticationApiService: AuthenticationApiService,
    @Inject(AUTHENTICATION_PROVIDER)
    private readonly authenticationProvider: AuthenticationProvider,
    private readonly technicalErrorService: TechnicalErrorService,
  ) {
    this.isLocalAuthentication = authenticationProvider.launchMode === LaunchMode.Local;
  }

  async initialize(): Promise<void> {
    this.state.set(INITIAL_STATE);

    const initialization = this.authenticationProvider.initialize().pipe(
      switchMap((hasAccessToken) =>
        hasAccessToken ? this.initializeAssistantCoreSession() : this.setUnauthenticated(),
      ),
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
    this.authenticationProvider
      .login()
      .pipe(
        switchMap((hasAccessToken) =>
          hasAccessToken ? this.initializeAssistantCoreSession() : of(undefined),
        ),
      )
      .subscribe({ error: (error: unknown) => this.handleError(error) });
  }

  logout(): void {
    this.state.set({
      errorMessage: null,
      session: null,
      status: AuthenticationStatus.Unauthenticated,
    });
    this.authenticationProvider
      .logout()
      .subscribe({ error: (error: unknown) => this.handleError(error) });
  }

  private initializeAssistantCoreSession(
    canRecover = true,
  ): Observable<AuthenticatedSession | undefined> {
    return this.authenticationApiService.authenticateUser().pipe(
      tap((session) => {
        this.state.set({
          errorMessage: null,
          session,
          status: AuthenticationStatus.Authenticated,
        });
      }),
      catchError((error: unknown) => {
        if (!(error instanceof ApiError) || error.status !== 401 || !canRecover) {
          return throwError(() => error);
        }

        return this.authenticationProvider.recover().pipe(
          switchMap((hasAccessToken) =>
            hasAccessToken
              ? this.initializeAssistantCoreSession(false)
              : this.setUnauthenticated(),
          ),
        );
      }),
    );
  }

  private setUnauthenticated(errorMessage: string | null = null) {
    this.state.set({
      errorMessage,
      session: null,
      status: AuthenticationStatus.Unauthenticated,
    });
    return of(undefined);
  }

  private setError(error: unknown): void {
    this.state.set({
      errorMessage: getAuthenticationErrorMessage(error),
      session: null,
      status: AuthenticationStatus.Error,
    });
  }

  private handleError(error: unknown): void {
    if (error instanceof ApiError && error.status === 403) {
      this.state.set({
        errorMessage: getAuthenticationErrorMessage(error),
        session: null,
        status: AuthenticationStatus.Forbidden,
      });
      return;
    }

    if (error instanceof ApiError && error.status === 401) {
      this.setUnauthenticated(getAuthenticationErrorMessage(error));
      return;
    }

    if (isRecoverableAuthenticationError(error)) {
      this.setError(error);
      return;
    }

    this.technicalErrorService.report(error);
  }
}
