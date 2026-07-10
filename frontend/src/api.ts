import type { EC2Instance, LambdaFunction, LogEvent, S3Object, SecretMetadata, IntegrationStatus, User } from './types';

const API_BASE_URL = 'http://localhost:5000/api';

// Simple check if backend is connected
let isBackendConnected = false;
let onBackendStatusChange: ((connected: boolean) => void) | null = null;

export function registerBackendStatusListener(callback: (connected: boolean) => void) {
  onBackendStatusChange = callback;
  callback(isBackendConnected);
}

// Simulated memory store for mock mode
const mockStore: {
  ec2: EC2Instance[];
  lambda: LambdaFunction[];
  s3Buckets: string[];
  s3Objects: Record<string, S3Object[]>;
  secrets: SecretMetadata[];
  secretValues: Record<string, string>;
  integrations: IntegrationStatus;
} = {
  ec2: [
    { id: 'i-0a2b3c4d5e6f7g8h9', name: 'api-server-prod', status: 'running', type: 't3.medium', ip: '54.210.12.85', cpu: 14.2 },
    { id: 'i-0987654321fedcba0', name: 'database-replica', status: 'stopped', type: 'r6i.large', ip: '3.95.148.120', cpu: 0 },
    { id: 'i-112233445566aabbc', name: 'jenkins-cicd-runner', status: 'running', type: 'c6i.xlarge', ip: '18.232.42.11', cpu: 45.8 },
    { id: 'i-998877665544ccddee', name: 'staging-auth-node', status: 'stopped', type: 't3.micro', ip: '34.201.55.99', cpu: 0 }
  ],
  lambda: [
    { name: 'processImage', runtime: 'nodejs18.x', memory: 512, invocations: 1420, errors: 2, duration: 184 },
    { name: 'cleanupLogs', runtime: 'python3.11', memory: 128, invocations: 4280, errors: 45, duration: 924 },
    { name: 'iotTelemetryIngest', runtime: 'go1.x', memory: 256, invocations: 154200, errors: 12, duration: 12 }
  ],
  s3Buckets: ['company-assets-prod', 'user-uploads-dev', 'cloudwatch-log-archives'],
  s3Objects: {
    'company-assets-prod': [
      { key: 'logo.png', size: 409600, lastModified: '2026-07-09T08:00:00Z' },
      { key: 'index.html', size: 10420, lastModified: '2026-07-10T02:15:30Z' },
      { key: 'assets/main.js', size: 1450200, lastModified: '2026-07-10T02:15:30Z' }
    ],
    'user-uploads-dev': [
      { key: 'avatar_user1.jpg', size: 45200, lastModified: '2026-07-08T12:00:00Z' },
      { key: 'document_scan.pdf', size: 4210400, lastModified: '2026-07-07T15:34:00Z' }
    ],
    'cloudwatch-log-archives': [
      { key: '2026/06/logs-archive.zip', size: 45910200, lastModified: '2026-07-01T00:05:00Z' }
    ]
  },
  secrets: [
    { name: 'prod/db/credentials', description: 'Production RDS MySQL login keys' },
    { name: 'staging/auth/jwt_secret', description: 'Secret key for signing user sessions' },
    { name: 'api/stripe/webhook_key', description: 'Stripe API authentication webhook verification signature' }
  ],
  secretValues: {
    'prod/db/credentials': '{"db_host": "prod-db.c12345.us-east-1.rds.amazonaws.com", "db_user": "admin_prod", "db_pass": "SuperSecureP@ss2026!"}',
    'staging/auth/jwt_secret': 'h$9A2k!vL8#qPwZ5*mX7%tN3(yR1c[vB',
    'api/stripe/webhook_key': 'whsec_6f7f2b1c4e5a3d7b8c9d0e1f2a3b4c5d'
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

// Helper for making API calls with fallback to simulator
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    
    if (!isBackendConnected) {
      isBackendConnected = true;
      if (onBackendStatusChange) onBackendStatusChange(true);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }
    return await response.json() as T;
  } catch (error) {
    if (isBackendConnected) {
      isBackendConnected = false;
      if (onBackendStatusChange) onBackendStatusChange(false);
    }
    throw error;
  }
}

// Authentication API
export async function loginUser(email: string, pass: string): Promise<{ token: string; user: User }> {
  try {
    return await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });
  } catch (e) {
    // Simulator Mode Fallback
    console.warn('Backend unavailable. Simulating login...');
    if (email === 'demo@example.com' && pass === 'password') {
      const mockToken = 'mock_jwt_token_jeyell';
      const mockUser = { id: 'usr-1', username: 'Jeyell', email: 'demo@example.com' };
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      return { token: mockToken, user: mockUser };
    }
    throw new Error('Invalid email or password. Use demo@example.com / password for simulator.');
  }
}

export async function registerUser(username: string, email: string, pass: string): Promise<{ token: string; user: User }> {
  try {
    return await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password: pass })
    });
  } catch (e) {
    // Simulator Mode Fallback
    console.warn('Backend unavailable. Simulating registration...');
    const mockToken = 'mock_jwt_token_' + Math.random().toString(36).substr(2, 9);
    const mockUser = { id: 'usr-' + Math.random().toString(36).substr(2, 4), username, email };
    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    return { token: mockToken, user: mockUser };
  }
}

export async function getProfile(): Promise<User> {
  try {
    return await request<User>('/auth/me');
  } catch (e) {
    const cachedUser = localStorage.getItem('auth_user');
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }
    throw new Error('No user profile found');
  }
}

// EC2 Manager API
export async function getEC2Instances(): Promise<EC2Instance[]> {
  try {
    return await request<EC2Instance[]>('/aws/ec2');
  } catch (e) {
    // Simulate minor CPU fluctuation
    mockStore.ec2 = mockStore.ec2.map(inst => {
      if (inst.status === 'running') {
        const delta = (Math.random() - 0.5) * 4;
        const newCpu = Math.max(1, Math.min(99, Number((inst.cpu + delta).toFixed(1))));
        return { ...inst, cpu: newCpu };
      }
      return inst;
    });
    return [...mockStore.ec2];
  }
}

export async function triggerEC2Action(instanceId: string, action: 'start' | 'stop'): Promise<{ success: boolean; status: string }> {
  try {
    return await request<{ success: boolean; status: string }>('/aws/ec2/action', {
      method: 'POST',
      body: JSON.stringify({ instanceId, action })
    });
  } catch (e) {
    const target = mockStore.ec2.find(i => i.id === instanceId);
    if (!target) throw new Error('Instance not found');

    if (action === 'start') {
      target.status = 'pending';
      setTimeout(() => {
        if (target.status === 'pending') {
          target.status = 'running';
          target.cpu = 5.0;
        }
      }, 4000);
    } else {
      target.status = 'stopping';
      setTimeout(() => {
        if (target.status === 'stopping') {
          target.status = 'stopped';
          target.cpu = 0;
        }
      }, 4000);
    }
    return { success: true, status: target.status };
  }
}

// Lambda API
export async function getLambdas(): Promise<LambdaFunction[]> {
  try {
    return await request<LambdaFunction[]>('/aws/lambda');
  } catch (e) {
    return [...mockStore.lambda];
  }
}

export async function invokeLambda(functionName: string, payload: any): Promise<{ success: boolean; logs: string; payload: any }> {
  try {
    return await request<{ success: boolean; logs: string; payload: any }>('/aws/lambda/invoke', {
      method: 'POST',
      body: JSON.stringify({ functionName, payload })
    });
  } catch (e) {
    const func = mockStore.lambda.find(f => f.name === functionName);
    if (func) {
      func.invocations += 1;
      if (Math.random() < 0.05) {
        func.errors += 1;
      }
    }

    const reqId = 'req-' + Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 4);
    const start = Date.now();
    const mockLogs = `START RequestId: ${reqId} Version: $LATEST
2026-07-10T10:52:00Z\t${reqId}\tINFO\tExecuting function handler for ${functionName}...
2026-07-10T10:52:01Z\t${reqId}\tINFO\tParsing event payload: ${JSON.stringify(payload)}
2026-07-10T10:52:01Z\t${reqId}\tINFO\tDatabase connection established successfully.
2026-07-10T10:52:02Z\t${reqId}\tINFO\tOperation completed, payload processed.
END RequestId: ${reqId}
REPORT RequestId: ${reqId}\tDuration: ${func ? func.duration : 120} ms\tBilled Duration: ${Math.ceil((func ? func.duration : 120) / 100) * 100} ms\tMemory Size: ${func ? func.memory : 256} MB\tMax Memory Used: 74 MB`;

    return {
      success: true,
      logs: mockLogs,
      payload: {
        statusCode: 200,
        body: JSON.stringify({ message: `Function ${functionName} executed successfully`, timestamp: start })
      }
    };
  }
}

// CloudWatch Logs API
export async function getLogGroups(): Promise<string[]> {
  try {
    return await request<string[]>('/aws/cloudwatch/groups');
  } catch (e) {
    return [
      '/aws/lambda/processImage',
      '/aws/lambda/cleanupLogs',
      '/aws/lambda/iotTelemetryIngest',
      '/aws/ecs/production-api-server',
      '/aws/apigateway/dashboard-gateway'
    ];
  }
}

export async function getLogs(groupName: string, filter: string = '', limit: number = 50): Promise<LogEvent[]> {
  try {
    const query = new URLSearchParams({ groupName, limit: String(limit), filter });
    return await request<LogEvent[]>(`/aws/cloudwatch/logs?${query.toString()}`);
  } catch (e) {
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

    const groupLogs = sampleLogs[groupName] || ['No logs found for this group'];
    const now = Date.now();
    
    const events = groupLogs.map((msg, index) => ({
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

// S3 Browser API
export async function getS3Buckets(): Promise<string[]> {
  try {
    return await request<string[]>('/aws/s3/buckets');
  } catch (e) {
    return [...mockStore.s3Buckets];
  }
}

export async function getS3Objects(bucketName: string): Promise<S3Object[]> {
  try {
    return await request<S3Object[]>(`/aws/s3/buckets/${bucketName}/objects`);
  } catch (e) {
    return [...(mockStore.s3Objects[bucketName] || [])];
  }
}

export async function uploadS3ObjectSimulate(bucketName: string, fileName: string, fileSize: number): Promise<S3Object> {
  const newObj = {
    key: fileName,
    size: fileSize,
    lastModified: new Date().toISOString()
  };
  
  if (!mockStore.s3Objects[bucketName]) {
    mockStore.s3Objects[bucketName] = [];
  }
  
  // Prevent duplicate keys
  mockStore.s3Objects[bucketName] = mockStore.s3Objects[bucketName].filter(o => o.key !== fileName);
  mockStore.s3Objects[bucketName].push(newObj);
  
  return newObj;
}

// Secrets Manager API
export async function getSecretsMetadata(): Promise<SecretMetadata[]> {
  try {
    return await request<SecretMetadata[]>('/aws/secrets');
  } catch (e) {
    return [...mockStore.secrets];
  }
}

export async function getSecretValue(secretName: string): Promise<string> {
  try {
    const res = await request<{ value: string }>(`/aws/secrets/${encodeURIComponent(secretName)}`);
    return res.value;
  } catch (e) {
    return mockStore.secretValues[secretName] || '{"error": "Secret not found"}';
  }
}

// Integration status API
export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  try {
    return await request<IntegrationStatus>('/aws/integrations/status');
  } catch (e) {
    // Fluctuations for a dynamic dashboard feeling
    const deltaReq = Math.floor(Math.random() * 5) + 1;
    mockStore.integrations.apiGateway.requestCount += deltaReq;
    mockStore.integrations.iot.messagesReceived += Math.floor(Math.random() * 8) + 1;
    if (Math.random() < 0.1) {
      mockStore.integrations.iot.connections = Math.max(1, mockStore.integrations.iot.connections + (Math.random() > 0.5 ? 1 : -1));
    }
    return { ...mockStore.integrations };
  }
}
