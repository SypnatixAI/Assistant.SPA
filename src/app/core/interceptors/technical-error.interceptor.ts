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

@Injectable()
export class TechnicalErrorInterceptor implements HttpInterceptor {
  constructor(private readonly technicalErrorService: TechnicalErrorService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          this.technicalErrorService.report(error);
        }

        return throwError(() => error);
      }),
    );
  }
}
