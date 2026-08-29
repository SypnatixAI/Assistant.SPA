import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  Signal,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';

import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import { ChatComposer } from '../../components/chat-composer/chat-composer';
import { ChatMessageList } from '../../components/chat-message-list/chat-message-list';
import { ChatWelcome } from '../../components/chat-welcome/chat-welcome';
import { ConversationSidebar } from '../../components/conversation-sidebar/conversation-sidebar';
import {
  ChatConversationSummary,
  ChatMessage,
  ConversationListStatus,
} from '../../models/chat-view-models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatComposer, ChatMessageList, ChatWelcome, ConversationSidebar],
  selector: 'app-chat-page',
  styleUrl: './chat-page.css',
  templateUrl: './chat-page.html',
})
export class ChatPage {
  readonly session: Signal<AuthenticatedSession | null>;

  protected readonly conversations = signal<readonly ChatConversationSummary[]>([]);
  protected readonly isNavigationOpen = signal(false);
  protected readonly isProcessing = signal(false);
  protected readonly messages = signal<readonly ChatMessage[]>([]);
  protected readonly selectedConversationId = signal<string | null>(null);
  protected readonly sidebarStatus = signal<ConversationListStatus>('ready');
  protected readonly conversationTitle = computed(() => {
    const selectedConversationId = this.selectedConversationId();
    return (
      this.conversations().find((conversation) => conversation.id === selectedConversationId)
        ?.title ?? 'Nouvelle conversation'
    );
  });

  private nextLocalMessageId = 1;
  private readonly composer = viewChild(ChatComposer);
  private readonly navigationButton = viewChild<ElementRef<HTMLButtonElement>>('navigationButton');
  private readonly navigationPanel = viewChild<ElementRef<HTMLElement>>('navigationPanel');
  private readonly sidebars = viewChildren(ConversationSidebar);

  constructor(private readonly authenticationService: AuthenticationService) {
    this.session = authenticationService.session;
  }

  logout(): void {
    this.authenticationService.logout();
  }

  openNavigation(): void {
    this.isNavigationOpen.set(true);
    queueMicrotask(() => this.sidebars().at(-1)?.focusCloseButton());
  }

  closeNavigation(restoreFocus = true): void {
    this.isNavigationOpen.set(false);
    if (restoreFocus) {
      const navigationButton = this.navigationButton()?.nativeElement;
      navigationButton?.closest('.conversation-area')?.removeAttribute('inert');
      navigationButton?.focus();
    }
  }

  closeNavigationFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeNavigation();
    }
  }

  startNewConversation(): void {
    this.selectedConversationId.set(null);
    this.messages.set([]);
    this.isProcessing.set(false);
    this.closeNavigation(false);
    queueMicrotask(() => this.composer()?.focus());
  }

  selectConversation(conversationId: string): void {
    this.selectedConversationId.set(conversationId);
    this.messages.set([]);
    this.closeNavigation();
  }

  useSuggestedQuestion(question: string): void {
    this.composer()?.setDraft(question);
  }

  submitMessage(content: string): void {
    const userMessage: ChatMessage = {
      content,
      id: `local-user-message-${this.nextLocalMessageId++}`,
      role: 'user',
      sources: [],
      warnings: [],
    };
    this.messages.update((messages) => [...messages, userMessage]);
  }

  @HostListener('document:keydown', ['$event'])
  handleDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isNavigationOpen()) {
      return;
    }

    if (event.key === 'Escape') {
      this.closeNavigation();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = this.navigationPanel()?.nativeElement.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusableElements?.length) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}
