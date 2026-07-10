export interface User {
  id: string;
  username: string;
  email: string;
}

export interface EC2Instance {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'pending' | 'stopping';
  type: string;
  ip: string;
  cpu: number;
}

export interface LambdaFunction {
  name: string;
  runtime: string;
  memory: number;
  invocations: number;
  errors: number;
  duration: number;
}

export interface LogEvent {
  timestamp: number;
  message: string;
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: string;
}

export interface SecretMetadata {
  name: string;
  description: string;
}

export interface IntegrationStatus {
  apiGateway: {
    routes: string[];
    requestCount: number;
    errorRate: number;
  };
  iot: {
    connections: number;
    messagesReceived: number;
  };
}
