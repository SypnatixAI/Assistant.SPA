import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatComposer } from './chat-composer';

describe('ChatComposer', () => {
  let fixture: ComponentFixture<ChatComposer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChatComposer] }).compileComponents();
    fixture = TestBed.createComponent(ChatComposer);
    fixture.detectChanges();
  });

  it('Given_AValidQuestion_When_submit_Then_EmitsTrimmedQuestionAndClearsDraft', () => {
    // Given
    const component = fixture.componentInstance;
    const emittedMessages: string[] = [];
    component.messageSubmitted.subscribe((message) => emittedMessages.push(message));
    component.messageControl.setValue('  Quelle est la politique?  ');

    // When
    component.submit();

    // Then
    expect(emittedMessages).toEqual(['Quelle est la politique?']);
    expect(component.messageControl.value).toBe('');
  });

  it('Given_ShiftEnter_When_handleKeydown_Then_DoesNotSubmitTheQuestion', () => {
    // Given
    const component = fixture.componentInstance;
    const emittedMessages: string[] = [];
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
    component.messageSubmitted.subscribe((message) => emittedMessages.push(message));
    component.messageControl.setValue('Question');

    // When
    component.handleKeydown(event);

    // Then
    expect(emittedMessages).toEqual([]);
    expect(component.messageControl.value).toBe('Question');
  });

  it('Given_AQuestionOverTheLimit_When_submit_Then_DoesNotEmitTheQuestion', () => {
    // Given
    const component = fixture.componentInstance;
    const emittedMessages: string[] = [];
    component.messageSubmitted.subscribe((message) => emittedMessages.push(message));
    component.messageControl.setValue('a'.repeat(component.maximumLength + 1));

    // When
    component.submit();

    // Then
    expect(emittedMessages).toEqual([]);
    expect(component.messageControl.hasError('maxlength')).toBeTrue();
  });
});
