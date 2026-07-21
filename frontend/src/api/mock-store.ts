// Shared in-memory mock data store.
// Imported by feature API modules when the backend is unavailable.

import type { EC2Instance, LambdaFunction, S3Object, SecretMetadata, IntegrationStatus } from '../types';

export const mockStore: {
  ec2: EC2Instance[];
  lambda: LambdaFunction[];
  s3Buckets: string[];
  s3Objects: Record<string, S3Object[]>;
  secrets: SecretMetadata[];
  secretValues: Record<string, string>;
  integrations: IntegrationStatus;
} = {
  ec2: [
    { id: 'i-0a2b3c4d5e6f7g8h9', name: 'api-server-prod',     status: 'running', type: 't3.medium',  ip: '54.210.12.85',   cpu: 14.2 },
    { id: 'i-0987654321fedcba0', name: 'database-replica',     status: 'stopped', type: 'r6i.large',  ip: '3.95.148.120',   cpu: 0    },
    { id: 'i-112233445566aabbc', name: 'jenkins-cicd-runner',  status: 'running', type: 'c6i.xlarge', ip: '18.232.42.11',   cpu: 45.8 },
    { id: 'i-998877665544ccddee', name: 'staging-auth-node',   status: 'stopped', type: 't3.micro',   ip: '34.201.55.99',   cpu: 0    }
  ],
  lambda: [
    { name: 'processImage',       runtime: 'nodejs18.x',  memory: 512, invocations: 1420,   errors: 2,  duration: 184 },
    { name: 'cleanupLogs',        runtime: 'python3.11',  memory: 128, invocations: 4280,   errors: 45, duration: 924 },
    { name: 'iotTelemetryIngest', runtime: 'go1.x',       memory: 256, invocations: 154200, errors: 12, duration: 12  }
  ],
  s3Buckets: ['company-assets-prod', 'user-uploads-dev', 'cloudwatch-log-archives'],
  s3Objects: {
    'company-assets-prod': [
      { key: 'logo.png',       size: 409600,    lastModified: '2026-07-09T08:00:00Z' },
      { key: 'index.html',     size: 10420,     lastModified: '2026-07-10T02:15:30Z' },
      { key: 'assets/main.js', size: 1450200,   lastModified: '2026-07-10T02:15:30Z' }
    ],
    'user-uploads-dev': [
      { key: 'avatar_user1.jpg',    size: 45200,   lastModified: '2026-07-08T12:00:00Z' },
      { key: 'document_scan.pdf',   size: 4210400, lastModified: '2026-07-07T15:34:00Z' }
    ],
    'cloudwatch-log-archives': [
      { key: '2026/06/logs-archive.zip', size: 45910200, lastModified: '2026-07-01T00:05:00Z' }
    ]
  },
  secrets: [
    { name: 'prod/db/credentials',       description: 'Production RDS MySQL login keys' },
    { name: 'staging/auth/jwt_secret',   description: 'Secret key for signing user sessions' },
    { name: 'api/stripe/webhook_key',    description: 'Stripe API authentication webhook verification signature' }
  ],
  secretValues: {
    'prod/db/credentials':     '{"db_host": "prod-db.c12345.us-east-1.rds.amazonaws.com", "db_user": "admin_prod", "db_pass": "SuperSecureP@ss2026!"}',
    'staging/auth/jwt_secret': 'h$9A2k!vL8#qPwZ5*mX7%tN3(yR1c[vB',
    'api/stripe/webhook_key':  'whsec_6f7f2b1c4e5a3d7b8c9d0e1f2a3b4c5d'
  },
  integrations: {
    apiGateway: {
      routes: ['/api/auth/login', '/api/auth/register', '/api/aws/ec2', '/api/aws/lambda', '/api/aws/cloudwatch/logs'],
      requestCount: 18450,
      errorRate: 0.28
    },
    iot: {
      connections: 18,
      messagesReceived: 429184
    }
  }
};
