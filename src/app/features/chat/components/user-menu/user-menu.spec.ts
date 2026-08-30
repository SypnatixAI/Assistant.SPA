import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import { UserMenu } from './user-menu';

describe('UserMenu', () => {
  const session: AuthenticatedSession = {
    organization: { id: 'organization-id', name: 'MetalPro' },
    roles: ['User'],
    user: { displayName: 'Marc Tremblay', email: 'marc@metalpro.com', id: 'user-id' },
  };
  let fixture: ComponentFixture<UserMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMenu],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(UserMenu);
    fixture.componentRef.setInput('session', session);
  });

  it('Given_AnAdministrator_When_UserMenuIsOpened_Then_Microsoft365LinkIsVisible', () => {
    // Given
    fixture.componentRef.setInput('session', { ...session, roles: ['Admin'] });
    fixture.detectChanges();
    const menu: HTMLElement = fixture.nativeElement;

    // When
    menu.querySelector<HTMLButtonElement>('.user-menu__trigger')?.click();
    fixture.detectChanges();

    // Then
    const link = menu.querySelector<HTMLAnchorElement>(
      'a[href="/administration/microsoft365"]',
    );
    expect(link?.textContent).toContain('Microsoft 365');
  });

  it('Given_AConnectedUser_When_UserMenuIsDisplayed_Then_OnlyFirstNameAndItsInitialAreVisible', () => {
    // Given
    // The connected user has a first name and a last name.

    // When
    fixture.detectChanges();

    // Then
    const menu: HTMLElement = fixture.nativeElement;
    expect(menu.querySelector('.user-menu__avatar')?.textContent?.trim()).toBe('M');
    expect(menu.querySelector('.user-menu__identity strong')?.textContent?.trim()).toBe('Marc');
    expect(menu.textContent).not.toContain('Marc Tremblay');
  });
});
