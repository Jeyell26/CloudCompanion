#!/bin/bash
set -e

STACK_NAME="logpulse-app"
REGION="us-east-1"

echo "=== LogPulse Tiny Generator Deployment ==="

# Check if CloudFormation stack exists and is in ROLLBACK_FAILED state
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].StackStatus" --output text 2>/dev/null || echo "DOES_NOT_EXIST")

if [ "$STACK_STATUS" = "ROLLBACK_FAILED" ] || [ "$STACK_STATUS" = "ROLLBACK_COMPLETE" ]; then
  echo "Stack '$STACK_NAME' is in $STACK_STATUS state. Deleting stack before redeploying..."
  aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$REGION"
  echo "Waiting for stack deletion to complete..."
  aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$REGION"
  echo "Stack '$STACK_NAME' deleted successfully."
fi

# Build SAM application
echo "Building SAM application..."
sam build

# Deploy using samconfig.toml if present, otherwise guided
if [ -f "samconfig.toml" ]; then
  echo "Deploying using existing samconfig.toml..."
  sam deploy
else
  echo "samconfig.toml not found. Starting guided deployment..."
  sam deploy --guided
fi

API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text 2>/dev/null || echo "None")

if [ -n "$API_URL" ] && [ "$API_URL" != "None" ]; then
  echo "$API_URL" > .api_url
  echo "Saved API URL to .api_url: $API_URL"
fi

echo "=== Deployment Completed Successfully ==="
