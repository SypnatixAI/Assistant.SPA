import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chat-processing',
  styleUrl: './chat-processing.css',
  templateUrl: './chat-processing.html',
})
export class ChatProcessing {
  readonly message = input.required<string>();
}
