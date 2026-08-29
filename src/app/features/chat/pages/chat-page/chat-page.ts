import { ChangeDetectionStrategy, Component, Signal } from '@angular/core';

import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chat-page',
  styleUrl: './chat-page.css',
  templateUrl: './chat-page.html',
})
export class ChatPage {
  readonly session: Signal<AuthenticatedSession | null>;

  constructor(private readonly authenticationService: AuthenticationService) {
    this.session = authenticationService.session;
  }

  logout(): void {
    this.authenticationService.logout();
  }
}
