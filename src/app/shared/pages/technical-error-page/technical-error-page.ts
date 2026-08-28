import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ApplicationNavigationService } from '../../../core/services/navigation/application-navigation.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-technical-error-page',
  styleUrl: './technical-error-page.css',
  templateUrl: './technical-error-page.html',
})
export class TechnicalErrorPage {
  constructor(
    private readonly applicationNavigationService: ApplicationNavigationService,
  ) {}

  reloadApplication(): void {
    this.applicationNavigationService.reloadApplication();
  }
}
