/**
 * range-query/api/fetchRangeQuery.ts
 *
 * Queries CloudWatch Logs Insights for events in a given time range.
 *
 * Mock toggle: when useMock() returns true (LocalStack session), a
 * synthetic paginated dataset is generated locally using templates from
 * VITE_MOCK_RANGE_QUERY_TEMPLATES (.env.test).
 *
 * Both paths share the same signature so callers are unaware of the toggle.
 */

import { request } from '../../../api/client';
import { useMock } from '../../../api/mockConfig';
import type { LogEvent, TimeRange } from '../../../types';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Parse log templates from .env.test. */
function getMockTemplates(): string[] {
  try {
    const raw = import.meta.env.VITE_MOCK_RANGE_QUERY_TEMPLATES ?? '[]';
    return JSON.parse(raw) as string[];
  } catch {
    return ['[INFO] mock range event {n}'];
  }
}

/** Fill placeholder tokens in a template string. */
function fillTemplate(template: string): string {
  return template
    .replace('{uuid}', Math.random().toString(36).substring(2, 10))
    .replace(/{n}/g, String(Math.floor(Math.random() * 500)));
}

/** Generates a synthetic paginated result set without touching the network. */
async function fetchMockRangeQuery(
  groups: string[],
  range: TimeRange,
  onProgress: (page: number, total: number) => void,
): Promise<LogEvent[]> {
  const templates = getMockTemplates();
  const startTs = new Date(`${range.startDate}T${range.startTime}`).getTime();
  const endTs = new Date(`${range.endDate}T${range.endTime}`).getTime();
  const durationMs = endTs - startTs;
  const eventCount = Math.floor(Math.random() * 200) + 80;
  const pageSize = 50;
  const totalPages = Math.ceil(eventCount / pageSize);

  const events: LogEvent[] = [];

  for (let page = 1; page <= totalPages; page++) {
    onProgress(page, totalPages);
    await new Promise<void>((r) => setTimeout(r, 200)); // simulate network latency

    const batchSize = Math.min(pageSize, eventCount - events.length);
    for (let i = 0; i < batchSize; i++) {
      const group = groups[Math.floor(Math.random() * groups.length)];
      const ts = startTs + Math.random() * durationMs;
      const template = templates[Math.floor(Math.random() * templates.length)];

      events.push({
        id: `rq-${page}-${i}-${Date.now()}`,
        timestamp: ts,
        logGroup: group,
        logStream: `${group}/stream-${Math.random().toString(36).substring(2, 8)}`,
        message: fillTemplate(template),
      });
    }
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
}

// ---------------------------------------------------------------------------
// Real API call
// ---------------------------------------------------------------------------

async function fetchRealRangeQuery(
  groups: string[],
  range: TimeRange,
  onProgress: (page: number, total: number) => void,
): Promise<LogEvent[]> {
  // Backend supports pagination — we fetch until nextToken is exhausted.
  const results: LogEvent[] = [];
  let nextToken: string | undefined;
  let page = 0;

  do {
    const body: Record<string, unknown> = { groups, range };
    if (nextToken) body.nextToken = nextToken;

    const res = await request<{ events: LogEvent[]; nextToken?: string; totalPages?: number }>(
      '/range-query',
      { method: 'POST', body: JSON.stringify(body) },
    );

    results.push(...res.events);
    nextToken = res.nextToken;
    page += 1;
    onProgress(page, res.totalPages ?? page);
  } while (nextToken);

  return results;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches log events within a time range for the given log groups.
 *
 * @param groups     Log group names to query.
 * @param range      The start/end date-time window.
 * @param onProgress Callback to report pagination progress (currentPage, totalPages).
 * @returns          Chronologically sorted log events.
 */
export async function fetchRangeQuery(
  groups: string[],
  range: TimeRange,
  onProgress: (page: number, total: number) => void,
): Promise<LogEvent[]> {
  if (useMock()) {
    return fetchMockRangeQuery(groups, range, onProgress);
  }
  return fetchRealRangeQuery(groups, range, onProgress);
}
