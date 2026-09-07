import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

import { TechnicalErrorService } from '../services/errors/technical-error.service';

/**
 * Endpoints facultatifs dont l'echec est deja gere localement par leur propre
 * etat (message discret + bouton "Reessayer" dans l'interface). Un echec sur
 * l'un d'eux ne doit jamais faire basculer toute l'application sur la page
 * d'erreur technique.
 */
const OPTIONAL_ENDPOINT_PATHS = ['/api/models', '/api/usage'];

@Injectable()
export class TechnicalErrorInterceptor implements HttpInterceptor {
  constructor(private readonly technicalErrorService: TechnicalErrorService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status >= 500 &&
          !OPTIONAL_ENDPOINT_PATHS.some((path) => request.url.includes(path))
        ) {
          this.technicalErrorService.report(error);
        }

        return throwError(() => error);
      }),
    );
  }
}
