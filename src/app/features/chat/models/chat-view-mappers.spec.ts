import {
  ConversationMessageResponse,
  ConversationSummaryResponse,
} from '../../../domain/conversations/conversation';
import { toChatConversationSummary, toChatMessage } from './chat-view-mappers';

describe('chat view mappers', () => {
  const summary: ConversationSummaryResponse = {
    id: 'conversation-id',
    title: 'Politique de télétravail',
    createdAt: '2026-08-06T20:15:00Z',
    updatedAt: '2026-08-06T20:18:32Z',
    lastMessagePreview: null,
  };

  function message(
    overrides: Partial<ConversationMessageResponse>,
  ): ConversationMessageResponse {
    return {
      id: 'message-id',
      role: 'Assistant',
      content: 'La politique permet deux jours.',
      processingStatus: 'Completed',
      model: 'gpt-5.6-luna',
      createdAt: '2026-08-06T20:15:08Z',
      updatedAt: '2026-08-06T20:15:08Z',
      sources: [],
      ...overrides,
    };
  }

  it('Given_AConversationWithoutMessage_When_toChatConversationSummary_Then_ThePreviewStaysEmpty', () => {
    // Given
    const conversation = summary;

    // When
    const result = toChatConversationSummary(conversation);

    // Then
    expect(result).toEqual({
      id: 'conversation-id',
      title: 'Politique de télétravail',
      preview: null,
    });
  });

  it('Given_AnAssistantAnswerWithSources_When_toChatMessage_Then_SourcesAreKeptAndWarningsStayEmpty', () => {
    // Given
    const response = message({
      sources: [
        {
          type: 'SharePoint',
          title: 'Politique de télétravail',
          url: 'https://example.sharepoint.com/politique',
          reference: 'document-123',
          sourceDate: '2026-05-01T00:00:00Z',
        },
        {
          type: 'SharePoint',
          title: 'Note interne',
          url: null,
          reference: 'document-456',
          sourceDate: null,
        },
      ],
    });

    // When
    const result = toChatMessage(response);

    // Then
    expect(result.role).toBe('assistant');
    expect(result.sources).toEqual([
      {
        type: 'SharePoint',
        title: 'Politique de télétravail',
        url: 'https://example.sharepoint.com/politique',
        reference: 'document-123',
      },
      {
        type: 'SharePoint',
        title: 'Note interne',
        url: null,
        reference: 'document-456',
      },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it('Given_AMemberQuestion_When_toChatMessage_Then_TheRoleBecomesUser', () => {
    // Given
    const response = message({
      role: 'User',
      content: 'Quelle est la politique de télétravail ?',
      model: null,
    });

    // When
    const result = toChatMessage(response);

    // Then
    expect(result.role).toBe('user');
    expect(result.content).toBe('Quelle est la politique de télétravail ?');
  });
});
