import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  TECHNICAL_ERROR_CONTENT,
  TECHNICAL_ERROR_ICONS,
} from '../../../core/errors/technical-error-content';
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
  ) {}

  reloadApplication(): void {
    this.applicationNavigationService.reloadApplication(
      this.activatedRoute.snapshot.queryParamMap.get('returnUrl'),
    );
  }
}
