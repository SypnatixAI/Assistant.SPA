import { ChangeDetectionStrategy, Component, Signal } from '@angular/core';

import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-application-page',
  styleUrl: './application-page.css',
  templateUrl: './application-page.html',
})
export class ApplicationPage {
  readonly session: Signal<AuthenticatedSession | null>;

  constructor(private readonly authenticationService: AuthenticationService) {
    this.session = authenticationService.session;
  }

  logout(): void {
    this.authenticationService.logout();
  }
}
