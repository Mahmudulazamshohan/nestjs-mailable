<div align="center">
  <h1>nestjs-mailable</h1>
  <p>A comprehensive NestJS mail package inspired by mail functionality with design patterns</p>
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
import { MailModule } from 'nestjs-mailable';

@Module({
  imports: [
    MailModule.forRoot({
      config: {
        default: {
          transport: 'smtp',
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'your-email@gmail.com',
            pass: 'your-password',
          },
        },
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
    await this.mailService
      .to(user.email)
      .subject('Welcome to our platform!')
      .template('welcome', { name: user.name })
      .send();
  }
}
```

### Using Mailable Classes

```typescript
import { Mailable } from 'nestjs-mailable';

export class WelcomeMail extends Mailable {
  constructor(private user: { name: string; email: string }) {
    super();
  }

  protected build() {
    return this
      .to(this.user.email)
      .subject('Welcome to our application!')
      .view('welcome', { name: this.user.name });
  }
}

// Send the mailable
const welcomeMail = new WelcomeMail(user);
await this.mailService.send(welcomeMail);
```

## 📚 Comprehensive Examples

### 1. Advanced Email Composition

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from 'nestjs-mailable';

@Injectable()
export class OrderService {
  constructor(private mailService: MailService) {}

  async sendOrderConfirmation(order: any) {
    await this.mailService
      .to({ address: order.customer.email, name: order.customer.name })
      .cc('orders@company.com')
      .bcc('analytics@company.com')
      .subject(`Order Confirmation #${order.number}`)
      .template('order-confirmation', {
        order,
        customerName: order.customer.name,
        items: order.items,
        total: order.total,
      })
      .attach('/path/to/invoice.pdf')
      .attachData(order.receipt, 'receipt.pdf', 'application/pdf')
      .header('X-Order-ID', order.id)
      .tag('order-confirmation')
      .metadata({ orderId: order.id, customerId: order.customer.id })
      .send();
  }
}
```

### 2. Multiple Transport Configuration

```typescript
@Module({
  imports: [
    MailModule.forRoot({
      config: {
        // Primary transport (SMTP)
        default: {
          transport: 'smtp',
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
        // Amazon SES for transactional emails
        transactional: {
          transport: 'ses',
          region: 'us-east-1',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        // Mailgun for marketing emails
        marketing: {
          transport: 'mailgun',
          domain: 'mg.yourdomain.com',
          apiKey: process.env.MAILGUN_API_KEY,
        },
        // Global email settings
        from: { address: 'noreply@yourapp.com', name: 'Your App' },
        replyTo: 'support@yourapp.com',
      },
    }),
  ],
})
export class AppModule {}
```

### 3. Template Engine Examples

#### Handlebars Templates

**templates/welcome.hbs**
```handlebars
<!DOCTYPE html>
<html>
<head>
    <title>Welcome {{userName}}!</title>
    <style>
        .button { background: #007bff; color: white; padding: 10px 20px; }
    </style>
</head>
<body>
    <h1>Welcome {{userName}}!</h1>
    <p>Thank you for joining {{appName}}.</p>
    
    {{#if verificationUrl}}
    <a href="{{verificationUrl}}" class="button">Verify Email</a>
    {{/if}}
    
    <ul>
    {{#each features}}
        <li>{{this}}</li>
    {{/each}}
    </ul>
</body>
</html>
```

#### MJML Templates

**templates/newsletter.mjml**
```xml
<mjml>
  <mj-head>
    <mj-title>Weekly Newsletter</mj-title>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="white">
      <mj-column>
        <mj-text font-size="24px" font-weight="bold">
          Hello {{subscriberName}}!
        </mj-text>
        <mj-text>
          Here are this week's highlights:
        </mj-text>
        {{#each articles}}
        <mj-text>
          <h3><a href="{{url}}">{{title}}</a></h3>
          <p>{{excerpt}}</p>
        </mj-text>
        {{/each}}
        <mj-button href="{{unsubscribeUrl}}">
          Unsubscribe
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

### 4. Advanced Mailable Classes

```typescript
import { Mailable } from 'nestjs-mailable';

export class OrderShippedMail extends Mailable {
  constructor(
    private order: Order,
    private customer: Customer,
    private trackingNumber: string
  ) {
    super();
  }

  protected build() {
    return this
      .to({ address: this.customer.email, name: this.customer.name })
      .cc(this.customer.isVip ? 'vip-support@company.com' : null)
      .subject(`Your order #${this.order.number} has shipped!`)
      .view('emails.orders.shipped', {
        customerName: this.customer.name,
        orderNumber: this.order.number,
        trackingNumber: this.trackingNumber,
        items: this.order.items,
        estimatedDelivery: this.calculateDeliveryDate(),
        isVip: this.customer.isVip,
      })
      .attach(this.generateShippingLabel())
      .header('X-Order-Type', this.order.type)
      .tag('order-shipped')
      .metadata({
        orderId: this.order.id,
        customerId: this.customer.id,
        trackingNumber: this.trackingNumber,
      });
  }

  private calculateDeliveryDate(): Date {
    const businessDays = this.customer.isVip ? 1 : 3;
    // Calculate delivery date logic...
    return new Date();
  }

  private generateShippingLabel(): string {
    // Generate shipping label PDF...
    return '/tmp/shipping-label.pdf';
  }
}
```

### 5. Builder Pattern Usage

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

### 6. Testing with MailFake

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
    mailFake.assertSent(WelcomeMail, (mail) => {
      return mail.hasTo(user.email) && 
             mail.hasSubject('Welcome to our platform!');
    });

    // Check sent count
    expect(mailFake.getSentCount()).toBe(1);

    // Get sent emails
    const sentEmails = mailFake.getSent();
    expect(sentEmails[0].context.name).toBe(user.name);
  });
});
```


### 8. Custom Template Helpers

```typescript
@Module({
  imports: [
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
    }),
  ],
})
export class AppModule {}
```

### 9. Environment-Based Configuration

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        config: {
          default: {
            transport: configService.get('MAIL_TRANSPORT', 'smtp'),
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
            engine: 'handlebars',
            directory: './templates',
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## Features

✨ **API** - Familiar and intuitive interface  
🏗️ **Design Patterns** - Factory, Builder, Strategy patterns  
📧 **Multiple Transports** - SMTP, SES, Mailgun support  
🎨 **Template Engines** - Handlebars, EJS, Pug, MJML  
🧪 **Testing Utilities** - Comprehensive testing helpers  
🔄 **Failover Support** - Multiple transport strategies  
🎯 **Type Safety** - Full TypeScript support  

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