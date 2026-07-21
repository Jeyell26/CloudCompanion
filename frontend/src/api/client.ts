// Shared HTTP client and backend status tracking.
// All feature API modules import `request` from here.

const API_BASE_URL = 'http://localhost:5000/api';

let isBackendConnected = false;
let onBackendStatusChange: ((connected: boolean) => void) | null = null;

export function registerBackendStatusListener(callback: (connected: boolean) => void) {
  onBackendStatusChange = callback;
  callback(isBackendConnected);
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    if (!isBackendConnected) {
      isBackendConnected = true;
      if (onBackendStatusChange) onBackendStatusChange(true);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }
    return await response.json() as T;
  } catch (error) {
    if (isBackendConnected) {
      isBackendConnected = false;
      if (onBackendStatusChange) onBackendStatusChange(false);
    }
    throw error;
  }
}
