// services/awsClient.js — Shared AWS SDK client factory
//
// Creates and caches pre-configured AWS SDK v3 clients.
// Reads AWS_ENDPOINT from the environment to transparently redirect
// all calls to LocalStack when set.
//
// Clients provided:
//   - CloudWatchLogsClient  (used by log-groups, live-tail, range-query)
//   - STSClient             (used by auth — STS GetCallerIdentity)
//
// Usage:
//   import { getCloudWatchClient, getSTSClient } from './awsClient.js';
//   const client = getCloudWatchClient(region, credentials);
//
// Credentials shape passed in from the JWT payload:
//   { accessKeyId, secretAccessKey, sessionToken? }
//
// LocalStack detection:
//   AWS_ENDPOINT env var is set → pass endpoint to client config.

// TODO: import AWS SDK v3 clients
// import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
// import { STSClient } from '@aws-sdk/client-sts';

// TODO: implement getCloudWatchClient(region, credentials)
//   - Build the client config object
//   - Add endpoint: process.env.AWS_ENDPOINT if set
//   - Return a new CloudWatchLogsClient

export function getCloudWatchClient(_region, _credentials) {
  // TODO
}

// TODO: implement getSTSClient(region, credentials)
//   - Same pattern as getCloudWatchClient
//   - Return a new STSClient

export function getSTSClient(_region, _credentials) {
  // TODO
}
