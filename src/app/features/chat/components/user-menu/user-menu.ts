import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import { APPLICATION_ROUTES } from '../../../../core/services/navigation/application-navigation.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-user-menu',
  styleUrl: './user-menu.css',
  templateUrl: './user-menu.html',
})
export class UserMenu {
  readonly logoutRequested = output<void>();
  readonly session = input.required<AuthenticatedSession>();

  protected readonly administrationRoute = APPLICATION_ROUTES.microsoft365Administration;
  protected readonly isOpen = signal(false);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  firstName(): string {
    const displayName = this.session().user.displayName.trim();
    return displayName.split(/\s+/)[0] || displayName;
  }

  initial(): string {
    return this.firstName().charAt(0).toUpperCase();
  }

  isAdministrator(): boolean {
    return this.session().roles.includes('Admin');
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((isOpen) => !isOpen);
  }

  requestLogout(): void {
    this.isOpen.set(false);
    this.logoutRequested.emit();
  }

  @HostListener('document:keydown.escape')
  close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.isOpen.set(false);
    this.trigger()?.nativeElement.focus();
  }
}
