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
import { finalize } from 'rxjs';

import { MessagesApiService } from '../../../../core/services/api/messages-api.service';
import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import { ApiError } from '../../../../domain/errors/api-error';
import { SendMessageResponse } from '../../../../domain/messages/send-message';
import { ChatComposer } from '../../components/chat-composer/chat-composer';
import { ChatMessageList } from '../../components/chat-message-list/chat-message-list';
import { ChatWelcome } from '../../components/chat-welcome/chat-welcome';
import { ConversationSidebar } from '../../components/conversation-sidebar/conversation-sidebar';
import { ModelCatalogState } from '../../../models/state/model-catalog.state';
import { UsageIndicator } from '../../../usage/components/usage-indicator/usage-indicator';
import { TokenUsageState } from '../../../usage/state/token-usage.state';
import {
  ChatConversationSummary,
  ChatMessage,
  ConversationListStatus,
} from '../../models/chat-view-models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatComposer, ChatMessageList, ChatWelcome, ConversationSidebar, UsageIndicator],
  selector: 'app-chat-page',
  styleUrl: './chat-page.css',
  templateUrl: './chat-page.html',
})
export class ChatPage {
  readonly session: Signal<AuthenticatedSession | null>;

  protected readonly conversations = signal<readonly ChatConversationSummary[]>([]);
  protected readonly isNavigationOpen = signal(false);
  protected readonly isProcessing = signal(false);
  protected readonly sendError = signal<string | null>(null);
  protected readonly messages = signal<readonly ChatMessage[]>([]);
  protected readonly selectedConversationId = signal<string | null>(null);
  protected readonly sidebarStatus = signal<ConversationListStatus>('ready');
  protected readonly canSubmitMessage = computed(
    () =>
      !this.isProcessing() &&
      !this.modelCatalogState.isLoading() &&
      !this.tokenUsageState.isLoading() &&
      this.modelCatalogState.error() === null &&
      this.tokenUsageState.error() === null &&
      this.modelCatalogState.selectedModelId() !== null &&
      this.tokenUsageState.usage() !== null &&
      !this.tokenUsageState.isExhausted(),
  );
  protected readonly conversationTitle = computed(() => {
    const selectedConversationId = this.selectedConversationId();
    return (
      this.conversations().find((conversation) => conversation.id === selectedConversationId)
        ?.title ?? 'Nouvelle conversation'
    );
  });

  private nextLocalMessageId = 1;
  private readonly composer = viewChild(ChatComposer);
  private readonly conversationScroll =
    viewChild<ElementRef<HTMLElement>>('conversationScroll');
  private readonly navigationButton = viewChild<ElementRef<HTMLButtonElement>>('navigationButton');
  private readonly navigationPanel = viewChild<ElementRef<HTMLElement>>('navigationPanel');
  private readonly sidebars = viewChildren(ConversationSidebar);

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly messagesApiService: MessagesApiService,
    protected readonly modelCatalogState: ModelCatalogState,
    protected readonly tokenUsageState: TokenUsageState,
  ) {
    this.session = authenticationService.session;
    this.modelCatalogState.load();
    this.tokenUsageState.load();
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
    this.sendError.set(null);
    this.modelCatalogState.resetToDefault();
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
    if (!this.canSubmitMessage()) {
      return;
    }

    const selectedModel = this.modelCatalogState
      .models()
      .find((model) => model.id === this.modelCatalogState.selectedModelId());
    if (!selectedModel) {
      this.sendError.set(
        'Le modèle sélectionné n’est plus disponible. Le catalogue a été rechargé.',
      );
      this.modelCatalogState.load();
      return;
    }

    const userMessage: ChatMessage = {
      content,
      id: `local-user-message-${this.nextLocalMessageId++}`,
      role: 'user',
      sources: [],
      warnings: [],
    };
    this.messages.update((messages) => [...messages, userMessage]);
    this.isProcessing.set(true);
    this.sendError.set(null);
    this.scrollConversationToBottom();

    this.messagesApiService
      .sendMessage({
        conversationId: this.selectedConversationId(),
        message: content,
        model: selectedModel.id,
      })
      .pipe(finalize(() => this.isProcessing.set(false)))
      .subscribe({
        next: (response) => this.applyMessageResponse(response),
        error: (error: unknown) => {
          if (this.isUnavailableModelError(error)) {
            this.sendError.set(
              'Le modèle sélectionné a été refusé par le serveur. Le catalogue a été rechargé.',
            );
            this.modelCatalogState.load();
            return;
          }

          const quotaExhausted = this.tokenUsageState.synchronizeQuotaExhaustion(error);
          this.sendError.set(
            quotaExhausted
              ? 'Le quota de jetons est épuisé.'
              : 'La réponse n’a pas pu être chargée. Réessayez dans quelques instants.',
          );
        },
      });
  }

  private isUnavailableModelError(error: unknown): boolean {
    return (
      error instanceof ApiError &&
      error.status === 400 &&
      error.message === 'The requested AI model is not available.'
    );
  }

  private applyMessageResponse(response: SendMessageResponse): void {
    const assistantMessage: ChatMessage = {
      content: response.answer,
      id: response.messageId,
      role: 'assistant',
      sources: response.sources,
      warnings: response.warnings,
    };

    this.selectedConversationId.set(response.conversationId);
    this.messages.update((messages) => [...messages, assistantMessage]);
    this.scrollConversationToBottom();
    if (response.usage) {
      this.tokenUsageState.updateFromMessage(response.usage);
    }
  }

  private scrollConversationToBottom(): void {
    queueMicrotask(() => {
      const conversationScroll = this.conversationScroll()?.nativeElement;
      if (conversationScroll) {
        conversationScroll.scrollTo({
          behavior: 'smooth',
          top: conversationScroll.scrollHeight,
        });
      }
    });
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
