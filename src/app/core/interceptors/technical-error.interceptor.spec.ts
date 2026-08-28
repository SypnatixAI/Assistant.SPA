import {
  HttpErrorResponse,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';

import { TechnicalErrorService } from '../services/errors/technical-error.service';
import { TechnicalErrorInterceptor } from './technical-error.interceptor';

describe('TechnicalErrorInterceptor', () => {
  it('Given_FailedBackendCall_When_interceptIsCalled_Then_TechnicalErrorIsReported', async () => {
    // Given
    const error = new HttpErrorResponse({ status: 500 });
    const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
    next.handle.and.returnValue(throwError(() => error));
    const technicalErrorService = jasmine.createSpyObj<TechnicalErrorService>(
      'TechnicalErrorService',
      ['report'],
    );
    const interceptor = new TechnicalErrorInterceptor(technicalErrorService);
    const request = new HttpRequest('GET', '/api/core/authenticateUser');

    // When
    const action = firstValueFrom(interceptor.intercept(request, next));

    // Then
    await expectAsync(action).toBeRejectedWith(error);
    expect(technicalErrorService.report).toHaveBeenCalledWith(error);
  });
});
