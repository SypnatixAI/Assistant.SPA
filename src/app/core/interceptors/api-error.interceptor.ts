import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiError, ApiErrorMetadata } from '../../domain/errors/api-error';

interface ApiErrorResponse {
  readonly code?: unknown;
  readonly Code?: unknown;
  readonly message?: unknown;
  readonly Message?: unknown;
  readonly metadata?: unknown;
  readonly Metadata?: unknown;
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) =>
      throwError(() =>
        error instanceof HttpErrorResponse ? toApiError(error) : error,
      ),
    ),
  );

function toApiError(error: HttpErrorResponse): ApiError {
  const response = isApiErrorResponse(error.error) ? error.error : null;

  return new ApiError(
    error.status,
    readString(response?.code ?? response?.Code) ?? getFallbackCode(error.status),
    readString(response?.message ?? response?.Message) ?? getFallbackMessage(error.status),
    readMetadata(response?.metadata ?? response?.Metadata),
  );
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readMetadata(value: unknown): ApiErrorMetadata | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as ApiErrorMetadata)
    : null;
}

function getFallbackCode(status: number): string {
  return status === 0 ? 'network_error' : `http_${status}`;
}

function getFallbackMessage(status: number): string {
  return status === 0
    ? 'onPremia est inaccessible.'
    : `onPremia a retourné une erreur HTTP ${status}.`;
}
