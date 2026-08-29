import { computed, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { ModelsApiService } from '../../../core/services/api/models-api.service';
import { AvailableModel, ModelCatalogResponse } from '../../../domain/models/model-catalog';

const MODEL_CATALOG_ERROR = 'Les modèles ne peuvent pas être chargés pour le moment.';
const INVALID_MODEL_CATALOG_ERROR = 'Aucun modèle valide n’est disponible.';

@Injectable({ providedIn: 'root' })
export class ModelCatalogState {
  private readonly modelsValue = signal<readonly AvailableModel[]>([]);
  private readonly defaultModelIdValue = signal<string | null>(null);
  private readonly selectedModelIdValue = signal<string | null>(null);
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<string | null>(null);
  private loadSubscription: Subscription | null = null;

  readonly models = this.modelsValue.asReadonly();
  readonly selectedModelId = this.selectedModelIdValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly selectedModel = computed(
    () => this.modelsValue().find((model) => model.id === this.selectedModelIdValue()) ?? null,
  );

  constructor(private readonly modelsApiService: ModelsApiService) {}

  load(): void {
    this.loadSubscription?.unsubscribe();
    this.loadingValue.set(true);
    this.errorValue.set(null);

    this.loadSubscription = this.modelsApiService.getAvailableModels().subscribe({
      next: (catalog) => this.applyCatalog(catalog),
      error: () => {
        this.modelsValue.set([]);
        this.defaultModelIdValue.set(null);
        this.selectedModelIdValue.set(null);
        this.errorValue.set(MODEL_CATALOG_ERROR);
        this.loadingValue.set(false);
      },
      complete: () => this.loadingValue.set(false),
    });
  }

  selectModel(modelId: string): void {
    if (this.modelsValue().some((model) => model.id === modelId)) {
      this.selectedModelIdValue.set(modelId);
    }
  }

  resetToDefault(): void {
    const defaultModelId = this.defaultModelIdValue();
    const defaultModelExists = this.modelsValue().some((model) => model.id === defaultModelId);
    this.selectedModelIdValue.set(defaultModelExists ? defaultModelId : null);
  }

  private applyCatalog(catalog: ModelCatalogResponse): void {
    const defaultModel = catalog.models.find((model) => model.id === catalog.defaultModelId);
    if (catalog.models.length === 0 || !defaultModel) {
      this.modelsValue.set([]);
      this.defaultModelIdValue.set(null);
      this.selectedModelIdValue.set(null);
      this.errorValue.set(INVALID_MODEL_CATALOG_ERROR);
      return;
    }

    this.modelsValue.set(catalog.models);
    this.defaultModelIdValue.set(defaultModel.id);
    this.selectedModelIdValue.set(defaultModel.id);
  }
}
