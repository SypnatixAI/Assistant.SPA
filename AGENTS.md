# Instructions pour Codex — Frontend Angular

## Règles de modification

- Ne modifie jamais les fichiers directement sans montrer un diff clair.
- Propose d’abord un plan court.
- Attends l’approbation avant d’appliquer les changements.
- Garde les changements petits et ciblés.
- Ne touche pas aux fichiers non liés à la demande.
- Explique les impacts avant de modifier plusieurs fichiers.

## Architecture

- Respecter les principes SOLID et Clean Architecture.
- Séparer clairement :
  - UI / composants visuels;
  - pages et orchestration de fonctionnalité;
  - services API;
  - domaine et modèles indépendants d’Angular;
  - état local ou partagé;
  - routing, guards et interceptors.
- Organiser le code entre `core`, `features`, `domain` et `shared`.
- Utiliser des composants standalone pour les nouvelles fonctionnalités.
- Charger paresseusement les routes de fonctionnalités.
- Éviter toute logique métier dans les composants visuels.
- Les composants visuels ne doivent jamais appeler `HttpClient` directement.
- Tout appel backend doit passer par un service typé de `app/core/api`.
- Les pages peuvent orchestrer l’état d’interface, mais les règles métier doivent
  rester dans le domaine ou dans un service dédié et testable.
- Utiliser les signals pour l’état local partagé d’une fonctionnalité.
- Ne pas ajouter de bibliothèque d’état globale sans besoin démontré.
- Les règles de quota, d’autorisation, d’organisation et de propriété restent
  dans le backend.

## Sécurité

- Aucun secret Microsoft, OpenAI ou fournisseur ne doit être ajouté au frontend.
- Ne jamais ajouter de client secret, clé API ou jeton dans la configuration
  statique Angular.
- Ne pas conserver manuellement les access tokens dans `localStorage`,
  `sessionStorage`, IndexedDB ou un autre stockage persistant.
- Ne jamais considérer une donnée envoyée par le frontend comme une preuve
  d’identité ou d’autorisation.
- Les guards améliorent la navigation, mais ne remplacent jamais les contrôles
  d’autorisation du backend.
- Toute configuration Angular doit être considérée comme publique puisqu’elle
  est accessible depuis le navigateur.

## Qualité du code

- Utiliser TypeScript strict et les templates Angular stricts.
- Favoriser des composants, fonctions et services petits, testables et lisibles.
- Utiliser `ChangeDetectionStrategy.OnPush` pour les composants applicatifs.
- Respecter l’accessibilité : HTML sémantique, libellés explicites, navigation au
  clavier et focus visible.
- Éviter le code dupliqué et les dépendances inutiles.
- Donner des noms explicites aux composants, services, fonctions et variables.
- Gérer les erreurs sans masquer les informations utiles au diagnostic.
- Utiliser RxJS uniquement lorsqu’un flux asynchrone le justifie; préférer une
  valeur ou un signal pour un état synchrone simple.

## Tests et validation

- Ajouter ou ajuster les tests pour toute nouvelle fonctionnalité ou modification
  de comportement.
- Utiliser Vitest et Angular TestBed pour les nouveaux tests.
- Nommer les tests avec la convention Gherkin
  `Given_<contexte>_When_<methode_testee>_Then_<resultat>`.
- La partie `When` doit contenir le nom exact de la méthode testée lorsqu’une
  méthode précise est la cible du test.
- Structurer le corps des tests avec `// Given`, `// When` et `// Then`.
- Tester les états de chargement, de succès, vide et d’erreur lorsqu’ils sont
  pertinents pour l’interface.
- Après chaque ajout ou modification de fonctionnalité, exécuter `npm run verify`.
- Si la vérification complète ne peut pas être exécutée, expliquer clairement la
  raison et ne pas présenter la fonctionnalité comme entièrement validée.
- Ne jamais supprimer, désactiver ou assouplir un test uniquement pour faire
  passer le CI.

## Documentation et tickets

- Rédiger les documents et tickets dans un langage simple, clair et concret.
- Documenter les versions Node.js et Angular supportées, les commandes locales et
  toute configuration publique nécessaire.
- Tous les tickets doivent commencer par expliquer la capacité finale recherchée.
- Les tickets doivent contenir les sections `But`,
  `Pourquoi cette fonctionnalité est nécessaire`, `Flow détaillé`,
  `Résultat concret`, `Limites`, `Réalisation pas à pas`,
  `Critères d’acceptation` et `Documentation de référence`.
- Pour chaque flow important, expliquer qui déclenche l’action, les données
  reçues, les validations, les appels API, les changements d’état et ce que
  l’utilisateur voit ensuite.
- Ne pas imposer les noms de toutes les classes et méthodes lorsqu’une décision
  locale peut être laissée au développeur.
- Avant de créer ou mettre à jour un ticket GitHub, mettre à jour la documentation
  de référence correspondante.
- Présenter le diff documentaire et attendre son approbation avant de créer ou
  modifier le ticket GitHub.
- Ne pas créer un ticket dont les décisions fonctionnelles importantes ne sont
  pas encore documentées.
