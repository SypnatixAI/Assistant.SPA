export interface TokenUsageSnapshot {
  readonly periodEndsAt: string;
  readonly tokenLimit: number;
  readonly tokensUsed: number;
  readonly tokensRemaining: number;
  readonly isExhausted: boolean;
}

export interface TokenUsageResponse extends TokenUsageSnapshot {
  readonly periodStartsAt: string;
}

export interface MessageUsageResponse extends TokenUsageSnapshot {
  readonly requestTokens: number;
}
