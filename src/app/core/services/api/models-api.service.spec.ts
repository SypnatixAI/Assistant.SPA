import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthenticationMode, LaunchMode, PUBLIC_APP_CONFIG } from '../../config/public-app-config';
import { ModelCatalogResponse } from '../../../domain/models/model-catalog';
import { ModelsApiService } from './models-api.service';

describe('ModelsApiService', () => {
  it('Given_AConfiguredApi_When_getAvailableModelsIsCalled_Then_ModelsAreRequested', async () => {
    // Given
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ModelsApiService,
        {
          provide: PUBLIC_APP_CONFIG,
          useValue: {
            apiBaseUrl: 'https://api.example.com/',
            authenticationMode: AuthenticationMode.MicrosoftEntra,
            authenticationUrl: '/local-auth/token',
            launchMode: LaunchMode.Certification,
            entraAuthority: 'https://login.microsoftonline.com/organizations',
            entraClientId: 'client-id',
            entraScope: 'api://api-client-id/access_as_user',
          },
        },
      ],
    });
    const service = TestBed.inject(ModelsApiService);
    const httpTestingController = TestBed.inject(HttpTestingController);
    const response: ModelCatalogResponse = {
      defaultModelId: 'luna',
      models: [
        {
          id: 'luna',
          displayName: 'Luna',
          description: 'Modèle général recommandé.',
          isDefault: true,
        },
      ],
    };

    // When
    const action = firstValueFrom(service.getAvailableModels());
    const request = httpTestingController.expectOne('https://api.example.com/api/models');
    request.flush(response);

    // Then
    await expectAsync(action).toBeResolvedTo(response);
    expect(request.request.method).toBe('GET');
    httpTestingController.verify();
  });
});
