import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantMessage } from './assistant-message';

describe('AssistantMessage', () => {
  let fixture: ComponentFixture<AssistantMessage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AssistantMessage] }).compileComponents();
    fixture = TestBed.createComponent(AssistantMessage);
  });

  it('Given_MarkdownContent_When_AssistantMessageIsDisplayed_Then_ContentIsRenderedAsHtml', () => {
    // Given
    const markdownContent = '\\###1) Résultat\n\n- **Créance douteuse**';
    fixture.componentRef.setInput('message', {
      content: markdownContent,
      id: 'message-id',
      role: 'assistant',
      sources: [],
      warnings: [],
    });

    // When
    fixture.detectChanges();

    // Then
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('h3')?.textContent).toBe('1) Résultat');
    expect(page.querySelector('li strong')?.textContent).toBe('Créance douteuse');
  });

  it('Given_UnsafeHtml_When_AssistantMessageIsDisplayed_Then_DangerousAttributesAreRemoved', () => {
    // Given
    fixture.componentRef.setInput('message', {
      content: '<img src="x" onerror="alert(1)">Réponse',
      id: 'message-id',
      role: 'assistant',
      sources: [],
      warnings: [],
    });

    // When
    fixture.detectChanges();

    // Then
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(image).not.toBeNull();
    expect(image?.hasAttribute('onerror')).toBeFalse();
  });
});
