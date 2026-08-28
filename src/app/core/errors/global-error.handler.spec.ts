import { TechnicalErrorService } from '../services/errors/technical-error.service';
import { GlobalErrorHandler } from './global-error.handler';

describe('GlobalErrorHandler', () => {
  it('Given_UnexpectedAngularError_When_handleErrorIsCalled_Then_TechnicalErrorIsReported', () => {
    // Given
    const technicalErrorService = jasmine.createSpyObj<TechnicalErrorService>(
      'TechnicalErrorService',
      ['report'],
    );
    const handler = new GlobalErrorHandler(technicalErrorService);
    const error = new Error('Unexpected failure');

    // When
    handler.handleError(error);

    // Then
    expect(technicalErrorService.report).toHaveBeenCalledWith(error);
  });
});
