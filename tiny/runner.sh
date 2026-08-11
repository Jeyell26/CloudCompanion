#!/bin/bash
# Helper runner script to invoke tiny API Gateway endpoints using AWS SigV4 IAM authentication

API_URL="${2}"
ACTION="${1}"

if [ -z "$ACTION" ] || [ -z "$API_URL" ]; then
  echo "Usage: ./runner.sh <action> <api_url> [options]"
  echo ""
  echo "Actions:"
  echo "  upload-url    <API_URL>                     Get presigned S3 upload URL"
  echo "  upload-config <API_URL> [config.json]       Upload config.json using presigned URL"
  echo "  start         <API_URL> [log_group] [sec]   Start generating logs"
  echo "  stop          <API_URL>                     Send stop signal to background logger"
  echo ""
  echo "Example:"
  echo "  ./runner.sh start https://abc123.execute-api.us-east-1.amazonaws.com /aws/logpulse/demo 300"
  exit 1
fi

# Strip trailing slash from API_URL if present
API_URL="${API_URL%/}"

# Auto-source backend/.env if available
if [ -f "../backend/.env" ]; then
  export $(grep -v '^#' ../backend/.env | xargs) >/dev/null 2>&1
fi

# Ensure AWS credentials are set
AWS_REGION="${AWS_REGION:-us-east-1}"

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "⚠️ Warning: AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY are not set in your environment."
  echo "   Please export them in your terminal before running:"
  echo "   export AWS_ACCESS_KEY_ID=\"your_access_key\""
  echo "   export AWS_SECRET_ACCESS_KEY=\"your_secret_key\""
  echo ""
fi

case "$ACTION" in
  upload-url)
    echo "🔑 Fetching presigned upload URL from ${API_URL}/upload-url ..."
    curl --aws-sigv4 "aws:amz:${AWS_REGION}:execute-api" \
         --user "${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}" \
         "${API_URL}/upload-url"
    echo ""
    ;;

  upload-config)
    CONFIG_FILE="${3:-config.json}"
    if [ ! -f "$CONFIG_FILE" ]; then
      echo "❌ Error: Config file '$CONFIG_FILE' not found!"
      exit 1
    fi
    echo "🔑 Getting upload URL..."
    UPLOAD_RES=$(curl -s --aws-sigv4 "aws:amz:${AWS_REGION}:execute-api" \
                      --user "${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}" \
                      "${API_URL}/upload-url")
    
    # Extract upload_url from JSON response
    UPLOAD_URL=$(echo "$UPLOAD_RES" | grep -o '"upload_url": "[^"]*' | cut -d'"' -f4)

    if [ -z "$UPLOAD_URL" ]; then
      echo "❌ Failed to get upload URL: $UPLOAD_RES"
      exit 1
    fi

    echo "📤 Uploading $CONFIG_FILE to S3..."
    curl -X PUT "$UPLOAD_URL" \
         --upload-file "$CONFIG_FILE" \
         --header "Content-Type: application/json"
    echo ""
    echo "✅ Upload complete!"
    ;;

  start)
    LOG_GROUP="${3:-/aws/logpulse/demo}"
    DURATION="${4:-300}"
    echo "🚀 Starting log generator for ${DURATION}s to group '${LOG_GROUP}'..."
    curl --aws-sigv4 "aws:amz:${AWS_REGION}:execute-api" \
         --user "${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}" \
         -X POST "${API_URL}/start" \
         -H "Content-Type: application/json" \
         -d "{\"log_group\": \"${LOG_GROUP}\", \"duration_seconds\": ${DURATION}}"
    echo ""
    ;;

  stop)
    echo "🛑 Sending stop signal to ${API_URL}/stop ..."
    curl --aws-sigv4 "aws:amz:${AWS_REGION}:execute-api" \
         --user "${AWS_ACCESS_KEY_ID}:${AWS_SECRET_ACCESS_KEY}" \
         -X POST "${API_URL}/stop"
    echo ""
    ;;

  *)
    echo "❌ Unknown action: $ACTION"
    exit 1
    ;;
esac
