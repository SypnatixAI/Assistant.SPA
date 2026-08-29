import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import {
  ChatConversationSummary,
  ConversationListStatus,
} from '../../models/chat-view-models';
import { UserMenu } from '../user-menu/user-menu';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserMenu],
  selector: 'app-conversation-sidebar',
  styleUrl: './conversation-sidebar.css',
  templateUrl: './conversation-sidebar.html',
})
export class ConversationSidebar {
  readonly closed = output<void>();
  readonly conversationSelected = output<string>();
  readonly logoutRequested = output<void>();
  readonly newConversationRequested = output<void>();
  readonly nextPageRequested = output<void>();
  readonly retryRequested = output<void>();

  readonly conversations = input<readonly ChatConversationSummary[]>([]);
  readonly errorMessage = input('Impossible de charger les conversations.');
  readonly hasNextPage = input(false);
  readonly isLoadingNextPage = input(false);
  readonly selectedConversationId = input<string | null>(null);
  readonly session = input.required<AuthenticatedSession>();
  readonly status = input<ConversationListStatus>('ready');

  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  focusCloseButton(): void {
    this.closeButton()?.nativeElement.focus();
  }
}
