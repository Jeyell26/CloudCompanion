// internal/services/auth.go — Credential validation via STS
//
// Validates IAM credentials by calling STS GetCallerIdentity.
// If the call succeeds the credentials are legitimate; the returned
// caller identity (Account, Arn, UserId) is embedded in the JWT.
//
// On LocalStack:
//   STS GetCallerIdentity always succeeds regardless of credentials.
//   This is the correct behaviour for local dev.

package services

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sts"
)

// CallerIdentity holds the result of a successful STS GetCallerIdentity call.
type CallerIdentity struct {
	AccountID string
	ARN       string
	UserID    string
}

// AuthService handles credential validation against AWS STS.
type AuthService struct {
	aws    *AWSClient
	mocker *MockerService
}

// NewAuthService creates a new auth service with optional MockerService for LocalStack.
func NewAuthService(aws *AWSClient, mocker *MockerService) *AuthService {
	return &AuthService{aws: aws, mocker: mocker}
}

// ValidateCredentials verifies IAM credentials by calling STS GetCallerIdentity.
func (s *AuthService) ValidateCredentials(ctx context.Context, accessKeyID, secretKey, region, sessionToken string) (*CallerIdentity, error) {
	client := s.aws.STSClient(region, accessKeyID, secretKey, sessionToken)
	callerIdentityOutput, err := client.GetCallerIdentity(ctx, &sts.GetCallerIdentityInput{})
	if err != nil {
		return nil, err
	}

	// Trigger LocalStack mock auto-population if using test/localstack credentials
	if s.mocker != nil && IsLocalStackCredential(accessKeyID) {
		_ = s.mocker.SeedAtLogin(ctx, region, accessKeyID, secretKey, sessionToken)
	}

	return &CallerIdentity{
		AccountID: aws.ToString(callerIdentityOutput.Account),
		ARN:       aws.ToString(callerIdentityOutput.Arn),
		UserID:    aws.ToString(callerIdentityOutput.UserId),
	}, nil
}
