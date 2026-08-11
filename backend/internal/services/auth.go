// internal/services/auth.go — Cross-Account Role Assumption via STS
//
// Implements the gold-standard multi-tenant SaaS auth pattern:
//   LogPulseAppRole (attached to this server) calls sts:AssumeRole
//   on the user-provided LogPulseReadRole ARN in the customer's account.
//   Returns short-lived temporary credentials scoped to the customer's role.
//
// LocalStack mode:
//   AWS_ENDPOINT is set → skips real AssumeRole, returns mock credentials
//   and seeds LocalStack with mock log data.

package services

import (
	"context"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sts"
)

// AssumedRoleCredentials holds the temporary credentials from sts:AssumeRole.
type AssumedRoleCredentials struct {
	AccessKeyID  string
	SecretKey    string
	SessionToken string
	AccountID    string
	ARN          string
}

// AuthService handles role assumption against AWS STS.
type AuthService struct {
	aws    *AWSClient
	mocker *MockerService
}

// NewAuthService creates a new auth service with optional MockerService for LocalStack.
func NewAuthService(aws *AWSClient, mocker *MockerService) *AuthService {
	return &AuthService{aws: aws, mocker: mocker}
}

// isLocalStackRoleARN returns true if the Role ARN belongs to a LocalStack fake account.
// LocalStack account IDs: 000000000000 and 123456789012.
// ARN format: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME
func isLocalStackRoleARN(roleARN string) bool {
	parts := strings.Split(roleARN, ":")
	if len(parts) < 5 {
		return false
	}
	accountID := parts[4]
	return accountID == "000000000000" || accountID == "123456789012"
}

// AssumeRole calls sts:AssumeRole using LogPulseAppRole (default credential chain).
// In LocalStack mode, returns mock credentials and seeds log data directly.
func (s *AuthService) AssumeRole(ctx context.Context, roleARN, externalID, region string) (*AssumedRoleCredentials, error) {
	// LocalStack fallback — detected from the Role ARN account ID (000000000000 or 123456789012)
	if isLocalStackRoleARN(roleARN) {
		if s.mocker != nil {
			_ = s.mocker.SeedAtLogin(ctx, region, "localstack", "localstack", "")
		}
		return &AssumedRoleCredentials{
			AccessKeyID:  "localstack",
			SecretKey:    "localstack",
			SessionToken: "",
			AccountID:    "123456789012",
			ARN:          roleARN,
		}, nil
	}

	// Production: use default credential chain (LogPulseAppRole on EC2/App Runner)
	client := s.aws.DefaultSTSClient(region)

	input := &sts.AssumeRoleInput{
		RoleArn:         aws.String(roleARN),
		RoleSessionName: aws.String("LogPulseSession"),
	}
	if externalID != "" {
		input.ExternalId = aws.String(externalID)
	}

	output, err := client.AssumeRole(ctx, input)
	if err != nil {
		return nil, err
	}

	// Extract account ID from the assumed role ARN
	// e.g. arn:aws:sts::123456789012:assumed-role/LogPulseReadRole/LogPulseSession
	accountID := ""
	if output.AssumedRoleUser != nil && output.AssumedRoleUser.Arn != nil {
		accountID = aws.ToString(output.AssumedRoleUser.Arn)
	}

	return &AssumedRoleCredentials{
		AccessKeyID:  aws.ToString(output.Credentials.AccessKeyId),
		SecretKey:    aws.ToString(output.Credentials.SecretAccessKey),
		SessionToken: aws.ToString(output.Credentials.SessionToken),
		AccountID:    accountID,
		ARN:          roleARN,
	}, nil
}
