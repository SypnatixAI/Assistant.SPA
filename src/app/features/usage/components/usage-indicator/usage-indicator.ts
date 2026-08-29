import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TokenUsageSnapshot } from '../../../../domain/usage/token-usage';

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-CA', {
  dateStyle: 'long',
  timeStyle: 'short',
});

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-usage-indicator',
  styleUrl: './usage-indicator.css',
  templateUrl: './usage-indicator.html',
})
export class UsageIndicator {
  readonly usage = input<TokenUsageSnapshot | null>(null);
  readonly isExhausted = input(false);
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);
  readonly refreshRequested = output<void>();

  formatRenewalDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'date inconnue' : DATE_FORMATTER.format(date);
  }
}
