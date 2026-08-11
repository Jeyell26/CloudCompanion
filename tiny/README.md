# Tiny Log Generator (AWS Lambda + API Gateway + S3 + CloudWatch)

Lightweight on-demand CloudWatch log generator for LogPulse portfolio demos. Protected via **AWS IAM (SigV4)** authentication.

---

## 🚀 1-Click Deployment

```bash
cd /home/jeyell/CloudApp/tiny
sam build && sam deploy --guided
```

---

## 🔐 Calling Endpoints with AWS IAM SigV4 (`curl`)

Since the API Gateway is protected with **`AWS_IAM`** authentication, `curl` commands must include `--aws-sigv4`:

### 1. Get Presigned S3 Upload URL
```bash
curl --aws-sigv4 "aws:amz:us-east-1:execute-api" \
     --user "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" \
     "https://<YOUR_API_ID>.execute-api.us-east-1.amazonaws.com/upload-url"
```

### 2. Upload Custom `config.json` to S3
```bash
curl -X PUT "<presigned_upload_url>" \
     --upload-file config.json \
     --header "Content-Type: application/json"
```

### 3. Start Generating Logs
```bash
curl --aws-sigv4 "aws:amz:us-east-1:execute-api" \
     --user "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" \
     -X POST "https://<YOUR_API_ID>.execute-api.us-east-1.amazonaws.com/start" \
     -H "Content-Type: application/json" \
     -d '{"log_group": "/aws/logpulse/demo", "duration_seconds": 300}'
```

### 4. Stop Logging Early
```bash
curl --aws-sigv4 "aws:amz:us-east-1:execute-api" \
     --user "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" \
     -X POST "https://<YOUR_API_ID>.execute-api.us-east-1.amazonaws.com/stop"
```
