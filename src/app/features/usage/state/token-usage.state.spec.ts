import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { UsageApiService } from '../../../core/services/api/usage-api.service';
import { ApiError } from '../../../domain/errors/api-error';
import { TokenUsageResponse } from '../../../domain/usage/token-usage';
import { TokenUsageState } from './token-usage.state';

describe('TokenUsageState', () => {
  const usage: TokenUsageResponse = {
    periodStartsAt: '2026-08-01T00:00:00Z',
    periodEndsAt: '2026-09-01T00:00:00Z',
    tokenLimit: 1_000_000,
    tokensUsed: 428_000,
    tokensRemaining: 572_000,
    isExhausted: false,
  };
  let api: jasmine.SpyObj<UsageApiService>;
  let state: TokenUsageState;

  beforeEach(() => {
    api = jasmine.createSpyObj<UsageApiService>('UsageApiService', ['getTokenUsage']);
    TestBed.configureTestingModule({
      providers: [TokenUsageState, { provide: UsageApiService, useValue: api }],
    });
    state = TestBed.inject(TokenUsageState);
  });

  it('Given_CurrentUsage_When_loadIsCalled_Then_BackendBalanceIsExposed', () => {
    // Given
    api.getTokenUsage.and.returnValue(of(usage));

    // When
    state.load();

    // Then
    expect(state.usage()?.tokensRemaining).toBe(572_000);
    expect(state.isExhausted()).toBeFalse();
  });

  it('Given_MessageUsage_When_updateFromMessageIsCalled_Then_BackendBalanceReplacesCurrentState', () => {
    // Given
    api.getTokenUsage.and.returnValue(of(usage));
    state.load();

    // When
    state.updateFromMessage({
      requestTokens: 8_460,
      tokenLimit: 1_000_000,
      tokensUsed: 436_460,
      tokensRemaining: 563_540,
      periodEndsAt: '2026-09-01T00:00:00Z',
      isExhausted: false,
    });

    // Then
    expect(state.usage()?.tokensRemaining).toBe(563_540);
    expect(state.usage()?.tokensUsed).toBe(436_460);
  });

  it('Given_QuotaError_When_synchronizeQuotaExhaustionIsCalled_Then_SendingIsBlockedImmediately', () => {
    // Given
    api.getTokenUsage.and.returnValue(of(usage));
    state.load();
    const error = new ApiError(429, 'organization_token_quota_exhausted', 'Quota épuisé.', {
      periodEndsAt: '2026-10-01T00:00:00Z',
    });

    // When
    const handled = state.synchronizeQuotaExhaustion(error);

    // Then
    expect(handled).toBeTrue();
    expect(state.isExhausted()).toBeTrue();
    expect(state.usage()?.tokensRemaining).toBe(0);
    expect(state.usage()?.periodEndsAt).toBe('2026-10-01T00:00:00Z');
  });

  it('Given_ARequestFailure_When_loadIsCalledAgain_Then_UsageCanBeRefreshed', () => {
    // Given
    api.getTokenUsage.and.returnValues(
      throwError(() => new Error('network')),
      of(usage),
    );
    state.load();

    // When
    state.load();

    // Then
    expect(api.getTokenUsage).toHaveBeenCalledTimes(2);
    expect(state.usage()?.tokensRemaining).toBe(572_000);
    expect(state.error()).toBeNull();
  });
});
