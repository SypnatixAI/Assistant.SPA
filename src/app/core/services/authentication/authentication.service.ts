import { computed, Inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  defaultIfEmpty,
  finalize,
  lastValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { AuthenticatedSession } from '../../../domain/auth/authenticated-session';
import { ApiError } from '../../../domain/errors/api-error';
import { AuthenticationApiService } from '../api/authentication-api.service';
import { TechnicalErrorService } from '../errors/technical-error.service';
import { ApplicationNavigationService } from '../navigation/application-navigation.service';
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

const SESSION_RECOVERY_ERROR_MESSAGE =
  'Votre session n’a pas pu être rétablie. Reconnectez-vous ou contactez votre administrateur.';

const INITIAL_STATE: AuthenticationState = {
  errorMessage: null,
  session: null,
  status: AuthenticationStatus.Loading,
};

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private loginInProgress = false;
  private unauthorizedRecovery: Observable<boolean> | null = null;
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
    private readonly applicationNavigationService: ApplicationNavigationService,
  ) {
    this.isLocalAuthentication = authenticationProvider.isLocalAuthentication;
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
    if (this.loginInProgress) {
      return;
    }

    this.loginInProgress = true;
    this.state.set(INITIAL_STATE);
    this.authenticationProvider
      .login()
      .pipe(
        switchMap((hasAccessToken) =>
          hasAccessToken ? this.initializeAssistantCoreSession() : of(undefined),
        ),
      )
      .subscribe({
        error: (error: unknown) => {
          this.loginInProgress = false;
          this.handleError(error);
        },
      });
  }

  /**
   * Point d'entrée central des 401 reçus pendant l'utilisation normale de
   * l'application. Les appels simultanés partagent la même tentative afin de
   * ne jamais déclencher plusieurs redirections concurrentes.
   *
   * Retourne `true` lorsque la session a été reconstruite et que l'appel
   * d'origine peut être rejoué.
   */
  handleUnauthorized(): Observable<boolean> {
    if (this.unauthorizedRecovery !== null) {
      return this.unauthorizedRecovery;
    }

    this.unauthorizedRecovery = this.authenticationProvider
      .recover(this.applicationNavigationService.getCurrentAbsoluteUrl())
      .pipe(
        switchMap((hasAccessToken) => {
          if (!hasAccessToken) {
            this.setUnauthenticated(SESSION_RECOVERY_ERROR_MESSAGE);
            return of(false);
          }

          return this.initializeAssistantCoreSession(false).pipe(
            map(() => this.isAuthenticated()),
          );
        }),
        catchError((error: unknown) => {
          this.handleError(error);
          return of(false);
        }),
        finalize(() => {
          this.unauthorizedRecovery = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.unauthorizedRecovery;
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
        if (!(error instanceof ApiError) || error.status !== 401) {
          return throwError(() => error);
        }

        if (!canRecover) {
          this.setSessionRecoveryError();
          return of(undefined);
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

  /**
   * Une identité fraîchement renouvelée qui reçoit encore un 401 signale un
   * refus durable : l'état d'erreur évite de relancer une connexion en boucle.
   */
  private setSessionRecoveryError(): void {
    this.state.set({
      errorMessage: SESSION_RECOVERY_ERROR_MESSAGE,
      session: null,
      status: AuthenticationStatus.Error,
    });
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
