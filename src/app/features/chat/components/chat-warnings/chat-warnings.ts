import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chat-warnings',
  styleUrl: './chat-warnings.css',
  templateUrl: './chat-warnings.html',
})
export class ChatWarnings {
  readonly warnings = input<readonly string[]>([]);
}
