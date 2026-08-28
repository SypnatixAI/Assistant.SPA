import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import { ApplicationPage } from './application-page';

describe('ApplicationPage', () => {
  const session: AuthenticatedSession = {
    organization: { id: 'organization-id', name: 'MetalPro' },
    roles: ['User'],
    user: {
      displayName: 'Marc Tremblay',
      email: 'marc@metalpro.com',
      id: 'user-id',
    },
  };
  let fixture: ComponentFixture<ApplicationPage>;
  let logout: jasmine.Spy;

  beforeEach(async () => {
    logout = jasmine.createSpy('logout');
    await TestBed.configureTestingModule({
      imports: [ApplicationPage],
      providers: [
        {
          provide: AuthenticationService,
          useValue: { logout, session: signal(session) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ApplicationPage);
    fixture.detectChanges();
  });

  it('Given_AuthenticatedSession_When_ApplicationPageIsDisplayed_Then_IdentityAndLogoutAreAvailable', () => {
    // Given
    const page: HTMLElement = fixture.nativeElement;

    // When
    const logoutButton: HTMLButtonElement = page.querySelector('button')!;
    logoutButton.click();

    // Then
    expect(page.textContent).toContain('Marc Tremblay');
    expect(page.textContent).toContain('MetalPro');
    expect(logout).toHaveBeenCalled();
  });
});
