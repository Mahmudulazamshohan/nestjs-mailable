# NestJS Mailable

Production-ready email handling for NestJS with Laravel-inspired mailable classes, fluent API, and multi-transport support.

[![npm version](https://img.shields.io/npm/v/nestjs-mailable.svg)](https://www.npmjs.com/package/nestjs-mailable)
[![npm downloads](https://img.shields.io/npm/dm/nestjs-mailable.svg)](https://www.npmjs.com/package/nestjs-mailable)
[![build status](https://img.shields.io/github/actions/workflow/status/Mahmudulazamshohan/nestjs-mailable/release.yml?branch=main)](https://github.com/Mahmudulazamshohan/nestjs-mailable/actions)
[![typescript](https://img.shields.io/badge/typescript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![node](https://img.shields.io/node/v/nestjs-mailable.svg)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/nestjs-mailable.svg)](LICENSE)

**[Documentation](https://mahmudulazamshohan.github.io/nestjs-mailable)** • **[Examples](https://github.com/Mahmudulazamshohan/nestjs-mailable/tree/main/examples)** • **[Contributing](#contributing)**

## Features

- **Mailable Classes** - Encapsulate email logic with `envelope()`, `content()`, `attachments()`, and `headers()` methods
- **Fluent API** - Chainable interface: `mailService.to(email).cc(cc).send(mailable)`
- **Multiple Transports** - SMTP, AWS SES, Mailgun, Mailjet, Resend
- **Template Engines** - Handlebars, EJS, Pug with auto-detection
- **Built-in Testing** - Mock MailService and verify emails without sending
- **Type-Safe** - Full TypeScript support with strict typing
- **Async Configuration** - Dependency injection with `forRootAsync`
- **Error Handling** - Detailed transport-specific error messages

## Installation

Install the core package:

```bash
npm install nestjs-mailable
```

Then install only the dependencies you need for your chosen transport and template engine.

### Transport Dependencies

```bash
# SMTP
npm install nodemailer

# AWS SES (Production with nodemailer SMTP)
npm install nodemailer aws-sdk

# AWS SES (LocalStack development)
npm install aws-sdk

# Mailgun
npm install mailgun.js axios form-data

# Mailjet
npm install node-mailjet

# Resend
npm install resend
```

### Template Engine Dependencies

```bash
# Handlebars (recommended)
npm install handlebars

# EJS
npm install ejs

# Pug
npm install pug
```

### Example: Minimal Installation

For SMTP with Handlebars templates:

```bash
npm install nestjs-mailable nodemailer handlebars
```

For AWS SES with EJS templates:

```bash
npm install nestjs-mailable aws-sdk ejs
```

### Requirements

- Node.js >= 20.0.0
- NestJS >= 10.0.0
- TypeScript >= 5.0.0

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
        address: 'noreply@example.com',
        name: 'Your App',
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
      subject: `Welcome, ${this.user.name}!`,
    };
  }

  content(): MailableContent {
    return {
      template: 'emails/welcome',
      with: {
        name: this.user.name,
        loginUrl: 'https://example.com/login',
      },
    };
  }
}
```

### 3. Send Email

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from 'nestjs-mailable';
import { WelcomeEmail } from './welcome.email';

@Injectable()
export class UserService {
  constructor(private mailService: MailService) {}

  async registerUser(userData: any) {
    const user = await this.createUser(userData);
    await this.mailService.to(user.email).send(new WelcomeEmail(user));
    return user;
  }
}
```

### 4. Create Template

Create `templates/emails/welcome.hbs`:

```handlebars
<h1>Welcome, {{name}}!</h1>
<p>Get started by logging in below.</p>
<a href="{{loginUrl}}">Login to Your Account</a>
```

## Configuration

### Synchronous Configuration

```typescript
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
    name: 'Your App',
  },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
  },
})
```

### Asynchronous Configuration

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

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
})
```

## Transports

### SMTP

```typescript
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
})
```

### AWS SES

**Production Mode** (nodemailer SMTP):

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    credentials: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  },
})
```

**LocalStack Mode** (AWS SDK):

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    endpoint: 'http://localhost:4566',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  },
})
```

### Mailgun

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.MAILGUN,
    options: {
      domain: 'mg.yourdomain.com',
      apiKey: process.env.MAILGUN_API_KEY,
    },
  },
})
```

### Mailjet

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.MAILJET,
    options: {
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_API_SECRET,
    },
  },
})
```

### Resend

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.RESEND,
    apiKey: process.env.RESEND_API_KEY,
  },
})
```

## API

### MailService

```typescript
// Set recipients
mailService.to(email: string | string[])
mailService.cc(email: string | string[])
mailService.bcc(email: string | string[])

// Configure email
mailService.from(address: string | Address)
mailService.replyTo(address: string | Address)
mailService.subject(subject: string)
mailService.html(content: string)
mailService.text(content: string)
mailService.template(name: string, context?: Record<string, any>)

// Send
mailService.send(mailable?: Mailable): Promise<unknown>

// Testing
mailService.fake(): MailFake
mailService.clearSent(): void
```

### Mailable Class

```typescript
export class MyEmail extends Mailable {
  envelope(): MailableEnvelope {
    return { subject: 'Email Subject' };
  }

  content(): MailableContent {
    return {
      template: 'email-template',
      with: { variable: 'value' },
    };
  }

  attachments(): MailableAttachment[] {
    return [AttachmentBuilder.fromPath('./file.pdf').as('file.pdf').build()];
  }

  headers(): MailableHeaders {
    return { 'X-Custom-Header': 'value' };
  }
}
```

## Testing

### Using MailFake

```typescript
import { Test } from '@nestjs/testing';
import { MailService } from 'nestjs-mailable';

describe('UserService', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, MailService],
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailService.fake();
  });

  it('should send welcome email', async () => {
    await userService.registerUser(user);

    expect(mailService.hasSent(WelcomeEmail)).toBe(true);
    expect(mailService.hasSentTo(user.email)).toBe(true);
  });
});
```

### Jest Mocking

```typescript
import { createMailServiceMock } from 'nestjs-mailable/testing';

const mockMailService = createMailServiceMock();

await mockMailService
  .to('user@example.com')
  .subject('Test')
  .send();

expect(mockMailService.to).toHaveBeenCalledWith('user@example.com');
```

See the [Jest Mocking Guide](https://mahmudulazamshohan.github.io/nestjs-mailable/docs/jest-mocking) and [Testing Utilities Reference](https://mahmudulazamshohan.github.io/nestjs-mailable/docs/testing-utilities) for comprehensive testing documentation.

## Template Engines

### Handlebars

```typescript
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
      },
    },
  },
})
```

### EJS

```typescript
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

### Pug

```typescript
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

## Advanced Usage

### Attachments

```typescript
import { AttachmentBuilder } from 'nestjs-mailable';

export class InvoiceEmail extends Mailable {
  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder
        .fromPath('./invoices/invoice.pdf')
        .as('Invoice.pdf')
        .withMime('application/pdf')
        .build(),
      AttachmentBuilder
        .fromBuffer(buffer, 'image.png')
        .withMime('image/png')
        .inline('logo')
        .build(),
    ];
  }
}
```

### Custom Headers

```typescript
export class CustomEmail extends Mailable {
  headers(): MailableHeaders {
    return {
      'X-Priority': '1',
      'X-Custom-Header': 'custom-value',
    };
  }
}
```

### Dynamic Template Selection

```typescript
export class LocalizedEmail extends Mailable {
  constructor(private user: User, private locale: string) {
    super();
  }

  content(): MailableContent {
    return {
      template: `emails/${this.locale}/welcome`,
      with: { name: this.user.name },
    };
  }
}
```

## Performance & Best Practices

### Connection Pooling

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  },
})
```

### Template Caching

```typescript
MailModule.forRoot({
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    options: {
      cache: true,
    },
  },
})
```

### Async Email Sending

Consider using a queue system for non-critical emails:

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async sendWelcomeEmail(user: User) {
    await this.emailQueue.add('welcome', {
      email: user.email,
      name: user.name,
    });
  }
}
```

### Security

- Never commit credentials. Use environment variables
- Validate and sanitize all user input before sending
- Use TLS for all SMTP connections in production
- Rotate credentials regularly
- Monitor bounce rates and complaints

## Troubleshooting

### Template Engine Not Found

Install the missing engine:

```bash
npm install handlebars
npm install ejs
npm install pug
```

### SMTP Connection Timeout

- Verify host and port are correct
- Check firewall allows outbound SMTP connections
- Use `secure: true` for port 465, `secure: false` for port 587

### AWS SES Authentication Failed

- Use SES SMTP credentials (not regular AWS credentials)
- Verify email address or domain in AWS SES console
- Ensure IAM user has `ses:SendEmail` permission
- Check region matches SMTP endpoint

### Template Not Found

- Verify template directory path
- Check file extension matches engine (`.hbs`, `.ejs`, `.pug`)
- Ensure template files are included in build output

### Mailgun API Error

- Verify API key format: `key-xxxxxxxxx`
- Check domain is configured in Mailgun dashboard
- Verify sender email matches verified domain

## Documentation

Complete documentation available at [mahmudulazamshohan.github.io/nestjs-mailable](https://mahmudulazamshohan.github.io/nestjs-mailable)

- [Configuration Guide](https://mahmudulazamshohan.github.io/nestjs-mailable/docs/configuration)
- [Mailable Classes](https://mahmudulazamshohan.github.io/nestjs-mailable/docs/mailables)
- [Template Engines](https://mahmudulazamshohan.github.io/nestjs-mailable/docs/templates)
- [Testing Guide](https://mahmudulazamshohan.github.io/nestjs-mailable/docs/testing)
- [Jest Mocking](https://mahmudulazamshohan.github.io/nestjs-mailable/docs/jest-mocking)
- [Testing Utilities](https://mahmudulazamshohan.github.io/nestjs-mailable/docs/testing-utilities)

## Examples

Complete working examples available in [examples/nestjs-email-app](https://github.com/Mahmudulazamshohan/nestjs-mailable/tree/main/examples):

- Basic NestJS integration
- Multiple transport configurations
- Template engine usage
- Mailable class implementations
- Testing patterns

## Migration

### From @nestjs-modules/mailer

```typescript
// Before
await this.mailerService.sendMail({
  to: user.email,
  subject: 'Welcome',
  template: './welcome',
  context: { name: user.name },
});

// After
await this.mailService
  .to(user.email)
  .send(new WelcomeEmail(user));
```

### From nodemailer

```typescript
// Before
const transporter = nodemailer.createTransport(config);
await transporter.sendMail({ from, to, subject, html });

// After
await this.mailService
  .to(to)
  .subject(subject)
  .html(html)
  .send();
```

## Contributing

Contributions are welcome. Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code of Conduct
- Development setup
- Submitting pull requests
- Reporting bugs

### Development

```bash
# Install dependencies
yarn install

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Build
yarn build

# Lint
yarn lint
```

## Support

- [Documentation](https://mahmudulazamshohan.github.io/nestjs-mailable)
- [GitHub Issues](https://github.com/Mahmudulazamshohan/nestjs-mailable/issues)
- [GitHub Discussions](https://github.com/Mahmudulazamshohan/nestjs-mailable/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/nestjs-mailable)

## License

MIT - see [LICENSE](./LICENSE) file for details.

Copyright (c) 2024 NestJS Mailable contributors
