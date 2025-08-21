<div align="center">
  <h1>nestjs-mailable</h1>
  <p>A comprehensive NestJS mail package with fluent API, advanced mailable classes, and multiple transport support</p>
</div>

<div align="center">

[![NPM version](https://img.shields.io/npm/v/nestjs-mailable.svg)](https://www.npmjs.com/package/nestjs-mailable)
[![License](https://img.shields.io/npm/l/nestjs-mailable.svg)](https://github.com/Mahmudulazamshohan/nestjs-mailable/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/nestjs-mailable.svg)](https://www.npmjs.com/package/nestjs-mailable)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Mahmudulazamshohan/nestjs-mailable/release.yml?branch=main)](https://github.com/Mahmudulazamshohan/nestjs-mailable/actions)
[![Documentation](https://img.shields.io/badge/docs-available-brightgreen.svg)](https://nestjs-mailable.github.io)

</div>

## Installation

```bash
npm install nestjs-mailable nodemailer handlebars ejs pug mjml
```

```bash
yarn add nestjs-mailable nodemailer handlebars ejs pug mjml
```

## Quick Start

### Module Configuration

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

### Advanced Mailable Classes

Create advanced, reusable email classes with envelope, content, attachments, and headers:

```typescript
import { 
  MailableClass as Mailable, 
  AttachmentBuilder, 
  MailableEnvelope,
  MailableContent,
  MailableHeaders,
  MailableAttachment 
} from 'nestjs-mailable';

export class OrderShippedAdvanced extends Mailable {
  constructor(public order: Order) {
    super();
  }

  /**
   * Define the message envelope: subject, tags, metadata
   */
  envelope(): MailableEnvelope {
    return {
      subject: 'Your Order Has Shipped!',
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
        orderName: this.order.name,
        orderPrice: this.order.price,
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

  protected generateReportPdf(): string {
    return '%PDF-1.4... (binary data)';
  }
}
```

**Send with chaining:**

```typescript
await this.mailService
  .to(order.customer_email)
  .cc('manager@yourapp.com')
  .bcc('audit@yourapp.com')
  .send(new OrderShippedAdvanced(order));
```

### Legacy Mailable Classes

```typescript
import { Mailable, Content } from 'nestjs-mailable';

export class WelcomeMail extends Mailable {
  constructor(private user: { name: string; email: string }) {
    super();
  }

  async build(): Promise<Content> {
    return {
      subject: 'Welcome to our application!',
      template: 'welcome',
      context: { name: this.user.name }
    };
  }
}

// Send the mailable
const welcomeMail = new WelcomeMail(user);
await this.mailService.to(user.email).send(welcomeMail);
```

## 📚 Comprehensive Examples

### 1. Multiple Transport Configuration

```typescript
import { Module } from '@nestjs/common';
import { MailModule, TransportType, TEMPLATE_ENGINE } from 'nestjs-mailable';

@Module({
  imports: [
    MailModule.forRoot({
      // SMTP Transport
      transport: {
        type: TransportType.SMTP,
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: { 
        address: 'noreply@yourapp.com', 
        name: 'Your App' 
      },
      replyTo: 'support@yourapp.com',
      templates: {
        engine: TEMPLATE_ENGINE.HANDLEBARS,
        directory: './templates',
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Amazon SES Configuration

```typescript
@Module({
  imports: [
    MailModule.forRoot({
      transport: {
        type: TransportType.SES,
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      },
      from: { address: 'noreply@yourapp.com', name: 'Your App' },
      templates: {
        engine: TEMPLATE_ENGINE.HANDLEBARS,
        directory: './templates',
      },
    }),
  ],
})
export class AppModule {}
```

### 3. Environment-Based Configuration with ConfigService

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule, TransportType, TEMPLATE_ENGINE } from 'nestjs-mailable';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          type: configService.get('MAIL_TRANSPORT') === 'ses' 
            ? TransportType.SES 
            : TransportType.SMTP,
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
          directory: './templates',
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### 4. Testing with MailFake

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
          useValue: new MailFake(new MailService({} as any)),
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    mailFake = module.get<MailService>(MailService) as MailFake;
  });

  it('should send welcome email on user registration', async () => {
    const user = { name: 'John Doe', email: 'john@example.com' };
    
    await userService.registerUser(user);

    // Check that email was sent
    expect(mailFake.getSentCount()).toBe(1);

    // Get sent emails and verify content
    const sentEmails = mailFake.getSent();
    expect(sentEmails[0].subject).toBe('Welcome to our platform!');
    expect(sentEmails[0].context.name).toBe(user.name);
  });
});
```

### 5. Template Engine Configuration

```typescript
@Module({
  imports: [
    MailModule.forRoot({
      transport: {
        type: TransportType.SMTP,
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      templates: {
        engine: TEMPLATE_ENGINE.HANDLEBARS,
        directory: './templates',
        options: {
          helpers: {
            // Custom helpers
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
    }),
  ],
})
export class AppModule {}
```

## Features

✨ **Advanced Mailable Classes** - Advanced mailable classes with envelope, content, attachments, and headers methods  
🔗 **Fluent API** - Clean, intuitive interface with method chaining  
🏗️ **Design Patterns** - Factory, Builder, Strategy patterns for maintainable code  
📧 **Multiple Transports** - SMTP, Amazon SES, Mailgun support  
🎨 **Template Engines** - Handlebars, EJS, Pug support with auto-detection  
📎 **Attachment Builder** - Fluent attachment creation from file paths and in-memory data  
🧪 **Testing Utilities** - MailFake class for testing email sending  
⚙️ **Easy Configuration** - Simple module configuration with forRoot/forRootAsync  
🎯 **Type Safety** - Full TypeScript support with comprehensive interfaces  

## Supported Transports

- **SMTP** - Standard SMTP servers
- **Amazon SES** - AWS Simple Email Service  
- **Mailgun** - Mailgun API
- **Custom** - Implement your own transport

## Documentation

For detailed documentation, examples, and advanced usage:

- **📖 [Documentation Site](https://nestjs-mailable.github.io/)** - Comprehensive guides and API reference
- **🚀 [Quick Start Guide](https://nestjs-mailable.github.io/docs/intro)** - Get started in minutes

### Development

This is a Turborepo monorepo. See [DEVELOPMENT.md](./DEVELOPMENT.md) for development instructions.

```bash
# Install dependencies
npm install

# Start documentation site
npm run docs:start

# Build all packages
npm run build

# Run tests
npm run test
```

## Contributors

Thanks to all the people who have contributed to this project:

<a href="https://github.com/Mahmudulazamshohan/nestjs-mailable/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Mahmudulazamshohan/nestjs-mailable" />
</a>

## License

MIT