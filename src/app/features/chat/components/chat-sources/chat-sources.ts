import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ChatSource } from '../../models/chat-view-models';
import { getSafeExternalUrl } from '../../security/safe-external-url';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chat-sources',
  styleUrl: './chat-sources.css',
  templateUrl: './chat-sources.html',
})
export class ChatSources {
  readonly sources = input<readonly ChatSource[]>([]);

  protected safeUrl(url: string | null): string | null {
    return getSafeExternalUrl(url);
  }
}
