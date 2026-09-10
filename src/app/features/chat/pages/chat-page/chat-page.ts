import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  OnDestroy,
  Signal,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { ConversationsApiService } from '../../../../core/services/api/conversations-api.service';
import { MessagesApiService } from '../../../../core/services/api/messages-api.service';
import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import {
  ConversationErrorRecovery,
  findConversationErrorMessage,
  resolveConversationErrorMessage,
  resolveConversationErrorRecovery,
} from '../../../../domain/errors/conversation-error';
import {
  SendMessageResponse,
  SendMessageStreamEvent,
} from '../../../../domain/messages/send-message';
import { ChatComposer } from '../../components/chat-composer/chat-composer';
import { ChatMessageList } from '../../components/chat-message-list/chat-message-list';
import { ChatWelcome } from '../../components/chat-welcome/chat-welcome';
import { ConversationSidebar } from '../../components/conversation-sidebar/conversation-sidebar';
import { ConversationListState } from '../../../conversations/state/conversation-list.state';
import { UsageIndicator } from '../../../usage/components/usage-indicator/usage-indicator';
import { TokenUsageState } from '../../../usage/state/token-usage.state';
import { toChatMessage } from '../../models/chat-view-mappers';
import { ChatActivity, ChatMessage } from '../../models/chat-view-models';

type ConversationHistoryStatus = 'error' | 'loading' | 'ready';

const QUOTA_EXHAUSTED_ERROR_CODE = 'organization_token_quota_exhausted';
const CONVERSATION_HISTORY_ERROR = 'Cette conversation n’a pas pu être chargée.';
const SEND_ERROR = 'La réponse n’a pas pu être terminée. Réessayez dans quelques instants.';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ChatComposer,
    ChatMessageList,
    ChatWelcome,
    ConversationSidebar,
    UsageIndicator,
  ],
  selector: 'app-chat-page',
  styleUrl: './chat-page.css',
  templateUrl: './chat-page.html',
})
export class ChatPage implements OnDestroy {
  readonly session: Signal<AuthenticatedSession | null>;

  protected readonly isNavigationOpen = signal(false);
  protected readonly isProcessing = signal(false);
  protected readonly activities = signal<readonly ChatActivity[]>([]);
  protected readonly sendError = signal<string | null>(null);
  protected readonly messages = signal<readonly ChatMessage[]>([]);
  protected readonly streamingAssistantMessage = signal<ChatMessage | null>(null);
  protected readonly selectedConversationId = signal<string | null>(null);
  protected readonly historyStatus = signal<ConversationHistoryStatus>('ready');
  protected readonly historyError = signal(CONVERSATION_HISTORY_ERROR);
  protected readonly historyRecovery = signal<ConversationErrorRecovery>('retry');
  /**
   * Le catalogue et le quota sont facultatifs : leurs endpoints n'existent pas
   * dans tous les environnements. Seul un quota explicitement épuisé bloque
   * l'envoi; une absence de données laisse le backend appliquer ses valeurs par
   * défaut.
   */
  protected readonly canSubmitMessage = computed(
    () => !this.isProcessing() && !this.tokenUsageState.isExhausted(),
  );
  protected readonly hasTokenUsage = computed(
    () => this.tokenUsageState.usage() !== null || this.tokenUsageState.isExhausted(),
  );
  protected readonly conversationTitle = computed(() => {
    const selectedConversationId = this.selectedConversationId();
    return (
      this.conversationListState
        .conversations()
        .find((conversation) => conversation.id === selectedConversationId)?.title ??
      'Nouvelle conversation'
    );
  });

  private nextLocalMessageId = 1;
  private isCurrentActivityOpen = false;
  private historySubscription: Subscription | null = null;
  private activeMessageStream: Subscription | null = null;
  private readonly composer = viewChild(ChatComposer);
  private readonly conversationScroll =
    viewChild<ElementRef<HTMLElement>>('conversationScroll');
  private readonly navigationButton = viewChild<ElementRef<HTMLButtonElement>>('navigationButton');
  private readonly navigationPanel = viewChild<ElementRef<HTMLElement>>('navigationPanel');
  private readonly sidebars = viewChildren(ConversationSidebar);

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly conversationsApiService: ConversationsApiService,
    private readonly messagesApiService: MessagesApiService,
    protected readonly conversationListState: ConversationListState,
    protected readonly tokenUsageState: TokenUsageState,
  ) {
    this.session = authenticationService.session;
    this.conversationListState.load();
    this.tokenUsageState.load();
  }

  logout(): void {
    this.authenticationService.logout();
  }

  ngOnDestroy(): void {
    this.cancelActiveMessageStream();
    this.historySubscription?.unsubscribe();
  }

  /**
   * Le tiroir est un dialogue modal : le focus doit y entrer. L'attente du rendu
   * est nécessaire, la liste des barres latérales ne contenant pas encore le
   * tiroir au moment du clic.
   */
  openNavigation(): void {
    this.isNavigationOpen.set(true);
    setTimeout(() => this.sidebars().at(-1)?.focusCloseButton());
  }

  closeNavigation(restoreFocus = true): void {
    this.isNavigationOpen.set(false);
    if (restoreFocus) {
      const navigationButton = this.navigationButton()?.nativeElement;
      navigationButton?.closest('.conversation-area')?.removeAttribute('inert');
      setTimeout(() => navigationButton?.focus());
    }
  }

  closeNavigationFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeNavigation();
    }
  }

  startNewConversation(): void {
    this.cancelActiveMessageStream();
    this.historySubscription?.unsubscribe();
    this.historyStatus.set('ready');
    this.selectedConversationId.set(null);
    this.messages.set([]);
    this.streamingAssistantMessage.set(null);
    this.isProcessing.set(false);
    this.resetActivities();
    this.sendError.set(null);
    this.closeNavigation(false);
    queueMicrotask(() => this.composer()?.focus());
  }

  selectConversation(conversationId: string): void {
    this.cancelActiveMessageStream();
    this.selectedConversationId.set(conversationId);
    this.messages.set([]);
    this.streamingAssistantMessage.set(null);
    this.isProcessing.set(false);
    this.resetActivities();
    this.sendError.set(null);
    this.closeNavigation();
    this.loadConversationHistory(conversationId);
  }

  retryConversationHistory(): void {
    const selectedConversationId = this.selectedConversationId();
    if (selectedConversationId !== null) {
      this.loadConversationHistory(selectedConversationId);
    }
  }

  /**
   * Charge la page la plus récente de l'historique. Une réponse qui arrive après
   * un changement de conversation est ignorée afin de ne jamais afficher les
   * messages d'une autre conversation.
   */
  private loadConversationHistory(conversationId: string): void {
    this.historySubscription?.unsubscribe();
    this.historyStatus.set('loading');

    this.historySubscription = this.conversationsApiService
      .getMessages(conversationId)
      .subscribe({
        next: (page) => {
          if (this.selectedConversationId() !== conversationId) {
            return;
          }

          this.messages.set(page.messages.map(toChatMessage));
          this.historyStatus.set('ready');
          this.scrollConversationToBottom();
        },
        error: (error: unknown) => {
          if (this.selectedConversationId() !== conversationId) {
            return;
          }

          this.historyError.set(
            resolveConversationErrorMessage(error, CONVERSATION_HISTORY_ERROR),
          );
          this.historyRecovery.set(resolveConversationErrorRecovery(error));
          this.historyStatus.set('error');
        },
      });
  }

  useSuggestedQuestion(question: string): void {
    this.composer()?.setDraft(question);
  }

  submitMessage(content: string): void {
    if (!this.canSubmitMessage()) {
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
    this.streamingAssistantMessage.set(null);
    this.isProcessing.set(true);
    this.activities.set([
      { content: 'Je cherche les informations utiles…', isActive: true },
    ]);
    this.isCurrentActivityOpen = false;
    this.sendError.set(null);
    this.scrollConversationToBottom();

    const streamingAssistantMessageId = `local-assistant-message-${this.nextLocalMessageId++}`;
    this.activeMessageStream = this.messagesApiService
      .streamMessage({
        conversationId: this.selectedConversationId(),
        message: content,
      })
      .subscribe({
        next: (event) => this.handleStreamEvent(event, streamingAssistantMessageId),
        error: () => {
          this.failMessageStream(streamingAssistantMessageId);
        },
        complete: () => this.completeMessageStream(),
      });
  }

  private handleStreamEvent(
    event: SendMessageStreamEvent,
    streamingAssistantMessageId: string,
  ): void {
    switch (event.type) {
      case 'message.accepted':
        return;
      case 'progress.updated':
        this.activities.update((activities) => [
          ...activities.map((activity) => ({ ...activity, isActive: false })),
          { content: event.message, isActive: false },
        ]);
        this.isCurrentActivityOpen = false;
        this.scrollConversationToBottom();
        return;
      case 'activity.delta':
        this.appendActivityDelta(event.delta);
        return;
      case 'activity.completed':
        this.activities.update((activities) =>
          activities.map((activity, index) =>
            index === activities.length - 1 ? { ...activity, isActive: false } : activity,
          ),
        );
        this.isCurrentActivityOpen = false;
        return;
      case 'answer.reset':
        this.resetAnswerDraft(streamingAssistantMessageId);
        return;
      case 'answer.delta':
        this.appendAnswerDelta(streamingAssistantMessageId, event.delta);
        return;
      case 'answer.completed':
        this.resetActivities();
        this.applyMessageResponse(event.response);
        return;
      case 'error':
        this.failMessageStream(streamingAssistantMessageId, event.code);
        return;
    }
  }

  private appendAnswerDelta(streamingAssistantMessageId: string, delta: string): void {
    const existingMessage = this.streamingAssistantMessage();

    if (existingMessage === null) {
      this.streamingAssistantMessage.set({
        content: delta,
        id: streamingAssistantMessageId,
        role: 'assistant',
        sources: [],
        warnings: [],
      });
    } else {
      this.streamingAssistantMessage.set({
        ...existingMessage,
        content: `${existingMessage.content}${delta}`,
      });
    }

    this.scrollConversationToBottom();
  }

  private appendActivityDelta(delta: string): void {
    this.activities.update((activities) => {
      if (!this.isCurrentActivityOpen || activities.length === 0) {
        return [
          ...activities.map((activity) => ({ ...activity, isActive: false })),
          { content: delta, isActive: true },
        ];
      }

      return activities.map((activity, index) =>
        index === activities.length - 1
          ? { content: `${activity.content}${delta}`, isActive: true }
          : activity,
      );
    });
    this.isCurrentActivityOpen = true;
    this.scrollConversationToBottom();
  }

  private resetActivities(): void {
    this.activities.set([]);
    this.isCurrentActivityOpen = false;
  }

  private resetAnswerDraft(streamingAssistantMessageId: string): void {
    if (this.streamingAssistantMessage()?.id === streamingAssistantMessageId) {
      this.streamingAssistantMessage.set(null);
    }
  }

  /**
   * Le backend crée la conversation à la première réponse. La liste est alors
   * rechargée afin que la nouvelle conversation et son titre apparaissent dans
   * la barre latérale sans attendre un rechargement de la page.
   */
  private applyMessageResponse(response: SendMessageResponse): void {
    const assistantMessage: ChatMessage = {
      content: response.answer,
      id: response.messageId,
      role: 'assistant',
      sources: response.sources,
      warnings: response.warnings,
    };

    const previousConversationId = this.selectedConversationId();
    this.selectedConversationId.set(response.conversationId);
    this.streamingAssistantMessage.set(null);
    this.messages.update((messages) => [...messages, assistantMessage]);
    this.scrollConversationToBottom();

    if (previousConversationId !== response.conversationId) {
      this.conversationListState.load();
    }
  }

  private completeMessageStream(): void {
    this.activeMessageStream = null;
    this.isProcessing.set(false);
    this.resetActivities();
    if (this.hasTokenUsage()) {
      this.tokenUsageState.load();
    }
  }

  private failMessageStream(streamingAssistantMessageId: string, errorCode?: string): void {
    if (errorCode === QUOTA_EXHAUSTED_ERROR_CODE) {
      this.tokenUsageState.load();
    }

    this.resetAnswerDraft(streamingAssistantMessageId);
    this.activeMessageStream = null;
    this.isProcessing.set(false);
    this.resetActivities();
    this.sendError.set(this.getSendErrorMessage(errorCode));
  }

  private getSendErrorMessage(errorCode?: string): string {
    switch (errorCode) {
      case QUOTA_EXHAUSTED_ERROR_CODE:
        return 'Le quota de jetons est épuisé.';
      case 'ai_provider_timeout':
        return 'L’assistant met trop de temps à répondre. Réessayez dans quelques instants.';
      case 'ai_provider_limit':
        return 'L’assistant est temporairement très sollicité. Réessayez dans quelques instants.';
      case 'ai_provider_unavailable':
        return 'Le service d’assistance est temporairement indisponible. Réessayez dans quelques instants.';
      default:
        return findConversationErrorMessage(errorCode) ?? SEND_ERROR;
    }
  }

  private cancelActiveMessageStream(): void {
    this.activeMessageStream?.unsubscribe();
    this.activeMessageStream = null;
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
