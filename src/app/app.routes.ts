import { Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { Microsoft365OnboardingGuard } from './core/guards/microsoft365-onboarding.guard';

/**
 * Convention d'URL : `/app` regroupe l'espace applicatif, `/setup` la
 * configuration initiale, `/auth` les pages d'authentification. Les anciennes
 * adresses restent valides et redirigent vers la nouvelle structure.
 */
export const routes: Routes = [
  {
    path: 'app',
    children: [
      {
        path: 'chat',
        canActivate: [AuthGuard, Microsoft365OnboardingGuard],
        loadComponent: () =>
          import('./features/chat/pages/chat-page/chat-page').then(
            ({ ChatPage }) => ChatPage,
          ),
        title: 'Chat | onPremia',
      },
      {
        path: 'settings/microsoft365',
        canActivate: [AuthGuard],
        data: { onboardingMode: false },
        loadComponent: () =>
          import(
            './features/microsoft365/pages/microsoft365-administration-page/microsoft365-administration-page'
          ).then(({ Microsoft365AdministrationPage }) => Microsoft365AdministrationPage),
        title: 'Administration Microsoft 365 | onPremia',
      },
      { path: '', pathMatch: 'full', redirectTo: 'chat' },
    ],
  },
  {
    path: 'setup',
    canActivate: [AuthGuard],
    data: { onboardingMode: true },
    loadComponent: () =>
      import(
        './features/microsoft365/pages/microsoft365-administration-page/microsoft365-administration-page'
      ).then(({ Microsoft365AdministrationPage }) => Microsoft365AdministrationPage),
    title: 'Configuration de votre espace | onPremia',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page').then(
        ({ LoginPage }) => LoginPage,
      ),
    title: 'Connexion | onPremia',
  },
  {
    path: 'auth/forbidden',
    loadComponent: () =>
      import('./shared/pages/access-denied-page/access-denied-page').then(
        ({ AccessDeniedPage }) => AccessDeniedPage,
      ),
    title: 'Accès refusé | onPremia',
  },
  {
    path: 'microsoft365/consent/success',
    canActivate: [AuthGuard],
    data: { consentOutcome: 'success', onboardingMode: true },
    loadComponent: () =>
      import(
        './features/microsoft365/pages/microsoft365-administration-page/microsoft365-administration-page'
      ).then(({ Microsoft365AdministrationPage }) => Microsoft365AdministrationPage),
    title: 'Microsoft 365 connecté | onPremia',
  },
  {
    path: 'microsoft365/consent/error',
    canActivate: [AuthGuard],
    data: { consentOutcome: 'error', onboardingMode: true },
    loadComponent: () =>
      import(
        './features/microsoft365/pages/microsoft365-administration-page/microsoft365-administration-page'
      ).then(({ Microsoft365AdministrationPage }) => Microsoft365AdministrationPage),
    title: 'Connexion Microsoft 365 échouée | onPremia',
  },
  {
    path: 'technical-error',
    loadComponent: () =>
      import('./shared/pages/technical-error-page/technical-error-page').then(
        ({ TechnicalErrorPage }) => TechnicalErrorPage,
      ),
    title: 'Erreur technique | onPremia',
  },
  /**
   * La racine laisse les gardes décider : non authentifié vers la connexion,
   * configuration incomplète vers `/setup`, sinon l'espace applicatif.
   */
  { path: '', pathMatch: 'full', redirectTo: 'app/chat' },
  { path: 'chat', pathMatch: 'full', redirectTo: 'app/chat' },
  { path: 'onboarding', pathMatch: 'full', redirectTo: 'setup' },
  {
    path: 'administration/microsoft365',
    pathMatch: 'full',
    redirectTo: 'app/settings/microsoft365',
  },
  { path: 'access-denied', pathMatch: 'full', redirectTo: 'auth/forbidden' },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/not-found-page/not-found-page').then(
        ({ NotFoundPage }) => NotFoundPage,
      ),
    title: 'Page introuvable | onPremia',
  },
];
