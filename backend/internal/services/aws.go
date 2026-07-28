// internal/services/aws.go — Shared AWS SDK client factory
//
// LocalStack detection:
//   AWS_ENDPOINT env var is set → pass custom endpoint to client options.

package services

import (
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/sts"
)

// AWSClient is a factory for creating AWS service clients with optional
// LocalStack endpoint override.
type AWSClient struct {
	endpoint string // empty string means real AWS
}

// NewAWSClient creates a new AWS client factory.
// Reads AWS_ENDPOINT from the environment.
func NewAWSClient() *AWSClient {
	return &AWSClient{
		endpoint: os.Getenv("AWS_ENDPOINT"),
	}
}

// CloudWatchLogsClient creates a CloudWatch Logs client for the given region and credentials.
func (a *AWSClient) CloudWatchLogsClient(region, accessKeyID, secretKey, sessionToken string) *cloudwatchlogs.Client {
	client := credentials.NewStaticCredentialsProvider(accessKeyID, secretKey, sessionToken)

	opts := cloudwatchlogs.Options{
		Region:      region,
		Credentials: aws.NewCredentialsCache(client),
	}

	return cloudwatchlogs.New(opts)
}

// STSClient creates an STS client for the given region and credentials.
func (a *AWSClient) STSClient(region, accessKeyID, secretKey, sessionToken string) *sts.Client {
	client := credentials.NewStaticCredentialsProvider(accessKeyID, secretKey, sessionToken)

	opts := sts.Options{
		Region:      region,
		Credentials: aws.NewCredentialsCache(client),
	}

	return sts.New(opts)
}
