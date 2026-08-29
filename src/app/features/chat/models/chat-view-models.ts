export type ConversationListStatus = 'error' | 'loading' | 'ready';

export interface ChatConversationSummary {
  readonly id: string;
  readonly title: string;
  readonly preview: string | null;
}

export interface ChatSource {
  readonly reference: string;
  readonly title: string;
  readonly type: string;
  readonly url: string | null;
}

export interface ChatMessage {
  readonly content: string;
  readonly id: string;
  readonly role: 'assistant' | 'user';
  readonly sources: readonly ChatSource[];
  readonly warnings: readonly string[];
}
