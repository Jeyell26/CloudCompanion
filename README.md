# CloudCompanion — LogPulse

A full-stack AWS CloudWatch log management SaaS built to showcase cross-account IAM role assumption, real-time log streaming, and modern cloud deployment pipelines.

[![Demo Video](https://img.shields.io/badge/Video-Watch_Live_AWS_Demo-blue?style=for-the-badge&logo=youtube)](#-demo--showcase)
[![GitHub Pages App](https://img.shields.io/badge/Live_App-Try_Interactive_Demo-success?style=for-the-badge&logo=github)](https://jeyell26.github.io/CloudCompanion/)
[![EC2 AWS App](https://img.shields.io/badge/Production_App-Live_on_AWS_EC2-orange?style=for-the-badge&logo=amazonaws)](http://3.89.224.215)

---

## 🎬 Demo & Showcase

LogPulse is available across **three access points**:

| Showcase Type | Description | Link |
|---|---|---|
| **Video Demo Walkthrough** | *TODO*
| **Interactive Demo (GitHub Pages)** | Zero-cost, zero-install hosted web app running in Mock Mode for instant browser testing | [Try Hosted Demo](https://jeyell26.github.io/CloudCompanion/) |
| **Live Production App (AWS EC2)** | Self-hosted production deployment connected to real AWS CloudWatch infrastructure | [Open EC2 App](http://3.89.224.215) |

---

## How to Use & Explore LogPulse

---

### Option 1: Try the Live Interactive Web App (GitHub Pages - No AWS Account Needed)
*Best for recruiters, interviewers, and reviewers who want to test the UI immediately.*

Visit [https://jeyell26.github.io/CloudCompanion/](https://jeyell26.github.io/CloudCompanion/).

1. Click the **"Fill Mock Role ARN"** button on the login screen.
2. Click **Login**.
3. Select any log group to experience real-time streaming, date/time filtering, log normalization, and pattern tracking with mock datasets.

---

### Option 2: Connect Your Own AWS Account to LogPulse (AWS EC2)
*Best for users who want to monitor real AWS CloudWatch logs using Cross-Account IAM Role Assumption.*

Visit [http://3.89.224.215](http://3.89.224.215) (or your self-hosted instance).

#### Step 1 — Create `LogPulseReadRole` in your AWS Account
1. Open **AWS Console → IAM → Roles → Create role**.
2. Select **Custom trust policy** and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<LOGPULSE_AWS_ACCOUNT_ID>:role/LogPulseAppRole"
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

3. Attach managed policy: **`CloudWatchLogsReadOnlyAccess`**.
4. Name the role: **`LogPulseReadRole`**.
5. Copy the generated Role ARN (`arn:aws:iam::YOUR_ACCOUNT_ID:role/LogPulseReadRole`).

#### Step 2 — Log In
1. Open [http://3.89.224.215](http://3.89.224.215).
2. Enter your **Role ARN** & **External ID:** `logpulse-secure-external-id`.
3. Select your AWS Region and click **Login**.

---

### Option 3: Self-Host LogPulse (On Your Own AWS or LocalStack)
*Best for developers or organizations deploying their own instance.*

#### A. Run Locally with LocalStack (Zero AWS Cost)
```bash
# 1. Clone repository
git clone https://github.com/Jeyell26/CloudCompanion.git
cd CloudCompanion

# 2. Start LocalStack mock environment
docker-compose up -d

# 3. Start Backend & Frontend
cd backend && go run cmd/server/main.go &
cd frontend && npm run dev
```

#### B. Deploy to AWS EC2 (CloudFormation + Makefile)
```bash
cd pipeline
# Edit log-pulse.yaml / Makefile parameters if needed, then run:
make all
```

---

## How Authentication Works

LogPulse implements gold-standard AWS Cross-Account IAM Role Assumption (`sts:AssumeRole`):

```
LogPulse Server (LogPulseAppRole)
  ├── 1. User submits Role ARN + External ID
  ├── 2. Calls sts:AssumeRole(UserRoleARN)
  ├── 3. Receives temporary 1-hour session credentials
  └── 4. Queries CloudWatch Logs on behalf of user
```

- **Zero Static Keys:** No `AKIA...` access keys are stored or transmitted.
- **Short-Lived Sessions:** Tokens automatically expire after 1 hour.
- **Instant Revocation:** Delete `LogPulseReadRole` in your AWS account at any time to instantly revoke LogPulse access.

---


## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Vanilla CSS |
| Backend | Go 1.24, chi router, golang-jwt/v5, AWS SDK v2 |
| Auth & Security | AWS STS Cross-Account Role Assumption (`sts:AssumeRole`) |
| Real-Time Streaming | CloudWatch Logs `StartLiveTail` (Server-Sent Events) |
| Demo Log Generator | Python 3.12, AWS SAM (Lambda + API Gateway + S3) |
| Infrastructure | CloudFormation (`log-pulse.yaml`) + Makefile + Nginx |
| Hosting & CI/CD | GitHub Actions + GitHub Pages / AWS EC2 |
