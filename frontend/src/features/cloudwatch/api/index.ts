// CloudWatch feature API — log groups and log event fetching.

import type { LogEvent } from '../../../types';
import { request } from '../../../api/client';

const sampleLogs: Record<string, string[]> = {
  '/aws/lambda/processImage': [
    'START RequestId: 81b29a24-9b2f-48d6-ba09-c128189689bf Version: $LATEST',
    'INFO Downloading source image from bucket user-uploads-dev key: avatar_user1.jpg',
    'INFO Processing image thumbnail resizing: width=128, height=128',
    'INFO Optimizing format to WebP for efficient CDN delivery',
    'INFO Uploading thumbnail to S3 bucket company-assets-prod key: thumbnails/avatar_user1.webp',
    'END RequestId: 81b29a24-9b2f-48d6-ba09-c128189689bf',
    'REPORT RequestId: 81b29a24-9b2f-48d6-ba09-c128189689bf Duration: 184.2 ms Billed Duration: 200 ms Memory Size: 512 MB Max Memory Used: 82 MB'
  ],
  '/aws/lambda/cleanupLogs': [
    'START RequestId: 04fa920d-7b22-44be-ac5f-e21b0213d2f1 Version: $LATEST',
    'INFO Scanning CloudWatch groups for retention policy checking',
    'INFO Archiving logs older than 30 days from group: /aws/ecs/production-api-server',
    'INFO Packaging 42.1 MB logs into zip archive',
    'INFO Saving zip to S3 bucket cloudwatch-log-archives key: 2026/06/logs-archive.zip',
    'INFO Logs successfully archived, deleting source log streams',
    'END RequestId: 04fa920d-7b22-44be-ac5f-e21b0213d2f1',
    'REPORT RequestId: 04fa920d-7b22-44be-ac5f-e21b0213d2f1 Duration: 924.1 ms Billed Duration: 1000 ms Memory Size: 128 MB Max Memory Used: 45 MB'
  ],
  '/aws/lambda/iotTelemetryIngest': [
    'START RequestId: df2841bc-202e-4b6e-b6a9-83bc1284a1e9 Version: $LATEST',
    'INFO Parsing incoming MQTT packet payload from topic: devices/sensors/telemetry',
    'INFO Telemetry details: { deviceId: "device-24", temp: 21.8, battery: 94.2 }',
    'INFO Pushing data points to Timestream database',
    'END RequestId: df2841bc-202e-4b6e-b6a9-83bc1284a1e9',
    'REPORT RequestId: df2841bc-202e-4b6e-b6a9-83bc1284a1e9 Duration: 12.1 ms Billed Duration: 50 ms Memory Size: 256 MB Max Memory Used: 31 MB'
  ],
  '/aws/ecs/production-api-server': [
    '2026-07-10T10:50:00Z [INFO] Server started listening on port 8080',
    '2026-07-10T10:50:12Z [INFO] GET /health - Status 200 OK (from: 10.0.1.48)',
    '2026-07-10T10:50:30Z [INFO] POST /api/v1/users - Processing registration for user: test_account',
    '2026-07-10T10:50:31Z [WARNING] Database connection pool query threshold exceeded: 120ms',
    '2026-07-10T10:50:31Z [INFO] User created, session JWT signed. Response 201 Created',
    '2026-07-10T10:50:50Z [ERROR] Failed to fetch user metadata from Redis cache: Connection timeout',
    '2026-07-10T10:50:50Z [INFO] Falling back to database lookup'
  ],
  '/aws/apigateway/dashboard-gateway': [
    '2026-07-10T10:50:02Z - Method: POST, Path: /api/auth/login, Client IP: 154.22.42.110, Latency: 24ms, Status: 200',
    '2026-07-10T10:50:15Z - Method: GET, Path: /api/aws/ec2, Client IP: 154.22.42.110, Latency: 42ms, Status: 200',
    '2026-07-10T10:50:18Z - Method: POST, Path: /api/aws/ec2/action, Client IP: 154.22.42.110, Latency: 112ms, Status: 200',
    '2026-07-10T10:50:24Z - Method: GET, Path: /api/aws/lambda, Client IP: 154.22.42.110, Latency: 35ms, Status: 200'
  ]
};

export async function getLogGroups(): Promise<string[]> {
  try {
    return await request<string[]>('/aws/cloudwatch/groups');
  } catch {
    return Object.keys(sampleLogs);
  }
}

export async function getLogs(
  groupName: string,
  filter: string = '',
  limit: number = 50
): Promise<LogEvent[]> {
  try {
    const query = new URLSearchParams({ groupName, limit: String(limit), filter });
    return await request<LogEvent[]>(`/aws/cloudwatch/logs?${query.toString()}`);
  } catch {
    const groupLogs = sampleLogs[groupName] || ['No logs found for this group'];
    const now = Date.now();

    const events: LogEvent[] = groupLogs.map((msg, index) => ({
      timestamp: now - (groupLogs.length - index) * 60000,
      message: msg
    }));

    if (filter) {
      const lowerFilter = filter.toLowerCase();
      return events.filter(e => e.message.toLowerCase().includes(lowerFilter));
    }
    return events.slice(-limit);
  }
}
