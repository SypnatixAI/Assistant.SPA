import { ApplicationNavigationService } from '../navigation/application-navigation.service';
import { TechnicalErrorService } from './technical-error.service';

describe('TechnicalErrorService', () => {
  it('Given_RepeatedFailures_When_reportIsCalled_Then_TechnicalPageNavigationOccursOnce', () => {
    // Given
    const applicationNavigationService =
      jasmine.createSpyObj<ApplicationNavigationService>(
        'ApplicationNavigationService',
        ['navigateToTechnicalError'],
      );
    const consoleError = spyOn(console, 'error');
    const service = new TechnicalErrorService(applicationNavigationService);

    // When
    service.report(new Error('First failure'));
    service.report(new Error('Second failure'));

    // Then
    expect(service.hasTechnicalError()).toBeTrue();
    expect(
      applicationNavigationService.navigateToTechnicalError,
    ).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it('Given_AnActiveTechnicalError_When_reset_Then_TheApplicationIsConsideredHealthyAgain', () => {
    // Given
    const applicationNavigationService =
      jasmine.createSpyObj<ApplicationNavigationService>(
        'ApplicationNavigationService',
        ['navigateToTechnicalError'],
      );
    spyOn(console, 'error');
    const service = new TechnicalErrorService(applicationNavigationService);
    service.report(new Error('panne'));

    // When
    service.reset();

    // Then
    expect(service.hasTechnicalError()).toBeFalse();
  });
});
