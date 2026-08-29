import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ModelsApiService } from '../../../core/services/api/models-api.service';
import { ModelCatalogResponse } from '../../../domain/models/model-catalog';
import { ModelCatalogState } from './model-catalog.state';

describe('ModelCatalogState', () => {
  const catalog: ModelCatalogResponse = {
    defaultModelId: 'luna',
    models: [
      {
        id: 'luna',
        displayName: 'Luna',
        description: 'Modèle général recommandé.',
        isDefault: true,
      },
      {
        id: 'terra',
        displayName: 'Terra',
        description: 'Modèle pour les analyses détaillées.',
        isDefault: false,
      },
    ],
  };
  let api: jasmine.SpyObj<ModelsApiService>;
  let state: ModelCatalogState;

  beforeEach(() => {
    api = jasmine.createSpyObj<ModelsApiService>('ModelsApiService', ['getAvailableModels']);
    TestBed.configureTestingModule({
      providers: [ModelCatalogState, { provide: ModelsApiService, useValue: api }],
    });
    state = TestBed.inject(ModelCatalogState);
  });

  it('Given_AValidCatalog_When_loadIsCalled_Then_DefaultModelIsSelected', () => {
    // Given
    api.getAvailableModels.and.returnValue(of(catalog));

    // When
    state.load();

    // Then
    expect(state.models()).toEqual(catalog.models);
    expect(state.selectedModelId()).toBe('luna');
    expect(state.error()).toBeNull();
  });

  it('Given_AvailableModels_When_selectModelIsCalled_Then_OnlyReturnedIdentifiersAreAccepted', () => {
    // Given
    api.getAvailableModels.and.returnValue(of(catalog));
    state.load();

    // When
    state.selectModel('terra');
    state.selectModel('provider-secret-model');

    // Then
    expect(state.selectedModelId()).toBe('terra');
  });

  it('Given_AnEmptyCatalog_When_loadIsCalled_Then_AnExplicitErrorIsExposed', () => {
    // Given
    api.getAvailableModels.and.returnValue(of({ defaultModelId: 'luna', models: [] }));

    // When
    state.load();

    // Then
    expect(state.models()).toEqual([]);
    expect(state.selectedModelId()).toBeNull();
    expect(state.error()).toContain('Aucun modèle valide');
  });

  it('Given_ARequestFailure_When_loadIsCalledAgain_Then_TheCatalogCanBeRefreshed', () => {
    // Given
    api.getAvailableModels.and.returnValues(
      throwError(() => new Error('network')),
      of(catalog),
    );
    state.load();

    // When
    state.load();

    // Then
    expect(api.getAvailableModels).toHaveBeenCalledTimes(2);
    expect(state.selectedModelId()).toBe('luna');
    expect(state.error()).toBeNull();
  });
});
