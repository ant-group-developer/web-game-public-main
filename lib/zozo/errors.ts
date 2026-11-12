import type { MessageKey } from '@/constants/i18n';
import { ZozoError } from '@/packages/zozo-sdk/src/core';

const CODES: Record<string, MessageKey> = {
  email_taken: 'err.emailTaken',
  already_registered: 'err.alreadyRegistered',
  invalid_credentials: 'err.invalidCredentials',
  too_many_requests: 'err.tooMany',
  player_banned: 'err.banned',
  invalid_link: 'err.invalidLink',
  not_configured: 'err.googleOff',
  google_state: 'err.google',
  google_failed: 'err.google',
  network: 'err.network',
  request_payload_validation_error: 'err.invalid',
  unauthorized: 'err.session',
  invalid_refresh_token: 'err.session',
};

/** errorCode của API → câu ngắn trong constants/i18n.ts. */
export function errorKey(error: unknown, fallback: MessageKey = 'err.generic'): MessageKey {
  const code = error instanceof ZozoError ? error.code : typeof error === 'string' ? error : '';
  if (CODES[code]) return CODES[code];
  if (error instanceof ZozoError && error.status === 429) return 'err.tooMany';
  return fallback;
}
