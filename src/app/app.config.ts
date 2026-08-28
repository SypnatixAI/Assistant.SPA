import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import {
  PUBLIC_APP_CONFIG,
  PublicAppConfig,
} from './core/config/public-app-config';
import { routes } from './app.routes';

export function createAppConfig(
  publicAppConfig: PublicAppConfig,
): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(routes),
      { provide: PUBLIC_APP_CONFIG, useValue: publicAppConfig },
    ],
  };
}
