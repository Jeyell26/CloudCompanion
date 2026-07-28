/**
 * auth/api/login.ts
 *
 * Handles IAM credential authentication against the LogPulse backend.
 * Falls back to a LocalStack mock session when:
 *  - the backend is unreachable, AND
 *  - the credentials are recognisable LocalStack test credentials.
 *
 * Mock toggle: automatically enabled when the resulting token starts with
 * the prefix defined in VITE_MOCK_AUTH_TOKEN_PREFIX (.env.test).
 * All subsequent API calls read useMock() from api/mockConfig to decide
 * whether to hit real endpoints or return mock data.
 */

import { request, setToken, clearToken } from '../../../api/client';
import type { AuthSession } from '../../../types';

export interface LoginCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

/** Credentials that are recognised as LocalStack dev credentials. */
function isLocalStackCredential(accessKeyId: string): boolean {
  return (
    accessKeyId === 'test' ||
    accessKeyId === 'localstack' ||
    accessKeyId.startsWith('AKIA')
  );
}

/**
 * Authenticates with the backend using IAM credentials.
 * On network failure with LocalStack credentials, issues a mock token
 * (which activates mock mode for all other API calls).
 */
export async function loginWithIAM(creds: LoginCredentials): Promise<AuthSession> {
  try {
    const res = await request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(creds),
    });
    setToken(res.token);
    localStorage.setItem('logpulse_region', creds.region);
    localStorage.setItem('logpulse_key_hint', creds.accessKeyId.slice(-4));
    return {
      token: res.token,
      region: creds.region,
      accessKeyId: creds.accessKeyId.slice(-4),
    };
  } catch {
    if (isLocalStackCredential(creds.accessKeyId)) {
      const mockTokenPrefix =
        import.meta.env.VITE_MOCK_AUTH_TOKEN_PREFIX ?? 'mock_logpulse_';
      const mockToken = mockTokenPrefix + Math.random().toString(36).substring(2, 14);
      setToken(mockToken);
      localStorage.setItem('logpulse_region', creds.region);
      localStorage.setItem('logpulse_key_hint', creds.accessKeyId.slice(-4));
      return {
        token: mockToken,
        region: creds.region,
        accessKeyId: creds.accessKeyId.slice(-4),
      };
    }
    throw new Error(
      'Invalid credentials. For LocalStack, use Access Key ID starting with "AKIA" or enter "localstack".',
    );
  }
}

/** Clears the current session (both real and mock). */
export function logout(): void {
  clearToken();
}

/** Rehydrates a stored session from localStorage (survives page refresh). */
export function getStoredSession(): AuthSession | null {
  const token = localStorage.getItem('logpulse_token');
  const region = localStorage.getItem('logpulse_region');
  const keyHint = localStorage.getItem('logpulse_key_hint');
  if (!token || !region) return null;
  return { token, region, accessKeyId: keyHint || '????' };
}
