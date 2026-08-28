import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalInterceptor,
  MsalService,
} from '@azure/msal-angular';

import {
  PUBLIC_APP_CONFIG,
  PublicAppConfig,
} from './core/config/public-app-config';
import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { TechnicalErrorInterceptor } from './core/interceptors/technical-error.interceptor';
import { AuthenticationService } from './core/services/authentication/authentication.service';
import {
  createMsalGuardConfig,
  createMsalInstance,
  createMsalInterceptorConfig,
} from './core/services/authentication/msal-config.factory';
import { ApplicationNavigationService } from './core/services/navigation/application-navigation.service';

export function createAppConfig(
  publicAppConfig: PublicAppConfig,
): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideHttpClient(withInterceptorsFromDi()),
      provideRouter(routes),
      { provide: PUBLIC_APP_CONFIG, useValue: publicAppConfig },
      {
        provide: MSAL_INSTANCE,
        useFactory: createMsalInstance,
        deps: [PUBLIC_APP_CONFIG, ApplicationNavigationService],
      },
      {
        provide: MSAL_GUARD_CONFIG,
        useFactory: createMsalGuardConfig,
        deps: [PUBLIC_APP_CONFIG],
      },
      {
        provide: MSAL_INTERCEPTOR_CONFIG,
        useFactory: createMsalInterceptorConfig,
        deps: [PUBLIC_APP_CONFIG, ApplicationNavigationService],
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MsalInterceptor,
        multi: true,
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: TechnicalErrorInterceptor,
        multi: true,
      },
      { provide: ErrorHandler, useClass: GlobalErrorHandler },
      MsalService,
      MsalGuard,
      MsalBroadcastService,
      provideAppInitializer(() => inject(AuthenticationService).initialize()),
    ],
  };
}
