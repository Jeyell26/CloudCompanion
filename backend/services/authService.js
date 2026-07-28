// services/authService.js — Credential validation via STS
//
// Validates IAM credentials by calling STS GetCallerIdentity.
// If the call succeeds the credentials are legitimate; the returned
// caller identity (Account, Arn, UserId) is embedded in the JWT.
//
// AWS SDK command: GetCallerIdentityCommand
//   Input:  {} (no parameters — the SDK uses the credentials from client config)
//   Output: { Account, Arn, UserId }
//
// On LocalStack:
//   STS GetCallerIdentity always succeeds regardless of credentials.
//   This is the correct behaviour for local dev — the frontend signals
//   LocalStack mode by sending well-known test credentials (key = "localstack").
//
// Usage:
//   const identity = await validateCredentials(accessKeyId, secretAccessKey, region);
//   // identity → { accountId, arn, userId }
//
// Throws on invalid credentials (AWS will return an AuthFailure error).

// TODO: import GetCallerIdentityCommand from '@aws-sdk/client-sts'
// import { GetCallerIdentityCommand } from '@aws-sdk/client-sts';
// import { getSTSClient } from './awsClient.js';

// TODO: implement validateCredentials(accessKeyId, secretAccessKey, region)
//   1. Build credentials object { accessKeyId, secretAccessKey }
//   2. Call getSTSClient(region, credentials)
//   3. Send GetCallerIdentityCommand
//   4. Return { accountId: Account, arn: Arn, userId: UserId }
//   5. Let errors propagate — the route handler maps them to 401

export async function validateCredentials(_accessKeyId, _secretAccessKey, _region) {
  // TODO
}
