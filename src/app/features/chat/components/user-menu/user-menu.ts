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

import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-menu',
  styleUrl: './user-menu.css',
  templateUrl: './user-menu.html',
})
export class UserMenu {
  readonly logoutRequested = output<void>();
  readonly session = input.required<AuthenticatedSession>();

  protected readonly isOpen = signal(false);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  initials(): string {
    return this.session()
      .user.displayName.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
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
