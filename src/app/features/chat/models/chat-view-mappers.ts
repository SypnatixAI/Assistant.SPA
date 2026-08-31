import {
  ASSISTANT_MESSAGE_ROLE,
  ConversationMessageResponse,
  ConversationMessageSourceResponse,
  ConversationSummaryResponse,
} from '../../../domain/conversations/conversation';
import { ChatConversationSummary, ChatMessage, ChatSource } from './chat-view-models';

export function toChatConversationSummary(
  conversation: ConversationSummaryResponse,
): ChatConversationSummary {
  return {
    id: conversation.id,
    preview: conversation.lastMessagePreview,
    title: conversation.title,
  };
}

/**
 * L'historique ne transporte aucun avertissement : seul l'envoi d'un message en
 * retourne. Les avertissements restent donc vides et ne sont jamais déduits des
 * sources.
 */
export function toChatMessage(message: ConversationMessageResponse): ChatMessage {
  return {
    content: message.content,
    id: message.id,
    role: message.role === ASSISTANT_MESSAGE_ROLE ? 'assistant' : 'user',
    sources: message.sources.map(toChatSource),
    warnings: [],
  };
}

function toChatSource(source: ConversationMessageSourceResponse): ChatSource {
  return {
    reference: source.reference,
    title: source.title,
    type: source.type,
    url: source.url,
  };
}
