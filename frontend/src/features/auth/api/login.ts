/**
 * auth/api/login.ts
 *
 * Handles IAM credential authentication against the LogPulse backend.
 * If the backend is unreachable or authentication fails, an error is thrown.
 *
 * Mock toggle: automatically enabled when the resulting token starts with
 * the prefix defined in VITE_MOCK_AUTH_TOKEN_PREFIX (.env.test).
 * All subsequent API calls read useMock() from api/mockConfig to decide
 * whether to hit real endpoints or return mock data.
 */

import { request, setToken, clearToken } from '../../../api/client';
import type { AuthSession } from '../../../types';

export interface LoginCredentials {
  roleArn: string;
  externalId?: string;
  region: string;
}

/**
 * Authenticates with the backend using cross-account IAM Role assumption (sts:AssumeRole).
 * Throws on network failure or invalid credentials — no silent fallback.
 */
export async function loginWithIAM(creds: LoginCredentials): Promise<AuthSession> {
  const res = await request<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(creds),
  });
  setToken(res.token);
  localStorage.setItem('logpulse_region', creds.region);
  localStorage.setItem('logpulse_role_arn', creds.roleArn);
  if (creds.externalId) {
    localStorage.setItem('logpulse_external_id', creds.externalId);
  }
  return {
    token: res.token,
    region: creds.region,
    roleArn: creds.roleArn,
    externalId: creds.externalId,
  };
}

/** Clears the current session. */
export function logout(): void {
  clearToken();
  localStorage.removeItem('logpulse_role_arn');
  localStorage.removeItem('logpulse_external_id');
}

/** Rehydrates a stored session from localStorage (survives page refresh). */
export function getStoredSession(): AuthSession | null {
  const token = localStorage.getItem('logpulse_token');
  const region = localStorage.getItem('logpulse_region');
  const roleArn = localStorage.getItem('logpulse_role_arn');
  const externalId = localStorage.getItem('logpulse_external_id') || undefined;
  if (!token || !region || !roleArn) return null;
  return { token, region, roleArn, externalId };
}
