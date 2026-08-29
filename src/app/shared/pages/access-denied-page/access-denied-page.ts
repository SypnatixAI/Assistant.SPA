import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AuthenticationService } from '../../../core/services/authentication/authentication.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-access-denied-page',
  styleUrl: './access-denied-page.css',
  templateUrl: './access-denied-page.html',
})
export class AccessDeniedPage {
  constructor(private readonly authenticationService: AuthenticationService) {}

  logout(): void {
    this.authenticationService.logout();
  }
}
