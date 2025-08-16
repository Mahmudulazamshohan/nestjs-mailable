# NestJS Mailable Examples

This directory contains comprehensive examples showcasing all features of the NestJS Mailable package. All examples are provided as single TypeScript files for easy understanding and testing.

## Examples Overview

### 📚 Complete Examples (Recommended Start Here)
- **`all-examples.ts`** - Comprehensive example showing ALL features in one file
- **`test-examples.ts`** - Test suite demonstrating how to test email functionality

### 🚀 Basic Examples (Simple to Advanced)
1. **`basic-setup.ts`** - Basic setup and simple email sending
2. **`templates.ts`** - Template engines (EJS, Handlebars, Pug) and rendering
3. **`attachments.ts`** - File attachments, inline images, and data attachments
4. **`providers.ts`** - Multiple transport providers (SMTP, SES, Mailgun) with failover
5. **`advanced.ts`** - Advanced features like queuing, bulk emails, testing, and error handling

## Quick Start

```bash
# Install dependencies
npm install

# Run all examples (comprehensive demo)
npm start

# Run specific examples
npm run start:basic
npm run start:templates
npm run start:attachments
npm run start:providers
npm run start:advanced

# Run test suite
npm test
```

## Features Demonstrated

### ✉️ Basic Email Operations
- Simple text emails
- HTML emails  
- Mailable classes with fluent API
- Template rendering
- Attachment handling

### 🎨 Template Engines
- EJS templates
- Handlebars templates  
- Pug templates
- Inline templates
- Template context and variables

### 📎 Attachments
- File attachments from disk
- Buffer/data attachments
- Inline images with CID
- Multiple attachments
- Dynamic attachment generation

### 🔄 Multi-Provider Support
- SMTP configuration
- AWS SES integration
- Mailgun integration
- Provider failover
- Async configuration

### 🚀 Advanced Features
- Email queuing with retry logic
- Bulk email campaigns with rate limiting
- Test mode for development
- Email assertions for testing
- Performance monitoring
- Error handling and logging

## Requirements

- Node.js 16+
- NestJS 10+
- TypeScript 5+

## Configuration

Each example uses mock SMTP configuration. To use with real email providers:

1. **SMTP (Gmail example):**
   ```typescript
   {
     transport: 'smtp',
     host: 'smtp.gmail.com',
     port: 587,
     secure: false,
     auth: {
       user: 'your-email@gmail.com',
       pass: 'your-app-password',
     },
   }
   ```

2. **AWS SES:**
   ```typescript
   {
     transport: 'ses',
     options: {
       accessKeyId: 'your-access-key',
       secretAccessKey: 'your-secret-key',
       region: 'us-east-1',
     },
   }
   ```

3. **Mailgun:**
   ```typescript
   {
     transport: 'mailgun',
     options: {
       apiKey: 'your-mailgun-api-key',
       domain: 'your-domain.com',
     },
   }
   ```

## Testing

The examples include a comprehensive test suite that demonstrates:
- Email capture in test mode
- Assertions for email content
- Queue functionality testing
- Bulk email testing
- Error handling verification

Run tests with: `npm test`

## Architecture

All examples follow NestJS best practices:
- Dependency injection
- Module configuration
- Service-based architecture
- Proper error handling
- Logging and monitoring