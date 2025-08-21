# 📧 SES Testing with Docker LocalStack

This guide shows you how to test SES email sending using Docker LocalStack (AWS mock service) and view the sent HTML content.

## 🚀 Quick Start

### 1. Start the Docker Services

```bash
# From the examples directory
cd examples
docker-compose up -d

# Wait for services to be ready
./init-localstack.sh
```

### 2. Start the NestJS Application with SES

```bash
cd nestjs-email-app
# Copy SES environment configuration
cp .env.ses .env

# Install dependencies
npm install

# Start the application
npm run start:dev
```

### 3. Test SES Email Sending

```bash
# Send test email via SES
curl http://localhost:3000/email/test-mailer/ses

# Send custom email
curl -X POST http://localhost:3000/email/order-shipped-advanced \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "mailer": "ses"}'
```

### 4. View Sent Email Content

Open the Email Viewer in your browser:
```
http://localhost:3002
```

## 🛠️ Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| **LocalStack** | 4566 | AWS services mock (SES) |
| **NestJS App** | 3000 | Your email application |
| **Email Viewer** | 3002 | View sent HTML content |
| **MailHog** | 8025 | Alternative SMTP testing UI |

## 📋 Available Endpoints

### Email Testing
- `GET /email/test-mailer/ses` - Send test email via SES
- `GET /email/test-mailer/smtp` - Send test email via SMTP
- `POST /email/order-shipped-advanced` - Send custom email
- `GET /email/info` - Get application info

### Email Viewer API
- `GET http://localhost:3002/api/emails` - List all sent emails
- `GET http://localhost:3002/api/emails/:id` - Get specific email
- `DELETE http://localhost:3002/api/emails` - Clear all emails

## 🔧 Configuration

### Environment Variables

```bash
# Transport Type
MAIL_TRANSPORT=ses          # Use SES transport

# SES Configuration
SES_ENDPOINT=http://localhost:4566  # LocalStack endpoint
SES_REGION=us-east-1               # AWS region
SES_ACCESS_KEY_ID=test             # LocalStack test key
SES_SECRET_ACCESS_KEY=test         # LocalStack test secret

# Template Engine
MAIL_TEMPLATE_ENGINE=handlebars    # Template engine to use
```

### Switching Between SMTP and SES

```bash
# Use SMTP (Ethereal Email)
MAIL_TRANSPORT=smtp

# Use SES (LocalStack)
MAIL_TRANSPORT=ses
```

## 📧 Email Content Verification

The Email Viewer service automatically captures:
- ✅ **HTML Content** - Rendered email HTML
- ✅ **Plain Text** - Text version
- ✅ **Headers** - From, To, CC, BCC, Subject
- ✅ **Metadata** - Message ID, Transport used
- ✅ **Template Data** - Order details, timestamps
- ✅ **Attachments** - File attachments (if any)

## 🔍 Debugging

### Check LocalStack Status
```bash
curl http://localhost:4566/_localstack/health
```

### Verify SES Email Addresses
```bash
aws --endpoint-url=http://localhost:4566 ses list-verified-email-addresses
```

### View LocalStack Logs
```bash
docker logs nestjs-mailable-localstack
```

### Check Email Viewer Logs
```bash
docker logs nestjs-mailable-viewer
```

## 📂 File Structure

```
examples/
├── docker-compose.yml          # Docker services configuration
├── init-localstack.sh          # LocalStack initialization script
├── email-viewer/               # Email content viewer service
│   ├── server.js               # Express server for viewing emails
│   └── package.json           # Dependencies
├── sent-emails/                # Stored email content (JSON files)
└── nestjs-email-app/          # Main NestJS application
    ├── .env.ses               # SES configuration
    └── src/
        ├── email/
        │   └── email.service.ts # Email service with viewer integration
        └── config-examples/
            └── ses.example.ts   # SES configuration example
```

## 🧪 Testing Scenarios

### 1. Basic SES Email
```bash
curl http://localhost:3000/email/test-mailer/ses
```

### 2. Custom Order Email
```bash
curl -X POST http://localhost:3000/email/order-shipped-advanced \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "mailer": "ses"
  }'
```

### 3. Different Template Engines
```bash
# Test with Handlebars
MAIL_TEMPLATE_ENGINE=handlebars npm run start:dev

# Test with EJS
MAIL_TEMPLATE_ENGINE=ejs npm run start:dev

# Test with Pug
MAIL_TEMPLATE_ENGINE=pug npm run start:dev
```

## 🐛 Troubleshooting

### SES Email Not Sending
1. Check LocalStack is running: `docker ps`
2. Verify SES service: `curl http://localhost:4566/_localstack/health`
3. Check email verification: `./init-localstack.sh`

### Email Viewer Not Working
1. Check service is running: `curl http://localhost:3002/api/emails`
2. Check Docker logs: `docker logs nestjs-mailable-viewer`
3. Verify email files: `ls examples/sent-emails/`

### Template Errors
1. Check template files exist in `src/email/templates/`
2. Verify template engine configuration
3. Check for syntax errors in template files

## 🎯 Production Setup

For production SES usage, update your configuration:

```bash
# Production SES Configuration
SES_ENDPOINT=https://email.us-east-1.amazonaws.com
SES_REGION=us-east-1
SES_ACCESS_KEY_ID=your-actual-access-key
SES_SECRET_ACCESS_KEY=your-actual-secret-key
```

Remember to:
- ✅ Verify your email addresses in AWS SES console
- ✅ Request production access (remove sandbox mode)
- ✅ Set up proper IAM permissions
- ✅ Configure SNS for bounce/complaint handling

## 🎉 Success Indicators

You know everything is working when:
- ✅ LocalStack health check shows SES as "available"
- ✅ Email endpoints return success responses
- ✅ Email Viewer shows sent emails with HTML content
- ✅ Template rendering works without errors
- ✅ Different transports (SMTP/SES) both work