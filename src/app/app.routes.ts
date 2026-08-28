import { Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page').then(
        ({ LoginPage }) => LoginPage,
      ),
    title: 'Connexion | AssistantCore',
  },
  {
    path: 'app',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/chat/pages/application-page/application-page').then(
        ({ ApplicationPage }) => ApplicationPage,
      ),
    title: 'AssistantCore',
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
