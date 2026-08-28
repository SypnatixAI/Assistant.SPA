import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Keeps application routes private until the Entra session flow is implemented.
 */
export const temporaryAuthGuard: CanActivateFn = () =>
  inject(Router).createUrlTree(['/login']);
