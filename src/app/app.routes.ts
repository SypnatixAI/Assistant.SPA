import { Routes } from '@angular/router';

import { temporaryAuthGuard } from './core/guards/temporary-auth.guard';

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
    canActivate: [temporaryAuthGuard],
    loadComponent: () =>
      import('./features/chat/pages/application-page/application-page').then(
        ({ ApplicationPage }) => ApplicationPage,
      ),
    title: 'AssistantCore',
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/pages/not-found-page/not-found-page').then(
        ({ NotFoundPage }) => NotFoundPage,
      ),
    title: 'Page introuvable | AssistantCore',
  },
];
