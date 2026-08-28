import { bootstrapApplication } from '@angular/platform-browser';

import { createAppConfig } from './app/app.config';
import { App } from './app/app';
import { loadPublicAppConfig } from './app/core/config/public-app-config.loader';

async function startApplication(): Promise<void> {
  const publicAppConfig = await loadPublicAppConfig();
  await bootstrapApplication(App, createAppConfig(publicAppConfig));
}

void startApplication().catch((error: unknown) => {
  console.error('Impossible de démarrer AssistantCore.', error);
});
