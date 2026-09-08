import { Injectable, signal } from '@angular/core';

import { ApplicationNavigationService } from '../navigation/application-navigation.service';

@Injectable({ providedIn: 'root' })
export class TechnicalErrorService {
  private readonly technicalErrorActive = signal(false);

  readonly hasTechnicalError = this.technicalErrorActive.asReadonly();

  constructor(
    private readonly applicationNavigationService: ApplicationNavigationService,
  ) {}

  report(error: unknown): void {
    if (this.technicalErrorActive()) {
      return;
    }

    console.error('Une erreur technique inattendue est survenue.', error);
    this.technicalErrorActive.set(true);
    this.applicationNavigationService.navigateToTechnicalError();
  }

  /**
   * Referme l'état technique avant une nouvelle tentative. Sans cela, les
   * gardes renverraient immédiatement sur la page d'erreur et la reprise
   * n'atteindrait jamais la destination visée.
   */
  reset(): void {
    this.technicalErrorActive.set(false);
  }
}
