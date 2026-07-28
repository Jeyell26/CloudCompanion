// internal/services/livetail.go — CloudWatch Logs live tail streaming
//
// Opens a real-time log stream using the CloudWatch Logs StartLiveTail API.
// Streams log events to the caller via a provided callback (onEvent).
// Returns a cleanup function the caller must invoke when the client disconnects.
//
// AWS SDK command: StartLiveTail
//   Input:  { LogGroupIdentifiers: []string, LogEventFilterPattern?: string }
//   Output: Async iterable of response chunks (StartLiveTailResponseStream)
//           Each chunk has a SessionUpdate field containing SessionResults
//           which is an array of LiveTailSessionLogEvent:
//             { LogStreamName, LogGroupIdentifier, Message, Timestamp, IngestionTime }
//
// Frontend LogEvent shape:
//   { id, timestamp, logGroup, logStream, message, ingestionTime? }
//
// Notes:
//   - StartLiveTail requires CloudWatch Logs v2 support; LocalStack supports it as of v3.
//   - The stream runs until cancelled via context cancellation.
//   - LogGroupIdentifiers uses ARN format on real AWS but log group names work on LocalStack.

package services

import (
	"context"
)

// LogEvent matches the frontend's expected shape.
type LogEvent struct {
	ID            string `json:"id"`
	Timestamp     int64  `json:"timestamp"`
	LogGroup      string `json:"logGroup"`
	LogStream     string `json:"logStream"`
	Message       string `json:"message"`
	IngestionTime int64  `json:"ingestionTime,omitempty"`
}

// LiveTailService handles CloudWatch Logs live tail streaming.
type LiveTailService struct {
	aws *AWSClient
}

// NewLiveTailService creates a new live tail service.
func NewLiveTailService(aws *AWSClient) *LiveTailService {
	return &LiveTailService{aws: aws}
}

// StartLiveTail opens a CloudWatch Logs live tail stream.
//
// TODO: implement
//   1. Create CW client via s.aws.CloudWatchLogsClient(region, accessKeyID, secretKey)
//   2. Send StartLiveTailInput{ LogGroupIdentifiers: groups }
//   3. Read from the response stream (result.GetStream().Events())
//   4. For each chunk, extract SessionUpdate.SessionResults
//   5. For each result, map to LogEvent and call onEvent(event)
//   6. Respect ctx cancellation to stop the stream
//   7. Return error on stream failure
func (s *LiveTailService) StartLiveTail(ctx context.Context, groups []string, region, accessKeyID, secretKey string, onEvent func(LogEvent)) error {
	// TODO
	return nil
}
