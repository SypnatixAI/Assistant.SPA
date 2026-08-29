import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-chat-welcome',
  styleUrl: './chat-welcome.css',
  templateUrl: './chat-welcome.html',
})
export class ChatWelcome {
  readonly displayName = input.required<string>();
  readonly organizationName = input.required<string>();
  readonly questionSelected = output<string>();
  readonly questions = input<readonly string[]>([
    'Résumez les dernières mises à jour de nos politiques.',
    'Quels documents parlent du télétravail ?',
    'Où trouver le processus de remboursement?',
    'Quelles échéances importantes approchent?',
  ]);

  firstName(): string {
    return this.displayName().trim().split(/\s+/)[0] || this.displayName();
  }
}
