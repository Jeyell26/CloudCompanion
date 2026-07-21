// Secrets Manager feature API — secret listing and value retrieval.

import type { SecretMetadata } from '../../../types';
import { request } from '../../../api/client';
import { mockStore } from '../../../api/mock-store';

export async function getSecretsMetadata(): Promise<SecretMetadata[]> {
  try {
    return await request<SecretMetadata[]>('/aws/secrets');
  } catch {
    return [...mockStore.secrets];
  }
}

export async function getSecretValue(secretName: string): Promise<string> {
  try {
    const res = await request<{ value: string }>(`/aws/secrets/${encodeURIComponent(secretName)}`);
    return res.value;
  } catch {
    return mockStore.secretValues[secretName] || '{"error": "Secret not found"}';
  }
}
