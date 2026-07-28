// internal/services/loggroups.go — CloudWatch log group enumeration
//
// Fetches all log groups the IAM principal has access to by paginating
// DescribeLogGroups until there is no NextToken.
//
// AWS SDK command: DescribeLogGroups
//   Input:  { NextToken? }
//   Output: { LogGroups: [{ LogGroupName, Arn, StoredBytes, RetentionInDays }], NextToken? }
//
// Frontend LogGroup shape expected:
//   { name: string, arn?: string, storedBytes?: number, retentionDays?: number }

package services

import (
	"context"
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
}
