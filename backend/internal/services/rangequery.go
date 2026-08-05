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
	"fmt"
	"sort"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
)

type RangeQueryResult struct {
	Events []LogEvent `json:"events"`
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
func (s *RangeQueryService) QueryRange(ctx context.Context, groups []string, startMs, endMs int64, region, accessKeyID, secretKey, sessionToken string) (*RangeQueryResult, error) {
	// client building
	client := s.aws.CloudWatchLogsClient(region, accessKeyID, secretKey, sessionToken)

	var logEvent []LogEvent

	for _, group := range groups {
		// input with group
		filterLogEventsInput := cloudwatchlogs.FilterLogEventsInput{
			LogGroupName: aws.String(group),
			StartTime:    aws.Int64(startMs),
			EndTime:      aws.Int64(endMs),
		}

		// gather output
		filterLogEventsOutput, err := client.FilterLogEvents(ctx, &filterLogEventsInput)
		if err != nil {
			return nil, err
		}
		// reject if exceeded 10k messages
		if filterLogEventsOutput.NextToken != nil {
			return nil, fmt.Errorf("Log group %s exceeded 10 000 messages", group)
		}

		// map received log group
		for _, item := range filterLogEventsOutput.Events {
			logEvent = append(logEvent, LogEvent{
				ID:            aws.ToString(item.EventId),
				Timestamp:     aws.ToInt64(item.Timestamp),
				LogGroup:      group,
				LogStream:     aws.ToString(item.LogStreamName),
				Message:       aws.ToString(item.Message),
				IngestionTime: aws.ToInt64(item.IngestionTime),
			})
		}
	}

	sort.Slice(logEvent, func(i, j int) bool {
		return logEvent[i].Timestamp < logEvent[j].Timestamp
	})

	return &RangeQueryResult{Events: logEvent}, nil
}
