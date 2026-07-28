// internal/services/rangequery.go — CloudWatch Logs historical query
//
// Fetches historical log events for a set of log groups within a time window
// using FilterLogEvents (simpler than Insights, sufficient for this use case).
//
// AWS SDK command: FilterLogEvents
//   Input:  { LogGroupNames, StartTime, EndTime, FilterPattern?, NextToken? }
//   Output: { Events: [{ EventId, Timestamp, Message, IngestionTime, LogStreamName }], NextToken? }
//   Notes:  - StartTime / EndTime are epoch milliseconds
//           - Returns up to 10,000 events per call; paginate via NextToken
//           - LogGroupNames supports multiple groups in one call
//
// Frontend LogEvent shape:
//   { id, timestamp, logGroup, logStream, message, ingestionTime? }
//
// Return shape (one page):
//   { events: LogEvent[], nextToken?: string }

package services

import (
	"context"
)

// RangeQueryResult represents one page of range query results.
type RangeQueryResult struct {
	Events    []LogEvent `json:"events"`
	NextToken string     `json:"nextToken,omitempty"`
}

// RangeQueryService handles CloudWatch Logs historical queries.
type RangeQueryService struct {
	aws *AWSClient
}

// NewRangeQueryService creates a new range query service.
func NewRangeQueryService(aws *AWSClient) *RangeQueryService {
	return &RangeQueryService{aws: aws}
}

// QueryRange fetches log events within a time range for the given log groups.
//
// TODO: implement
//   1. Create CW client via s.aws.CloudWatchLogsClient(region, accessKeyID, secretKey)
//   2. Send FilterLogEventsInput{ LogGroupNames: groups, StartTime: &startMs, EndTime: &endMs, NextToken }
//   3. Map each AWS event to LogEvent:
//       ID            → EventId
//       Timestamp     → Timestamp (already ms)
//       LogGroup      → derive from the group list (AWS returns LogStreamName, not group)
//       LogStream     → LogStreamName
//       Message       → Message
//       IngestionTime → IngestionTime
//   4. Return RangeQueryResult{ Events, NextToken }
func (s *RangeQueryService) QueryRange(ctx context.Context, groups []string, startMs, endMs int64, nextToken, region, accessKeyID, secretKey string) (*RangeQueryResult, error) {
	// TODO
	return nil, nil
}
