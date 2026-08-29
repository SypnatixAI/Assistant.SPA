import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthenticationService } from '../../../../core/services/authentication/authentication.service';
import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import { ChatPage } from './chat-page';

describe('ChatPage', () => {
  const session: AuthenticatedSession = {
    organization: { id: 'organization-id', name: 'MetalPro' },
    roles: ['User'],
    user: {
      displayName: 'Marc Tremblay',
      email: 'marc@metalpro.com',
      id: 'user-id',
    },
  };
  let fixture: ComponentFixture<ChatPage>;
  let logout: jasmine.Spy;

  beforeEach(async () => {
    logout = jasmine.createSpy('logout');
    await TestBed.configureTestingModule({
      imports: [ChatPage],
      providers: [
        {
          provide: AuthenticationService,
          useValue: { logout, session: signal(session) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ChatPage);
    fixture.detectChanges();
  });

  it('Given_AuthenticatedSession_When_ChatPageIsDisplayed_Then_IdentityAndLogoutAreAvailable', () => {
    // Given
    const page: HTMLElement = fixture.nativeElement;

    // When
    const menuButton: HTMLButtonElement = page.querySelector('.user-menu__trigger')!;
    menuButton.click();
    fixture.detectChanges();
    const logoutButton = Array.from(page.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Se déconnecter'),
    )!;
    logoutButton.click();

    // Then
    expect(page.textContent).toContain('Marc Tremblay');
    expect(page.textContent).toContain('MetalPro');
    expect(logout).toHaveBeenCalled();
  });

  it('Given_AuthenticatedSession_When_ChatPageIsDisplayed_Then_SecureWorkspaceContextIsVisible', () => {
    // Given
    const page: HTMLElement = fixture.nativeElement;

    // When
    const workspaceStatus = page.querySelector('.workspace-status');

    // Then
    expect(workspaceStatus?.textContent).toContain('Espace sécurisé');
    expect(workspaceStatus?.textContent).toContain('MetalPro');
  });

  it('Given_AQuestionSuggestion_When_useSuggestedQuestion_Then_ComposerReceivesTheQuestion', () => {
    // Given
    const page: HTMLElement = fixture.nativeElement;
    const suggestion: HTMLButtonElement = page.querySelector('.suggestions button')!;

    // When
    suggestion.click();
    fixture.detectChanges();

    // Then
    const textarea: HTMLTextAreaElement = page.querySelector('textarea')!;
    expect(textarea.value).toContain('politiques');
    expect(document.activeElement).toBe(textarea);
  });

  it('Given_AVisibleMessage_When_startNewConversation_Then_MessageIsClearedAndFocusReturnsToComposer', async () => {
    // Given
    const component = fixture.componentInstance;
    component.submitMessage('Question locale');
    fixture.detectChanges();

    // When
    const newConversationButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.new-conversation');
    newConversationButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.textContent).not.toContain('Question locale');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('textarea'));
  });

  it('Given_OpenMobileNavigation_When_handleDocumentKeydownReceivesEscape_Then_NavigationClosesAndFocusReturnsToTrigger', async () => {
    // Given
    const navigationButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.navigation-trigger');
    navigationButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    // When
    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();

    // Then
    expect(fixture.nativeElement.querySelector('.mobile-navigation')).toBeNull();
    expect(document.activeElement).toBe(navigationButton);
  });

  it('Given_FocusOnFirstDrawerControl_When_handleDocumentKeydownReceivesShiftTab_Then_FocusWrapsToLastControl', async () => {
    // Given
    const navigationButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.navigation-trigger');
    navigationButton.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const panel: HTMLElement = fixture.nativeElement.querySelector('.mobile-navigation__panel');
    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    firstElement.focus();

    // When
    document.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Tab', shiftKey: true }),
    );

    // Then
    expect(document.activeElement).toBe(lastElement);
  });
});
