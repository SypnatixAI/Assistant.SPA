import { Injectable } from '@angular/core';
import { CanActivate, UrlTree } from '@angular/router';

import { AuthenticationService } from '../services/authentication/authentication.service';
import { TechnicalErrorService } from '../services/errors/technical-error.service';
import { ApplicationNavigationService } from '../services/navigation/application-navigation.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly technicalErrorService: TechnicalErrorService,
    private readonly applicationNavigationService: ApplicationNavigationService,
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.technicalErrorService.hasTechnicalError()) {
      return this.applicationNavigationService.createTechnicalErrorUrlTree();
    }

    return this.authenticationService.isAuthenticated()
      ? true
      : this.applicationNavigationService.createLoginUrlTree();
  }
}
