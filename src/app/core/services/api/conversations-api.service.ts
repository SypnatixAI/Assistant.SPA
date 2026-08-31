import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  assertConversationPageLimit,
  ConversationPageRequest,
  GetConversationMessagesResponse,
  ListConversationsResponse,
} from '../../../domain/conversations/conversation';
import { PUBLIC_APP_CONFIG, PublicAppConfig } from '../../config/public-app-config';

@Injectable({ providedIn: 'root' })
export class ConversationsApiService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpClient: HttpClient,
    @Inject(PUBLIC_APP_CONFIG) publicAppConfig: PublicAppConfig,
  ) {
    this.baseUrl = `${publicAppConfig.apiBaseUrl.replace(/\/$/, '')}/api/conversations`;
  }

  listConversations(
    request: ConversationPageRequest = {},
  ): Observable<ListConversationsResponse> {
    return this.httpClient.get<ListConversationsResponse>(this.baseUrl, {
      params: buildPageParams(request),
    });
  }

  getMessages(
    conversationId: string,
    request: ConversationPageRequest = {},
  ): Observable<GetConversationMessagesResponse> {
    return this.httpClient.get<GetConversationMessagesResponse>(
      `${this.baseUrl}/${encodeURIComponent(conversationId)}/messages`,
      { params: buildPageParams(request) },
    );
  }
}

/**
 * Le curseur est opaque : il est renvoyé exactement tel qu'il a été reçu, sans
 * être décodé ni reconstruit.
 */
function buildPageParams(request: ConversationPageRequest): HttpParams {
  assertConversationPageLimit(request.limit);

  let params = new HttpParams();
  if (request.limit !== undefined) {
    params = params.set('limit', request.limit);
  }

  if (request.cursor) {
    params = params.set('cursor', request.cursor);
  }

  return params;
}
