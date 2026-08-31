import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { ConversationsApiService } from '../../../../core/services/api/conversations-api.service';
import { MessagesApiService } from '../../../../core/services/api/messages-api.service';
import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import { GetConversationMessagesResponse } from '../../../../domain/conversations/conversation';
import {
  SendMessageResponse,
  SendMessageStreamEvent,
} from '../../../../domain/messages/send-message';
import { ConversationListState } from '../../../conversations/state/conversation-list.state';
import { ChatPage } from './chat-page';

describe('ChatPage', () => {
  const session: AuthenticatedSession = {
    organization: { id: 'organization-id', name: 'MetalPro' },
    roles: ['User'],
    user: { displayName: 'Marc Tremblay', email: 'marc@metalpro.com', id: 'user-id' },
  };
  let fixture: ComponentFixture<ChatPage>;
  let logout: jasmine.Spy;
  let streamMessage: jasmine.Spy;
  let getMessages: jasmine.Spy;
  let loadConversations: jasmine.Spy;
  let conversations: ReturnType<
    typeof signal<readonly { id: string; title: string; preview: string | null }[]>
  >;

  beforeEach(async () => {
    logout = jasmine.createSpy('logout');
    streamMessage = jasmine
      .createSpy('streamMessage')
      .and.returnValue(of(createCompletedEvent()));
    getMessages = jasmine.createSpy('getMessages').and.returnValue(of(createEmptyHistory()));
    loadConversations = jasmine.createSpy('loadConversations');
    conversations = signal<readonly { id: string; title: string; preview: string | null }[]>([]);

    await TestBed.configureTestingModule({
      imports: [ChatPage],
      providers: [
        { provide: AuthenticationService, useValue: { logout, session: signal(session) } },
        { provide: MessagesApiService, useValue: { streamMessage } },
        { provide: ConversationsApiService, useValue: { getMessages } },
        {
          provide: ConversationListState,
          useValue: {
            conversations,
            errorMessage: 'Impossible de charger les conversations.',
            hasNextPage: signal(false),
            isLoadingNextPage: signal(false),
            load: loadConversations,
            loadNextPage: jasmine.createSpy('loadNextPage'),
            nextPageError: signal<string | null>(null),
            status: signal('ready'),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ChatPage);
    fixture.detectChanges();
  });

  it('Given_AQuestion_When_submitMessageIsCalled_Then_RequestUsesTheBackendDefaultModel', () => {
    // Given
    const component = fixture.componentInstance;

    // When
    component.submitMessage('Bonjour');
    fixture.detectChanges();

    // Then
    expect(streamMessage).toHaveBeenCalledOnceWith({ conversationId: null, message: 'Bonjour' });
    expect(fixture.nativeElement.textContent).toContain('Le mode local fonctionne sans appel OpenAI réel.');
  });

  it('Given_AFailedRequest_When_submitMessageIsCalled_Then_ErrorIsVisibleAndComposerIsEnabled', () => {
    // Given
    streamMessage.and.returnValue(throwError(() => new Error('network')));

    // When
    fixture.componentInstance.submitMessage('Bonjour');
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.textContent).toContain('La réponse n’a pas pu être terminée');
    expect((fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement).disabled).toBeFalse();
  });

  it('Given_AProviderTimeout_When_submitMessageIsCalled_Then_AHelpfulErrorIsVisible', () => {
    // Given
    const stream = new Subject<SendMessageStreamEvent>();
    streamMessage.and.returnValue(stream);

    // When
    fixture.componentInstance.submitMessage('Quel est le code du projet Atlas ?');
    stream.next({ type: 'error', code: 'ai_provider_timeout' });
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.textContent).toContain(
      'L’assistant met trop de temps à répondre',
    );
  });

  it('Given_AuthenticatedSession_When_ChatPageIsDisplayed_Then_IdentityAndLogoutAreAvailable', () => {
    // Given
    const page: HTMLElement = fixture.nativeElement;

    // When
    (page.querySelector('.user-menu__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    Array.from(page.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Se déconnecter'),
    )?.click();

    // Then
    expect(page.querySelector('.user-menu__avatar')?.textContent?.trim()).toBe('M');
    expect(page.textContent).toContain('MetalPro');
    expect(logout).toHaveBeenCalled();
  });

  it('Given_AQuestionSuggestion_When_useSuggestedQuestion_Then_ComposerReceivesTheQuestion', () => {
    // Given
    const page: HTMLElement = fixture.nativeElement;

    // When
    (page.querySelector('.suggestions button') as HTMLButtonElement).click();
    fixture.detectChanges();

    // Then
    expect((page.querySelector('textarea') as HTMLTextAreaElement).value).toContain('politiques');
  });

  it('Given_AStreamingAnswer_When_submitMessageIsCalled_Then_ProgressIsDistinctFromTheFinalAnswer', () => {
    // Given
    const stream = new Subject<SendMessageStreamEvent>();
    streamMessage.and.returnValue(stream);

    // When
    fixture.componentInstance.submitMessage('Bonjour');
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.textContent).toContain('Je cherche les informations utiles…');

    // When
    stream.next({
      type: 'progress.updated',
      message: 'Je consulte les documents pertinents.',
    });
    fixture.detectChanges();

    // Then
    const progress = fixture.nativeElement.querySelector('app-chat-processing');
    expect(progress?.textContent).toContain('Je consulte les documents pertinents.');
    expect(fixture.nativeElement.querySelector('app-assistant-message')).toBeNull();

    // When
    stream.next({ type: 'answer.delta', delta: 'Bonjour, ' });
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.textContent).toContain('Bonjour,');
    expect(fixture.nativeElement.textContent).not.toContain('Je cherche les informations utiles…');
  });

  it('Given_TheProtectedRoute_When_ChatPageIsCreated_Then_ConversationsAreLoadedOnce', () => {
    // Given
    // The page has been created by the shared setup.

    // When
    // Creation is the trigger under test.

    // Then
    expect(loadConversations).toHaveBeenCalledTimes(1);
  });

  it('Given_LoadedConversations_When_ChatPageIsDisplayed_Then_TitlesAndPreviewsAreVisible', () => {
    // Given
    conversations.set([
      { id: 'conversation-id', title: 'Politique de télétravail', preview: 'Deux jours par semaine.' },
    ]);

    // When
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.textContent).toContain('Politique de télétravail');
    expect(fixture.nativeElement.textContent).toContain('Deux jours par semaine.');
  });

  it('Given_ASelectedConversation_When_selectConversation_Then_ItsHistoryAndSourcesAreDisplayed', () => {
    // Given
    const history: GetConversationMessagesResponse = {
      conversationId: 'conversation-id',
      messages: [
        {
          id: 'user-message-id',
          role: 'User',
          content: 'Quelle est notre politique ?',
          processingStatus: 'Completed',
          model: null,
          createdAt: '2026-08-06T20:15:00Z',
          updatedAt: '2026-08-06T20:15:00Z',
          sources: [],
        },
        {
          id: 'assistant-message-id',
          role: 'Assistant',
          content: 'La politique permet deux jours.',
          processingStatus: 'Completed',
          model: 'gpt-5.6-luna',
          createdAt: '2026-08-06T20:15:08Z',
          updatedAt: '2026-08-06T20:15:08Z',
          sources: [
            {
              type: 'SharePoint',
              title: 'Politique de télétravail',
              url: 'https://example.sharepoint.com/politique',
              reference: 'document-123',
              sourceDate: null,
            },
            {
              type: 'SharePoint',
              title: 'Note interne sans lien',
              url: null,
              reference: 'document-456',
              sourceDate: null,
            },
          ],
        },
      ],
      nextCursor: null,
      hasMore: false,
    };
    getMessages.and.returnValue(of(history));

    // When
    fixture.componentInstance.selectConversation('conversation-id');
    fixture.detectChanges();

    // Then
    expect(getMessages).toHaveBeenCalledOnceWith('conversation-id');
    expect(fixture.nativeElement.textContent).toContain('Quelle est notre politique ?');
    expect(fixture.nativeElement.textContent).toContain('La politique permet deux jours.');
    const sourceLink: HTMLAnchorElement = fixture.nativeElement.querySelector('.sources a');
    expect(sourceLink.href).toBe('https://example.sharepoint.com/politique');
    expect(fixture.nativeElement.querySelector('.sources span:not(.visually-hidden)').textContent)
      .toContain('Note interne sans lien');
    expect(fixture.nativeElement.querySelector('.warnings')).toBeNull();
  });

  it('Given_AnEmptyConversation_When_selectConversation_Then_TheWelcomeScreenStaysVisible', () => {
    // Given
    getMessages.and.returnValue(of(createEmptyHistory()));

    // When
    fixture.componentInstance.selectConversation('conversation-id');
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.querySelector('app-chat-welcome')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.history-state')).toBeNull();
  });

  it('Given_AFailedHistory_When_retryConversationHistory_Then_TheHistoryIsRequestedAgain', () => {
    // Given
    getMessages.and.returnValue(throwError(() => new Error('offline')));
    fixture.componentInstance.selectConversation('conversation-id');
    fixture.detectChanges();
    const retryButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.history-state button');

    // When
    retryButton.click();

    // Then
    expect(getMessages).toHaveBeenCalledTimes(2);
  });

  function createResponse(): SendMessageResponse {
    return {
      conversationId: 'conversation-id',
      messageId: 'assistant-message-id',
      answer: 'Le mode local fonctionne sans appel OpenAI réel.',
      model: 'gpt-5.6-luna',
      sources: [],
      warnings: [],
      createdAt: '2026-08-29T14:00:00Z',
    };
  }

  function createCompletedEvent(): SendMessageStreamEvent {
    return { type: 'answer.completed', response: createResponse() };
  }

  function createEmptyHistory(): GetConversationMessagesResponse {
    return {
      conversationId: 'conversation-id',
      messages: [],
      nextCursor: null,
      hasMore: false,
    };
  }
});
