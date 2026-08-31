export interface SendMessageRequest {
  readonly conversationId: string | null;
  readonly message: string;
  readonly model?: string;
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
  readonly createdAt: string;
}

export type SendMessageStreamEvent =
  | MessageAcceptedStreamEvent
  | ProgressUpdatedStreamEvent
  | AnswerDeltaStreamEvent
  | AnswerCompletedStreamEvent
  | MessageStreamErrorEvent;

export interface MessageAcceptedStreamEvent {
  readonly type: 'message.accepted';
  readonly conversationId: string;
  readonly userMessageId: string;
}

export interface ProgressUpdatedStreamEvent {
  readonly type: 'progress.updated';
  readonly message: string;
}

export interface AnswerDeltaStreamEvent {
  readonly type: 'answer.delta';
  readonly delta: string;
}

export interface AnswerCompletedStreamEvent {
  readonly type: 'answer.completed';
  readonly response: SendMessageResponse;
}

export interface MessageStreamErrorEvent {
  readonly type: 'error';
  readonly code: string;
}
