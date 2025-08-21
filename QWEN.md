# nestjs-mailable - Qwen Code Context

## Project Overview

**nestjs-mailable** is a comprehensive NestJS mail package that brings Laravel-style mailable functionality to NestJS applications with robust design patterns. It's designed to be a feature-rich, enterprise-grade email solution with support for multiple transports, template engines, and advanced email composition capabilities.

### Key Features

- **Laravel-Style Mailables**: Advanced mailable classes with envelope, content, attachments, and headers methods
- **Fluent API**: Familiar and intuitive interface with method chaining
- **Design Patterns**: Implements Factory, Builder, and Strategy patterns for extensibility
- **Multiple Transports**: Supports SMTP, Amazon SES, and Mailgun out of the box
- **Template Engines**: Supports Handlebars, EJS, Pug, and MJML with auto-detection
- **Attachment Builder**: Fluent attachment creation from paths, storage, or in-memory data
- **Testing Utilities**: Comprehensive testing helpers with MailFake for easy unit testing
- **Failover Support**: Multiple transport strategies for high availability
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Extensible Architecture**: Easy to extend with custom transports and template engines

## Project Structure

```
nestjs-mailable/
├── src/
│   ├── builders/           # Builder pattern implementations
│   ├── classes/            # Mailable class implementations
│   ├── engines/            # Template engine implementations
│   ├── factories/          # Factory pattern implementations
│   ├── interfaces/         # TypeScript interfaces
│   ├── mailables/          # Mailable base classes
│   ├── services/           # Core services (mail, config, template)
│   ├── transports/         # Transport implementations (SMTP, SES, Mailgun)
│   ├── types/              # TypeScript types
│   ├── index.ts            # Main entry point
│   └── mail.module.ts      # Main module
├── docs/                  # Documentation site
├── examples/              # Example implementations
├── templates/             # Default template files
└── package.json           # Project configuration
```

## Installation

```bash
# Using npm
npm install nestjs-mailable nodemailer handlebars ejs pug mjml

# Using yarn
yarn add nestjs-mailable nodemailer handlebars ejs pug mjml
```

## Quick Start

### Module Configuration

```typescript
import { Module } from '@nestjs/common';
import { MailModule } from 'nestjs-mailable';

@Module({
  imports: [
    MailModule.forRoot({
      config: {
        default: 'smtp',
        mailers: {
          smtp: {
            transport: 'smtp',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: 'your-email@gmail.com',
              pass: 'your-password',
            },
          }
        },
        from: { address: 'noreply@yourapp.com', name: 'Your App' },
        templates: {
          engine: 'handlebars',
          directory: './templates',
        },
      },
    }),
  ],
})
export class AppModule {}
```

### Basic Email Sending

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from 'nestjs-mailable';

@Injectable()
export class UserService {
  constructor(private mailService: MailService) {}

  async sendWelcomeEmail(user: { name: string; email: string }) {
    // Clean, fluent API - template engine auto-detected from configuration
    await this.mailService
      .to(user.email)
      .cc('support@company.com')
      .send({
        subject: 'Welcome to our platform!',
        template: 'welcome', // Extension auto-detected (.hbs, .ejs, .pug)
        context: { name: user.name }
      });
  }
}
```

## Core Components

### 1. MailModule

The main module that provides configuration and setup for the mail service. It supports both synchronous and asynchronous configuration with a new simplified configuration system (v1.1+):

```typescript
// New simplified configuration (v1.1+) - Recommended
import { MailModule, TEMPLATE_ENGINE, TransportType } from 'nestjs-mailable';

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
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
  replyTo: { address: 'support@yourapp.com', name: 'Your App Support' },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
    options: {
      helpers: {
        currency: (amount: number) => `${amount.toFixed(2)}`,
        formatDate: (date: Date) => date.toLocaleDateString(),
      },
    },
  },
})

// Legacy configuration (backward compatible)
MailModule.forRoot({
  config: {
    default: 'smtp',
    mailers: {
      smtp: {
        transport: 'smtp',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'your-email@gmail.com',
          pass: 'your-password',
        },
      },
      // Amazon SES for transactional emails
      transactional: {
        transport: 'ses',
        options: {
          region: 'us-east-1',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      },
      // Mailgun for marketing emails
      marketing: {
        transport: 'mailgun',
        options: {
          domain: 'mg.yourdomain.com',
          apiKey: process.env.MAILGUN_API_KEY,
        },
      }
    },
    from: { address: 'noreply@yourapp.com', name: 'Your App' },
    templates: {
      engine: 'handlebars',
      directory: './templates',
      options: {
        helpers: {
          currency: (amount: number) => `${amount.toFixed(2)}`
        }
      }
    }
  }
})

// Asynchronous configuration with new simplified system
MailModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    transport: {
      type: configService.get('MAIL_TRANSPORT', TransportType.SMTP),
      host: configService.get('MAIL_HOST'),
      port: configService.get('MAIL_PORT'),
      secure: configService.get('MAIL_SECURE'),
      auth: {
        user: configService.get('MAIL_USER'),
        pass: configService.get('MAIL_PASS'),
      },
    },
    from: {
      address: configService.get('MAIL_FROM_ADDRESS'),
      name: configService.get('MAIL_FROM_NAME'),
    },
    replyTo: {
      address: configService.get('MAIL_REPLY_TO_ADDRESS'),
      name: configService.get('MAIL_REPLY_TO_NAME'),
    },
    templates: {
      engine: configService.get('MAIL_TEMPLATE_ENGINE', TEMPLATE_ENGINE.HANDLEBARS),
      directory: configService.get('MAIL_TEMPLATE_DIR', './templates'),
      options: {
        helpers: {
          currency: (amount: number) => `${amount.toFixed(2)}`,
          formatDate: (date: Date) => date.toLocaleDateString(),
        },
      },
    }
  }),
  inject: [ConfigService]
})

### 2. MailService

The core service for sending emails. Provides both direct sending and fluent interface:

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from 'nestjs-mailable';

@Injectable()
export class NotificationService {
  constructor(private mailService: MailService) {}

  async sendNotification(user: User, message: string) {
    // Direct sending
    await this.mailService.send({
      to: user.email,
      subject: 'Notification',
      html: `<p>${message}</p>`
    });

    // Fluent interface
    await this.mailService
      .to(user.email)
      .cc('manager@company.com')
      .bcc('audit@company.com')
      .send({
        subject: 'Notification',
        template: 'notification',
        context: { 
          userName: user.name,
          message 
        },
        attachments: [
          { filename: 'document.pdf', path: '/path/to/document.pdf' }
        ],
        headers: { 'X-Custom-Header': 'custom-value' }
      });
  }
}
```

### 3. Mailable Classes

Laravel-style mailable classes with advanced features for complex email scenarios:

```typescript
import { 
  Mailable, 
  AttachmentBuilder, 
  MailableEnvelope,
  MailableContent,
  MailableHeaders,
  MailableAttachment 
} from 'nestjs-mailable';

interface Order {
  id: number;
  name: string;
  price: number;
  invoice_number: string;
  customer_email: string;
}

export class OrderShippedAdvanced extends Mailable {
  constructor(public order: Order) {
    super();
  }

  /**
   * Define the message envelope: subject, tags, metadata
   */
  envelope(): MailableEnvelope {
    return {
      subject: 'Your Order Has Shipped! 📦',
      tags: ['shipment'],
      metadata: {
        order_id: this.order.id,
      },
      using: [
        (message: any) => {
          // Add low-level customizations
          message.headers['X-Mailer'] = 'NestJS-Mailable/1.x';
        },
      ],
    };
  }

  /**
   * Define the content: template and data
   */
  content(): MailableContent {
    return {
      template: 'mail/orders/shipped',
      with: {
        orderId: this.order.id,
        orderName: this.order.name,
        orderPrice: this.order.price,
        invoiceNumber: this.order.invoice_number,
        customerEmail: this.order.customer_email,
      },
    };
  }

  /**
   * Add custom headers: Message-ID, references, etc.
   */
  headers(): MailableHeaders {
    return {
      messageId: `<order.${this.order.id}@yourapp.com>`,
      references: ['<order-confirmation@yourapp.com>'],
      text: {
        'X-Custom-Order-Header': 'OrderShippedAdvanced',
      },
    };
  }

  /**
   * Attach files: file path, storage, and in-memory data
   */
  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder.fromPath(`./invoices/${this.order.invoice_number}.pdf`)
        .as(`Invoice-${this.order.invoice_number}.pdf`)
        .withMime('application/pdf')
        .build(),

      AttachmentBuilder.fromStorage('reports/shipment-details.txt').build(),

      AttachmentBuilder.fromData(() => this.generateReportPdf(), 'Report.pdf')
        .withMime('application/pdf')
        .build(),
    ];
  }

  protected generateReportPdf(): string {
    // Generate PDF content
    return '%PDF-1.4... (binary data)';
  }
}

// Usage
const orderShippedMail = new OrderShippedAdvanced(order);
await this.mailService
  .to(order.customer_email)
  .cc('manager@yourapp.com')
  .bcc('audit@yourapp.com')
  .send(orderShippedMail);
```

### 4. Template Engines

Supports multiple template engines with Handlebars, EJS, and Pug. The template engine is automatically detected from configuration:

```typescript
// Handlebars (default) with helpers and partials
MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'localhost',
    port: 1025,
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
    partials: {
      header: './partials/header',
      footer: './partials/footer',
    },
    options: {
      helpers: {
        currency: (amount: number) => `${amount.toFixed(2)}`,
        formatDate: (date: Date) => date.toLocaleDateString(),
        uppercase: (str: string) => str.toUpperCase(),
      },
    },
  },
})

// EJS
MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'localhost',
    port: 1025,
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
  templates: {
    engine: TEMPLATE_ENGINE.EJS,
    directory: './templates',
  },
})

// Pug
MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'localhost',
    port: 1025,
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
  templates: {
    engine: TEMPLATE_ENGINE.PUG,
    directory: './templates',
    options: {
      pretty: true,
    },
  },
})
```

Example Handlebars template (`templates/welcome.hbs`):
```handlebars
<!DOCTYPE html>
<html>
<head>
    <title>Welcome {{name}}!</title>
</head>
<body>
    <h1>Welcome {{name}}!</h1>
    <p>Thank you for joining our platform.</p>
    
    {{#if features}}
    <ul>
    {{#each features}}
        <li>{{this}}</li>
    {{/each}}
    </ul>
    {{/if}}
    
    {{#if actionUrl}}
    <a href="{{actionUrl}}" class="button">Get Started</a>
    {{/if}}
</body>
</html>
```

Example EJS template (`templates/welcome.ejs`):
```ejs
<!DOCTYPE html>
<html>
<head>
    <title>Welcome <%= name %>!</title>
</head>
<body>
    <h1>Welcome <%= name %>!</h1>
    <p>Thank you for joining our platform.</p>
    
    <% if (features && features.length) { %>
    <ul>
    <% features.forEach(function(feature) { %>
        <li><%= feature %></li>
    <% }); %>
    </ul>
    <% } %>
    
    <% if (actionUrl) { %>
    <a href="<%= actionUrl %>" class="button">Get Started</a>
    <% } %>
</body>
</html>
```

Example Pug template (`templates/welcome.pug`):
```pug
doctype html
html
  head
    title Welcome #{name}!
  body
    h1 Welcome #{name}!
    p Thank you for joining our platform.
    
    if features && features.length
      ul
        each feature in features
          li= feature
    
    if actionUrl
      a.button(href=actionUrl) Get Started
```

### 5. Transport Support

Supports multiple email transports with easy configuration:

- **SMTP**: Standard SMTP servers (Gmail, SendGrid, etc.)
- **Amazon SES**: AWS Simple Email Service
- **Mailgun**: Mailgun API

```typescript
// SMTP Configuration
{
  transport: 'smtp',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-password',
  }
}

// Amazon SES Configuration
{
  transport: 'ses',
  options: {
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
}

// Mailgun Configuration
{
  transport: 'mailgun',
  options: {
    domain: 'mg.yourdomain.com',
    apiKey: process.env.MAILGUN_API_KEY,
  }
}
```

## Advanced Usage

### Environment-Based Configuration

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        config: {
          default: configService.get('MAIL_DEFAULT', 'smtp'),
          mailers: {
            smtp: {
              transport: configService.get('MAIL_TRANSPORT', 'smtp'),
              host: configService.get('MAIL_HOST'),
              port: configService.get('MAIL_PORT', 587),
              secure: configService.get('MAIL_SECURE', false),
              auth: {
                user: configService.get('MAIL_USER'),
                pass: configService.get('MAIL_PASS'),
              },
            }
          },
          from: {
            address: configService.get('MAIL_FROM_ADDRESS'),
            name: configService.get('MAIL_FROM_NAME'),
          },
          templates: {
            engine: configService.get('MAIL_TEMPLATE_ENGINE', 'handlebars'),
            directory: configService.get('MAIL_TEMPLATE_DIR', './templates'),
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Custom Template Helpers

```typescript
MailModule.forRoot({
  config: {
    templates: {
      engine: 'handlebars',
      directory: './templates',
      options: {
        helpers: {
          // Currency formatting
          currency: (amount: number, currency = 'USD') => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency
            }).format(amount);
          },
          
          // Date formatting
          formatDate: (date: Date, format = 'short') => {
            return new Intl.DateTimeFormat('en-US', {
              dateStyle: format as any
            }).format(new Date(date));
          },
          
          // Conditional helper
          ifEquals: function(arg1: any, arg2: any, options: any) {
            return arg1 === arg2 ? options.fn(this) : options.inverse(this);
          },
          
          // String manipulation
          truncate: (str: string, length: number) => {
            return str.length > length ? str.substring(0, length) + '...' : str;
          },
        },
        partials: './templates/partials',
      },
    },
  },
})
```

### Builder Pattern Usage

```typescript
import { MailableBuilder } from 'nestjs-mailable';

@Injectable()
export class NotificationService {
  constructor(private mailService: MailService) {}

  async sendCustomNotification(user: User, notification: Notification) {
    const baseEmail = MailableBuilder.create()
      .from('notifications@yourapp.com')
      .tag('notification')
      .header('X-Notification-Type', notification.type);

    // Clone and customize based on notification type
    let email = baseEmail.clone();

    switch (notification.type) {
      case 'urgent':
        email = email
          .subject(`🚨 URGENT: ${notification.title}`)
          .template('notifications.urgent', { 
            user, 
            notification,
            urgencyLevel: 'high' 
          })
          .header('X-Priority', '1');
        break;

      case 'info':
        email = email
          .subject(notification.title)
          .template('notifications.info', { user, notification });
        break;

      case 'marketing':
        email = email
          .subject(notification.title)
          .template('notifications.marketing', { user, notification })
          .header('List-Unsubscribe', `<mailto:unsubscribe@yourapp.com?subject=unsubscribe-${user.id}>`);
        break;
    }

    await this.mailService.send(
      email.to(user.email).build()
    );
  }
}
```

## Testing Utilities

The package includes comprehensive testing utilities through `MailFake`:

```typescript
import { Test } from '@nestjs/testing';
import { MailService, MailFake } from 'nestjs-mailable';

describe('UserService', () => {
  let userService: UserService;
  let mailFake: MailFake;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: MailService,
          useClass: MailFake,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    mailFake = module.get<MailService>(MailService) as MailFake;
  });

  it('should send welcome email on user registration', async () => {
    const user = { name: 'John Doe', email: 'john@example.com' };
    
    await userService.registerUser(user);

    // Assert email was sent
    mailFake.assertSent((mail) => {
      return mail.to === user.email && 
             mail.subject === 'Welcome to our platform!';
    });

    // Check sent count
    expect(mailFake.getSentCount()).toBe(1);

    // Get sent emails
    const sentEmails = mailFake.getSentMails();
    expect(sentEmails[0].context.name).toBe(user.name);
  });
});
```

### Testing with Different Template Engines

You can test your application with different template engines by creating separate test modules:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MailModule, TEMPLATE_ENGINE, TransportType } from 'nestjs-mailable';

// Test with Handlebars
async function createHandlebarsTestModule(): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      MailModule.forRoot({
        transport: {
          type: TransportType.SMTP,
          host: 'localhost',
          port: 1025,
        },
        from: { address: 'test@example.com', name: 'Test App' },
        templates: {
          engine: TEMPLATE_ENGINE.HANDLEBARS,
          directory: './test-templates/handlebars',
        },
      }),
    ],
  }).compile();
}

// Test with EJS
async function createEjsTestModule(): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      MailModule.forRoot({
        transport: {
          type: TransportType.SMTP,
          host: 'localhost',
          port: 1025,
        },
        from: { address: 'test@example.com', name: 'Test App' },
        templates: {
          engine: TEMPLATE_ENGINE.EJS,
          directory: './test-templates/ejs',
        },
      }),
    ],
  }).compile();
}

// Test with Pug
async function createPugTestModule(): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      MailModule.forRoot({
        transport: {
          type: TransportType.SMTP,
          host: 'localhost',
          port: 1025,
        },
        from: { address: 'test@example.com', name: 'Test App' },
        templates: {
          engine: TEMPLATE_ENGINE.PUG,
          directory: './test-templates/pug',
        },
      }),
    ],
  }).compile();
}
```

## Development Commands

### Building
```bash
# Build the package
yarn build
# or
npm run build
```

### Testing
```bash
# Run tests
yarn test
# or
npm run test

# Run tests with coverage
yarn test:coverage
# or
npm run test:coverage
```

### Linting
```bash
# Lint the code
yarn lint
# or
npm run lint

# Fix linting issues
yarn lint:fix
# or
npm run lint:fix
```

### Formatting
```bash
# Format code with Prettier
yarn format
# or
npm run format
```

### Documentation
```bash
# Start documentation site
yarn docs:start
# or
npm run docs:start

# Build documentation
yarn docs:build
# or
npm run docs:build
```

## Key Design Patterns

### 1. Factory Pattern
Used in `MailTransportFactory` to create different transport instances based on configuration.

### 2. Builder Pattern
Implemented in `MailableBuilder` for fluent email composition.

### 3. Strategy Pattern
Used in template engines and transport implementations to provide different algorithms for the same interface.

### 4. Abstract Factory Pattern
Used in template engine implementations to provide a consistent interface across different engines.

## Configuration Options

### New Configuration System (v1.1+) - Recommended

#### Mail Configuration
```typescript
{
  transport: TransportConfiguration;
  from?: Address;
  replyTo?: Address | false;
  templates?: TemplateConfiguration;
}
```

#### Transport Configuration
```typescript
{
  type: 'smtp' | 'ses' | 'mailgun';
  // SMTP specific options
  host?: string;
  port?: number;
  secure?: boolean;
  ignoreTLS?: boolean;
  auth?: {
    user?: string;
    pass?: string;
  };
  // SES specific options
  endpoint?: string;
  region?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  // Mailgun specific options
  options?: MailgunOptions;
}
```

#### Template Configuration
```typescript
{
  engine: 'handlebars' | 'ejs' | 'pug';
  directory: string;
  partials?: Record<string, string>;
  options?: {
    helpers?: Record<string, Function>;
    [key: string]: unknown;
  };
}
```

#### Mailgun Options
```typescript
{
  domain: string;
  apiKey: string;
  host?: string;
  timeout?: number;
}
```

### Legacy Configuration System (Backward Compatible)

#### Mail Configuration
```typescript
{
  default: string;                    // Default mailer name
  mailers: Record<string, MailerConfig>;
  from?: {                           // Global from address
    address: string;
    name?: string;
  };
  replyTo?: {                        // Global reply-to address
    address: string;
    name?: string;
  };
  templates?: {                      // Template configuration
    engine?: string;
    directory?: string;
    main?: string;
    options?: Record<string, any>;
  };
}
```

#### Mailer Configuration
```typescript
{
  transport: 'smtp' | 'ses' | 'mailgun';
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  options?: SesMailerOptions | MailgunMailerOptions | Record<string, unknown>;
  mailers?: string[];               // Failover/Round-robin configuration
  retryAfter?: number;
}
```

#### Template Engine Configuration
```typescript
{
  engine: 'handlebars' | 'ejs' | 'pug';
  directory: string;
  main?: string;
  options?: {
    helpers?: Record<string, Function>;
    partials?: string;
  };
}
```

#### Transport-Specific Options

##### Amazon SES Options
```typescript
{
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}
```

##### Mailgun Options
```typescript
{
  apiKey: string;
  domain: string;
}
```

## API Reference

### MailService Methods

| Method | Description |
|--------|-------------|
| `to(address)` | Set recipient address(es) |
| `cc(address)` | Set CC address(es) |
| `bcc(address)` | Set BCC address(es) |
| `send(content)` | Send email with content or Mailable |
| `fake()` | Get MailFake instance for testing |

### Mailable Methods

| Method | Description |
|--------|-------------|
| `envelope()` | Define message envelope (subject, tags, metadata) |
| `content()` | Define message content (template, data) |
| `attachments()` | Define message attachments |
| `headers()` | Define custom headers |
| `build()` | Build the final email content |

### AttachmentBuilder Methods

| Method | Description |
|--------|-------------|
| `fromPath(filePath)` | Create attachment from file path |
| `fromStorage(storagePath)` | Create attachment from storage path |
| `fromData(dataFn, filename)` | Create attachment from in-memory data |
| `as(filename)` | Set attachment filename |
| `withMime(mimeType)` | Set attachment MIME type |
| `build()` | Build the attachment |

This project provides a comprehensive, enterprise-grade email solution for NestJS applications with extensive customization options, multiple transport support, and robust testing capabilities. It's designed to be both powerful and easy to use, following best practices for modern TypeScript development.