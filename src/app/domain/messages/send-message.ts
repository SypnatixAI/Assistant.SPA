import { MessageUsageResponse } from '../usage/token-usage';

export interface SendMessageRequest {
  readonly conversationId: string | null;
  readonly message: string;
  readonly model: string;
}

export interface SendMessageSourceResponse {
  readonly type: string;
  readonly title: string;
  readonly url: string | null;
  readonly reference: string;
}

export interface SendMessageResponse {
  readonly conversationId: string;
  readonly messageId: string;
  readonly answer: string;
  readonly model: string;
  readonly sources: readonly SendMessageSourceResponse[];
  readonly warnings: readonly string[];
  readonly usage?: MessageUsageResponse;
  readonly createdAt: string;
}
