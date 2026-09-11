import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Injector } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { firstValueFrom, Observable, Subscriber } from 'rxjs';

import {
  SendMessageRequest,
  SendMessageResponse,
  SendMessageStreamEvent,
} from '../../../domain/messages/send-message';
import { ApiError } from '../../../domain/errors/api-error';
import {
  AuthenticationMode,
  PUBLIC_APP_CONFIG,
  PublicAppConfig,
} from '../../config/public-app-config';
import { AuthenticationService } from '../authentication/authentication.service';
import { LocalAccessTokenService } from '../authentication/local-access-token.service';

@Injectable({ providedIn: 'root' })
export class MessagesApiService {
  constructor(
    private readonly httpClient: HttpClient,
    @Inject(PUBLIC_APP_CONFIG)
    private readonly publicAppConfig: PublicAppConfig,
    private readonly injector: Injector,
    private readonly localAccessTokenService: LocalAccessTokenService,
    private readonly authenticationService: AuthenticationService,
  ) {}

  sendMessage(request: SendMessageRequest): Observable<SendMessageResponse> {
    const apiBaseUrl = this.publicAppConfig.apiBaseUrl.replace(/\/$/, '');

    return this.httpClient.post<SendMessageResponse>(`${apiBaseUrl}/api/messages`, request);
  }

  streamMessage(request: SendMessageRequest): Observable<SendMessageStreamEvent> {
    return new Observable<SendMessageStreamEvent>((subscriber) => {
      const abortController = new AbortController();

      void this.consumeMessageStream(request, subscriber, abortController.signal).catch(
        (error: unknown) => {
          if (!abortController.signal.aborted && !subscriber.closed) {
            subscriber.error(error);
          }
        },
      );

      return () => abortController.abort();
    });
  }

  private async consumeMessageStream(
    request: SendMessageRequest,
    subscriber: Subscriber<SendMessageStreamEvent>,
    signal: AbortSignal,
  ): Promise<void> {
    const response = await this.openMessageStream(request, signal, true);
    if (response.body === null) {
      throw new Error('The message stream response did not contain a readable body.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let eventBuffer = '';

    try {
      while (!subscriber.closed) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        eventBuffer = await this.emitEvents(
          decoder.decode(value, { stream: true }),
          eventBuffer,
          subscriber,
          signal,
        );
      }

      await this.emitEvents(decoder.decode(), eventBuffer, subscriber, signal);
      if (!subscriber.closed) {
        subscriber.complete();
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async openMessageStream(
    request: SendMessageRequest,
    signal: AbortSignal,
    canRecoverAuthentication: boolean,
  ): Promise<Response> {
    const apiBaseUrl = this.publicAppConfig.apiBaseUrl.replace(/\/$/, '');
    const accessToken = await this.getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    };
    if (accessToken !== null) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${apiBaseUrl}/api/messages/stream`, {
      body: JSON.stringify(request),
      cache: 'no-store',
      headers,
      method: 'POST',
      signal,
    });

    if (response.status === 401 && canRecoverAuthentication) {
      const recovered = await firstValueFrom(this.authenticationService.handleUnauthorized());
      if (recovered) {
        return this.openMessageStream(request, signal, false);
      }
    }

    if (!response.ok) {
      throw await this.createApiError(response);
    }

    return response;
  }

  private async getAccessToken(): Promise<string | null> {
    if (this.publicAppConfig.authenticationMode === AuthenticationMode.LocalJwt) {
      return this.localAccessTokenService.get();
    }

    const msalService = this.injector.get(MsalService);
    const account =
      msalService.instance.getActiveAccount() ?? msalService.instance.getAllAccounts()[0] ?? null;
    if (account === null) {
      return null;
    }

    const result = await firstValueFrom(
      msalService.acquireTokenSilent({
        account,
        scopes: [this.publicAppConfig.entraScope],
      }),
    );
    return result.accessToken;
  }

  private async emitEvents(
    text: string,
    buffer: string,
    subscriber: Pick<Subscriber<SendMessageStreamEvent>, 'next'>,
    signal: AbortSignal,
  ): Promise<string> {
    let remainingText = `${buffer}${text}`.replace(/\r\n/g, '\n');
    let separatorIndex = remainingText.indexOf('\n\n');

    while (separatorIndex >= 0) {
      const rawEvent = remainingText.slice(0, separatorIndex);
      remainingText = remainingText.slice(separatorIndex + 2);
      const streamEvent = this.parseEvent(rawEvent);
      if (streamEvent !== null) {
        subscriber.next(streamEvent);
        if (streamEvent.type === 'answer.delta') {
          await this.waitForNextEventLoopTurn(signal);
          if (signal.aborted) {
            return remainingText;
          }
        }
      }

      separatorIndex = remainingText.indexOf('\n\n');
    }

    return remainingText;
  }

  private waitForNextEventLoopTurn(signal: AbortSignal): Promise<void> {
    if (signal.aborted) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        signal.removeEventListener('abort', handleAbort);
        resolve();
      });
      const handleAbort = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      signal.addEventListener('abort', handleAbort, { once: true });
    });
  }

  private parseEvent(rawEvent: string): SendMessageStreamEvent | null {
    const eventName = rawEvent
      .split('\n')
      .find((line) => line.startsWith('event:'))
      ?.slice('event:'.length)
      .trim();
    const data = rawEvent
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice('data:'.length).trim())
      .join('\n');

    if (eventName === undefined || data.length === 0) {
      return null;
    }

    try {
      const payload: unknown = JSON.parse(data);
      return this.mapStreamEvent(eventName, payload);
    } catch {
      return null;
    }
  }

  private mapStreamEvent(eventName: string, payload: unknown): SendMessageStreamEvent | null {
    if (!isRecord(payload)) {
      return null;
    }

    switch (eventName) {
      case 'message.accepted': {
        const conversationId = readString(payload, 'conversationId', 'ConversationId');
        const userMessageId = readString(payload, 'userMessageId', 'UserMessageId');
        return conversationId !== null && userMessageId !== null
          ? { type: 'message.accepted', conversationId, userMessageId }
          : null;
      }
      case 'progress.updated': {
        const message = readString(payload, 'message', 'Message');
        return message === null ? null : { type: 'progress.updated', message };
      }
      case 'activity.delta': {
        const delta = readString(payload, 'delta', 'Delta');
        return delta === null ? null : { type: 'activity.delta', delta };
      }
      case 'activity.completed':
        return { type: 'activity.completed' };
      case 'answer.reset':
        return { type: 'answer.reset' };
      case 'answer.delta': {
        const delta = readString(payload, 'delta', 'Delta');
        return delta === null ? null : { type: 'answer.delta', delta };
      }
      case 'answer.completed': {
        const response = mapSendMessageResponse(payload);
        return response === null ? null : { type: 'answer.completed', response };
      }
      case 'error': {
        const code = readString(payload, 'code', 'Code');
        return code === null ? null : { type: 'error', code };
      }
      default:
        return null;
    }
  }

  private async createApiError(response: Response): Promise<ApiError> {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // Some upstream failures return an empty or non-JSON body.
    }

    const body = isRecord(payload) ? payload : null;
    return new ApiError(
      response.status,
      (body === null ? null : readString(body, 'code', 'Code')) ?? `http_${response.status}`,
      (body === null ? null : readString(body, 'message', 'Message')) ??
        `onPremia a retourné une erreur HTTP ${response.status}.`,
      null,
    );
  }
}

function mapSendMessageResponse(payload: Record<string, unknown>): SendMessageResponse | null {
  const conversationId = readString(payload, 'conversationId', 'ConversationId');
  const messageId = readString(payload, 'messageId', 'MessageId');
  const answer = readString(payload, 'answer', 'Answer');
  const model = readString(payload, 'model', 'Model');
  const createdAt = readString(payload, 'createdAt', 'CreatedAt');
  const sources = readArray(payload, 'sources', 'Sources');
  const warnings = readArray(payload, 'warnings', 'Warnings');

  if (
    conversationId === null ||
    messageId === null ||
    answer === null ||
    model === null ||
    createdAt === null ||
    sources === null ||
    warnings === null
  ) {
    return null;
  }

  return {
    answer,
    conversationId,
    createdAt,
    messageId,
    model,
    sources: sources.filter(isRecord).map((source) => ({
      reference: readString(source, 'reference', 'Reference') ?? '',
      title: readString(source, 'title', 'Title') ?? '',
      type: readString(source, 'type', 'Type') ?? '',
      url: readString(source, 'url', 'Url'),
    })),
    warnings: warnings.filter((warning): warning is string => typeof warning === 'string'),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readArray(
  payload: Record<string, unknown>,
  camelCaseName: string,
  pascalCaseName: string,
): readonly unknown[] | null {
  const value = payload[camelCaseName] ?? payload[pascalCaseName];
  return Array.isArray(value) ? value : null;
}

function readString(
  payload: Record<string, unknown>,
  camelCaseName: string,
  pascalCaseName: string,
): string | null {
  const value = payload[camelCaseName] ?? payload[pascalCaseName];
  return typeof value === 'string' ? value : null;
}
