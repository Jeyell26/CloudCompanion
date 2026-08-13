# CloudCompanion — LogPulse

A full-stack AWS CloudWatch log management SaaS built to showcase cross-account IAM role assumption, real-time log streaming, and modern cloud architecture patterns.

---

## What is LogPulse?

LogPulse lets you monitor and search AWS CloudWatch logs from a clean web interface. It uses the same authentication pattern as Datadog and Grafana Cloud — you grant LogPulse read access to your AWS account via an IAM role, and it never touches your credentials directly.

---

## Getting Started (User Onboarding)

Before you can log into LogPulse, you need to create an IAM Role in your AWS account that grants LogPulse read access to your CloudWatch logs.

### Step 1 — Create `LogPulseReadRole` in your AWS account

1. Go to **IAM → Roles → Create role**
2. Select **Custom trust policy** and paste the following:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::LOGPULSE_ACCOUNT_ID:role/LogPulseAppRole"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "logpulse-secure-external-id"
        }
      }
    }
  ]
}
```

> Replace `LOGPULSE_ACCOUNT_ID` with the LogPulse AWS account ID (provided by the LogPulse admin).

3. Click **Next** → search and attach **`CloudWatchLogsReadOnlyAccess`**
4. Name the role: **`LogPulseReadRole`**
5. Create the role and copy its ARN — it looks like:
   ```
   arn:aws:iam::YOUR_ACCOUNT_ID:role/LogPulseReadRole
   ```

### Step 2 — Log into LogPulse

1. Open LogPulse in your browser
2. Enter your **Role ARN** from Step 1
3. Enter the **External ID:** `logpulse-secure-external-id`
4. Select your **AWS region**
5. Click **Login**

LogPulse will assume your role and gain temporary (1-hour) read-only access to your CloudWatch logs. You can revoke access at any time by deleting `LogPulseReadRole` from your AWS account.

---

## How Authentication Works

LogPulse uses AWS Cross-Account Role Assumption (`sts:AssumeRole`):

```
LogPulse Server (LogPulseAppRole)
  → calls sts:AssumeRole on your LogPulseReadRole
  → receives temporary credentials (1-hour expiry)
  → uses those credentials to read your CloudWatch logs
  → credentials are never stored — expire automatically
```

No static access keys are stored anywhere. You are in full control of access.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | Go 1.24, chi router, AWS SDK v2 |
| Auth | JWT + AWS STS Cross-Account Role Assumption |
| Log Streaming | CloudWatch Logs StartLiveTail (SSE) |
| Demo Generator | Python 3.12, AWS SAM, Lambda |
| Local Dev | Docker Compose + LocalStack |
