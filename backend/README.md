# LogPulse Go Backend Architecture & Schematic

This document outlines the architecture, layer separation, data flow, and AWS SDK integration for the **LogPulse** Go backend.

---

## 🏛 High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Frontend Layer (React 19 + TS)"]
        UI["LogPulse Web UI"]
    end

    subgraph Backend["Go Backend Server (cmd/server/main.go)"]
        Router["chi Router + Middleware<br/>(CORS, Logger, Recoverer, Auth)"]

        subgraph Handlers["Handler Layer (internal/handlers/)"]
            AuthH["auth.go<br/>(POST /api/auth/login)"]
            LogGroupH["loggroups.go<br/>(GET /api/log-groups)"]
            LiveTailH["livetail.go<br/>(GET /api/live-tail)"]
            RangeQueryH["rangequery.go<br/>(POST /api/range-query)"]
        end

        subgraph Services["Service Layer (internal/services/)"]
            AuthSvc["auth.go<br/>ValidateCredentials()"]
            LogGroupSvc["loggroups.go<br/>ListLogGroups()"]
            LiveTailSvc["livetail.go<br/>StartLiveTail()"]
            RangeQuerySvc["rangequery.go<br/>QueryRange()"]
            AWSFactory["aws.go<br/>AWSClient Factory"]
        end

        subgraph MiddlewareLayer["Middleware (internal/middleware/)"]
            JWTAuth["auth.go<br/>Verify (Header) & VerifyQueryToken (SSE)"]
        end
    end

    subgraph Infrastructure["AWS Infrastructure / LocalStack"]
        STS["AWS STS<br/>GetCallerIdentity"]
        CWLogs["AWS CloudWatch Logs<br/>DescribeLogGroups / StartLiveTail / FilterLogEvents"]
    end

    %% Flow connections
    UI -->|HTTP POST Credentials| AuthH
    UI -->|HTTP GET + Bearer JWT| LogGroupH
    UI -->|SSE Connection + token query| LiveTailH
    UI -->|HTTP POST + Bearer JWT| RangeQueryH

    AuthH -->|Verify Creds| AuthSvc
    LogGroupH -->|Check JWT| JWTAuth
    RangeQueryH -->|Check JWT| JWTAuth
    LiveTailH -->|Check Query Token| JWTAuth

    LogGroupH --> LogGroupSvc
    LiveTailH --> LiveTailSvc
    RangeQueryH --> RangeQuerySvc

    AuthSvc -->|Get STS Client| AWSFactory
    LogGroupSvc -->|Get CW Client| AWSFactory
    LiveTailSvc -->|Get CW Client| AWSFactory
    RangeQuerySvc -->|Get CW Client| AWSFactory

    AWSFactory -->|STS API Call| STS
    AWSFactory -->|CloudWatch API Calls| CWLogs
```

---

## 🔄 End-to-End Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React Frontend
    participant Middleware as JWT Middleware
    participant Handler as Go Handler
    participant Service as Go Service
    participant AWSFactory as AWSClient Factory
    participant AWS as AWS / LocalStack

    %% 1. LOGIN
    rect rgb(240, 248, 255)
    note right of User: 1. Authentication
    User->>UI: Enter IAM Credentials
    UI->>Handler: POST /api/auth/login
    Handler->>Service: ValidateCredentials(accessKey, secretKey, region)
    Service->>AWSFactory: STSClient(region, creds)
    AWSFactory->>AWS: STS GetCallerIdentity
    AWS-->>AWSFactory: Return Caller Identity (ARN, Account ID)
    Service-->>Handler: Identity Validated
    Handler->>Handler: Sign JWT (with creds & region claims)
    Handler-->>UI: Return 200 OK + JWT Token
    end

    %% 2. LOG GROUPS
    rect rgb(245, 245, 220)
    note right of User: 2. Fetch Log Groups
    UI->>Middleware: GET /api/log-groups (Header: Bearer JWT)
    Middleware->>Middleware: Parse JWT, inject Claims into Context
    Middleware->>Handler: Pass to ListHandler
    Handler->>Service: ListLogGroups(ctx, region, creds)
    Service->>AWSFactory: CloudWatchLogsClient(region, creds)
    Service->>AWS: DescribeLogGroups (Paginated)
    AWS-->>Service: []LogGroup
    Service-->>Handler: []LogGroup JSON
    Handler-->>UI: 200 OK []LogGroup
    end

    %% 3. LIVE TAIL (SSE)
    rect rgb(240, 255, 240)
    note right of User: 3. Streaming Live Tail
    UI->>Handler: GET /api/live-tail?groups[]=...&token=JWT
    Handler->>Middleware: VerifyQueryToken(token)
    Handler->>Service: StartLiveTail(ctx, groups, creds)
    Service->>AWS: CloudWatch StartLiveTail Stream
    loop Event Loop
        AWS-->>Service: LogEvent Chunk
        Service-->>Handler: OnEvent Callback
        Handler-->>UI: SSE Frame (data: {JSON LogEvent})
    end
    end
```

---

## 🛠 Directory & Layer Responsibilities

```
backend/
├── cmd/
│   └── server/
│       └── main.go           # Entry point: loads env, sets up chi router, mounts routes
├── internal/
│   ├── handlers/             # HTTP Layer (Decodes JSON body/query, handles status codes)
│   │   ├── auth.go           # POST /api/auth/login
│   │   ├── loggroups.go      # GET /api/log-groups
│   │   ├── livetail.go       # GET /api/live-tail (SSE)
│   │   └── rangequery.go     # POST /api/range-query
│   ├── middleware/           # Cross-cutting Concerns
│   │   └── auth.go           # JWT verification & claims context extraction
│   └── services/             # Core Business Logic & AWS Integration
│       ├── aws.go            # AWS SDK Client Factory (handles LocalStack endpoint overrides)
│       ├── auth.go           # Validates IAM credentials with STS GetCallerIdentity
│       ├── loggroups.go      # Interacts with CloudWatch DescribeLogGroups API
│       ├── livetail.go       # Manages CloudWatch StartLiveTail streaming connection
│       └── rangequery.go     # Queries historical logs via FilterLogEvents API
├── go.mod                    # Go 1.24 module definition
└── .env.example              # Environment variables template
```

---

## 💡 How the AWS Client Factory Works

The `AWSClient` struct in `internal/services/aws.go` acts as a centralized factory. Whenever a service needs to talk to AWS:

1. It passes the user's specific `region`, `accessKeyID`, and `secretAccessKey` extracted from their authenticated JWT token.
2. The factory creates an AWS SDK v2 client scoped specifically to that user's session.
3. If `AWS_ENDPOINT` is configured in the environment (e.g. `http://localhost:4566`), it sets `BaseEndpoint` on the client options to redirect all AWS traffic directly into LocalStack!
