import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  SendMessageRequest,
  SendMessageResponse,
  SendMessageStreamEvent,
} from '../../../domain/messages/send-message';
import { PUBLIC_APP_CONFIG, PublicAppConfig } from '../../config/public-app-config';

@Injectable({ providedIn: 'root' })
export class MessagesApiService {
  constructor(
    private readonly httpClient: HttpClient,
    @Inject(PUBLIC_APP_CONFIG)
    private readonly publicAppConfig: PublicAppConfig,
  ) {}

  sendMessage(request: SendMessageRequest): Observable<SendMessageResponse> {
    const apiBaseUrl = this.publicAppConfig.apiBaseUrl.replace(/\/$/, '');

    return this.httpClient.post<SendMessageResponse>(`${apiBaseUrl}/api/messages`, request);
  }

  streamMessage(request: SendMessageRequest): Observable<SendMessageStreamEvent> {
    const apiBaseUrl = this.publicAppConfig.apiBaseUrl.replace(/\/$/, '');

    return new Observable<SendMessageStreamEvent>((subscriber) => {
      let receivedText = '';
      let eventBuffer = '';
      const subscription = this.httpClient
        .post(`${apiBaseUrl}/api/messages/stream`, request, {
          observe: 'events',
          reportProgress: true,
          responseType: 'text',
        })
        .subscribe({
          next: (event) => {
            if (event.type === HttpEventType.DownloadProgress) {
              const partialText = event.partialText ?? '';
              const newText = partialText.slice(receivedText.length);
              receivedText = partialText;
              eventBuffer = this.emitEvents(newText, eventBuffer, subscriber);
              return;
            }

            if (event instanceof HttpResponse) {
              const responseText = event.body ?? '';
              const newText = responseText.slice(receivedText.length);
              eventBuffer = this.emitEvents(newText, eventBuffer, subscriber);
            }
          },
          error: (error: unknown) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });

      return () => subscription.unsubscribe();
    });
  }

  private emitEvents(
    text: string,
    buffer: string,
    subscriber: { next(event: SendMessageStreamEvent): void },
  ): string {
    let remainingText = buffer + text;
    let separatorIndex = remainingText.indexOf('\n\n');

    while (separatorIndex >= 0) {
      const rawEvent = remainingText.slice(0, separatorIndex);
      remainingText = remainingText.slice(separatorIndex + 2);
      const streamEvent = this.parseEvent(rawEvent);
      if (streamEvent !== null) {
        subscriber.next(streamEvent);
      }

      separatorIndex = remainingText.indexOf('\n\n');
    }

    return remainingText;
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
