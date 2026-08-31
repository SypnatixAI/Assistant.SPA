import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { LaunchMode, PUBLIC_APP_CONFIG } from '../../config/public-app-config';
import {
  SendMessageRequest,
  SendMessageResponse,
  SendMessageStreamEvent,
} from '../../../domain/messages/send-message';
import { MessagesApiService } from './messages-api.service';

describe('MessagesApiService', () => {
  it('Given_AMultilineQuestion_When_sendMessageIsCalled_Then_ContentIsSentWithoutModelSelection', async () => {
    // Given
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessagesApiService,
        {
          provide: PUBLIC_APP_CONFIG,
          useValue: {
            apiBaseUrl: 'https://api.example.com/',
            authenticationUrl: '/local-auth/token',
            launchMode: LaunchMode.Certification,
            entraAuthority: 'https://login.microsoftonline.com/organizations',
            entraClientId: 'client-id',
            entraScope: 'api://api-client-id/access_as_user',
          },
        },
      ],
    });
    const service = TestBed.inject(MessagesApiService);
    const httpTestingController = TestBed.inject(HttpTestingController);
    const requestBody: SendMessageRequest = {
      conversationId: null,
      message: `Première ligne\nDeuxième ligne ${'a'.repeat(250)}`,
    };
    const response: SendMessageResponse = {
      conversationId: 'conversation-id',
      messageId: 'assistant-message-id',
      answer: 'Réponse locale WireMock.',
      model: 'gpt-5.6-luna',
      sources: [],
      warnings: [],
      createdAt: '2026-08-29T14:00:00Z',
    };

    // When
    const action = firstValueFrom(service.sendMessage(requestBody));
    const request = httpTestingController.expectOne('https://api.example.com/api/messages');
    request.flush(response);

    // Then
    await expectAsync(action).toBeResolvedTo(response);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    httpTestingController.verify();
  });

  it('Given_SseEvents_When_streamMessageIsCalled_Then_ParsesDeltasAndTheCompletedResponse', () => {
    // Given
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessagesApiService,
        {
          provide: PUBLIC_APP_CONFIG,
          useValue: {
            apiBaseUrl: 'https://api.example.com/',
            authenticationUrl: '/local-auth/token',
            launchMode: LaunchMode.Certification,
            entraAuthority: 'https://login.microsoftonline.com/organizations',
            entraClientId: 'client-id',
            entraScope: 'api://api-client-id/access_as_user',
          },
        },
      ],
    });
    const service = TestBed.inject(MessagesApiService);
    const httpTestingController = TestBed.inject(HttpTestingController);
    const events: SendMessageStreamEvent[] = [];
    const requestBody: SendMessageRequest = { conversationId: null, message: 'Bonjour' };
    const response = JSON.stringify({
      ConversationId: 'conversation-id',
      MessageId: 'assistant-message-id',
      Answer: 'Bonjour monde',
      Model: 'gpt-5.6-luna',
      Sources: [],
      Warnings: [],
      CreatedAt: '2026-08-29T14:00:00Z',
    });
    const sse = [
      'event: message.accepted',
      'data: {"ConversationId":"conversation-id","UserMessageId":"user-message-id"}',
      '',
      'event: progress.updated',
      'data: {"Message":"Je consulte les documents pertinents."}',
      '',
      'event: answer.delta',
      'data: {"Delta":"Bonjour "}',
      '',
      'event: answer.completed',
      `data: ${response}`,
      '',
      '',
    ].join('\n');

    // When
    service.streamMessage(requestBody).subscribe((event) => events.push(event));
    const request = httpTestingController.expectOne('https://api.example.com/api/messages/stream');
    request.event({ type: HttpEventType.DownloadProgress, loaded: sse.length, partialText: sse });
    request.flush(sse);

    // Then
    expect(request.request.method).toBe('POST');
    expect(events).toEqual([
      {
        type: 'message.accepted',
        conversationId: 'conversation-id',
        userMessageId: 'user-message-id',
      },
      {
        type: 'progress.updated',
        message: 'Je consulte les documents pertinents.',
      },
      { type: 'answer.delta', delta: 'Bonjour ' },
      {
        type: 'answer.completed',
        response: {
          answer: 'Bonjour monde',
          conversationId: 'conversation-id',
          createdAt: '2026-08-29T14:00:00Z',
          messageId: 'assistant-message-id',
          model: 'gpt-5.6-luna',
          sources: [],
          warnings: [],
        },
      },
    ]);
    httpTestingController.verify();
  });
});
