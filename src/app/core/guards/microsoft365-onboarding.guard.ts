import { Injectable } from '@angular/core';
import { CanActivate, UrlTree } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';

import { Microsoft365ApiService } from '../services/api/microsoft365-api.service';
import { ApplicationNavigationService } from '../services/navigation/application-navigation.service';

@Injectable({ providedIn: 'root' })
export class Microsoft365OnboardingGuard implements CanActivate {
  constructor(
    private readonly microsoft365ApiService: Microsoft365ApiService,
    private readonly applicationNavigationService: ApplicationNavigationService,
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.microsoft365ApiService.getOnboardingStatus().pipe(
      map((status) =>
        status.isComplete
          ? true
          : this.applicationNavigationService.createOnboardingUrlTree(),
      ),
      catchError(() =>
        of(this.applicationNavigationService.createTechnicalErrorUrlTree()),
      ),
    );
  }
}
