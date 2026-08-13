/**
 * log-groups/api/fetchLogGroups.ts
 *
 * Fetches the list of CloudWatch log groups from the backend.
 *
 * Mock toggle: when useMock() returns true (LocalStack session),
 * mock data is returned from VITE_MOCK_LOG_GROUPS (.env.test) without
 * making any network request.
 */

import { request } from '../../../api/client';
import { useMock } from '../../../api/mockConfig';
import type { LogGroup } from '../../../types';

/** Parse mock log groups from .env.test — falls back to an empty array on parse error. */
function getMockLogGroups(): LogGroup[] {
  try {
    const raw = import.meta.env.VITE_MOCK_LOG_GROUPS ?? '[]';
    return JSON.parse(raw) as LogGroup[];
  } catch {
    return [];
  }
}

/**
 * Returns all CloudWatch log groups visible to the authenticated IAM principal.
 * Uses mock data when running against LocalStack.
 */
export async function fetchLogGroups(): Promise<LogGroup[]> {
  if (useMock()) {
    return getMockLogGroups();
  }
  return request<LogGroup[]>('/log-groups');
}
