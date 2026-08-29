import {
  ChangeDetectionStrategy,
  Component,
  effect,
  OnInit,
  Signal,
} from '@angular/core';

import {
  AuthenticationService,
  AuthenticationStatus,
} from '../../../../core/services/authentication/authentication.service';
import { ApplicationNavigationService } from '../../../../core/services/navigation/application-navigation.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-page',
  styleUrl: './login-page.css',
  templateUrl: './login-page.html',
})
export class LoginPage implements OnInit {
  readonly errorMessage: Signal<string | null>;
  readonly isLocalAuthentication: boolean;
  readonly status: Signal<AuthenticationStatus>;

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly applicationNavigationService: ApplicationNavigationService,
  ) {
    this.errorMessage = authenticationService.errorMessage;
    this.isLocalAuthentication = authenticationService.isLocalAuthentication;
    this.status = authenticationService.status;
    effect(() => {
      if (authenticationService.isAuthenticated()) {
        this.applicationNavigationService.navigateToChat();
      }
    });
  }

  ngOnInit(): void {
    if (this.authenticationService.isAuthenticated()) {
      return;
    }

    if (
      !this.isLocalAuthentication &&
      this.authenticationService.status() === 'unauthenticated'
    ) {
      this.authenticationService.login();
    }
  }

  login(): void {
    this.authenticationService.login();
  }
}
