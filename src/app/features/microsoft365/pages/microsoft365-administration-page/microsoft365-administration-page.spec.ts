import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

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

  it('Given_AvailableSite_When_SiteIsSelected_Then_OnboardingIsCompletedWithoutManualContentStep', () => {
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
    apiService.selectSite.and.returnValue(of({ ...site, isSelected: true }));
    createComponent();
    const page: HTMLElement = fixture.nativeElement;

    // When
    page.querySelector<HTMLButtonElement>('.site-option')?.click();
    fixture.detectChanges();

    // Then
    expect(apiService.selectSite).toHaveBeenCalledWith(site.siteId);
    expect(apiService.getDrives).not.toHaveBeenCalled();
    expect(apiService.getLists).not.toHaveBeenCalled();
    expect(page.textContent).toContain('Configuration terminée');
    expect(page.textContent).not.toContain('Étape 3');
    expect(page.textContent).not.toContain('indexer');
  });

  function createComponent(): void {
    TestBed.configureTestingModule({
      imports: [Microsoft365AdministrationPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { onboardingMode: true } } },
        },
        { provide: Microsoft365ApiService, useValue: apiService },
        { provide: ApplicationNavigationService, useValue: navigationService },
      ],
    });
    fixture = TestBed.createComponent(Microsoft365AdministrationPage);
    fixture.detectChanges();
  }
});
