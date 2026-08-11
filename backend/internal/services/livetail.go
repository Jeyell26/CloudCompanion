// internal/services/livetail.go — CloudWatch Logs live tail streaming
//
// Opens a real-time log stream using the CloudWatch Logs StartLiveTail API.
// Streams log events to the caller via a provided callback (onEvent).
// Returns a cleanup function the caller must invoke when the client disconnects.
//
// Notes:
//   - StartLiveTail requires CloudWatch Logs v2 support; LocalStack supports it as of v3.
//   - The stream runs until cancelled via context cancellation.
//   - LogGroupIdentifiers uses ARN format on real AWS but log group names work on LocalStack.

package services

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs/types"
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
func (s *LiveTailService) StartLiveTail(ctx context.Context, logGroups []string, region, accessKeyID, secretKey, sessionToken string, onEvent func(LogEvent)) error {
	client := s.aws.CloudWatchLogsClient(region, accessKeyID, secretKey, sessionToken)

	// LocalStack Community fallback: poll FilterLogEvents since LocalStack Community does not support StartLiveTail gRPC
	if s.aws.IsLocalStack() {
		lastSeenMap := make(map[string]int64)
		initialStart := time.Now().Add(-30 * time.Second).UnixMilli()
		for _, group := range logGroups {
			lastSeenMap[group] = initialStart
		}

		ticker := time.NewTicker(1500 * time.Millisecond)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return nil
			case <-ticker.C:
				for _, group := range logGroups {
					lastSeen := lastSeenMap[group]
					output, err := client.FilterLogEvents(ctx, &cloudwatchlogs.FilterLogEventsInput{
						LogGroupName: aws.String(group),
						StartTime:    aws.Int64(lastSeen + 1),
					})
					if err == nil && output != nil {
						for _, item := range output.Events {
							ts := aws.ToInt64(item.Timestamp)
							if ts > lastSeenMap[group] {
								lastSeenMap[group] = ts
							}
							onEvent(LogEvent{
								ID:            aws.ToString(item.EventId),
								Timestamp:     ts,
								LogGroup:      group,
								LogStream:     aws.ToString(item.LogStreamName),
								Message:       aws.ToString(item.Message),
								IngestionTime: aws.ToInt64(item.IngestionTime),
							})
						}
					}
				}
			}
		}
	}

	// Real AWS: use official StartLiveTail API
	liveTailInput := cloudwatchlogs.StartLiveTailInput{
		LogGroupIdentifiers: logGroups,
	}

	liveTailOutput, err := client.StartLiveTail(ctx, &liveTailInput)
	if err != nil {
		return err
	}

	streamChannel := liveTailOutput.GetStream()
	defer streamChannel.Close()

	for {
		select {
		case <-ctx.Done():
			return nil
		case event, ok := <-streamChannel.Events():
			if !ok {
				return streamChannel.Err()
			}
			sessionUpdate, ok := event.(*types.StartLiveTailResponseStreamMemberSessionUpdate)
			if !ok {
				continue
			}

			for _, item := range sessionUpdate.Value.SessionResults {
				logEvent := &LogEvent{
					ID:            fmt.Sprintf("%d-%s", aws.ToInt64(item.Timestamp), aws.ToString(item.LogStreamName)),
					Timestamp:     aws.ToInt64(item.Timestamp),
					LogGroup:      aws.ToString(item.LogGroupIdentifier),
					LogStream:     aws.ToString(item.LogStreamName),
					Message:       aws.ToString(item.Message),
					IngestionTime: aws.ToInt64(item.IngestionTime),
				}

				onEvent(*logEvent)
			}
		}
	}
}
