import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, toArray } from 'rxjs';

import { AuthenticationMode, LaunchMode, PUBLIC_APP_CONFIG } from '../../config/public-app-config';
import {
  SendMessageRequest,
  SendMessageResponse,
  SendMessageStreamEvent,
} from '../../../domain/messages/send-message';
import { AuthenticationService } from '../authentication/authentication.service';
import { LocalAccessTokenService } from '../authentication/local-access-token.service';
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
            authenticationMode: AuthenticationMode.MicrosoftEntra,
            authenticationUrl: '/local-auth/token',
            launchMode: LaunchMode.Certification,
            entraAuthority: 'https://login.microsoftonline.com/organizations',
            entraClientId: 'client-id',
            entraScope: 'api://api-client-id/access_as_user',
          },
        },
        { provide: LocalAccessTokenService, useValue: { get: () => null } },
        {
          provide: AuthenticationService,
          useValue: { handleUnauthorized: () => of(false) },
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

  it('Given_ChunkedSse_When_streamMessageIsCalled_Then_EmitsEventsAsTheBodyIsRead', async () => {
    // Given
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        MessagesApiService,
        {
          provide: PUBLIC_APP_CONFIG,
          useValue: {
            apiBaseUrl: 'https://api.example.com/',
            authenticationMode: AuthenticationMode.LocalJwt,
            authenticationUrl: '/local-auth/token',
            launchMode: LaunchMode.Dev,
            entraAuthority: 'https://login.microsoftonline.com/organizations',
            entraClientId: 'client-id',
            entraScope: 'api://api-client-id/access_as_user',
          },
        },
        { provide: LocalAccessTokenService, useValue: { get: () => 'local-token' } },
        {
          provide: AuthenticationService,
          useValue: { handleUnauthorized: () => of(false) },
        },
      ],
    });
    const service = TestBed.inject(MessagesApiService);
    const encoder = new TextEncoder();
    const completedResponse = JSON.stringify({
      conversationId: 'conversation-id',
      messageId: 'assistant-message-id',
      answer: 'Bonjour monde',
      model: 'gpt-5.6-luna',
      sources: [],
      warnings: [],
      createdAt: '2026-08-29T14:00:00Z',
    });
    const firstChunk = [
      'event: message.accepted',
      'data: {"conversationId":"conversation-id","userMessageId":"user-message-id"}',
      '',
      'event: answer.delta',
      'data: {"delta":"Bonjour "}',
      '',
      '',
    ].join('\r\n');
    const secondChunk = [
      'event: answer.delta',
      'data: {"delta":"monde"}',
      '',
      'event: answer.completed',
      `data: ${completedResponse}`,
      '',
      '',
    ].join('\n');
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(firstChunk));
        controller.enqueue(encoder.encode(secondChunk));
        controller.close();
      },
    });
    const fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(
      new Response(body, {
        headers: { 'Content-Type': 'text/event-stream' },
        status: 200,
      }),
    );
    const requestBody: SendMessageRequest = { conversationId: null, message: 'Bonjour' };

    // When
    const events: SendMessageStreamEvent[] = await firstValueFrom(
      service.streamMessage(requestBody).pipe(toArray()),
    );

    // Then
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.calls.mostRecent().args[0]).toBe(
      'https://api.example.com/api/messages/stream',
    );
    const request = fetchSpy.calls.mostRecent().args[1] as RequestInit;
    expect(request.method).toBe('POST');
    expect(request.body).toBe(JSON.stringify(requestBody));
    expect(request.headers).toEqual(
      jasmine.objectContaining({
        Accept: 'text/event-stream',
        Authorization: 'Bearer local-token',
        'Content-Type': 'application/json',
      }),
    );
    expect(events).toEqual([
      {
        type: 'message.accepted',
        conversationId: 'conversation-id',
        userMessageId: 'user-message-id',
      },
      { type: 'answer.delta', delta: 'Bonjour ' },
      { type: 'answer.delta', delta: 'monde' },
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
  });
});
