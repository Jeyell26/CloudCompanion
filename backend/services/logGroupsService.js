// services/logGroupsService.js — CloudWatch log group enumeration
//
// Fetches all log groups the IAM principal has access to by paginating
// DescribeLogGroups until there is no nextToken.
//
// AWS SDK command: DescribeLogGroupsCommand
//   Input:  { nextToken? }
//   Output: { logGroups: [{ logGroupName, arn, storedBytes, retentionInDays }], nextToken? }
//
// Frontend LogGroup shape expected:
//   { name: string, arn?: string, storedBytes?: number, retentionDays?: number }
//
// Notes on pagination:
//   AWS returns up to 50 log groups per page.
//   Loop until response.nextToken is undefined, accumulating results.
//
// Usage:
//   const groups = await listLogGroups(region, credentials);

// TODO: import DescribeLogGroupsCommand from '@aws-sdk/client-cloudwatch-logs'
// import { DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
// import { getCloudWatchClient } from './awsClient.js';

// TODO: implement listLogGroups(region, credentials)
//   1. Create CW client via getCloudWatchClient
//   2. Loop: send DescribeLogGroupsCommand, accumulate logGroups, break on no nextToken
//   3. Map each AWS group to { name, arn, storedBytes, retentionDays }
//   4. Return the full array

export async function listLogGroups(_region, _credentials) {
  // TODO
}
