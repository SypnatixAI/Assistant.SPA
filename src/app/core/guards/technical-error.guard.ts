import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, UrlTree } from '@angular/router';

import { TechnicalErrorService } from '../services/errors/technical-error.service';
import { ApplicationNavigationService } from '../services/navigation/application-navigation.service';

/**
 * Empêche `/technical-error` de devenir une route terminale.
 *
 * L'état technique ne vit qu'en mémoire : après un refresh du navigateur, le
 * service est recréé vide alors que l'adresse pointe encore sur la page
 * d'erreur. Sans garde, l'utilisateur resterait bloqué sur un écran d'erreur
 * qui ne correspond plus à aucune panne. Une erreur réellement active laisse au
 * contraire la page s'afficher.
 */
@Injectable({ providedIn: 'root' })
export class TechnicalErrorGuard implements CanActivate {
  constructor(
    private readonly technicalErrorService: TechnicalErrorService,
    private readonly applicationNavigationService: ApplicationNavigationService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (this.technicalErrorService.hasTechnicalError()) {
      return true;
    }

    return this.applicationNavigationService.createReturnUrlTree(
      route.queryParamMap.get('returnUrl'),
    );
  }
}
