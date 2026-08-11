// internal/services/aws.go — Shared AWS SDK client factory
//
// Provides two credential modes:
//   1. DefaultSTSClient — uses the default AWS credential chain (LogPulseAppRole
//      when deployed on EC2/App Runner, env vars for local dev). Used for sts:AssumeRole.
//   2. CloudWatchLogsClient / STSClient — uses static credentials (the temporary
//      credentials obtained after AssumeRole). Used for all CloudWatch API calls.
//
// LocalStack detection:
//   AWS_ENDPOINT env var is set → pass custom endpoint to client options.

package services

import (
	"context"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
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

// IsLocalStack returns true when the backend is pointed at LocalStack.
func (a *AWSClient) IsLocalStack() bool {
	return a.endpoint != ""
}

// IsLocalStackCredential returns true if the environment represents LocalStack mode.
func IsLocalStackCredential(roleARN string) bool {
	return os.Getenv("AWS_ENDPOINT") != ""
}

// DefaultSTSClient creates an STS client using the default AWS credential chain.
// In production (deployed on EC2/App Runner), this automatically uses LogPulseAppRole.
// In local dev, uses AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from the environment.
func (a *AWSClient) DefaultSTSClient(region string) *sts.Client {
	cfg, _ := config.LoadDefaultConfig(context.Background(), config.WithRegion(region))

	var endpoint *string
	if a.endpoint != "" {
		endpoint = &a.endpoint
	}

	return sts.NewFromConfig(cfg, func(o *sts.Options) {
		o.BaseEndpoint = endpoint
	})
}

// CloudWatchLogsClient creates a CloudWatch Logs client from temporary assumed role credentials.
func (a *AWSClient) CloudWatchLogsClient(region, accessKeyID, secretKey, sessionToken string) *cloudwatchlogs.Client {
	var endpoint *string
	if a.endpoint != "" {
		endpoint = &a.endpoint
	}

	client := credentials.NewStaticCredentialsProvider(accessKeyID, secretKey, sessionToken)

	opts := cloudwatchlogs.Options{
		Region:       region,
		Credentials:  aws.NewCredentialsCache(client),
		BaseEndpoint: endpoint,
	}

	return cloudwatchlogs.New(opts)
}

// STSClient creates an STS client from static credentials (used for LocalStack test flows).
func (a *AWSClient) STSClient(region, accessKeyID, secretKey, sessionToken string) *sts.Client {
	var endpoint *string
	if a.endpoint != "" {
		endpoint = &a.endpoint
	}

	client := credentials.NewStaticCredentialsProvider(accessKeyID, secretKey, sessionToken)

	opts := sts.Options{
		Region:       region,
		Credentials:  aws.NewCredentialsCache(client),
		BaseEndpoint: endpoint,
	}

	return sts.New(opts)
}
