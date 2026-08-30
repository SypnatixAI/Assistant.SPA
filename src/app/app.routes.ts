import { Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { Microsoft365OnboardingGuard } from './core/guards/microsoft365-onboarding.guard';

export const routes: Routes = [
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./shared/pages/access-denied-page/access-denied-page').then(
        ({ AccessDeniedPage }) => AccessDeniedPage,
      ),
    title: 'Accès refusé | onPremia',
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
    path: 'chat',
    canActivate: [AuthGuard, Microsoft365OnboardingGuard],
    loadComponent: () =>
      import('./features/chat/pages/chat-page/chat-page').then(
        ({ ChatPage }) => ChatPage,
      ),
    title: 'Chat | onPremia',
  },
  {
    path: 'onboarding',
    canActivate: [AuthGuard],
    data: { onboardingMode: true },
    loadComponent: () =>
      import(
        './features/microsoft365/pages/microsoft365-administration-page/microsoft365-administration-page'
      ).then(({ Microsoft365AdministrationPage }) => Microsoft365AdministrationPage),
    title: 'Configuration de votre espace | onPremia',
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
    path: 'administration/microsoft365',
    canActivate: [AuthGuard],
    data: { onboardingMode: false },
    loadComponent: () =>
      import(
        './features/microsoft365/pages/microsoft365-administration-page/microsoft365-administration-page'
      ).then(({ Microsoft365AdministrationPage }) => Microsoft365AdministrationPage),
    title: 'Administration Microsoft 365 | onPremia',
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
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'technical-error',
    loadComponent: () =>
      import(
        './shared/pages/technical-error-page/technical-error-page'
      ).then(({ TechnicalErrorPage }) => TechnicalErrorPage),
    title: 'Erreur technique | onPremia',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/not-found-page/not-found-page').then(
        ({ NotFoundPage }) => NotFoundPage,
      ),
    title: 'Page introuvable | onPremia',
  },
];
