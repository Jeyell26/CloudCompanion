# =============================================================================
# LogPulse Deployment Makefile
# Usage: make all
# =============================================================================

# ---------------------------------------------------------------------------
# Config — edit these variables before running
# ---------------------------------------------------------------------------
STACK_NAME    = logpulse-stack
REGION        = us-east-1
TEMPLATE      = log-pulse.yaml

KEY_PAIR      = logpulse-key
KEY_FILE      = ~/.ssh/logpulse-key.pem
INSTANCE_TYPE = t3.micro
IAM_PROFILE   = LogPulseAppRole
BACKEND_PORT  = 5000

FRONTEND_DIR  = ../frontend
BACKEND_DIR   = ../backend
BIN_DIR       = ../bin
BINARY_NAME   = logpulse-backend

JWT_SECRET    = change-this-to-a-secure-secret  # Run: openssl rand -hex 64
JWT_EXPIRES   = 8
CORS_ORIGIN   = *

# ---------------------------------------------------------------------------
# Internal — resolved from CloudFormation outputs (do not edit)
# ---------------------------------------------------------------------------
EC2_IP = $(shell aws cloudformation describe-stacks \
	--stack-name $(STACK_NAME) \
	--region $(REGION) \
	--query "Stacks[0].Outputs[?OutputKey=='PublicIP'].OutputValue" \
	--output text 2>/dev/null)

SSH       = ssh -i $(KEY_FILE) -o StrictHostKeyChecking=no ubuntu@$(EC2_IP)
SCP       = scp -i $(KEY_FILE) -o StrictHostKeyChecking=no

# ---------------------------------------------------------------------------
# Targets
# ---------------------------------------------------------------------------
.PHONY: all ec2-launch build build-frontend build-backend \
        deploy deploy-frontend deploy-backend \
        clean ip ssh logs restart-backend restart-frontend

## ── Full deployment ─────────────────────────────────────────────────────────

# Deploy everything: launch EC2, build both, deploy both
all: ec2-launch build deploy
	@echo ""
	@echo "LogPulse is live at http://$(EC2_IP)"

## ── Step 1: Infrastructure ──────────────────────────────────────────────────

# Deploy CloudFormation stack (creates EC2 + Security Group)
ec2-launch:
	@echo "Deploying CloudFormation stack '$(STACK_NAME)'..."
	@aws cloudformation deploy \
		--template-file $(TEMPLATE) \
		--stack-name $(STACK_NAME) \
		--region $(REGION) \
		--capabilities CAPABILITY_NAMED_IAM \
		--parameter-overrides \
			KeyPairName=$(KEY_PAIR) \
			InstanceType=$(INSTANCE_TYPE) \
			IAMInstanceProfile=$(IAM_PROFILE) \
			BackendPort=$(BACKEND_PORT)
	@echo "Stack deployed. EC2 IP: $(EC2_IP)"

## ── Step 2: Build ───────────────────────────────────────────────────────────

# Build both frontend and backend
build: build-frontend build-backend

# Build React production bundle → frontend/dist/
build-frontend:
	@echo "Building frontend..."
	@cd $(FRONTEND_DIR) && npm install --silent && npm run build
	@echo "Frontend built → $(FRONTEND_DIR)/dist/"

# Cross-compile Go backend binary for Linux amd64 → bin/logpulse-backend
build-backend:
	@echo "Building backend..."
	@mkdir -p $(BIN_DIR)
	@cd $(BACKEND_DIR) && GOOS=linux GOARCH=amd64 go build -o ../bin/$(BINARY_NAME) ./cmd/server
	@echo "Backend built → $(BIN_DIR)/$(BINARY_NAME)"

## ── Step 3: Deploy ──────────────────────────────────────────────────────────

# Deploy both frontend and backend to EC2
deploy: deploy-backend deploy-frontend

# Deploy Go binary + systemd service to EC2 and restart backend service
deploy-backend:
	@echo "📦  Deploying backend to $(EC2_IP)..."
	@$(SCP) $(BIN_DIR)/$(BINARY_NAME) ubuntu@$(EC2_IP):/tmp/$(BINARY_NAME)
	@$(SSH) " \
		sudo mkdir -p /opt/logpulse && \
		sudo mv /tmp/$(BINARY_NAME) /opt/logpulse/$(BINARY_NAME) && \
		sudo chmod +x /opt/logpulse/$(BINARY_NAME) && \
		printf 'PORT=$(BACKEND_PORT)\nJWT_SECRET=$(JWT_SECRET)\nJWT_EXPIRES_HOURS=$(JWT_EXPIRES)\nAWS_REGION=$(REGION)\nAWS_ENDPOINT=\nCORS_ORIGIN=$(CORS_ORIGIN)\n' | sudo tee /opt/logpulse/.env > /dev/null && \
		printf '[Unit]\nDescription=LogPulse Backend Service\nAfter=network.target\n\n[Service]\nType=simple\nUser=ubuntu\nWorkingDirectory=/opt/logpulse\nEnvironmentFile=/opt/logpulse/.env\nExecStart=/opt/logpulse/$(BINARY_NAME)\nRestart=on-failure\nRestartSec=5s\n\n[Install]\nWantedBy=multi-user.target\n' | sudo tee /etc/systemd/system/logpulse.service > /dev/null && \
		sudo systemctl daemon-reload && \
		sudo systemctl enable logpulse && \
		sudo systemctl restart logpulse \
	"
	@echo "✅  Backend deployed and running."

# Deploy React dist/ to EC2 and reload Nginx
deploy-frontend:
	@echo "Deploying frontend to $(EC2_IP)..."
	@$(SSH) "sudo mkdir -p /var/www/logpulse && sudo apt-get install -y nginx -qq && sudo systemctl enable nginx"
	@$(SCP) -r $(FRONTEND_DIR)/dist ubuntu@$(EC2_IP):/tmp/logpulse-dist
	@$(SSH) " \
		sudo rm -rf /var/www/logpulse/dist && \
		sudo mv /tmp/logpulse-dist /var/www/logpulse/dist && \
		sudo chown -R www-data:www-data /var/www/logpulse && \
		sudo tee /etc/nginx/sites-available/logpulse > /dev/null <<'NGINX'\n\
limit_req_zone \$$binary_remote_addr zone=logpulse_api:10m rate=10r/s;\n\
limit_conn_zone \$$binary_remote_addr zone=logpulse_conn:10m;\n\
server {\n\
    listen 80;\n\
    server_name _;\n\
    location / {\n\
        root /var/www/logpulse/dist;\n\
        index index.html;\n\
        try_files \$$uri \$$uri/ /index.html;\n\
    }\n\
    location /api/ {\n\
        limit_req zone=logpulse_api burst=20 nodelay;\n\
        limit_conn logpulse_conn 5;\n\
        proxy_pass http://127.0.0.1:$(BACKEND_PORT);\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Host \$$host;\n\
        proxy_set_header X-Real-IP \$$remote_addr;\n\
        proxy_buffering off;\n\
        proxy_cache off;\n\
    }\n\
}\n\
NGINX\n\
		sudo ln -sf /etc/nginx/sites-available/logpulse /etc/nginx/sites-enabled/logpulse && \
		sudo rm -f /etc/nginx/sites-enabled/default && \
		sudo nginx -t && \
		sudo systemctl reload nginx \
	"
	@echo " Frontend deployed and Nginx reloaded."

## ── Utilities ───────────────────────────────────────────────────────────────

# Print the public IP of the running LogPulse EC2 instance
ip:
	@echo "LogPulse EC2 IP: $(EC2_IP)"

# SSH directly into the LogPulse EC2 instance
ssh:
	@$(SSH)

# Tail live backend logs from EC2
logs:
	@$(SSH) "sudo journalctl -u logpulse -f"

# Restart only the Go backend service on EC2 (no redeploy)
restart-backend:
	@$(SSH) "sudo systemctl restart logpulse"
	@echo "Backend restarted."

# Reload only Nginx on EC2 (no redeploy)
restart-frontend:
	@$(SSH) "sudo systemctl reload nginx"
	@echo "Nginx reloaded."

# Remove local build artifacts
clean:
	@rm -rf $(BIN_DIR)
	@cd $(FRONTEND_DIR) && rm -rf dist
	@echo "Cleaned build artifacts."

# Tear down the entire CloudFormation stack (destroys EC2 + Security Group)
destroy:
	@echo "Destroying CloudFormation stack '$(STACK_NAME)'..."
	@aws cloudformation delete-stack --stack-name $(STACK_NAME) --region $(REGION)
	@aws cloudformation wait stack-delete-complete --stack-name $(STACK_NAME) --region $(REGION)
	@echo "Stack destroyed."
