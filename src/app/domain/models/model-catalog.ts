export interface AvailableModel {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly isDefault: boolean;
}

export interface ModelCatalogResponse {
  readonly defaultModelId: string;
  readonly models: readonly AvailableModel[];
}
