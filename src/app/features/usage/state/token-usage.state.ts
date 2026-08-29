import { computed, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { UsageApiService } from '../../../core/services/api/usage-api.service';
import { ApiError } from '../../../domain/errors/api-error';
import {
  MessageUsageResponse,
  TokenUsageSnapshot,
  TokenUsageResponse,
} from '../../../domain/usage/token-usage';

const USAGE_ERROR = 'Le quota ne peut pas être chargé pour le moment.';
const QUOTA_EXHAUSTED_ERROR_CODE = 'organization_token_quota_exhausted';

@Injectable({ providedIn: 'root' })
export class TokenUsageState {
  private readonly usageValue = signal<TokenUsageSnapshot | null>(null);
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<string | null>(null);
  private readonly exhaustedOverride = signal(false);
  private loadSubscription: Subscription | null = null;

  readonly usage = this.usageValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly isExhausted = computed(
    () => this.exhaustedOverride() || this.usageValue()?.isExhausted === true,
  );

  constructor(private readonly usageApiService: UsageApiService) {}

  load(): void {
    this.loadSubscription?.unsubscribe();
    this.loadingValue.set(true);
    this.errorValue.set(null);

    this.loadSubscription = this.usageApiService.getTokenUsage().subscribe({
      next: (usage) => this.applyUsage(usage),
      error: () => {
        this.errorValue.set(USAGE_ERROR);
        this.loadingValue.set(false);
      },
      complete: () => this.loadingValue.set(false),
    });
  }

  updateFromMessage(usage: MessageUsageResponse): void {
    this.applyUsage(usage);
  }

  synchronizeQuotaExhaustion(error: unknown): boolean {
    if (!(error instanceof ApiError) || error.code !== QUOTA_EXHAUSTED_ERROR_CODE) {
      return false;
    }

    this.exhaustedOverride.set(true);
    const currentUsage = this.usageValue();
    const renewedAt = error.metadata?.['periodEndsAt'];
    if (currentUsage) {
      this.usageValue.set({
        ...currentUsage,
        periodEndsAt: typeof renewedAt === 'string' ? renewedAt : currentUsage.periodEndsAt,
        tokensRemaining: 0,
        isExhausted: true,
      });
    } else {
      this.load();
    }

    return true;
  }

  private applyUsage(usage: TokenUsageResponse | MessageUsageResponse): void {
    this.usageValue.set({
      periodEndsAt: usage.periodEndsAt,
      tokenLimit: usage.tokenLimit,
      tokensUsed: usage.tokensUsed,
      tokensRemaining: usage.tokensRemaining,
      isExhausted: usage.isExhausted,
    });
    this.exhaustedOverride.set(false);
    this.errorValue.set(null);
  }
}
