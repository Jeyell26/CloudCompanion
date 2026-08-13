// Shared HTTP client with JWT auth and SSE support.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export function getToken(): string | null {
  return localStorage.getItem('logpulse_token');
}

export function setToken(token: string): void {
  localStorage.setItem('logpulse_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('logpulse_token');
  localStorage.removeItem('logpulse_region');
  localStorage.removeItem('logpulse_key_hint');
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Creates an SSE connection. Returns an EventSource and a cleanup function.
 * Caller is responsible for calling cleanup() when done.
 */
export function createSSEConnection(
  path: string,
  params: Record<string, string | string[]>,
  onMessage: (data: unknown) => void,
  onError?: (err: Event) => void,
): () => void {
  const token = getToken();
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(val => qs.append(k, val));
    else qs.set(k, v);
  });
  if (token) qs.set('token', token);

  const url = `${API_BASE_URL}${path}?${qs.toString()}`;
  const source = new EventSource(url);

  source.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data));
    } catch {
      onMessage(e.data);
    }
  };

  if (onError) source.onerror = onError;

  return () => source.close();
}
