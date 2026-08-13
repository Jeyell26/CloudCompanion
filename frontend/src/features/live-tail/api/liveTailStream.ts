/**
 * live-tail/api/liveTailStream.ts
 *
 * Manages a streaming connection to the live-tail SSE endpoint.
 *
 * Mock toggle: when useMock() returns true (LocalStack session), a local
 * interval-based generator is used instead of a real SSE connection.
 * Message templates are pulled from VITE_MOCK_LIVE_TAIL_MESSAGES (.env.test).
 *
 * Both real and mock paths expose the same signature:
 *   createLiveTailStream(groups, onEvent, intervalMs?) => stopFn
 */

import { createSSEConnection } from '../../../api/client';
import { useMock } from '../../../api/mockConfig';
import type { LogEvent } from '../../../types';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Parse message templates from .env.test. */
function getMockMessages(): string[] {
  try {
    const raw = import.meta.env.VITE_MOCK_LIVE_TAIL_MESSAGES ?? '[]';
    return JSON.parse(raw) as string[];
  } catch {
    return ['[INFO] mock log event {n}'];
  }
}

/** Fill placeholder tokens in a template string with random realistic values. */
function fillTemplate(template: string): string {
  return template
    .replace('{uuid}', crypto.randomUUID().split('-')[0])
    .replace(
      '{ip}',
      `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1`,
    )
    .replace(/{n}/g, String(Math.floor(Math.random() * 500)));
}

/** Starts a mock live-tail stream driven by a local interval. */
function createMockLiveTailStream(
  groups: string[],
  onEvent: (log: LogEvent) => void,
  intervalMs: number,
): () => void {
  const messages = getMockMessages();
  const streams = groups.map(
    (g) => `${g}/stream-${Math.random().toString(36).substring(2, 8)}`,
  );
  let counter = 0;

  const handle = setInterval(() => {
    const group = groups[Math.floor(Math.random() * groups.length)];
    const stream = streams[Math.floor(Math.random() * streams.length)];
    const template = messages[Math.floor(Math.random() * messages.length)];

    onEvent({
      id: `mock-${counter++}-${Date.now()}`,
      timestamp: Date.now(),
      logGroup: group,
      logStream: stream,
      message: fillTemplate(template),
      ingestionTime: Date.now() + 50,
    });
  }, intervalMs);

  return () => clearInterval(handle);
}

// ---------------------------------------------------------------------------
// Real SSE stream
// ---------------------------------------------------------------------------

function createRealLiveTailStream(
  groups: string[],
  onEvent: (log: LogEvent) => void,
): () => void {
  return createSSEConnection(
    '/live-tail',
    { groups },
    (data) => onEvent(data as LogEvent),
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a live-tail stream for the given log groups.
 *
 * @param groups     Log group names to tail.
 * @param onEvent    Callback fired for each incoming log event.
 * @param intervalMs Polling interval used only in mock mode (default 1200 ms).
 * @returns          A stop function — call it to tear down the stream.
 */
export function createLiveTailStream(
  groups: string[],
  onEvent: (log: LogEvent) => void,
  intervalMs: number = 1200,
): () => void {
  if (useMock()) {
    return createMockLiveTailStream(groups, onEvent, intervalMs);
  }
  return createRealLiveTailStream(groups, onEvent);
}
