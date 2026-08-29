import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatSources } from './chat-sources';

describe('ChatSources', () => {
  let fixture: ComponentFixture<ChatSources>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChatSources] }).compileComponents();
    fixture = TestBed.createComponent(ChatSources);
  });

  it('Given_SafeAndUnsafeSources_When_ChatSourcesIsDisplayed_Then_OnlyHttpsSourceIsLinked', () => {
    // Given
    fixture.componentRef.setInput('sources', [
      { reference: 'safe', title: 'Politique', type: 'SharePoint', url: 'https://contoso.test/politique' },
      { reference: 'unsafe', title: 'Source non fiable', type: 'Fichier', url: 'javascript:alert(1)' },
    ]);

    // When
    fixture.detectChanges();

    // Then
    const page: HTMLElement = fixture.nativeElement;
    const links = page.querySelectorAll('a');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(page.textContent).toContain('Source non fiable');
  });
});
