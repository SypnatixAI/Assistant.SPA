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

  it('Given_TechnicalFailure_When_PageIsRendered_Then_FullPageRecoveryOptionsAreDisplayed', () => {
    // Given
    const page: HTMLElement = fixture.nativeElement;

    // When
    const fullPageLayout = page.querySelector('main.technical-error-page');
    const title = page.querySelector('#technical-error-title');
    const supportLink = page.querySelector<HTMLAnchorElement>(
      'a[href="mailto:support@assistantcore.com"]',
    );

    // Then
    expect(fullPageLayout).not.toBeNull();
    expect(title?.textContent).toContain('erreur technique');
    expect(supportLink?.textContent).toContain('Contacter le soutien');
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
