import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ConversationsApiService } from '../../../../core/services/api/conversations-api.service';
import { MessagesApiService } from '../../../../core/services/api/messages-api.service';
import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import { ApiError } from '../../../../domain/errors/api-error';
import { SendMessageResponse } from '../../../../domain/messages/send-message';
import { GetConversationMessagesResponse } from '../../../../domain/conversations/conversation';
import { ConversationListState } from '../../../conversations/state/conversation-list.state';
import { ModelCatalogState } from '../../../models/state/model-catalog.state';
import { TokenUsageState } from '../../../usage/state/token-usage.state';
import { ChatPage } from './chat-page';

describe('ChatPage', () => {
  const session: AuthenticatedSession = {
    organization: { id: 'organization-id', name: 'MetalPro' },
    roles: ['User'],
    user: {
      displayName: 'Marc Tremblay',
      email: 'marc@metalpro.com',
      id: 'user-id',
    },
  };
  let fixture: ComponentFixture<ChatPage>;
  let logout: jasmine.Spy;
  let loadModels: jasmine.Spy;
  let loadUsage: jasmine.Spy;
  let sendMessage: jasmine.Spy;
  let getMessages: jasmine.Spy;
  let loadConversations: jasmine.Spy;
  let loadNextConversationPage: jasmine.Spy;
  let conversations: ReturnType<typeof signal<readonly { id: string; title: string; preview: string | null }[]>>;
  let modelError: ReturnType<typeof signal<string | null>>;
  let selectedModelId: ReturnType<typeof signal<string | null>>;
  let usageExhausted: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    logout = jasmine.createSpy('logout');
    loadModels = jasmine.createSpy('loadModels');
    loadUsage = jasmine.createSpy('loadUsage');
    sendMessage = jasmine.createSpy('sendMessage');
    getMessages = jasmine.createSpy('getMessages');
    loadConversations = jasmine.createSpy('loadConversations');
    loadNextConversationPage = jasmine.createSpy('loadNextConversationPage');
    conversations = signal<readonly { id: string; title: string; preview: string | null }[]>([]);
    const history: GetConversationMessagesResponse = {
      conversationId: 'conversation-id',
      messages: [],
      nextCursor: null,
      hasMore: false,
    };
    getMessages.and.returnValue(of(history));
    modelError = signal<string | null>(null);
    selectedModelId = signal<string | null>('gpt-5.6-luna');
    usageExhausted = signal(false);
    const selectModel = jasmine
      .createSpy('selectModel')
      .and.callFake((modelId: string) => selectedModelId.set(modelId));
    const response: SendMessageResponse = {
      conversationId: 'conversation-id',
      messageId: 'assistant-message-id',
      answer: 'Le mode local fonctionne sans appel OpenAI réel.',
      model: 'gpt-5.6-luna',
      sources: [],
      warnings: [],
      createdAt: '2026-08-29T14:00:00Z',
    };
    sendMessage.and.returnValue(of(response));
    await TestBed.configureTestingModule({
      imports: [ChatPage],
      providers: [
        {
          provide: AuthenticationService,
          useValue: { logout, session: signal(session) },
        },
        {
          provide: MessagesApiService,
          useValue: { sendMessage },
        },
        {
          provide: ConversationsApiService,
          useValue: { getMessages },
        },
        {
          provide: ConversationListState,
          useValue: {
            conversations,
            errorMessage: 'Impossible de charger les conversations.',
            hasNextPage: signal(false),
            isLoadingNextPage: signal(false),
            load: loadConversations,
            loadNextPage: loadNextConversationPage,
            nextPageError: signal<string | null>(null),
            status: signal('ready'),
          },
        },
        {
          provide: ModelCatalogState,
          useValue: {
            error: modelError,
            isLoading: signal(false),
            load: loadModels,
            models: signal([
              {
                id: 'gpt-5.6-luna',
                displayName: 'Luna',
                description: 'Modèle général recommandé.',
                isDefault: true,
              },
              {
                id: 'gpt-5.6-terra',
                displayName: 'Terra',
                description: 'Modèle pour les analyses détaillées.',
                isDefault: false,
              },
            ]),
            resetToDefault: jasmine.createSpy('resetToDefault'),
            selectModel,
            selectedModelId,
          },
        },
        {
          provide: TokenUsageState,
          useValue: {
            error: signal<string | null>(null),
            isExhausted: usageExhausted,
            isLoading: signal(false),
            load: loadUsage,
            synchronizeQuotaExhaustion: jasmine
              .createSpy('synchronizeQuotaExhaustion')
              .and.returnValue(false),
            updateFromMessage: jasmine.createSpy('updateFromMessage'),
            usage: signal({
              periodEndsAt: '2026-09-01T00:00:00Z',
              tokenLimit: 1_000_000,
              tokensUsed: 428_000,
              tokensRemaining: 572_000,
              isExhausted: false,
            }),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ChatPage);
    fixture.detectChanges();
  });

  it('Given_TheProtectedRoute_When_ChatPageIsCreated_Then_ModelsAndUsageLoadInParallel', () => {
    // Given
    // The page has been created by the shared setup.

    // When
    fixture.detectChanges();

    // Then
    expect(loadModels).toHaveBeenCalledTimes(1);
    expect(loadUsage).toHaveBeenCalledTimes(1);
  });

  it('Given_LoadedModelsAndUsage_When_ChatPageIsDisplayed_Then_DefaultModelIsVisibleWithoutTokenBalance', () => {
    // Given
    const page: HTMLElement = fixture.nativeElement;

    // When
    const selector: HTMLSelectElement = page.querySelector('.composer #model-selection')!;

    // Then
    expect(selector.value).toBe('gpt-5.6-luna');
    expect(selector.closest('.model-selector__control')?.getAttribute('title')).toBe(
      'Modèle général recommandé.',
    );
    expect(page.textContent).not.toContain('572 000 / 1 000 000');
    expect(page.textContent).not.toContain('jetons disponibles');
  });

  it('Given_AnotherReturnedModel_When_selectModelIsTriggered_Then_PublicIdentifierIsSelected', () => {
    // Given
    const selector: HTMLSelectElement = fixture.nativeElement.querySelector('#model-selection');

    // When
    selector.value = 'gpt-5.6-terra';
    selector.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // Then
    expect(selectedModelId()).toBe('gpt-5.6-terra');
    expect(fixture.nativeElement.textContent).toContain('Modèle pour les analyses détaillées.');
  });

  it('Given_AnExhaustedQuota_When_ChatPageIsDisplayed_Then_ComposerIsBlockedWithRenewalDate', () => {
    // Given
    usageExhausted.set(true);

    // When
    fixture.detectChanges();

    // Then
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(textarea.disabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Quota épuisé');
  });

  it('Given_AModelLoadingError_When_RefreshIsRequested_Then_ModelsAreLoadedAgain', () => {
    // Given
    modelError.set('Les modèles ne peuvent pas être chargés pour le moment.');
    fixture.detectChanges();
    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.model-selector__error button',
    );

    // When
    retryButton.click();

    // Then
    expect(loadModels).toHaveBeenCalledTimes(2);
  });

  it('Given_AQuestion_When_submitMessageIsCalled_Then_BackendResponseIsDisplayed', () => {
    // Given
    const component = fixture.componentInstance;

    // When
    component.submitMessage('Bonjour');
    fixture.detectChanges();

    // Then
    expect(sendMessage).toHaveBeenCalledOnceWith({
      conversationId: null,
      message: 'Bonjour',
      model: 'gpt-5.6-luna',
    });
    expect(fixture.nativeElement.textContent).toContain('Bonjour');
    expect(fixture.nativeElement.textContent).toContain(
      'Le mode local fonctionne sans appel OpenAI réel.',
    );
  });

  it('Given_AQuestion_When_submitMessageIsCalled_Then_ConversationScrollsToTheLatestMessage', async () => {
    // Given
    const component = fixture.componentInstance;
    const conversationScroll: HTMLElement =
      fixture.nativeElement.querySelector('.conversation-scroll');
    const scrollTo = jasmine.createSpy('scrollTo');
    conversationScroll.scrollTo = scrollTo;
    Object.defineProperty(conversationScroll, 'scrollHeight', {
      configurable: true,
      value: 720,
    });

    // When
    component.submitMessage('Bonjour');
    await fixture.whenStable();

    // Then
    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: 720 });
  });

  it('Given_ShortThenMultilineQuestions_When_submitMessageIsCalled_Then_SelectedModelRemainsUnchanged', () => {
    // Given
    const component = fixture.componentInstance;
    const secondResponse: SendMessageResponse = {
      conversationId: 'conversation-id',
      messageId: 'second-assistant-message-id',
      answer: 'Deuxième réponse locale.',
      model: 'gpt-5.6-luna',
      sources: [],
      warnings: [],
      createdAt: '2026-08-29T14:01:00Z',
    };
    sendMessage.and.returnValues(
      of({
        conversationId: 'conversation-id',
        messageId: 'first-assistant-message-id',
        answer: 'Première réponse locale.',
        model: 'gpt-5.6-luna',
        sources: [],
        warnings: [],
        createdAt: '2026-08-29T14:00:00Z',
      }),
      of(secondResponse),
    );
    const multilineMessage = `Première ligne\nDeuxième ligne ${'a'.repeat(250)}`;

    // When
    component.submitMessage('Bonjour');
    component.submitMessage(multilineMessage);

    // Then
    expect(sendMessage.calls.argsFor(0)[0]).toEqual({
      conversationId: null,
      message: 'Bonjour',
      model: 'gpt-5.6-luna',
    });
    expect(sendMessage.calls.argsFor(1)[0]).toEqual({
      conversationId: 'conversation-id',
      message: multilineMessage,
      model: 'gpt-5.6-luna',
    });
  });

  it('Given_ARejectedModel_When_submitMessageIsCalled_Then_CatalogIsReloadedWithExplicitError', () => {
    // Given
    sendMessage.and.returnValue(
      throwError(
        () => new ApiError(400, 'http_400', 'The requested AI model is not available.', null),
      ),
    );
    const component = fixture.componentInstance;

    // When
    component.submitMessage('Question valide');
    fixture.detectChanges();

    // Then
    expect(loadModels).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain(
      'Le modèle sélectionné a été refusé par le serveur',
    );
  });

  it('Given_AFailedRequest_When_submitMessageIsCalled_Then_ErrorIsVisibleAndComposerIsEnabled', () => {
    // Given
    sendMessage.and.returnValue(throwError(() => new Error('network')));
    const component = fixture.componentInstance;

    // When
    component.submitMessage('Bonjour');
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.textContent).toContain('La réponse n’a pas pu être chargée');
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(textarea.disabled).toBeFalse();
  });

  it('Given_AuthenticatedSession_When_ChatPageIsDisplayed_Then_IdentityAndLogoutAreAvailable', () => {
    // Given
    const page: HTMLElement = fixture.nativeElement;

    // When
    const menuButton: HTMLButtonElement = page.querySelector('.user-menu__trigger')!;
    menuButton.click();
    fixture.detectChanges();
    const logoutButton = Array.from(page.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Se déconnecter'),
    )!;
    logoutButton.click();

    // Then
    expect(page.querySelector('.user-menu__avatar')?.textContent?.trim()).toBe('M');
    expect(page.querySelector('.user-menu__identity strong')?.textContent?.trim()).toBe('Marc');
    expect(page.textContent).not.toContain('Marc Tremblay');
    expect(page.textContent).toContain('MetalPro');
    expect(logout).toHaveBeenCalled();
  });

  it('Given_AuthenticatedSession_When_ChatPageIsDisplayed_Then_SecureWorkspaceContextIsVisible', () => {
    // Given
    const page: HTMLElement = fixture.nativeElement;

    // When
    const workspaceStatus = page.querySelector('.workspace-status');

    // Then
    expect(workspaceStatus?.textContent).toContain('Espace sécurisé');
    expect(workspaceStatus?.textContent).toContain('MetalPro');
  });

  it('Given_AQuestionSuggestion_When_useSuggestedQuestion_Then_ComposerReceivesTheQuestion', () => {
    // Given
    const page: HTMLElement = fixture.nativeElement;
    const suggestion: HTMLButtonElement = page.querySelector('.suggestions button')!;

    // When
    suggestion.click();
    fixture.detectChanges();

    // Then
    const textarea: HTMLTextAreaElement = page.querySelector('textarea')!;
    expect(textarea.value).toContain('politiques');
    expect(document.activeElement).toBe(textarea);
  });

  it('Given_AVisibleMessage_When_startNewConversation_Then_MessageIsClearedAndFocusReturnsToComposer', async () => {
    // Given
    const component = fixture.componentInstance;
    component.submitMessage('Question locale');
    fixture.detectChanges();

    // When
    const newConversationButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.new-conversation');
    newConversationButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.textContent).not.toContain('Question locale');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('textarea'));
  });

  it('Given_OpenMobileNavigation_When_handleDocumentKeydownReceivesEscape_Then_NavigationClosesAndFocusReturnsToTrigger', async () => {
    // Given
    const navigationButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.navigation-trigger');
    navigationButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    // When
    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();

    // Then
    expect(fixture.nativeElement.querySelector('.mobile-navigation')).toBeNull();
    expect(document.activeElement).toBe(navigationButton);
  });

  it('Given_FocusOnFirstDrawerControl_When_handleDocumentKeydownReceivesShiftTab_Then_FocusWrapsToLastControl', async () => {
    // Given
    const navigationButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.navigation-trigger');
    navigationButton.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const panel: HTMLElement = fixture.nativeElement.querySelector('.mobile-navigation__panel');
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    firstElement.focus();

    // When
    document.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Tab', shiftKey: true }),
    );

    // Then
    expect(document.activeElement).toBe(lastElement);
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
    getMessages.and.returnValue(
      of({
        conversationId: 'conversation-id',
        messages: [],
        nextCursor: null,
        hasMore: false,
      }),
    );

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
});
