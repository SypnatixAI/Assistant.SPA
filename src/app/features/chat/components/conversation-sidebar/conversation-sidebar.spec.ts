import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthenticatedSession } from '../../../../domain/auth/authenticated-session';
import { ConversationSidebar } from './conversation-sidebar';

describe('ConversationSidebar', () => {
  const session: AuthenticatedSession = {
    organization: { id: 'organization-id', name: 'MetalPro' },
    roles: ['User'],
    user: { displayName: 'Marc Tremblay', email: 'marc@metalpro.com', id: 'user-id' },
  };
  let fixture: ComponentFixture<ConversationSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConversationSidebar] }).compileComponents();
    fixture = TestBed.createComponent(ConversationSidebar);
    fixture.componentRef.setInput('session', session);
  });

  it('Given_AnEmptyConversationList_When_ConversationSidebarIsDisplayed_Then_EmptyStateIsVisible', () => {
    // Given
    fixture.componentRef.setInput('status', 'ready');
    fixture.componentRef.setInput('conversations', []);

    // When
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.textContent).toContain('Vos conversations apparaîtront ici.');
  });

  it('Given_ConversationLoadingError_When_retryRequested_Then_RetryEventIsEmitted', () => {
    // Given
    let retryCount = 0;
    fixture.componentInstance.retryRequested.subscribe(() => retryCount++);
    fixture.componentRef.setInput('status', 'error');
    fixture.detectChanges();

    // When
    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector('.sidebar-state button');
    retryButton.click();

    // Then
    expect(retryCount).toBe(1);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('Given_AnotherConversationPage_When_nextPageRequested_Then_NextPageEventIsEmitted', () => {
    // Given
    let requestCount = 0;
    fixture.componentInstance.nextPageRequested.subscribe(() => requestCount++);
    fixture.componentRef.setInput('conversations', [
      { id: 'conversation-id', preview: 'Question récente', title: 'Politiques' },
    ]);
    fixture.componentRef.setInput('hasNextPage', true);
    fixture.detectChanges();

    // When
    const loadMoreButton: HTMLButtonElement = fixture.nativeElement.querySelector('.load-more');
    loadMoreButton.click();

    // Then
    expect(requestCount).toBe(1);
  });
});
