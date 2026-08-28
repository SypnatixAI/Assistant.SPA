import { HttpErrorResponse } from '@angular/common/http';
import { AuthError } from '@azure/msal-browser';

const CANCELLED_ERROR_CODES = new Set(['user_cancelled', 'user_canceled']);
const CONSENT_ERROR_CODES = new Set([
  'access_denied',
  'consent_required',
  'interaction_required',
]);
const CONFIGURATION_ERROR_CODES = new Set([
  'client_mismatch',
  'endpoints_resolution_error',
  'invalid_client',
  'redirect_uri_mismatch',
  'untrusted_authority',
]);

export function getAuthenticationErrorMessage(error: unknown): string {
  const errorCode = getErrorCode(error);

  if (CANCELLED_ERROR_CODES.has(errorCode)) {
    return 'La connexion Microsoft a été annulée. Vous pouvez réessayer.';
  }

  if (CONSENT_ERROR_CODES.has(errorCode)) {
    return "Microsoft n’a pas autorisé l’accès à AssistantCore. Vérifiez le consentement avec votre administrateur.";
  }

  if (CONFIGURATION_ERROR_CODES.has(errorCode)) {
    return 'La connexion Microsoft est mal configurée. Contactez votre administrateur.';
  }

  if (error instanceof HttpErrorResponse) {
    if (error.status === 401 || error.status === 403) {
      return "Votre compte n’est pas autorisé à accéder à AssistantCore.";
    }

    return 'AssistantCore ne peut pas construire votre session pour le moment. Réessayez plus tard.';
  }

  return 'La connexion a échoué. Réessayez ou contactez votre administrateur.';
}

export function isRecoverableAuthenticationError(error: unknown): boolean {
  const errorCode = getErrorCode(error);

  return (
    CANCELLED_ERROR_CODES.has(errorCode) || CONSENT_ERROR_CODES.has(errorCode)
  );
}

function getErrorCode(error: unknown): string {
  if (error instanceof AuthError) {
    return error.errorCode;
  }

  if (typeof error === 'object' && error !== null && 'errorCode' in error) {
    const errorCode = (error as { errorCode: unknown }).errorCode;
    return typeof errorCode === 'string' ? errorCode : '';
  }

  return '';
}
