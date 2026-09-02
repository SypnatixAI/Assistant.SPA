import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import {
  APPLICATION_ROUTES,
  ApplicationNavigationService,
} from './application-navigation.service';

describe('ApplicationNavigationService', () => {
  const origin = 'https://onpremia.test';
  let assign: jasmine.Spy;
  let reload: jasmine.Spy;
  let navigateByUrl: jasmine.Spy;
  let router: { url: string; navigateByUrl: jasmine.Spy };

  beforeEach(() => {
    assign = jasmine.createSpy('assign');
    reload = jasmine.createSpy('reload');
    navigateByUrl = jasmine.createSpy('navigateByUrl');
    router = { url: '/app/chat', navigateByUrl };

    TestBed.configureTestingModule({
      providers: [
        ApplicationNavigationService,
        { provide: Router, useValue: router },
        { provide: DOCUMENT, useValue: { location: { assign, origin, reload } } },
      ],
    });
  });

  it('Given_AnHttpsAddress_When_navigateToExternalHttpsUrl_Then_TheBrowserLeavesTheApplication', () => {
    // Given
    const service = TestBed.inject(ApplicationNavigationService);

    // When
    service.navigateToExternalHttpsUrl('https://login.microsoftonline.com/consent');

    // Then
    expect(assign).toHaveBeenCalledOnceWith('https://login.microsoftonline.com/consent');
  });

  it('Given_APlainHttpAddress_When_navigateToExternalHttpsUrl_Then_TheNavigationIsRefused', () => {
    // Given
    const service = TestBed.inject(ApplicationNavigationService);

    // When
    const navigate = () => service.navigateToExternalHttpsUrl('http://login.example.com');

    // Then
    expect(navigate).toThrowError('External navigation requires an HTTPS URL.');
    expect(assign).not.toHaveBeenCalled();
  });

  it('Given_AScriptScheme_When_navigateToExternalHttpsUrl_Then_TheNavigationIsRefused', () => {
    // Given
    const service = TestBed.inject(ApplicationNavigationService);

    // When
    const navigate = () => service.navigateToExternalHttpsUrl('javascript:alert(1)');

    // Then
    expect(navigate).toThrowError('External navigation requires an HTTPS URL.');
    expect(assign).not.toHaveBeenCalled();
  });

  it('Given_AnInternalPath_When_getAbsoluteUrl_Then_ItIsResolvedAgainstTheApplicationOrigin', () => {
    // Given
    const service = TestBed.inject(ApplicationNavigationService);

    // When
    const absoluteUrl = service.getAbsoluteUrl(APPLICATION_ROUTES.chat);

    // Then
    expect(absoluteUrl).toBe(`${origin}${APPLICATION_ROUTES.chat}`);
  });

  it('Given_TheCurrentPage_When_getCurrentAbsoluteUrl_Then_TheRouterUrlIsUsed', () => {
    // Given
    router.url = '/app/settings/microsoft365';
    const service = TestBed.inject(ApplicationNavigationService);

    // When
    const absoluteUrl = service.getCurrentAbsoluteUrl();

    // Then
    expect(absoluteUrl).toBe(`${origin}/app/settings/microsoft365`);
  });

  it('Given_AnotherPage_When_navigateToTechnicalError_Then_TheErrorPageIsOpened', () => {
    // Given
    const service = TestBed.inject(ApplicationNavigationService);

    // When
    service.navigateToTechnicalError();

    // Then
    expect(navigateByUrl).toHaveBeenCalledOnceWith(APPLICATION_ROUTES.technicalError);
  });

  it('Given_TheErrorPageAlreadyDisplayed_When_navigateToTechnicalError_Then_NoNavigationIsRepeated', () => {
    // Given
    router.url = APPLICATION_ROUTES.technicalError;
    const service = TestBed.inject(ApplicationNavigationService);

    // When
    service.navigateToTechnicalError();

    // Then
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('Given_TheAccessDeniedPageAlreadyDisplayed_When_navigateToAccessDenied_Then_NoNavigationIsRepeated', () => {
    // Given
    router.url = APPLICATION_ROUTES.accessDenied;
    const service = TestBed.inject(ApplicationNavigationService);

    // When
    service.navigateToAccessDenied();

    // Then
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('Given_AnUnexpectedState_When_reloadApplication_Then_TheDocumentIsReloaded', () => {
    // Given
    const service = TestBed.inject(ApplicationNavigationService);

    // When
    service.reloadApplication();

    // Then
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
