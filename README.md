# Assistant.SPA

Application web Angular d’AssistantCore. Le projet fournit pour le moment le
socle technique, les routes minimales et les emplacements réservés aux futures
fonctionnalités.

## Prérequis

- Node.js 24.15.0, défini dans `.nvmrc` et `.node-version`;
- npm 11 ou une version compatible avec Angular 22;
- Angular 22.1.

Angular 22 accepte également Node.js 22.22.3 ou une version 26 et plus récente.
Node.js 24.15.0 reste la version de référence du projet.

## Installation

```bash
nvm use
npm ci
```

Si `nvm` n’est pas disponible, installer la version indiquée dans `.nvmrc`
avec le gestionnaire Node.js de votre choix.

## Commandes locales

```bash
npm start          # serveur local sur http://localhost:4200
npm run build      # build de production
npm run test:ci    # tests Vitest en exécution unique
npm run lint       # ESLint pour TypeScript et les templates Angular
npm run typecheck  # vérification TypeScript stricte
npm run verify     # vérification complète du ticket
```

## Routes initiales

- `/login` : page publique temporaire;
- `/app` : route applicative protégée temporairement;
- toute adresse inconnue : page 404.

La garde de `/app` redirige vers `/login` jusqu’à l’implémentation de la session
Microsoft Entra.

## Configuration publique

Avant de démarrer Angular, la SPA charge le fichier statique
`/assets/config/config.json`. Il contient l’URL de l’API, le client ID Entra,
l’autorité et le scope.

En local, `public/assets/config/config.json` fournit des valeurs codées en dur
pour `ng serve`. Ce fichier local est exclu du build de production.

En DEV, CERT et PROD, le déploiement ou le BFF doit placer un fichier portant le
même nom dans `assets/config/config.json`. La SPA utilise ainsi le même chemin et
le même build dans tous les environnements. Le BFF est responsable de remplacer
le contenu avec les valeurs publiques de l’environnement courant.

Le serveur doit retourner ce fichier sans cache persistant. La SPA demande aussi
la ressource avec `cache: no-store` afin de ne pas conserver une ancienne
configuration après un déploiement.

Ces données sont visibles dans le navigateur et ne doivent jamais contenir de
secret, de client secret, de clé API ou d’adresse privée de production.

## Architecture

```text
src/app/
  core/
    auth/          session et configuration Microsoft Entra
    guards/        protection des routes
    interceptors/  Bearer token et erreurs HTTP
    api/           HttpClient et contrats backend
    config/        configuration publique typée
  features/
    auth/
    chat/
    conversations/
    models/
    usage/
  domain/          modèles TypeScript indépendants d’Angular
  shared/          composants et pages visuelles réutilisables
```

Les fonctionnalités utilisent des composants standalone et des routes chargées
paresseusement. Les composants visuels n’appellent pas directement `HttpClient`.
