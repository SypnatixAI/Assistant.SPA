import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ConversationsApiService } from '../../../core/services/api/conversations-api.service';
import {
  ConversationSummaryResponse,
  ListConversationsResponse,
} from '../../../domain/conversations/conversation';
import { ConversationListState } from './conversation-list.state';

describe('ConversationListState', () => {
  let listConversations: jasmine.Spy;
  let state: ConversationListState;

  function conversation(id: string, title: string): ConversationSummaryResponse {
    return {
      id,
      title,
      createdAt: '2026-08-06T20:15:00Z',
      updatedAt: '2026-08-06T20:18:32Z',
      lastMessagePreview: `Aperçu de ${title}`,
    };
  }

  function page(
    conversations: readonly ConversationSummaryResponse[],
    nextCursor: string | null,
  ): ListConversationsResponse {
    return { conversations, nextCursor, hasMore: nextCursor !== null };
  }

  beforeEach(() => {
    listConversations = jasmine.createSpy('listConversations');
    TestBed.configureTestingModule({
      providers: [
        ConversationListState,
        { provide: ConversationsApiService, useValue: { listConversations } },
      ],
    });
    state = TestBed.inject(ConversationListState);
  });

  it('Given_AMemberWithoutConversation_When_load_Then_TheListIsEmptyAndPaginationIsClosed', () => {
    // Given
    listConversations.and.returnValue(of(page([], null)));

    // When
    state.load();

    // Then
    expect(state.conversations()).toEqual([]);
    expect(state.status()).toBe('ready');
    expect(state.hasNextPage()).toBeFalse();
  });

  it('Given_ASinglePage_When_load_Then_ConversationsKeepTheBackendOrderWithTheirPreview', () => {
    // Given
    listConversations.and.returnValue(
      of(page([conversation('a', 'Politique'), conversation('b', 'Commande')], null)),
    );

    // When
    state.load();

    // Then
    expect(state.conversations()).toEqual([
      { id: 'a', title: 'Politique', preview: 'Aperçu de Politique' },
      { id: 'b', title: 'Commande', preview: 'Aperçu de Commande' },
    ]);
    expect(listConversations).toHaveBeenCalledWith();
  });

  it('Given_TwoChainedPages_When_loadNextPage_Then_EveryConversationAppearsOnceInOrder', () => {
    // Given
    listConversations.and.returnValue(
      of(page([conversation('a', 'Politique'), conversation('b', 'Commande')], 'cursor-1')),
    );
    state.load();
    listConversations.and.returnValue(
      of(page([conversation('b', 'Commande'), conversation('c', 'Facture')], null)),
    );

    // When
    state.loadNextPage();

    // Then
    expect(state.conversations().map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(listConversations).toHaveBeenCalledWith({ cursor: 'cursor-1' });
    expect(state.hasNextPage()).toBeFalse();
    expect(state.isLoadingNextPage()).toBeFalse();
  });

  it('Given_ALoadedList_When_loadNextPageFails_Then_LoadedConversationsRemainAndRetryStaysPossible', () => {
    // Given
    listConversations.and.returnValue(of(page([conversation('a', 'Politique')], 'cursor-1')));
    state.load();
    listConversations.and.returnValue(throwError(() => new Error('offline')));

    // When
    state.loadNextPage();

    // Then
    expect(state.conversations().map((item) => item.id)).toEqual(['a']);
    expect(state.status()).toBe('ready');
    expect(state.nextPageError()).not.toBeNull();
    expect(state.hasNextPage()).toBeTrue();
    expect(state.isLoadingNextPage()).toBeFalse();
  });

  it('Given_ALoadedList_When_loadFails_Then_TheErrorStateKeepsThePreviousConversations', () => {
    // Given
    listConversations.and.returnValue(of(page([conversation('a', 'Politique')], null)));
    state.load();
    listConversations.and.returnValue(throwError(() => new Error('offline')));

    // When
    state.load();

    // Then
    expect(state.status()).toBe('error');
    expect(state.conversations().map((item) => item.id)).toEqual(['a']);
  });

  it('Given_ALastPageStillCarryingACursor_When_load_Then_PaginationIsClosed', () => {
    // Given
    listConversations.and.returnValue(
      of({
        conversations: [conversation('a', 'Politique')],
        nextCursor: 'cursor-1',
        hasMore: false,
      }),
    );

    // When
    state.load();

    // Then
    expect(state.hasNextPage()).toBeFalse();
  });
});
