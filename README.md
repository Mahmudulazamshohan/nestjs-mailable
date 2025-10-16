<div align="center">
  <h1>NestJS Mailable</h1>
  <p>Advanced mailable classes for NestJS with fluent API, multiple transports, and comprehensive template support</p>
</div>

<div align="center">

[![NPM version](https://img.shields.io/npm/v/nestjs-mailable.svg)](https://www.npmjs.com/package/nestjs-mailable)
[![License](https://img.shields.io/npm/l/nestjs-mailable.svg)](https://github.com/Mahmudulazamshohan/nestjs-mailable/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/nestjs-mailable.svg)](https://www.npmjs.com/package/nestjs-mailable)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Mahmudulazamshohan/nestjs-mailable/release.yml?branch=main)](https://github.com/Mahmudulazamshohan/nestjs-mailable/actions)
[![Documentation](https://img.shields.io/badge/docs-available-brightgreen.svg)](https://nestjs-mailable.github.io)

</div>

## Features

- **Advanced Mailable Classes** - Organized, reusable email components
- **Fluent API** - Clean, chainable interface for sending emails
- **Multiple Transports** - SMTP, Amazon SES, Mailgun, Resend support
- **Template Engines** - Handlebars, EJS, Pug with auto-detection
- **Attachment Builder** - Flexible file attachment handling
- **Easy Configuration** - Simple setup with TypeScript support
- **Testing Ready** - Built-in testing utilities

## Installation

### Basic Installation
```bash
npm install nestjs-mailable nodemailer handlebars
```

### Choose Your Transport & Template Engine

#### SMTP Transport
```bash
# With Handlebars (recommended)
npm install nestjs-mailable nodemailer handlebars

# With EJS
npm install nestjs-mailable nodemailer ejs

# With Pug
npm install nestjs-mailable nodemailer pug
```

#### Amazon SES Transport
```bash
# With Handlebars (Production AWS SES uses nodemailer SMTP)
npm install nestjs-mailable nodemailer aws-sdk handlebars

# With EJS
npm install nestjs-mailable nodemailer aws-sdk ejs

# With Pug
npm install nestjs-mailable nodemailer aws-sdk pug

# Note: aws-sdk is required for LocalStack development, nodemailer for production
```

#### Mailgun Transport
```bash
# With Handlebars
npm install nestjs-mailable mailgun.js handlebars

# With EJS
npm install nestjs-mailable mailgun.js ejs

# With Pug
npm install nestjs-mailable mailgun.js pug
```

#### Resend Transport
```bash
# With Handlebars
npm install nestjs-mailable resend handlebars

# With EJS
npm install nestjs-mailable resend ejs

# With Pug
npm install nestjs-mailable resend pug
```

### All-in-One Installation
```bash
# Install with all transports and template engines
npm install nestjs-mailable nodemailer aws-sdk mailgun.js resend handlebars ejs pug
```

## Quick Start

### 1. Module Setup

```typescript
import { Module } from '@nestjs/common';
import { MailModule, TransportType, TEMPLATE_ENGINE } from 'nestjs-mailable';

@Module({
  imports: [
    MailModule.forRoot({
      transport: {
        type: TransportType.SMTP,
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'your-email@gmail.com',
          pass: 'your-password',
        },
      },
      from: { 
        address: 'noreply@yourapp.com', 
        name: 'Your App' 
      },
      templates: {
        engine: TEMPLATE_ENGINE.HANDLEBARS,
        directory: './templates',
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Simple Email Sending

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from 'nestjs-mailable';

@Injectable()
export class NotificationService {
  constructor(private mailService: MailService) {}

  async sendWelcomeEmail(user: { name: string; email: string }) {
    await this.mailService
      .to(user.email)
      .subject('Welcome!')
      .template('welcome', { name: user.name })
      .send();
  }
}
```

## Mailable Classes

### Simple Mailable

```typescript
import { Mailable, Content } from 'nestjs-mailable';

export class WelcomeMail extends Mailable {
  constructor(private user: { name: string; email: string }) {
    super();
  }

  async build(): Promise<Content> {
    return {
      subject: `Welcome ${this.user.name}!`,
      template: 'welcome',
      context: { name: this.user.name }
    };
  }
}

// Usage
await this.mailService
  .to(user.email)
  .send(new WelcomeMail(user));
```

### Advanced Mailable

```typescript
import { 
  MailableClass as Mailable, 
  AttachmentBuilder,
  MailableEnvelope,
  MailableContent,
  MailableAttachment 
} from 'nestjs-mailable';

export class OrderShippedMail extends Mailable {
  constructor(private order: Order) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: `Order #${this.order.id} has shipped!`,
      tags: ['order', 'shipment'],
      metadata: { orderId: this.order.id }
    };
  }

  content(): MailableContent {
    return {
      template: 'orders/shipped',
      with: {
        customerName: this.order.customerName,
        orderNumber: this.order.id,
        trackingUrl: this.order.trackingUrl
      }
    };
  }

  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder
        .fromPath('./invoices/invoice.pdf')
        .as('Invoice.pdf')
        .build()
    ];
  }
}

// Usage
await this.mailService
  .to(order.customerEmail)
  .cc('sales@company.com')
  .send(new OrderShippedMail(order));
```

## Configuration Examples

### Environment-based Configuration

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        transport: {
          type: TransportType.SMTP,
          host: config.get('MAIL_HOST'),
          port: config.get('MAIL_PORT', 587),
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASS'),
          },
        },
        from: {
          address: config.get('MAIL_FROM_ADDRESS'),
          name: config.get('MAIL_FROM_NAME'),
        },
        templates: {
          engine: TEMPLATE_ENGINE.HANDLEBARS,
          directory: './templates',
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Amazon SES Configuration

The SES transport automatically uses the appropriate method based on your environment:
- **Production AWS SES**: Uses nodemailer with SMTP credentials (`email-smtp.{region}.amazonaws.com:587`)
- **LocalStack/Mock**: Uses AWS SDK when endpoint contains `localhost`, `127.0.0.1`, or `4566`

#### Production AWS SES (Recommended)
```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    host: process.env.MAIL_HOST || 'email-smtp.us-east-1.amazonaws.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    secure: process.env.MAIL_SECURE === 'true',
    credentials: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
  },
})
```

> **Note**: For production AWS SES, use SMTP credentials (`user` and `pass`) obtained from IAM user with SES sending permissions. The transport uses nodemailer SMTP which connects to `email-smtp.{region}.amazonaws.com:587` with TLS.

#### LocalStack/Mock Development
```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    endpoint: 'http://localhost:4566', // For LocalStack
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  },
  from: { address: 'test@example.com', name: 'Test App' },
})
```

### Resend Configuration

Resend offers a simple, modern API for email delivery with excellent deliverability.

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.RESEND,
    apiKey: process.env.RESEND_API_KEY,
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
  },
})
```

> **Note**: For Resend, you'll need to verify your domain at [resend.com/domains](https://resend.com/domains) and use a from address with that verified domain in production. In test mode, you can only send to your own verified email.

### Handlebars with Custom Helpers

```typescript
MailModule.forRoot({
  // ... transport config
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
    options: {
      helpers: {
        currency: (amount: number) => `$${amount.toFixed(2)}`,
        formatDate: (date: Date) => date.toLocaleDateString(),
        uppercase: (str: string) => str.toUpperCase(),
      },
    },
    partials: {
      header: './templates/partials/header',
      footer: './templates/partials/footer',
    },
  },
})
```

## Development & Testing

### Mock Servers for Development

For development and testing, you can use mock servers that simulate the email service APIs:

#### SMTP Mock Server
```bash
# Start SMTP mock server (port 1025)
node mock-ses-server.js
```

#### SES Mock Server
```bash
# Start SES mock server (port 4566)
node examples/ses-mock-server.js
```

#### Mailgun Mock Server
```bash
# Install dependencies
npm install express cors multer fs-extra

# Start Mailgun mock server (port 3001)
node mailgun-mock-server.js
```

### Docker Compose for Mock Servers

Start all mock servers with Docker:

```bash
# Start all mock servers
docker-compose -f docker-compose.mock.yml up

# Or start specific services
docker-compose -f docker-compose.mock.yml up mailgun-mock
docker-compose -f docker-compose.mock.yml up ses-mock
```

### Mock Server Configuration

Configure your application to use mock servers:

```typescript
// .env for Mailgun mock
MAIL_TRANSPORT=mailgun
MAILGUN_DOMAIN=test-domain.com
MAILGUN_API_KEY=test-api-key
MAILGUN_HOST=localhost:3001
MAILGUN_PROTOCOL=http:

// .env for SES mock
MAIL_TRANSPORT=ses
SES_ENDPOINT=http://localhost:4566
SES_REGION=us-east-1
SES_ACCESS_KEY_ID=test
SES_SECRET_ACCESS_KEY=test
```

### Testing Emails

Mock servers provide endpoints to inspect sent emails:

```bash
# List emails sent via Mailgun mock
curl http://localhost:3001/emails

# List emails sent via SES mock
curl http://localhost:4566/emails

# Get specific email details
curl http://localhost:3001/emails/EMAIL_ID
```

## Documentation

**[Full Documentation](https://mahmudulazamshohan.github.io/nestjs-mailable)** - Comprehensive guides, API reference, and examples

## Supported Transports

| Transport | Description | Status |
|-----------|-------------|--------|
| **SMTP** | Standard SMTP servers | Yes |
| **Amazon SES** | AWS Simple Email Service | Yes |
| **Mailgun** | Mailgun API | Yes |
| **Resend** | Resend API | Yes |

## Template Engines

| Engine | Extension | Helper Support | Partials |
|--------|-----------|----------------|----------|
| **Handlebars** | `.hbs` | Yes | Yes |
| **EJS** | `.ejs` | Partial | Yes |
| **Pug** | `.pug` | Partial | Yes |

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT © [NestJS Mailable](https://github.com/Mahmudulazamshohan/nestjs-mailable)

---

<div align="center">
  <sub>Built for the NestJS community</sub>
</div>