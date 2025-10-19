<div align="center">
  <h1>NestJS Mailable</h1>
  <p>Production-ready email handling for NestJS with Laravel-inspired mailable classes, fluent API, and enterprise-grade transport support</p>
</div>

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/nestjs-mailable.svg)](https://www.npmjs.com/package/nestjs-mailable)
[![NPM Downloads](https://img.shields.io/npm/dm/nestjs-mailable.svg)](https://www.npmjs.com/package/nestjs-mailable)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Mahmudulazamshohan/nestjs-mailable/release.yml?branch=main)](https://github.com/Mahmudulazamshohan/nestjs-mailable/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/nestjs-mailable.svg)](https://github.com/Mahmudulazamshohan/nestjs-mailable/blob/main/LICENSE)
[![Node Version](https://img.shields.io/node/v/nestjs-mailable.svg)](https://nodejs.org)

[Documentation](https://mahmudulazamshohan.github.io/nestjs-mailable) • [Getting Started](#quick-start) • [Examples](#examples) • [API Reference](#api-reference)

</div>

---

## Table of Contents

- [Why NestJS Mailable?](#why-nestjs-mailable)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Mailable Classes](#mailable-classes)
  - [Fluent API](#fluent-api)
  - [Template Engines](#template-engines)
  - [Transport Layer](#transport-layer)
- [Configuration](#configuration)
- [Advanced Usage](#advanced-usage)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)
- [Performance & Best Practices](#performance--best-practices)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

---

## Why NestJS Mailable?

NestJS Mailable brings Laravel's elegant mailable pattern to the NestJS ecosystem, providing a clean, testable, and maintainable approach to email handling in enterprise applications.

### Design Philosophy

- **Separation of Concerns**: Mailable classes encapsulate email logic, keeping controllers and services clean
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Testability**: Built-in testing utilities to verify email sending without actual delivery
- **Flexibility**: Support for multiple transports and template engines
- **Developer Experience**: Fluent API inspired by Laravel's Mail facade

### Comparison with Alternatives

| Feature | NestJS Mailable | @nestjs-modules/mailer | nodemailer |
|---------|----------------|------------------------|------------|
| Mailable Classes | Yes | No | No |
| Fluent API | Yes | Limited | No |
| Multiple Transports | SMTP, SES, Mailgun | SMTP only | SMTP only |
| Template Engines | Handlebars, EJS, Pug | Handlebars, Pug | Manual |
| Testing Utilities | Built-in | Manual | Manual |
| TypeScript First | Yes | Partial | No |
| Laravel-style API | Yes | No | No |

---

## Features

### Core Features

- **Laravel-Inspired Mailable Classes** - Organize email logic into reusable, testable components with `envelope()`, `content()`, `attachments()`, and `headers()` methods
- **Fluent API** - Chain methods for intuitive email composition: `mailService.to(email).cc(cc).bcc(bcc).send(mailable)`
- **Multiple Transport Support** - Production-ready integrations for SMTP, Amazon SES, and Mailgun with automatic failover
- **Template Engine Support** - First-class support for Handlebars, EJS, and Pug with auto-detection and extension resolution
- **Attachment Builder** - Flexible attachment handling from file paths, streams, or in-memory buffers with MIME type detection
- **Testing Utilities** - MailFake class for testing email sending without actual delivery
- **Type Safety** - Comprehensive TypeScript definitions with strict type checking
- **Async Configuration** - Dependency injection support with `forRootAsync` for dynamic configuration

### Advanced Features

- **Template Partials & Helpers** - Register custom Handlebars helpers and partials for reusable template components
- **Connection Pooling** - Automatic SMTP connection pooling for high-throughput applications
- **Dual-Mode SES** - Automatically uses nodemailer SMTP for production AWS SES or AWS SDK for LocalStack development
- **Custom Headers** - Full control over email headers including custom X-headers
- **Reply-To & CC/BCC** - Comprehensive recipient management with global defaults
- **Environment-Based Config** - Seamless integration with @nestjs/config for environment-specific settings
- **Error Handling** - Detailed error messages with transport-specific debugging information

---

## Installation

### Basic Installation

```bash
npm install nestjs-mailable
```

### Transport & Template Engine Dependencies

Install additional packages based on your requirements:

#### SMTP Transport

```bash
# SMTP with Handlebars (recommended)
npm install nodemailer handlebars

# SMTP with EJS
npm install nodemailer ejs

# SMTP with Pug
npm install nodemailer pug
```

#### Amazon SES Transport

```bash
# Production AWS SES (uses nodemailer SMTP)
npm install nodemailer aws-sdk handlebars

# LocalStack development (uses AWS SDK)
npm install aws-sdk handlebars
```

#### Mailgun Transport

```bash
# Mailgun API with Handlebars
npm install mailgun.js form-data handlebars
```

### Complete Installation

For projects using multiple transports and template engines:

```bash
npm install nestjs-mailable nodemailer aws-sdk mailgun.js form-data handlebars ejs pug
```

### Requirements

- **Node.js**: >= 20.0.0
- **NestJS**: >= 10.0.0
- **TypeScript**: >= 5.0.0

---

## Quick Start

### 1. Import MailModule

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
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      from: {
        address: 'noreply@yourapp.com',
        name: 'Your Application',
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

### 2. Create a Mailable Class

```typescript
import {
  MailableClass as Mailable,
  MailableEnvelope,
  MailableContent,
} from 'nestjs-mailable';

export class WelcomeEmail extends Mailable {
  constructor(private user: { name: string; email: string }) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: `Welcome to Our Platform, ${this.user.name}!`,
    };
  }

  content(): MailableContent {
    return {
      template: 'emails/welcome',
      with: {
        name: this.user.name,
        loginUrl: 'https://yourapp.com/login',
      },
    };
  }
}
```

### 3. Send Email

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from 'nestjs-mailable';
import { WelcomeEmail } from './emails/welcome.email';

@Injectable()
export class UserService {
  constructor(private mailService: MailService) {}

  async registerUser(userData: any) {
    const user = await this.createUser(userData);

    await this.mailService
      .to(user.email)
      .send(new WelcomeEmail(user));

    return user;
  }
}
```

### 4. Create Email Template

Create `templates/emails/welcome.hbs`:

```handlebars
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome</title>
</head>
<body>
  <h1>Welcome, {{name}}!</h1>
  <p>Thank you for joining our platform.</p>
  <a href="{{loginUrl}}">Get Started</a>
</body>
</html>
```

---

## Core Concepts

### Mailable Classes

NestJS Mailable provides two types of mailable implementations to suit different use cases:

#### Simple Mailable (Legacy)

For straightforward email composition with a single `build()` method:

```typescript
import { Mailable, Content } from 'nestjs-mailable';

export class SimpleNotification extends Mailable {
  constructor(private message: string) {
    super();
  }

  async build(): Promise<Content> {
    return {
      subject: 'Notification',
      html: `<p>${this.message}</p>`,
      text: this.message,
    };
  }
}
```

#### Advanced Mailable (Recommended)

Laravel-style mailable with separate concerns for envelope, content, attachments, and headers:

```typescript
import {
  MailableClass as Mailable,
  MailableEnvelope,
  MailableContent,
  MailableAttachment,
  MailableHeaders,
  AttachmentBuilder,
} from 'nestjs-mailable';

export class OrderShipped extends Mailable {
  constructor(private order: Order) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: `Order #${this.order.id} Shipped`,
      tags: ['order', 'shipment'],
      metadata: {
        orderId: this.order.id,
        customerId: this.order.customerId,
      },
    };
  }

  content(): MailableContent {
    return {
      template: 'orders/shipped',
      with: {
        orderNumber: this.order.id,
        customerName: this.order.customerName,
        trackingUrl: this.order.trackingUrl,
        items: this.order.items,
        total: this.order.total,
      },
    };
  }

  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder
        .fromPath(`./storage/invoices/${this.order.id}.pdf`)
        .as('Invoice.pdf')
        .withMime('application/pdf')
        .build(),
    ];
  }

  headers(): MailableHeaders {
    return {
      'X-Order-ID': this.order.id.toString(),
      'X-Customer-ID': this.order.customerId.toString(),
    };
  }
}
```

### Fluent API

The fluent API provides a clean, chainable interface for email composition:

```typescript
// Simple email
await this.mailService
  .to('user@example.com')
  .subject('Hello')
  .html('<h1>Hello World</h1>')
  .send();

// Email with multiple recipients
await this.mailService
  .to(['user1@example.com', 'user2@example.com'])
  .cc('manager@example.com')
  .bcc('archive@example.com')
  .subject('Team Update')
  .template('updates/team', { message: 'Important update' })
  .send();

// Email with mailable class
await this.mailService
  .to(user.email)
  .cc(user.manager.email)
  .send(new WelcomeEmail(user));
```

### Template Engines

NestJS Mailable supports multiple template engines with automatic extension resolution:

#### Handlebars

```typescript
// Configuration
MailModule.forRoot({
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
    partials: {
      header: './templates/partials/header',
      footer: './templates/partials/footer',
    },
    options: {
      helpers: {
        currency: (amount: number) => `$${amount.toFixed(2)}`,
        formatDate: (date: Date) => date.toLocaleDateString(),
        uppercase: (str: string) => str.toUpperCase(),
      },
    },
  },
})
```

Template (`templates/email.hbs`):

```handlebars
{{> header}}

<h1>Invoice for {{customerName}}</h1>
<p>Total: {{currency total}}</p>
<p>Date: {{formatDate invoiceDate}}</p>

{{> footer}}
```

#### EJS

```typescript
// Configuration
MailModule.forRoot({
  templates: {
    engine: TEMPLATE_ENGINE.EJS,
    directory: './templates',
    options: {
      cache: true,
      compileDebug: false,
    },
  },
})
```

Template (`templates/email.ejs`):

```ejs
<h1>Welcome, <%= name %>!</h1>
<% if (isPremium) { %>
  <p>Thank you for being a premium member!</p>
<% } %>
```

#### Pug

```typescript
// Configuration
MailModule.forRoot({
  templates: {
    engine: TEMPLATE_ENGINE.PUG,
    directory: './templates',
    options: {
      pretty: false,
      compileDebug: false,
    },
  },
})
```

Template (`templates/email.pug`):

```pug
html
  body
    h1= title
    p Welcome, #{name}!
    if isPremium
      p Thank you for being a premium member!
```

### Transport Layer

#### SMTP Transport

Standard SMTP with connection pooling:

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    pool: true, // Enable connection pooling
    maxConnections: 5,
    maxMessages: 100,
  },
})
```

#### Amazon SES Transport

Dual-mode support for production AWS SES and LocalStack development:

**Production Mode** (uses nodemailer SMTP):

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    // host: 'email-smtp.us-east-1.amazonaws.com', // Auto-generated if omitted
    port: 587,
    secure: false,
    credentials: {
      user: process.env.MAIL_USERNAME,     // SES SMTP username
      pass: process.env.MAIL_PASSWORD,     // SES SMTP password
      // Fallback to AWS SDK credentials
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
})
```

**LocalStack Mode** (uses AWS SDK):

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    endpoint: 'http://localhost:4566', // Triggers AWS SDK mode
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  },
})
```

#### Mailgun Transport

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.MAILGUN,
    options: {
      domain: 'mg.yourdomain.com',
      apiKey: process.env.MAILGUN_API_KEY,
      host: 'api.mailgun.net', // Optional: defaults to api.mailgun.net
    },
  },
})
```

---

## Configuration

### Synchronous Configuration

```typescript
import { MailModule, TransportType, TEMPLATE_ENGINE } from 'nestjs-mailable';

@Module({
  imports: [
    MailModule.forRoot({
      transport: {
        type: TransportType.SMTP,
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'username',
          pass: 'password',
        },
      },
      from: {
        address: 'noreply@example.com',
        name: 'Example App',
      },
      replyTo: {
        address: 'support@example.com',
        name: 'Support Team',
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

### Asynchronous Configuration

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule, TransportType, TEMPLATE_ENGINE } from 'nestjs-mailable';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          type: configService.get('MAIL_TRANSPORT') as TransportType,
          host: configService.get('MAIL_HOST'),
          port: configService.get('MAIL_PORT', 587),
          secure: configService.get('MAIL_SECURE', false),
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASS'),
          },
        },
        from: {
          address: configService.get('MAIL_FROM_ADDRESS'),
          name: configService.get('MAIL_FROM_NAME'),
        },
        templates: {
          engine: TEMPLATE_ENGINE.HANDLEBARS,
          directory: path.join(__dirname, '../templates'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Environment Variables

Create a `.env` file:

```env
# Transport Configuration
MAIL_TRANSPORT=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-password

# Sender Configuration
MAIL_FROM_ADDRESS=noreply@yourapp.com
MAIL_FROM_NAME=Your Application

# AWS SES Configuration (Production)
MAIL_USERNAME=your-ses-smtp-username
MAIL_PASSWORD=your-ses-smtp-password
SES_REGION=us-east-1

# Mailgun Configuration
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_API_KEY=your-mailgun-api-key
```

---

## Advanced Usage

### Attachment Handling

```typescript
import { AttachmentBuilder } from 'nestjs-mailable';

// From file path
const attachment1 = AttachmentBuilder
  .fromPath('./documents/report.pdf')
  .as('Monthly_Report.pdf')
  .withMime('application/pdf')
  .build();

// From buffer
const attachment2 = AttachmentBuilder
  .fromBuffer(buffer, 'image.png')
  .withMime('image/png')
  .build();

// Inline image
const attachment3 = AttachmentBuilder
  .fromPath('./logo.png')
  .as('logo.png')
  .inline('logo')
  .build();

// Usage in mailable
export class ReportEmail extends Mailable {
  attachments(): MailableAttachment[] {
    return [attachment1, attachment2, attachment3];
  }
}
```

### Custom Headers

```typescript
export class CustomEmail extends Mailable {
  headers(): MailableHeaders {
    return {
      'X-Priority': '1',
      'X-Mailer': 'NestJS Mailable',
      'X-Custom-Header': 'custom-value',
    };
  }
}
```

### Dynamic Template Selection

```typescript
export class DynamicEmail extends Mailable {
  constructor(
    private user: User,
    private locale: string,
  ) {
    super();
  }

  content(): MailableContent {
    const templatePath = `emails/${this.locale}/welcome`;

    return {
      template: templatePath,
      with: {
        name: this.user.name,
        locale: this.locale,
      },
    };
  }
}
```

### Conditional Content

```typescript
export class ConditionalEmail extends Mailable {
  constructor(
    private user: User,
    private includePromotion: boolean,
  ) {
    super();
  }

  content(): MailableContent {
    const data: any = {
      name: this.user.name,
      email: this.user.email,
    };

    if (this.includePromotion) {
      data.promotion = {
        code: 'WELCOME20',
        discount: 20,
      };
    }

    return {
      template: 'emails/marketing',
      with: data,
    };
  }
}
```

---

## Testing

### Using MailFake

NestJS Mailable provides a built-in testing utility to verify email sending without actual delivery:

```typescript
import { Test } from '@nestjs/testing';
import { MailService } from 'nestjs-mailable';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;
  let mailService: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, MailService],
    }).compile();

    userService = module.get<UserService>(UserService);
    mailService = module.get<MailService>(MailService);

    // Enable fake mode
    mailService.fake();
  });

  it('should send welcome email on registration', async () => {
    const user = { name: 'John', email: 'john@example.com' };

    await userService.registerUser(user);

    // Verify email was sent
    expect(mailService.hasSent(WelcomeEmail)).toBe(true);

    // Verify email was sent to specific recipient
    expect(mailService.hasSentTo(user.email)).toBe(true);

    // Get sent emails
    const sentEmails = mailService.getSent();
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toContain(user.email);
  });

  afterEach(() => {
    // Clear sent emails
    mailService.clearSent();
  });
});
```

### Integration Testing

```typescript
describe('Email Integration', () => {
  let app: INestApplication;
  let mailService: MailService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        MailModule.forRoot({
          transport: {
            type: TransportType.SMTP,
            host: 'localhost',
            port: 1025, // MailHog or similar SMTP mock
            ignoreTLS: true,
          },
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    mailService = module.get<MailService>(MailService);
  });

  it('should send email through mock SMTP server', async () => {
    await mailService
      .to('test@example.com')
      .subject('Test Email')
      .html('<h1>Test</h1>')
      .send();

    // Verify email was sent (implementation depends on mock server)
  });

  afterAll(async () => {
    await app.close();
  });
});
```

---

## API Reference

### MailService

The primary service for sending emails.

#### Methods

##### `to(recipients: string | string[] | Address | Address[]): MailSender`

Set email recipients.

```typescript
mailService.to('user@example.com')
mailService.to(['user1@example.com', 'user2@example.com'])
mailService.to({ name: 'John Doe', address: 'john@example.com' })
```

##### `cc(recipients: string | string[] | Address | Address[]): MailSender`

Set CC recipients.

##### `bcc(recipients: string | string[] | Address | Address[]): MailSender`

Set BCC recipients.

##### `from(address: string | Address): MailSender`

Override default sender address.

##### `replyTo(address: string | Address): MailSender`

Set reply-to address.

##### `subject(subject: string): MailSender`

Set email subject.

##### `html(content: string): MailSender`

Set HTML content.

##### `text(content: string): MailSender`

Set plain text content.

##### `template(name: string, context?: Record<string, any>): MailSender`

Use template with context data.

##### `send(mailable?: Mailable): Promise<unknown>`

Send the email.

### Mailable Class

Base class for creating mailable components.

#### Methods

##### `envelope(): MailableEnvelope`

Define email metadata (subject, tags, metadata).

##### `content(): MailableContent`

Define email content (template, HTML, text).

##### `attachments(): MailableAttachment[]`

Define email attachments.

##### `headers(): MailableHeaders`

Define custom email headers.

### AttachmentBuilder

Fluent builder for creating email attachments.

#### Static Methods

##### `fromPath(path: string): AttachmentBuilder`

Create attachment from file path.

##### `fromBuffer(buffer: Buffer, filename: string): AttachmentBuilder`

Create attachment from buffer.

#### Instance Methods

##### `as(filename: string): AttachmentBuilder`

Set attachment filename.

##### `withMime(mimeType: string): AttachmentBuilder`

Set MIME type.

##### `inline(cid: string): AttachmentBuilder`

Mark as inline attachment with content ID.

##### `build(): MailableAttachment`

Build the attachment object.

---

## Migration Guide

### From @nestjs-modules/mailer

```typescript
// Before (@nestjs-modules/mailer)
await this.mailerService.sendMail({
  to: user.email,
  subject: 'Welcome',
  template: './welcome',
  context: { name: user.name },
});

// After (nestjs-mailable)
await this.mailService
  .to(user.email)
  .subject('Welcome')
  .template('welcome', { name: user.name })
  .send();

// Or with mailable class
await this.mailService
  .to(user.email)
  .send(new WelcomeEmail(user));
```

### From nodemailer

```typescript
// Before (nodemailer)
const transporter = nodemailer.createTransport(config);
await transporter.sendMail({
  from: 'noreply@app.com',
  to: user.email,
  subject: 'Welcome',
  html: '<h1>Welcome</h1>',
});

// After (nestjs-mailable)
await this.mailService
  .to(user.email)
  .subject('Welcome')
  .html('<h1>Welcome</h1>')
  .send();
```

---

## Troubleshooting

### Common Issues

#### Template Engine Not Found

**Error**: `Handlebars template engine is not available`

**Solution**: Install the template engine package:

```bash
npm install handlebars
# or
npm install ejs
# or
npm install pug
```

#### SMTP Connection Timeout

**Error**: `Connection timeout`

**Solution**: Verify SMTP server settings:

- Check host and port are correct
- Verify firewall allows outbound connections on SMTP port
- For Gmail, enable "Less secure app access" or use App Password
- Use `secure: true` for port 465, `secure: false` for port 587

#### AWS SES Authentication Failed

**Error**: `Invalid login: 535 Authentication Credentials Invalid`

**Solution**:

For production AWS SES:
- Verify you're using SES SMTP credentials (not regular AWS credentials)
- Generate SMTP credentials from AWS SES Console → SMTP Settings
- Ensure IAM user has `ses:SendEmail` and `ses:SendRawEmail` permissions
- Verify email address or domain is verified in AWS SES
- Check region matches SMTP endpoint

For LocalStack:
- Ensure endpoint is set to `http://localhost:4566`
- No email verification needed for LocalStack

#### Template Not Found

**Error**: `Failed to load template file 'welcome'`

**Solution**:

- Verify template directory path is correct
- Check template file extension matches engine (`.hbs`, `.ejs`, `.pug`)
- Use relative or absolute paths consistently
- Ensure template files are included in build output

#### Mailgun API Error

**Error**: `Mailgun API returned 401: Unauthorized`

**Solution**:

- Verify API key is correct (format: `key-xxxxxxxxx`)
- Check domain is configured in Mailgun dashboard
- Ensure sender email matches verified domain

---

## Performance & Best Practices

### Connection Pooling

Enable SMTP connection pooling for high-throughput applications:

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000, // milliseconds
    rateLimit: 5, // messages per rateDelta
  },
})
```

### Template Caching

Template engines cache compiled templates by default. For production:

```typescript
MailModule.forRoot({
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    options: {
      cache: true, // Enable template caching
    },
  },
})
```

### Async Email Sending

For non-critical emails, consider using a queue system:

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async sendWelcomeEmail(user: User) {
    await this.emailQueue.add('welcome', {
      email: user.email,
      name: user.name,
    });
  }
}
```

### Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Validate email addresses** - Sanitize user input before sending
3. **Rate limiting** - Implement rate limits to prevent abuse
4. **Use TLS** - Always use secure connections for production
5. **Rotate credentials** - Regularly rotate SMTP/API credentials
6. **Monitor sending** - Track bounce rates and spam complaints

### Resource Management

```typescript
// Properly close connections on application shutdown
import { OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class AppService implements OnModuleDestroy {
  constructor(private mailService: MailService) {}

  async onModuleDestroy() {
    await this.mailService.close();
  }
}
```

---

## Examples

Complete working examples are available in the [examples directory](https://github.com/Mahmudulazamshohan/nestjs-mailable/tree/main/examples):

- **Basic NestJS Integration** - Simple email sending setup
- **Multiple Transports** - Switching between SMTP, SES, and Mailgun
- **Template Engines** - Using Handlebars, EJS, and Pug
- **Mailable Classes** - Advanced mailable implementations
- **Testing Patterns** - Unit and integration testing examples
- **Queue Integration** - Async email sending with Bull

---

## Contributing

We welcome contributions from the community! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code of Conduct
- Development setup
- Submitting pull requests
- Reporting bugs
- Suggesting features

### Development Setup

```bash
# Clone repository
git clone https://github.com/Mahmudulazamshohan/nestjs-mailable.git
cd nestjs-mailable

# Install dependencies
yarn install

# Run tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run linter
yarn lint

# Build package
yarn build
```

### Running Tests

```bash
# Unit tests
yarn test

# Test coverage
yarn test:coverage

# Type checking
yarn typecheck
```

---

## Support

### Documentation

- [Official Documentation](https://mahmudulazamshohan.github.io/nestjs-mailable)
- [API Reference](https://mahmudulazamshohan.github.io/nestjs-mailable/api)
- [Examples](https://github.com/Mahmudulazamshohan/nestjs-mailable/tree/main/examples)

### Community

- [GitHub Issues](https://github.com/Mahmudulazamshohan/nestjs-mailable/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/Mahmudulazamshohan/nestjs-mailable/discussions) - Questions and discussions
- [Stack Overflow](https://stackoverflow.com/questions/tagged/nestjs-mailable) - Tag your questions with `nestjs-mailable`

### Professional Support

For enterprise support, custom integrations, or consulting services, please contact the maintainers through GitHub.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history and migration notes.

---

## License

MIT License - see [LICENSE](./LICENSE) file for details.

Copyright (c) 2024 NestJS Mailable

---

<div align="center">
  <sub>Built with TypeScript for the NestJS community</sub>
</div>
