/**
 * Contenu unique de la page d'erreur technique.
 *
 * Deux rendus l'utilisent : le composant Angular `TechnicalErrorPage`, et le
 * repli de `renderBootstrapError` lorsque l'application n'a pas pu démarrer et
 * qu'aucun composant Angular n'existe encore. Les deux doivent afficher
 * exactement la même chose, dans tous les environnements; garder le texte ici
 * empêche les deux écrans de diverger à nouveau.
 */
export const TECHNICAL_ERROR_CONTENT = {
  brandName: 'onPremia',
  description:
    'Votre espace de travail ne peut pas être chargé pour le moment. Réessayez maintenant ou revenez dans quelques minutes.',
  eyebrow: 'Service temporairement indisponible',
  footer: 'Aucun renseignement supplémentaire n’est requis de votre part.',
  retryLabel: 'Réessayer',
  supportHref: 'mailto:support@assistantcore.com',
  supportLabel: 'Contacter le soutien',
  title: 'Une erreur technique empêche le chargement.',
} as const;

/** Tracés des deux icônes, partagés par le template et le repli. */
export const TECHNICAL_ERROR_ICONS = {
  retry: 'M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7',
  warning:
    'M12 8v4.75m0 3.25h.01M10.3 3.84 2.55 17.25A2 2 0 0 0 4.28 20h15.44a2 2 0 0 0 1.73-2.75L13.7 3.84a1.96 1.96 0 0 0-3.4 0Z',
} as const;
