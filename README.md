# Assistant.SPA

Application web Angular d’AssistantCore. La SPA utilise Microsoft Entra pour
connecter les employés avant de construire leur session auprès de l’API.

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
npm start          # serveur local avec authentification simulée
npm run start:certification # serveur local avec Microsoft Entra
npm run build      # build de production
npm run test:ci    # tests Vitest en exécution unique
npm run lint       # ESLint pour TypeScript et les templates Angular
npm run typecheck  # vérification TypeScript stricte
npm run verify     # vérification complète du ticket
```

## Routes

Les adresses suivent une convention par espace : `/app` pour l’application,
`/setup` pour la configuration initiale, `/auth` pour l’authentification.

- `/` : point d’entrée; les gardes envoient vers la connexion, la configuration
  ou l’espace applicatif selon l’état de la session;
- `/login` : lance automatiquement la connexion professionnelle Microsoft;
- `/app/chat` : espace de chat affiché uniquement après une session
  AssistantCore valide;
- `/app/settings/microsoft365` : administration de la connexion Microsoft 365;
- `/setup` : configuration initiale de l’espace de travail;
- `/auth/forbidden` : compte connecté mais non autorisé;
- `/technical-error` : arrêt sécurisé après une erreur inattendue;
- toute adresse inconnue : page 404.

La garde de `/app/chat` redirige vers `/login` lorsque la session n’est pas
valide, et vers `/setup` tant que la configuration Microsoft 365 est incomplète.

Les anciennes adresses restent valides et redirigent vers la nouvelle
structure : `/chat`, `/onboarding`, `/administration/microsoft365` et
`/access-denied`.

Les retours de consentement Microsoft (`/microsoft365/consent/success` et
`/microsoft365/consent/error`) restent inchangés : leur adresse est configurée
côté backend et Entra.
La page de connexion envoie immédiatement l’utilisateur vers Microsoft, sans
étape ni bouton intermédiaire. Une annulation ou un consentement refusé reste
affiché sans relancer automatiquement la redirection.

En mode local simulé, `/login` affiche plutôt un bouton permettant d’entrer
comme administrateur local. Le JWT est demandé à WireMock seulement après ce
clic, conservé uniquement en mémoire et ajouté aux appels `/api`. Un
rechargement complet demande donc une nouvelle connexion locale.

### Authentification locale simulée

Le mode local par défaut ne communique pas avec Microsoft :

```bash
# Dans le dépôt backend
bash scripts/start-local-wiremock.sh

# Dans ce dépôt
npm start
```

Le chat affiche le sélecteur de modèle et l’indicateur de quota uniquement
lorsque `/api/models` et `/api/usage` répondent. Là où ces endpoints n’existent
pas encore, les deux contrôles restent masqués et l’envoi continue de
fonctionner : le backend applique alors ses valeurs par défaut.

`npm start` charge `public/assets/config/config.json`, dont le `launchMode` est
`Local` par défaut. Le proxy Angular transmet `/local-auth/token` à WireMock et
`/api` au backend local. Tant que les endpoints de catalogue et de quota ne
sont pas disponibles dans le backend, il transmet précisément `/api/models` et
`/api/usage` à WireMock. Les autres routes `/api` continuent d’être traitées par
AssistantCore.

### Authentification Microsoft réelle en local

Pour vérifier le vrai parcours MSAL, utiliser la configuration publique dédiée
`public/assets/config/config.certification.json`. Démarrer ensuite les services
connectés et la SPA avec :

```bash
# Dans le dépôt backend
bash scripts/start-local-live.sh

# Dans ce dépôt
npm run start:certification
```

`npm run start:entra` est un alias de cette commande.

Le fichier contient uniquement le client ID public de la SPA, l’autorité et le
scope de l’API. Aucun client secret ne doit y être ajouté. L’URI de retour SPA
Entra doit être exactement `http://localhost:4200/login`.

## Configuration Microsoft Entra

Créer une App Registration pour la SPA, distincte de celle de l’API. Dans la
plateforme `Single-page application`, enregistrer exactement l’URI de retour de
l’environnement. En local, cette URI est :

```text
http://localhost:4200/login
```

Ajouter la permission déléguée exposée par l’API :

```text
api://<API_CLIENT_ID>/access_as_user
```

L’App Registration SPA ne doit contenir aucun client secret. Microsoft
Authentication Library (MSAL) utilise le flux Authorization Code avec PKCE et
conserve elle-même son cache dans la session du navigateur. Le code applicatif
ne lit ni ne persiste le token.

## Configuration publique

Avant de démarrer Angular, la SPA charge une configuration publique statique.
`npm start` utilise `/assets/config/config.json` pour l’authentification simulée
et `npm run start:certification` utilise
`/assets/config/config.certification.json` pour Microsoft Entra.

En local, `public/assets/config/config.json` utilise la racine `/`. Le serveur de
développement transmet les appels `/api` à AssistantCore sur
`http://localhost:5043` grâce à `proxy.conf.json`. Ce fichier de configuration
publique local est exclu du build de production.

En DEV, CERT et PROD, le déploiement ou le BFF doit placer la configuration de
l’environnement dans `assets/config/config.json`. Le build de production reste
ainsi indépendant de l’environnement. Le fichier `config.certification.json`
sert uniquement au démarrage connecté local et est exclu du build de production.

Le serveur doit retourner ce fichier sans cache persistant. La SPA demande aussi
la ressource avec `cache: no-store` afin de ne pas conserver une ancienne
configuration après un déploiement.

Ces données sont visibles dans le navigateur et ne doivent jamais contenir de
secret, de client secret, de clé API ou d’adresse privée de production.

## Vérification manuelle de la connexion

1. Vérifier les valeurs publiques dans
   `public/assets/config/config.certification.json`.
2. Démarrer AssistantCore et la SPA, puis ouvrir `/chat` sans session pour
   vérifier la redirection automatique vers Microsoft.
3. Terminer la connexion, la MFA ou le consentement demandé.
4. Vérifier que `/chat` apparaît seulement après la réponse valide de
   `GET /api/core/authenticateUser`.
5. Recharger la page pour vérifier l’acquisition silencieuse du token.
6. Utiliser `Se déconnecter` et vérifier le retour vers `/login`.

## Architecture

```text
src/app/
  core/
    guards/        protection des routes
    interceptors/  Bearer token et erreurs HTTP
    config/        configuration publique typée
    services/
      authentication/  session et configuration Microsoft Entra
      api/              clients HttpClient typés
      errors/           état d’erreur technique global
      navigation/       navigation Angular et redirections Microsoft
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
Une erreur HTTP backend ou une exception Angular inattendue interrompt le flow
courant et affiche `/technical-error`. Une erreur survenant avant le démarrage
d’Angular affiche le même message sous forme de page statique.
