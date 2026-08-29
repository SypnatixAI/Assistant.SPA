import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-message',
  styleUrl: './user-message.css',
  templateUrl: './user-message.html',
})
export class UserMessage {
  readonly content = input.required<string>();
}
