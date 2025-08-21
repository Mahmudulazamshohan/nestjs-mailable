#!/bin/bash

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack to be ready..."
until curl -s http://localhost:4566/_localstack/health | grep -q '"ses": "available"'; do
  echo "Waiting for SES service..."
  sleep 2
done

echo "✅ LocalStack is ready!"

# Configure AWS CLI to use LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Verify email addresses in SES
echo "📧 Setting up SES email addresses..."

# Verify sender email
aws --endpoint-url=http://localhost:4566 ses verify-email-identity --email-address noreply@yourapp.com
aws --endpoint-url=http://localhost:4566 ses verify-email-identity --email-address support@yourapp.com

# Verify recipient emails
aws --endpoint-url=http://localhost:4566 ses verify-email-identity --email-address test@example.com
aws --endpoint-url=http://localhost:4566 ses verify-email-identity --email-address test@yourapp.com
aws --endpoint-url=http://localhost:4566 ses verify-email-identity --email-address logs@yourapp.com

# Put SES in sandbox mode (allows sending to verified emails only)
aws --endpoint-url=http://localhost:4566 ses put-account-sending-enabled --enabled

echo "✅ SES setup complete!"

# List verified email addresses
echo "📋 Verified email addresses:"
aws --endpoint-url=http://localhost:4566 ses list-verified-email-addresses

# Set up SES configuration set for tracking
echo "⚙️  Setting up SES configuration..."
aws --endpoint-url=http://localhost:4566 ses create-configuration-set --configuration-set Name=nestjs-mailable-config

echo "🎉 LocalStack SES setup is complete!"
echo "🌐 SES endpoint: http://localhost:4566"
echo "🔑 Access Key: test"
echo "🔐 Secret Key: test"
echo "📍 Region: us-east-1"