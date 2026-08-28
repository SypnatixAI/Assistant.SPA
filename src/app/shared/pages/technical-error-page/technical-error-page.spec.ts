import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationNavigationService } from '../../../core/services/navigation/application-navigation.service';
import { TechnicalErrorPage } from './technical-error-page';

describe('TechnicalErrorPage', () => {
  let fixture: ComponentFixture<TechnicalErrorPage>;
  let reloadApplication: jasmine.Spy;

  beforeEach(async () => {
    reloadApplication = jasmine.createSpy('reloadApplication');
    await TestBed.configureTestingModule({
      imports: [TechnicalErrorPage],
      providers: [
        {
          provide: ApplicationNavigationService,
          useValue: { reloadApplication },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TechnicalErrorPage);
    fixture.detectChanges();
  });

  it('Given_TechnicalFailure_When_reloadApplicationIsCalled_Then_ApplicationReloadStarts', () => {
    // Given
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');

    // When
    button.click();

    // Then
    expect(reloadApplication).toHaveBeenCalled();
  });
});
