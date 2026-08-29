import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ChatMessage } from '../../models/chat-view-models';
import { ChatSources } from '../chat-sources/chat-sources';
import { ChatWarnings } from '../chat-warnings/chat-warnings';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatSources, ChatWarnings],
  selector: 'app-assistant-message',
  styleUrl: './assistant-message.css',
  templateUrl: './assistant-message.html',
})
export class AssistantMessage {
  readonly message = input.required<ChatMessage>();
}
