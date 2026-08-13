import { useEffect, useRef, useCallback, useState } from 'react';
import { createSSEConnection } from '../api/client';

export type SSEStatus = 'idle' | 'connecting' | 'open' | 'error' | 'closed';

export function useSSE<T>(
  path: string,
  params: Record<string, string | string[]>,
  onMessage: (data: T) => void,
  enabled: boolean,
) {
  const [status, setStatus] = useState<SSEStatus>('idle');
  const cleanupRef = useRef<(() => void) | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (cleanupRef.current) cleanupRef.current();
    setStatus('connecting');
    const cleanup = createSSEConnection(
      path,
      params,
      (data) => {
        setStatus('open');
        onMessageRef.current(data as T);
      },
      () => setStatus('error'),
    );
    cleanupRef.current = cleanup;
    return cleanup;
  }, [path, JSON.stringify(params)]);

  useEffect(() => {
    if (!enabled) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setStatus('idle');
      return;
    }
    const cleanup = connect();
    return () => {
      cleanup();
      setStatus('closed');
    };
  }, [enabled, connect]);

  const disconnect = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setStatus('closed');
  }, []);

  return { status, disconnect };
}
