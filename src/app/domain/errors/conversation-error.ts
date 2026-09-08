import { ApiError } from './api-error';

/**
 * Ce que l'utilisateur peut encore tenter après un échec.
 *
 * Réessayer ne vaut que si la même requête peut aboutir. Une conversation
 * absente et un curseur invalide échoueront autant de fois qu'on insiste : leur
 * proposer un bouton Réessayer enferme l'utilisateur dans une action condamnée.
 */
export type ConversationErrorRecovery = 'reload-list' | 'retry' | 'start-new-conversation';

/**
 * Les codes stables renvoyés par le backend sur les 400, 404 et 409 des
 * conversations. `bad_request`, `not_found` et `conflict` sont les trois replis
 * du backend lorsqu'aucun code plus précis ne s'applique.
 */
const CONVERSATION_ERROR_MESSAGES = new Map<string, string>([
  ['bad_request', 'Cette demande n’a pas été acceptée par onPremia.'],
  [
    'conversation_archived',
    'Cette conversation est archivée : elle n’accepte plus de nouveaux messages.',
  ],
  [
    'conflict',
    'Cette action entre en conflit avec une modification récente. Rechargez avant de recommencer.',
  ],
  ['conversation_not_found', 'Cette conversation n’existe plus.'],
  [
    'conversation_version_conflict',
    'Cette conversation a été modifiée ailleurs. Rechargez-la avant de recommencer.',
  ],
  ['empty_conversation_patch', 'Aucune modification à enregistrer.'],
  ['invalid_conversation_status', 'Ce filtre de conversations n’est pas reconnu.'],
  ['invalid_conversation_title', 'Ce titre est vide ou trop long.'],
  [
    'invalid_pagination',
    'La suite de la liste n’est plus valide. Rechargez les conversations.',
  ],
  ['invalid_version_header', 'La version de cette conversation est illisible.'],
  ['not_found', 'Cet élément est introuvable.'],
]);

/**
 * Les codes pour lesquels réessayer la même requête est sans issue. Tout code
 * absent de cette table garde le comportement par défaut : réessayer.
 */
const CONVERSATION_ERROR_RECOVERIES = new Map<string, ConversationErrorRecovery>([
  ['conversation_not_found', 'start-new-conversation'],
  ['invalid_pagination', 'reload-list'],
  ['not_found', 'start-new-conversation'],
]);

/**
 * Traduit un code d'erreur seul, tel que le flux de messages le transporte.
 * Retourne `null` pour un code inconnu afin que l'appelant garde la main sur
 * son propre message générique.
 */
export function findConversationErrorMessage(code: string | null | undefined): string | null {
  return (code ? CONVERSATION_ERROR_MESSAGES.get(code) : undefined) ?? null;
}

/**
 * Traduit une erreur HTTP déjà typée par l'intercepteur. Une panne réseau, ou
 * tout code hors contrat, retombe sur le message générique de l'appelant.
 */
export function resolveConversationErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  return findConversationErrorMessage(readErrorCode(error)) ?? fallbackMessage;
}

export function resolveConversationErrorRecovery(error: unknown): ConversationErrorRecovery {
  const code = readErrorCode(error);

  return (code ? CONVERSATION_ERROR_RECOVERIES.get(code) : undefined) ?? 'retry';
}

function readErrorCode(error: unknown): string | null {
  return error instanceof ApiError ? error.code : null;
}
