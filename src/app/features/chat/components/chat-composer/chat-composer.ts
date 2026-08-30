import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';


const MAXIMUM_MESSAGE_LENGTH = 4_000;
const MAXIMUM_MESSAGE_INPUT_HEIGHT = 224;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, ReactiveFormsModule],
  selector: 'app-chat-composer',
  styleUrl: './chat-composer.css',
  templateUrl: './chat-composer.html',
})
export class ChatComposer {
  readonly disabled = input(false);
  readonly messageSubmitted = output<string>();
  readonly maximumLength = MAXIMUM_MESSAGE_LENGTH;
  readonly messageControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(MAXIMUM_MESSAGE_LENGTH)],
  });

  private readonly messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');

  constructor() {
    effect(() => {
      if (this.disabled()) {
        this.messageControl.disable({ emitEvent: false });
      } else {
        this.messageControl.enable({ emitEvent: false });
      }
    });
  }

  focus(): void {
    this.messageInput()?.nativeElement.focus();
  }

  setDraft(message: string): void {
    this.messageControl.setValue(message);
    this.focus();
    queueMicrotask(() => this.resizeMessageInput());
  }

  resizeMessageInput(): void {
    const messageInput = this.messageInput()?.nativeElement;
    if (!messageInput) {
      return;
    }

    messageInput.style.height = 'auto';
    messageInput.style.height = `${Math.min(
      messageInput.scrollHeight,
      MAXIMUM_MESSAGE_INPUT_HEIGHT,
    )}px`;
    messageInput.style.overflowY =
      messageInput.scrollHeight > MAXIMUM_MESSAGE_INPUT_HEIGHT ? 'auto' : 'hidden';
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    this.submit();
  }

  handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submit();
  }

  submit(): void {
    const message = this.messageControl.value.trim();
    if (this.messageControl.disabled || this.messageControl.invalid || message.length === 0) {
      this.messageControl.markAsTouched();
      return;
    }

    this.messageSubmitted.emit(message);
    this.messageControl.reset();
    queueMicrotask(() => this.resizeMessageInput());
  }
}
