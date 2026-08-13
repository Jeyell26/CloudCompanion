/**
 * mockConfig.ts — Shared mock toggle utility.
 *
 * Rules:
 *  - Mock mode is OFF by default.
 *  - Mock mode is ON only when the stored session token was issued by LocalStack
 *    (i.e. it starts with the prefix defined in VITE_MOCK_AUTH_TOKEN_PREFIX).
 *
 * Usage in any API file:
 *   import { useMock } from '../../../api/mockConfig';
 *   if (useMock()) { return mockData; }
 */

const MOCK_TOKEN_PREFIX =
  import.meta.env.VITE_MOCK_AUTH_TOKEN_PREFIX ?? 'mock_logpulse_';

/**
 * Returns true when the active session is a LocalStack mock session.
 * All API calls should gate their mock branches on this function.
 */
export function useMock(): boolean {
  if (import.meta.env.VITE_MOCK_MODE === 'true') return true;
  const token = localStorage.getItem('logpulse_token');
  if (!token) return false;
  return token.startsWith(MOCK_TOKEN_PREFIX);
}
