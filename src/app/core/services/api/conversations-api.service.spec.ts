import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import {
  GetConversationMessagesResponse,
  ListConversationsResponse,
} from '../../../domain/conversations/conversation';
import { ApiError } from '../../../domain/errors/api-error';
import { apiErrorInterceptor } from '../../interceptors/api-error.interceptor';
import { LaunchMode, PUBLIC_APP_CONFIG } from '../../config/public-app-config';
import { ConversationsApiService } from './conversations-api.service';

describe('ConversationsApiService', () => {
  const opaqueCursor = 'eyJ1cGRhdGVkQXQiOiIyMDI2LTA4LTA2VDIwOjE4OjMyWiJ9+/=';
  let service: ConversationsApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        ConversationsApiService,
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
    service = TestBed.inject(ConversationsApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('Given_NoPaginationParameter_When_listConversationsIsCalled_Then_BackendDefaultsAreLeftUntouched', async () => {
    // Given
    const response: ListConversationsResponse = {
      conversations: [],
      nextCursor: null,
      hasMore: false,
    };

    // When
    const action = firstValueFrom(service.listConversations());
    const request = httpTestingController.expectOne(
      'https://api.example.com/api/conversations',
    );
    request.flush(response);

    // Then
    await expectAsync(action).toBeResolvedTo(response);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
  });

  it('Given_AnOpaqueCursor_When_listConversationsIsCalled_Then_TheCursorIsForwardedUnchanged', async () => {
    // Given
    const response: ListConversationsResponse = {
      conversations: [],
      nextCursor: null,
      hasMore: false,
    };

    // When
    const action = firstValueFrom(
      service.listConversations({ cursor: opaqueCursor, limit: 25 }),
    );
    const request = httpTestingController.expectOne(
      (candidate) => candidate.url === 'https://api.example.com/api/conversations',
    );
    request.flush(response);

    // Then
    await expectAsync(action).toBeResolvedTo(response);
    expect(request.request.params.get('cursor')).toBe(opaqueCursor);
    expect(request.request.params.get('limit')).toBe('25');
  });

  it('Given_ALimitOutsideTheAllowedRange_When_listConversationsIsCalled_Then_NoRequestReachesTheBackend', () => {
    // Given
    const rejectedLimits = [0, 101, 12.5];

    // When
    const actions = rejectedLimits.map(
      (limit) => () => service.listConversations({ limit }),
    );

    // Then
    actions.forEach((action) => expect(action).toThrowError(RangeError));
    httpTestingController.expectNone(() => true);
  });

  it('Given_AConversationIdentifier_When_getMessagesIsCalled_Then_TheHistoryEndpointIsCalled', async () => {
    // Given
    const response: GetConversationMessagesResponse = {
      conversationId: 'conversation id/1',
      messages: [],
      nextCursor: null,
      hasMore: false,
    };

    // When
    const action = firstValueFrom(service.getMessages('conversation id/1'));
    const request = httpTestingController.expectOne(
      'https://api.example.com/api/conversations/conversation%20id%2F1/messages',
    );
    request.flush(response);

    // Then
    await expectAsync(action).toBeResolvedTo(response);
    expect(request.request.method).toBe('GET');
  });

  it('Given_ARejectedCursor_When_getMessagesIsCalled_Then_TheBackendErrorIsExposedAsApiError', async () => {
    // Given
    const conversationId = 'conversation-id';

    // When
    const action = firstValueFrom(
      service.getMessages(conversationId, { cursor: 'not-a-cursor' }),
    );
    const request = httpTestingController.expectOne(
      (candidate) =>
        candidate.url ===
        `https://api.example.com/api/conversations/${conversationId}/messages`,
    );
    request.flush(
      { message: 'cursor is invalid.' },
      { status: 400, statusText: 'Bad Request' },
    );

    // Then
    await expectAsync(action).toBeRejectedWith(
      new ApiError(400, 'http_400', 'cursor is invalid.', null),
    );
  });
});
