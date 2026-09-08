import { ApiError } from './api-error';
import {
  findConversationErrorMessage,
  resolveConversationErrorMessage,
  resolveConversationErrorRecovery,
} from './conversation-error';

describe('conversation-error', () => {
  const FALLBACK = 'Impossible de charger les conversations.';

  /** Les codes stables du contrat backend, replis compris. */
  const CONTRACT_CODES = [
    'bad_request',
    'conflict',
    'conversation_archived',
    'conversation_not_found',
    'conversation_version_conflict',
    'empty_conversation_patch',
    'invalid_conversation_status',
    'invalid_conversation_title',
    'invalid_pagination',
    'invalid_version_header',
    'not_found',
  ];

  function apiError(status: number, code: string): ApiError {
    return new ApiError(status, code, 'Conversation not found.', null);
  }

  it('Given_EveryContractCode_When_findConversationErrorMessage_Then_ANonEmptyFrenchMessageIsReturned', () => {
    // Given
    const codes = CONTRACT_CODES;

    // When
    const messages = codes.map((code) => findConversationErrorMessage(code));

    // Then
    expect(messages.every((message) => message !== null && message.trim().length > 0)).toBeTrue();
  });

  it('Given_AnUnknownCode_When_findConversationErrorMessage_Then_NullIsReturned', () => {
    // Given
    const code = 'teapot_on_fire';

    // When
    const message = findConversationErrorMessage(code);

    // Then
    expect(message).toBeNull();
  });

  it('Given_AMissingCode_When_findConversationErrorMessage_Then_NullIsReturned', () => {
    // Given
    const code = undefined;

    // When
    const message = findConversationErrorMessage(code);

    // Then
    expect(message).toBeNull();
  });

  it('Given_ADeletedConversation_When_resolveConversationErrorMessage_Then_TheMessageSaysItNoLongerExists', () => {
    // Given
    const error = apiError(404, 'conversation_not_found');

    // When
    const message = resolveConversationErrorMessage(error, FALLBACK);

    // Then
    expect(message).toBe('Cette conversation n’existe plus.');
  });

  it('Given_AnUnknownErrorCode_When_resolveConversationErrorMessage_Then_TheCallerFallbackIsKept', () => {
    // Given
    const error = apiError(400, 'code_hors_contrat');

    // When
    const message = resolveConversationErrorMessage(error, FALLBACK);

    // Then
    expect(message).toBe(FALLBACK);
  });

  it('Given_ANetworkFailureWithoutApiError_When_resolveConversationErrorMessage_Then_TheCallerFallbackIsKept', () => {
    // Given
    const error = new Error('offline');

    // When
    const message = resolveConversationErrorMessage(error, FALLBACK);

    // Then
    expect(message).toBe(FALLBACK);
  });

  it('Given_AnInvalidCursor_When_resolveConversationErrorRecovery_Then_TheListMustBeReloaded', () => {
    // Given
    const error = apiError(400, 'invalid_pagination');

    // When
    const recovery = resolveConversationErrorRecovery(error);

    // Then
    expect(recovery).toBe('reload-list');
  });

  it('Given_ADeletedConversation_When_resolveConversationErrorRecovery_Then_ANewConversationIsProposed', () => {
    // Given
    const error = apiError(404, 'conversation_not_found');

    // When
    const recovery = resolveConversationErrorRecovery(error);

    // Then
    expect(recovery).toBe('start-new-conversation');
  });

  it('Given_ANetworkFailure_When_resolveConversationErrorRecovery_Then_RetryStaysTheDefault', () => {
    // Given
    const error = new Error('offline');

    // When
    const recovery = resolveConversationErrorRecovery(error);

    // Then
    expect(recovery).toBe('retry');
  });
});
