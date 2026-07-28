// services/liveTailService.js — CloudWatch Logs live tail streaming
//
// Opens a real-time log stream using the CloudWatch Logs StartLiveTail API.
// Streams log events to the caller via a provided callback (onEvent).
// Returns a cleanup function the caller must invoke when the client disconnects.
//
// AWS SDK command: StartLiveTailCommand  (@aws-sdk/client-cloudwatch-logs ^3.x)
//   Input:  { logGroupIdentifiers: string[], logEventFilterPattern?: string }
//   Output: An async iterable of response chunks (StartLiveTailResponseStream)
//           Each chunk has a `sessionUpdate` field containing `sessionResults`
//           which is an array of LiveTailSessionLogEvent:
//             { logStreamName, logGroupIdentifier, message, timestamp, ingestionTime }
//
// Frontend LogEvent shape:
//   { id, timestamp, logGroup, logStream, message, ingestionTime? }
//
// Notes:
//   - StartLiveTail requires a region with CloudWatch Logs; LocalStack supports it
//     as of LocalStack v3.
//   - The iterable will run until the HTTP/2 stream is cancelled — call
//     the AbortController to stop it.
//   - logGroupIdentifiers uses ARN format on real AWS but log group names work
//     on LocalStack.
//
// Usage:
//   const stop = await startLiveTail(groups, region, credentials, onEvent);
//   // later...
//   stop();

// TODO: import StartLiveTailCommand from '@aws-sdk/client-cloudwatch-logs'
// import { StartLiveTailCommand } from '@aws-sdk/client-cloudwatch-logs';
// import { getCloudWatchClient } from './awsClient.js';

// TODO: implement startLiveTail(groups, region, credentials, onEvent)
//   1. Create an AbortController
//   2. Create the CW client, passing abortSignal in the requestHandler options
//   3. Send StartLiveTailCommand with { logGroupIdentifiers: groups }
//   4. Iterate response.responseStream (async for...of)
//      - For each chunk: extract chunk.sessionUpdate.sessionResults
//      - For each sessionResult: map to LogEvent shape and call onEvent(event)
//   5. Return () => abortController.abort() as the stop/cleanup function

export async function startLiveTail(_groups, _region, _credentials, _onEvent) {
  // TODO
  // return stopFn;
}
