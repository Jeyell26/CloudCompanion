// internal/services/loggroups.go — CloudWatch log group enumeration
//
// Fetches all log groups the IAM principal has access to by paginating
// DescribeLogGroups until there is no NextToken.

package services

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
)

// LogGroup matches the frontend's expected shape.
type LogGroup struct {
	Name          string `json:"name"`
	ARN           string `json:"arn,omitempty"`
	StoredBytes   int64  `json:"storedBytes,omitempty"`
	RetentionDays int32  `json:"retentionDays,omitempty"`
}

// LogGroupsService handles CloudWatch log group operations.
type LogGroupsService struct {
	aws *AWSClient
}

// NewLogGroupsService creates a new log groups service.
func NewLogGroupsService(aws *AWSClient) *LogGroupsService {
	return &LogGroupsService{aws: aws}
}

// ListLogGroups fetches all CloudWatch log groups for the given credentials.
func (s *LogGroupsService) ListLogGroups(ctx context.Context, region, accessKeyID, secretKey, sessionToken string) ([]LogGroup, error) {
	client := s.aws.CloudWatchLogsClient(region, accessKeyID, secretKey, sessionToken)

	// initialize input
	input := &cloudwatchlogs.DescribeLogGroupsInput{}

	var logGroup []LogGroup
	for {

		// get describe log groups of client
		describeLogOutput, err := client.DescribeLogGroups(ctx, input)
		if err != nil {
			return nil, err
		}

		// map received log groups
		for _, lg := range describeLogOutput.LogGroups {
			logGroup = append(logGroup, LogGroup{
				Name:          aws.ToString(lg.LogGroupName),
				ARN:           aws.ToString(lg.Arn),
				StoredBytes:   aws.ToInt64(lg.StoredBytes),
				RetentionDays: aws.ToInt32(lg.RetentionInDays),
			})
		}

		// exit loop if no more next page
		if describeLogOutput.NextToken == nil {
			break
		}

		// adjust input and do again if next page exists
		input = &cloudwatchlogs.DescribeLogGroupsInput{NextToken: describeLogOutput.NextToken}
	}

	return logGroup, nil
}
