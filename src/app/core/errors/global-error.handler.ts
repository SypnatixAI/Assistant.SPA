import { ErrorHandler, Injectable } from '@angular/core';

import { TechnicalErrorService } from '../services/errors/technical-error.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private readonly technicalErrorService: TechnicalErrorService) {}

  handleError(error: unknown): void {
    this.technicalErrorService.report(error);
  }
}
