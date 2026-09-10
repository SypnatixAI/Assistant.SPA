import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import {
  ChatActivity,
  ChatMessage as ChatMessageModel,
} from '../../models/chat-view-models';
import { AssistantMessage } from '../assistant-message/assistant-message';
import { ChatProcessing } from '../chat-processing/chat-processing';
import { UserMessage } from '../user-message/user-message';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AssistantMessage, ChatProcessing, UserMessage],
  selector: 'app-chat-message-list',
  styleUrl: './chat-message-list.css',
  templateUrl: './chat-message-list.html',
})
export class ChatMessageList {
  readonly messages = input<readonly ChatMessageModel[]>([]);
  readonly activities = input<readonly ChatActivity[]>([]);
  readonly streamingMessage = input<ChatMessageModel | null>(null);
}
