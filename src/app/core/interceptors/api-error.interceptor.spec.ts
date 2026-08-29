import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';

import { ApiError } from '../../domain/errors/api-error';
import { apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  it('Given_BackendErrorContract_When_apiErrorInterceptorIsCalled_Then_TypedApiErrorIsThrown', async () => {
    // Given
    const request = new HttpRequest('GET', '/api/core/authenticateUser');
    const next = jasmine.createSpy('next').and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              code: 'organization_access_denied',
              message: 'Access denied.',
              metadata: { organizationId: 'organization-id' },
            },
            status: 403,
          }),
      ),
    );

    // When
    const action = firstValueFrom(apiErrorInterceptor(request, next));

    // Then
    await expectAsync(action).toBeRejectedWith(
      new ApiError(
        403,
        'organization_access_denied',
        'Access denied.',
        { organizationId: 'organization-id' },
      ),
    );
  });

  it('Given_LegacyBackendError_When_apiErrorInterceptorIsCalled_Then_FallbackContractIsCreated', async () => {
    // Given
    const request = new HttpRequest('GET', '/api/core/authenticateUser');
    const next = jasmine.createSpy('next').and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { Message: 'Authentication required.' },
            status: 401,
          }),
      ),
    );

    // When
    const action = firstValueFrom(apiErrorInterceptor(request, next));

    // Then
    await expectAsync(action).toBeRejectedWith(
      new ApiError(401, 'http_401', 'Authentication required.', null),
    );
  });
});
