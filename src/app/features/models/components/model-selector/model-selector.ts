import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { AvailableModel } from '../../../../domain/models/model-catalog';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-model-selector',
  styleUrl: './model-selector.css',
  templateUrl: './model-selector.html',
})
export class ModelSelector {
  readonly models = input<readonly AvailableModel[]>([]);
  readonly selectedModelId = input<string | null>(null);
  readonly isLoading = input(false);
  readonly error = input<string | null>(null);
  readonly modelSelected = output<string>();
  readonly refreshRequested = output<void>();
  readonly selectedModel = computed(
    () => this.models().find((model) => model.id === this.selectedModelId()) ?? null,
  );

  selectModel(event: Event): void {
    const modelId = (event.target as HTMLSelectElement).value;
    if (this.models().some((model) => model.id === modelId)) {
      this.modelSelected.emit(modelId);
    }
  }
}
