// internal/services/mocker.go — LocalStack log group and event auto-mocker
//
// Automatically populates LocalStack with sample log groups and events from mock_data.json
// when logging in with test/localstack credentials.

package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs/types"
)

// MockLogGroup defines the shape of each log group entry in mock_data.json.
type MockLogGroup struct {
	Name     string   `json:"name"`
	Stream   string   `json:"stream"`
	Messages []string `json:"messages"`
}

// MockerService handles populating LocalStack CloudWatch Logs using mock_data.json.
type MockerService struct {
	aws       *AWSClient
	stopChan  chan struct{}
	isSeeding bool
	mu        sync.Mutex
}

// NewMockerService creates a new mocker service instance.
func NewMockerService(aws *AWSClient) *MockerService {
	return &MockerService{
		aws:      aws,
		stopChan: make(chan struct{}),
	}
}

// loadMockData reads and parses mock_data.json from disk.
func (m *MockerService) loadMockData() ([]MockLogGroup, error) {
	data, err := os.ReadFile("mock_data.json")
	if err != nil {
		return nil, fmt.Errorf("failed to read mock_data.json: %w", err)
	}

	var groups []MockLogGroup
	err = json.Unmarshal(data, &groups)
	if err != nil {
		return nil, fmt.Errorf("failed to parse mock_data.json: %w", err)
	}

	return groups, nil
}

// SeedAtLogin reads mock_data.json, creates log groups/streams, and generates historical events.
func (m *MockerService) SeedAtLogin(ctx context.Context, region, accessKeyID, secretKey, sessionToken string) error {
	if !m.aws.IsLocalStack() {
		return nil
	}

	groups, err := m.loadMockData()
	if err != nil {
		return err
	}

	client := m.aws.CloudWatchLogsClient(region, accessKeyID, secretKey, sessionToken)
	now := time.Now()

	log.Printf("[Mocker] Seeding %d LocalStack log groups and historical events...", len(groups))

	for _, group := range groups {
		// 1. Create log group (ignore if exists)
		_, _ = client.CreateLogGroup(ctx, &cloudwatchlogs.CreateLogGroupInput{
			LogGroupName: aws.String(group.Name),
		})

		// 2. Create log stream (ignore if exists)
		_, _ = client.CreateLogStream(ctx, &cloudwatchlogs.CreateLogStreamInput{
			LogGroupName:  aws.String(group.Name),
			LogStreamName: aws.String(group.Stream),
		})

		// 3. Put historical log events across past 24 hours
		var inputEvents []types.InputLogEvent
		for i := 0; i < 20; i++ {
			ts := now.Add(-time.Duration(24-i) * time.Hour).Add(time.Duration(i*3) * time.Minute).UnixMilli()
			msg := group.Messages[i%len(group.Messages)]

			inputEvents = append(inputEvents, types.InputLogEvent{
				Timestamp: aws.Int64(ts),
				Message:   aws.String(fmt.Sprintf("%s [id=%d]", msg, i+1)),
			})
		}

		_, _ = client.PutLogEvents(ctx, &cloudwatchlogs.PutLogEventsInput{
			LogGroupName:  aws.String(group.Name),
			LogStreamName: aws.String(group.Stream),
			LogEvents:     inputEvents,
		})
	}

	// 4. Start continuous background ticker for Live Tail streaming across all log groups
	m.startBackgroundTicker(region, accessKeyID, secretKey, sessionToken, groups)

	return nil
}

// startBackgroundTicker periodically writes new log events to ALL log groups in LocalStack.
func (m *MockerService) startBackgroundTicker(region, accessKeyID, secretKey, sessionToken string, groups []MockLogGroup) {
	m.mu.Lock()
	if m.isSeeding {
		m.mu.Unlock()
		return
	}
	m.isSeeding = true
	m.mu.Unlock()

	log.Println("[Mocker] Started background live tail ticker (pushing logs every 2s to all groups)")

	go func() {
		ticker := time.NewTicker(2 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-m.stopChan:
				return
			case <-ticker.C:
				if len(groups) == 0 {
					continue
				}
				ctx := context.Background()
				client := m.aws.CloudWatchLogsClient(region, accessKeyID, secretKey, sessionToken)
				nowMs := time.Now().UnixMilli()

				// Push a new log event to EVERY log group on each tick
				for _, group := range groups {
					if len(group.Messages) == 0 {
						continue
					}
					msg := group.Messages[rand.Intn(len(group.Messages))]

					_, _ = client.PutLogEvents(ctx, &cloudwatchlogs.PutLogEventsInput{
						LogGroupName:  aws.String(group.Name),
						LogStreamName: aws.String(group.Stream),
						LogEvents: []types.InputLogEvent{
							{
								Timestamp: aws.Int64(nowMs),
								Message:   aws.String(fmt.Sprintf("%s [live-%d]", msg, nowMs)),
							},
						},
					})
				}
			}
		}
	}()
}
