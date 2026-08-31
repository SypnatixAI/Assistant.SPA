import { computed, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { ConversationsApiService } from '../../../core/services/api/conversations-api.service';
import { ListConversationsResponse } from '../../../domain/conversations/conversation';
import {
  ChatConversationSummary,
  ConversationListStatus,
} from '../../chat/models/chat-view-models';
import { toChatConversationSummary } from '../../chat/models/chat-view-mappers';

const CONVERSATION_LIST_ERROR = 'Impossible de charger les conversations.';
const CONVERSATION_NEXT_PAGE_ERROR =
  'Les conversations suivantes n’ont pas pu être chargées.';

@Injectable({ providedIn: 'root' })
export class ConversationListState {
  private readonly conversationsValue = signal<readonly ChatConversationSummary[]>([]);
  private readonly statusValue = signal<ConversationListStatus>('ready');
  private readonly nextCursorValue = signal<string | null>(null);
  private readonly loadingNextPageValue = signal(false);
  private readonly nextPageErrorValue = signal<string | null>(null);
  private loadSubscription: Subscription | null = null;

  readonly conversations = this.conversationsValue.asReadonly();
  readonly status = this.statusValue.asReadonly();
  readonly isLoadingNextPage = this.loadingNextPageValue.asReadonly();
  readonly nextPageError = this.nextPageErrorValue.asReadonly();
  readonly errorMessage = CONVERSATION_LIST_ERROR;
  readonly hasNextPage = computed(() => this.nextCursorValue() !== null);

  constructor(private readonly conversationsApiService: ConversationsApiService) {}

  /**
   * Charge la première page. Une erreur conserve la liste déjà affichée : elle
   * signale la panne sans effacer ce que l'utilisateur voyait.
   */
  load(): void {
    this.loadSubscription?.unsubscribe();
    this.statusValue.set('loading');
    this.nextPageErrorValue.set(null);

    this.loadSubscription = this.conversationsApiService.listConversations().subscribe({
      next: (page) => this.applyFirstPage(page),
      error: () => this.statusValue.set('error'),
    });
  }

  /**
   * Charge la page suivante à partir du curseur opaque retourné par le backend.
   * Le curseur est conservé tel quel afin qu'une nouvelle tentative reste possible.
   */
  loadNextPage(): void {
    const cursor = this.nextCursorValue();
    if (cursor === null || this.loadingNextPageValue()) {
      return;
    }

    this.loadingNextPageValue.set(true);
    this.nextPageErrorValue.set(null);

    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.conversationsApiService
      .listConversations({ cursor })
      .subscribe({
        next: (page) => this.appendPage(page),
        error: () => {
          this.nextPageErrorValue.set(CONVERSATION_NEXT_PAGE_ERROR);
          this.loadingNextPageValue.set(false);
        },
      });
  }

  private applyFirstPage(page: ListConversationsResponse): void {
    this.conversationsValue.set(page.conversations.map(toChatConversationSummary));
    this.nextCursorValue.set(readNextCursor(page));
    this.loadingNextPageValue.set(false);
    this.statusValue.set('ready');
  }

  private appendPage(page: ListConversationsResponse): void {
    this.conversationsValue.update((conversations) =>
      appendWithoutDuplicates(conversations, page.conversations.map(toChatConversationSummary)),
    );
    this.nextCursorValue.set(readNextCursor(page));
    this.loadingNextPageValue.set(false);
  }
}

/**
 * Une page sans curseur, ou annoncée comme la dernière, termine la pagination
 * même si le backend renvoie encore un curseur.
 */
function readNextCursor(page: ListConversationsResponse): string | null {
  return page.hasMore && page.nextCursor ? page.nextCursor : null;
}

function appendWithoutDuplicates(
  conversations: readonly ChatConversationSummary[],
  nextPage: readonly ChatConversationSummary[],
): readonly ChatConversationSummary[] {
  const knownIds = new Set(conversations.map((conversation) => conversation.id));

  return [
    ...conversations,
    ...nextPage.filter((conversation) => !knownIds.has(conversation.id)),
  ];
}
