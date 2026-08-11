// internal/services/aws.go — Shared AWS SDK client factory
//
// LocalStack detection is credential-based, not env-var-based:
//   - At login: isLocalStackRoleARN() checks the account ID in the Role ARN
//   - After login: IsLocalStackCredential() checks the TempAccessKeyID in the JWT
//
// AWS_ENDPOINT is optional — overrides the LocalStack endpoint URL.
// Defaults to http://localhost:4566 when in LocalStack mode.

package services

import (
	"context"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/sts"
)

// AWSClient is a factory for creating AWS service clients.
type AWSClient struct{}

// NewAWSClient creates a new AWS client factory.
func NewAWSClient() *AWSClient {
	return &AWSClient{}
}

// IsLocalStackCredential returns true if the credential key is a LocalStack mock key.
// Used by downstream clients (CloudWatch, live tail) to detect LocalStack mode
// after login, based on the TempAccessKeyID stored in the JWT.
func IsLocalStackCredential(accessKeyID string) bool {
	key := strings.ToLower(strings.TrimSpace(accessKeyID))
	return key == "localstack" || key == "test"
}

// localStackEndpoint returns the LocalStack endpoint URL.
// Uses AWS_ENDPOINT env var if set, otherwise defaults to http://localhost:4566.
func localStackEndpoint() string {
	if ep := os.Getenv("AWS_ENDPOINT"); ep != "" {
		return ep
	}
	return "http://localhost:4566"
}

// DefaultSTSClient creates an STS client using the default AWS credential chain.
// In production (deployed on EC2/App Runner), this automatically uses LogPulseAppRole.
// In local dev, uses AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from the environment.
func (a *AWSClient) DefaultSTSClient(region string) *sts.Client {
	cfg, _ := config.LoadDefaultConfig(context.Background(), config.WithRegion(region))
	return sts.NewFromConfig(cfg)
}

// CloudWatchLogsClient creates a CloudWatch Logs client from temporary assumed role credentials.
// Automatically routes to LocalStack if accessKeyID is a mock key.
func (a *AWSClient) CloudWatchLogsClient(region, accessKeyID, secretKey, sessionToken string) *cloudwatchlogs.Client {
	// Mock check
	var endpoint *string
	if IsLocalStackCredential(accessKeyID) {
		ep := localStackEndpoint()
		endpoint = &ep
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
// Automatically routes to LocalStack if accessKeyID is a mock key.
func (a *AWSClient) STSClient(region, accessKeyID, secretKey, sessionToken string) *sts.Client {
	// Mock check
	var endpoint *string
	if IsLocalStackCredential(accessKeyID) {
		ep := localStackEndpoint()
		endpoint = &ep
	}

	client := credentials.NewStaticCredentialsProvider(accessKeyID, secretKey, sessionToken)

	opts := sts.Options{
		Region:       region,
		Credentials:  aws.NewCredentialsCache(client),
		BaseEndpoint: endpoint,
	}

	return sts.New(opts)
}
