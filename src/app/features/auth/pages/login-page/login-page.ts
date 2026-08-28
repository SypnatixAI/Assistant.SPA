import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Signal,
} from '@angular/core';

import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { ApplicationNavigationService } from '../../../../core/services/navigation/application-navigation.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-page',
  styleUrl: './login-page.css',
  templateUrl: './login-page.html',
})
export class LoginPage implements OnInit {
  readonly errorMessage: Signal<string | null>;

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly applicationNavigationService: ApplicationNavigationService,
  ) {
    this.errorMessage = authenticationService.errorMessage;
  }

  ngOnInit(): void {
    if (this.authenticationService.isAuthenticated()) {
      this.applicationNavigationService.navigateToApplication();
      return;
    }

    if (this.authenticationService.status() === 'unauthenticated') {
      this.authenticationService.login();
    }
  }
}
