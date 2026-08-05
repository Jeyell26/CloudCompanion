// internal/services/loggroups.go — CloudWatch log group enumeration
//
// Fetches all log groups the IAM principal has access to by paginating
// DescribeLogGroups until there is no NextToken.
<<<<<<< Updated upstream
//
// AWS SDK command: DescribeLogGroups
//   Input:  { NextToken? }
//   Output: { LogGroups: [{ LogGroupName, Arn, StoredBytes, RetentionInDays }], NextToken? }
//
// Frontend LogGroup shape expected:
//   { name: string, arn?: string, storedBytes?: number, retentionDays?: number }
=======
>>>>>>> Stashed changes

package services

import (
	"context"
<<<<<<< Updated upstream
=======

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
//
// TODO: implement
//   1. Create CW client via s.aws.CloudWatchLogsClient(region, accessKeyID, secretKey)
//   2. Loop: send DescribeLogGroupsInput{ NextToken }, accumulate results
//   3. Break when result.NextToken == nil
//   4. Map each AWS log group to LogGroup{ Name, ARN, StoredBytes, RetentionDays }
//   5. Return the full slice
func (s *LogGroupsService) ListLogGroups(ctx context.Context, region, accessKeyID, secretKey string) ([]LogGroup, error) {
	// TODO
	return nil, nil
=======
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
>>>>>>> Stashed changes
}
