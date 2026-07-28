// services/rangeQueryService.js — CloudWatch Logs historical query
//
// Fetches historical log events for a set of log groups within a time window.
// Two AWS approaches — choose one (FilterLogEvents is simpler; Insights is more powerful):
//
// ── Option A: FilterLogEvents (recommended for this use case) ─────────────
//   AWS SDK command: FilterLogEventsCommand
//   Input:  { logGroupNames, startTime, endTime, filterPattern?, nextToken? }
//   Output: { events: [{ eventId, timestamp, message, ingestionTime, logStreamName }], nextToken? }
//   Notes:  - startTime / endTime are epoch milliseconds
//           - Returns up to 10,000 events per call; paginate via nextToken
//           - logGroupNames supports multiple groups in one call
//
// ── Option B: CloudWatch Logs Insights ────────────────────────────────────
//   Commands: StartQueryCommand → GetQueryResultsCommand (poll until Complete)
//   More powerful (supports aggregation, stats, sort) but adds polling complexity.
//   Stick with FilterLogEvents unless the frontend needs query syntax.
//
// Frontend LogEvent shape:
//   { id, timestamp, logGroup, logStream, message, ingestionTime? }
//
// Return shape (one page):
//   { events: LogEvent[], nextToken?: string, totalPages?: number }
//
// Note on totalPages:
//   FilterLogEvents does not expose total count — omit totalPages or estimate
//   based on a first-pass count query if needed.
//
// Usage:
//   const result = await queryRange(groups, startMs, endMs, nextToken, region, credentials);

// TODO: import FilterLogEventsCommand from '@aws-sdk/client-cloudwatch-logs'
// import { FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
// import { getCloudWatchClient } from './awsClient.js';

// TODO: implement queryRange(groups, startMs, endMs, nextToken, region, credentials)
//   1. Create CW client
//   2. Send FilterLogEventsCommand with { logGroupNames: groups, startTime, endTime, nextToken }
//   3. Map each AWS event to the LogEvent frontend shape:
//       id            → eventId
//       timestamp     → timestamp (already ms)
//       logGroup      → derive from the group list (AWS returns logStreamName, not group)
//       logStream     → logStreamName
//       message       → message
//       ingestionTime → ingestionTime
//   4. Return { events, nextToken: response.nextToken }

export async function queryRange(_groups, _startMs, _endMs, _nextToken, _region, _credentials) {
  // TODO
}
