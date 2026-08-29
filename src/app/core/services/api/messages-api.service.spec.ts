import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { LaunchMode, PUBLIC_APP_CONFIG } from '../../config/public-app-config';
import { SendMessageRequest, SendMessageResponse } from '../../../domain/messages/send-message';
import { MessagesApiService } from './messages-api.service';

describe('MessagesApiService', () => {
  it('Given_AMultilineQuestion_When_sendMessageIsCalled_Then_ContentAndModelRemainUnchanged', async () => {
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
      model: 'gpt-5.6-luna',
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
});
