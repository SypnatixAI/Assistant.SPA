import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantMessage } from './assistant-message';

describe('AssistantMessage', () => {
  let fixture: ComponentFixture<AssistantMessage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AssistantMessage] }).compileComponents();
    fixture = TestBed.createComponent(AssistantMessage);
  });

  it('Given_HtmlInContent_When_AssistantMessageIsDisplayed_Then_ContentIsRenderedAsText', () => {
    // Given
    const unsafeContent = '<img src=x onerror=alert(1)>Réponse';
    fixture.componentRef.setInput('message', {
      content: unsafeContent,
      id: 'message-id',
      role: 'assistant',
      sources: [],
      warnings: [],
    });

    // When
    fixture.detectChanges();

    // Then
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('img')).toBeNull();
    expect(page.textContent).toContain(unsafeContent);
  });
});
