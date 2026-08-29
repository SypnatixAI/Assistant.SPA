import { Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./shared/pages/access-denied-page/access-denied-page').then(
        ({ AccessDeniedPage }) => AccessDeniedPage,
      ),
    title: 'Accès refusé | AssistantCore',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page').then(
        ({ LoginPage }) => LoginPage,
      ),
    title: 'Connexion | AssistantCore',
  },
  {
    path: 'chat',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/chat/pages/chat-page/chat-page').then(
        ({ ChatPage }) => ChatPage,
      ),
    title: 'Chat | AssistantCore',
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'technical-error',
    loadComponent: () =>
      import(
        './shared/pages/technical-error-page/technical-error-page'
      ).then(({ TechnicalErrorPage }) => TechnicalErrorPage),
    title: 'Erreur technique | AssistantCore',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/not-found-page/not-found-page').then(
        ({ NotFoundPage }) => NotFoundPage,
      ),
    title: 'Page introuvable | AssistantCore',
  },
];
