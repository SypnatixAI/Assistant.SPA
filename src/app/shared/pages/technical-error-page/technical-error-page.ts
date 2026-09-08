import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  TECHNICAL_ERROR_CONTENT,
  TECHNICAL_ERROR_ICONS,
} from '../../../core/errors/technical-error-content';
import { TechnicalErrorService } from '../../../core/services/errors/technical-error.service';
import { ApplicationNavigationService } from '../../../core/services/navigation/application-navigation.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-technical-error-page',
  styleUrl: './technical-error-page.css',
  templateUrl: './technical-error-page.html',
})
export class TechnicalErrorPage {
  protected readonly content = TECHNICAL_ERROR_CONTENT;
  protected readonly icons = TECHNICAL_ERROR_ICONS;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly applicationNavigationService: ApplicationNavigationService,
    private readonly technicalErrorService: TechnicalErrorService,
  ) {}

  /**
   * L'état technique est refermé avant la relance : le rechargement repart
   * d'une application saine, et si la panne persiste elle sera signalée de
   * nouveau par le parcours normal.
   */
  reloadApplication(): void {
    this.technicalErrorService.reset();
    this.applicationNavigationService.reloadApplication(
      this.activatedRoute.snapshot.queryParamMap.get('returnUrl'),
    );
  }
}
