export const CONVERSATION_PAGE_MINIMUM_LIMIT = 1;
export const CONVERSATION_PAGE_MAXIMUM_LIMIT = 100;

export const ASSISTANT_MESSAGE_ROLE = 'Assistant';

export interface ConversationPageRequest {
  readonly cursor?: string | null;
  readonly limit?: number;
}

export interface ConversationSummaryResponse {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastMessagePreview: string | null;
}

export interface ListConversationsResponse {
  readonly conversations: readonly ConversationSummaryResponse[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export interface ConversationMessageSourceResponse {
  readonly type: string;
  readonly title: string;
  readonly url: string | null;
  readonly reference: string;
  readonly sourceDate: string | null;
}

export interface ConversationMessageResponse {
  readonly id: string;
  readonly role: string;
  readonly content: string;
  readonly processingStatus: string;
  readonly model: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly sources: readonly ConversationMessageSourceResponse[];
}

export interface GetConversationMessagesResponse {
  readonly conversationId: string;
  readonly messages: readonly ConversationMessageResponse[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

/**
 * Refuse une limite que le backend rejetterait en 400. Une limite absente laisse
 * le backend appliquer sa valeur par défaut.
 */
export function assertConversationPageLimit(limit: number | undefined): void {
  if (limit === undefined) {
    return;
  }

  if (
    !Number.isInteger(limit) ||
    limit < CONVERSATION_PAGE_MINIMUM_LIMIT ||
    limit > CONVERSATION_PAGE_MAXIMUM_LIMIT
  ) {
    throw new RangeError(
      `limit doit être un entier entre ${CONVERSATION_PAGE_MINIMUM_LIMIT} et ${CONVERSATION_PAGE_MAXIMUM_LIMIT}.`,
    );
  }
}
