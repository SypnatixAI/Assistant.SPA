import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  SecurityContext,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';

import { ChatMessage } from '../../models/chat-view-models';
import { ChatSources } from '../chat-sources/chat-sources';
import { ChatWarnings } from '../chat-warnings/chat-warnings';

const normalizeAssistantMarkdown = (content: string): string =>
  content.replace(/^\\(#{1,6})(?!#)\s*/gm, '$1 ');

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatSources, ChatWarnings],
  selector: 'app-assistant-message',
  styleUrl: './assistant-message.css',
  templateUrl: './assistant-message.html',
  encapsulation: ViewEncapsulation.None,
})
export class AssistantMessage {
  readonly message = input.required<ChatMessage>();
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly renderedContent = computed(() => {
    const html = marked(normalizeAssistantMarkdown(this.message().content), { async: false });
    return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  });
}
