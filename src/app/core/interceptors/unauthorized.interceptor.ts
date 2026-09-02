import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { ApiError } from '../../domain/errors/api-error';
import { AuthenticationService } from '../services/authentication/authentication.service';
import { ApplicationNavigationService } from '../services/navigation/application-navigation.service';

const AUTHENTICATE_USER_PATH = '/api/core/authenticateUser';

/**
 * Traite de manière centrale les réponses 401 et 403 des APIs protégées reçues
 * pendant l'utilisation normale de l'application.
 *
 * `authenticateUser` est exclu : la construction de session gère déjà sa propre
 * reprise et la traiter ici relancerait une seconde tentative concurrente.
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isProtectedApiRequest(request.url)) {
    return next(request);
  }

  const authenticationService = inject(AuthenticationService);
  const applicationNavigationService = inject(ApplicationNavigationService);

  return next(request).pipe(
    catchError((error: unknown) => {
      const status = readStatus(error);

      if (status === 403) {
        applicationNavigationService.navigateToAccessDenied();
        return throwError(() => error);
      }

      if (status !== 401) {
        return throwError(() => error);
      }

      return authenticationService
        .handleUnauthorized()
        .pipe(
          switchMap((isRecovered) =>
            isRecovered ? next(request) : throwError(() => error),
          ),
        );
    }),
  );
};

function isProtectedApiRequest(url: string): boolean {
  return url.includes('/api/') && !url.includes(AUTHENTICATE_USER_PATH);
}

function readStatus(error: unknown): number | null {
  return error instanceof ApiError || error instanceof HttpErrorResponse
    ? error.status
    : null;
}
