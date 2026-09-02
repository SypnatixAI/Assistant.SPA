import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Microsoft365Site } from '../../../../domain/microsoft365/microsoft365';
import { Microsoft365ApiService } from '../../../../core/services/api/microsoft365-api.service';
import { ApplicationNavigationService } from '../../../../core/services/navigation/application-navigation.service';
import { Microsoft365AdministrationPage } from './microsoft365-administration-page';

describe('Microsoft365AdministrationPage', () => {
  let apiService: jasmine.SpyObj<Microsoft365ApiService>;
  let fixture: ComponentFixture<Microsoft365AdministrationPage>;
  let navigationService: jasmine.SpyObj<ApplicationNavigationService>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj<Microsoft365ApiService>('Microsoft365ApiService', [
      'getDrives',
      'getLists',
      'getOnboardingStatus',
      'getSites',
      'selectSite',
      'setDriveIndexed',
      'setListIndexed',
      'startConsent',
    ]);
    navigationService = jasmine.createSpyObj<ApplicationNavigationService>(
      'ApplicationNavigationService',
      ['navigateToChat', 'navigateToExternalHttpsUrl'],
    );
  });

  it('Given_NoActiveConnection_When_ConsentStarts_Then_BrowserNavigatesToAuthorizationUrl', () => {
    // Given
    apiService.getOnboardingStatus.and.returnValue(of({
      isAdministrator: true,
      connectionStatus: 'NotStarted',
      isConsentComplete: false,
      hasSelectedSite: false,
      hasIndexedSource: false,
      isComplete: false,
    }));
    apiService.startConsent.and.returnValue(
      of({ authorizationUrl: 'https://localhost:9443/microsoft/consent' }),
    );
    createComponent();
    const page: HTMLElement = fixture.nativeElement;

    // When
    page
      .querySelector<HTMLButtonElement>('.primary-button')
      ?.click();

    // Then
    expect(navigationService.navigateToExternalHttpsUrl).toHaveBeenCalledWith(
      'https://localhost:9443/microsoft/consent',
    );
  });

  it('Given_MultipleAvailableSites_When_confirmSiteSelectionIsCalled_Then_AllCheckedSitesAreSelected', () => {
    // Given
    const firstSite: Microsoft365Site = {
      siteId: 'finance-site',
      displayName: 'Finance',
      webUrl: 'https://contoso.local/sites/finance',
      isSelected: false,
    };
    const secondSite: Microsoft365Site = {
      siteId: 'operations-site',
      displayName: 'Opérations',
      webUrl: 'https://contoso.local/sites/operations',
      isSelected: false,
    };
    apiService.getOnboardingStatus.and.returnValue(of({
      isAdministrator: true,
      connectionStatus: 'Active',
      isConsentComplete: true,
      hasSelectedSite: false,
      hasIndexedSource: false,
      isComplete: false,
    }));
    apiService.getSites.and.returnValue(of({ sites: [firstSite, secondSite] }));
    apiService.selectSite.and.callFake((siteId) => {
      const site = siteId === firstSite.siteId ? firstSite : secondSite;
      return of({ ...site, isSelected: true });
    });
    createComponent();
    const page: HTMLElement = fixture.nativeElement;

    // When
    const checkboxes = page.querySelectorAll<HTMLInputElement>('.site-checkbox');
    checkboxes[0]?.click();
    checkboxes[1]?.click();
    fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.confirm-sites-button')?.click();
    fixture.detectChanges();

    // Then
    expect(apiService.selectSite).toHaveBeenCalledTimes(2);
    expect(apiService.selectSite).toHaveBeenCalledWith(firstSite.siteId);
    expect(apiService.selectSite).toHaveBeenCalledWith(secondSite.siteId);
    expect(apiService.getDrives).not.toHaveBeenCalled();
    expect(apiService.getLists).not.toHaveBeenCalled();
    expect(page.textContent).toContain('Configuration terminée');
    expect(page.textContent).not.toContain('Étape 3');
    expect(page.textContent).not.toContain('indexer');
  });

  it('Given_CheckedSite_When_togglePendingSiteIsCalledAgain_Then_SiteIsNotSubmitted', () => {
    // Given
    const site: Microsoft365Site = {
      siteId: 'local-site',
      displayName: 'Site SharePoint local',
      webUrl: 'https://contoso.local/sites/assistant',
      isSelected: false,
    };
    apiService.getOnboardingStatus.and.returnValue(of({
      isAdministrator: true,
      connectionStatus: 'Active',
      isConsentComplete: true,
      hasSelectedSite: false,
      hasIndexedSource: false,
      isComplete: false,
    }));
    apiService.getSites.and.returnValue(of({ sites: [site] }));
    createComponent();
    const page: HTMLElement = fixture.nativeElement;
    const checkbox = page.querySelector<HTMLInputElement>('.site-checkbox');

    // When
    checkbox?.click();
    checkbox?.click();
    fixture.detectChanges();

    // Then
    expect(apiService.selectSite).not.toHaveBeenCalled();
    expect(
      page.querySelector<HTMLButtonElement>('.confirm-sites-button')?.disabled,
    ).toBeTrue();
    expect(page.textContent).toContain('0 site sélectionné');
  });

  it('Given_SiteLoadingFails_When_PageLoads_Then_EmptySiteMessageIsNotDisplayed', () => {
    // Given
    apiService.getOnboardingStatus.and.returnValue(of({
      isAdministrator: true,
      connectionStatus: 'Active',
      isConsentComplete: true,
      hasSelectedSite: false,
      hasIndexedSource: false,
      isComplete: false,
    }));
    apiService.getSites.and.returnValue(
      throwError(() => new Error('Microsoft Graph access denied')),
    );

    // When
    createComponent();
    const page: HTMLElement = fixture.nativeElement;

    // Then
    expect(page.textContent).toContain(
      'Les sites SharePoint n’ont pas pu être chargés.',
    );
    expect(page.textContent).not.toContain(
      'Aucun site SharePoint n’est disponible.',
    );
  });

  function createComponent(): void {
    TestBed.configureTestingModule({
      imports: [Microsoft365AdministrationPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { onboardingMode: true },
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        { provide: Microsoft365ApiService, useValue: apiService },
        { provide: ApplicationNavigationService, useValue: navigationService },
      ],
    });
    fixture = TestBed.createComponent(Microsoft365AdministrationPage);
    fixture.detectChanges();
  }
});
