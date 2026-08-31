import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { MessagesApiService } from '../../../../core/services/api/messages-api.service';
import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import {
  SendMessageResponse,
  SendMessageStreamEvent,
} from '../../../../domain/messages/send-message';
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

  beforeEach(async () => {
    logout = jasmine.createSpy('logout');
    streamMessage = jasmine
      .createSpy('streamMessage')
      .and.returnValue(of(createCompletedEvent()));

    await TestBed.configureTestingModule({
      imports: [ChatPage],
      providers: [
        { provide: AuthenticationService, useValue: { logout, session: signal(session) } },
        { provide: MessagesApiService, useValue: { streamMessage } },
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
});
