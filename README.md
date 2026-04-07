# NestJS Mailable

Production-ready email module for NestJS with Laravel-inspired mailables, fluent sending, template engines, retries, events, and testing utilities.

[![npm version](https://img.shields.io/npm/v/nestjs-mailable.svg)](https://www.npmjs.com/package/nestjs-mailable)
[![build status](https://img.shields.io/github/actions/workflow/status/Mahmudulazamshohan/nestjs-mailable/release.yml?branch=main)](https://github.com/Mahmudulazamshohan/nestjs-mailable/actions)
[![typescript](https://img.shields.io/badge/typescript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![node](https://img.shields.io/node/v/nestjs-mailable.svg)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/nestjs-mailable.svg)](LICENSE)

## Table of Contents

- [Why NestJS Mailable](#why-nestjs-mailable)
- [Features](#features)
- [Compatibility](#compatibility)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Transport Configuration](#transport-configuration)
- [Template Engines](#template-engines)
- [Core API](#core-api)
- [Batch Sending](#batch-sending)
- [Retry with Backoff](#retry-with-backoff)
- [Events](#events)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Links](#links)
- [License](#license)

## Why NestJS Mailable

`nestjs-mailable` is designed for teams that want:

- Clear separation of email logic via dedicated classes.
- A typed configuration model for transport/template setup.
- Easy unit/integration testing without sending real mail.
- A practical API that works for both simple and advanced email workflows.

## Features

- Mailable classes with `envelope()`, `content()`, `attachments()`, and `headers()`.
- Fluent send API: `mailService.to(...).cc(...).bcc(...).send(...)`.
- Transport support: SMTP, AWS SES, Mailgun, Mailjet.
- Template engines: Handlebars, EJS, Pug.
- LRU template caching with TTL/max-size controls.
- Batch sending with chunking and concurrency control.
- Retry wrapper with fixed/linear/exponential strategies.
- Optional lifecycle events (`mail.sent`, `mail.failed`, `mail.batch.completed`).
- Jest-focused testing utilities under `nestjs-mailable/testing`.

## Compatibility

- Node.js: `>=18`
- NestJS: `^10 || ^11`
- TypeScript: `>=5`

## Installation

```bash
npm install nestjs-mailable
```

Core transport/template runtime dependencies are included by this package.

## Quick Start

### 1. Register `MailModule`

```ts
import { Module } from '@nestjs/common';
import { MailModule, TEMPLATE_ENGINE, TransportType } from 'nestjs-mailable';

@Module({
  imports: [
    MailModule.forRoot({
      transport: {
        type: TransportType.SMTP,
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_PORT || 587),
        secure: false,
        auth: {
          user: process.env.MAIL_USERNAME || '',
          pass: process.env.MAIL_PASSWORD || '',
        },
      },
      from: {
        address: process.env.MAIL_FROM_ADDRESS || 'noreply@example.com',
        name: process.env.MAIL_FROM_NAME || 'Example App',
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

### 2. Create a mailable class

```ts
import {
  Mailable,
  MailableContent,
  MailableEnvelope,
} from 'nestjs-mailable';

export class WelcomeEmail extends Mailable {
  constructor(private readonly user: { name: string }) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: `Welcome, ${this.user.name}!`,
      tags: ['welcome'],
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

### 3. Send email

```ts
import { Injectable } from '@nestjs/common';
import { MailService } from 'nestjs-mailable';
import { WelcomeEmail } from './welcome.email';

@Injectable()
export class UserService {
  constructor(private readonly mailService: MailService) {}

  async register(user: { email: string; name: string }) {
    await this.mailService.to(user.email).send(new WelcomeEmail(user));
  }
}
```

## Transport Configuration

### SMTP

```ts
import { MailModule, TransportType } from 'nestjs-mailable';

MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME || '',
      pass: process.env.MAIL_PASSWORD || '',
    },
  },
});
```

### AWS SES

For AWS SMTP endpoints:

```ts
import { MailModule, TransportType } from 'nestjs-mailable';

MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      sessionToken: process.env.AWS_SESSION_TOKEN,
    },
  },
});
```

For LocalStack/mock endpoint:

```ts
import { MailModule, TransportType } from 'nestjs-mailable';

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
});
```

### Mailgun

```ts
import { MailModule, TransportType } from 'nestjs-mailable';

MailModule.forRoot({
  transport: {
    type: TransportType.MAILGUN,
    options: {
      domain: process.env.MAILGUN_DOMAIN || '',
      apiKey: process.env.MAILGUN_API_KEY || '',
    },
  },
});
```

### Mailjet

```ts
import { MailModule, TransportType } from 'nestjs-mailable';

MailModule.forRoot({
  transport: {
    type: TransportType.MAILJET,
    options: {
      apiKey: process.env.MAILJET_API_KEY || '',
      apiSecret: process.env.MAILJET_API_SECRET || '',
    },
  },
});
```

## Template Engines

### Handlebars

```ts
import { MailModule, TEMPLATE_ENGINE } from 'nestjs-mailable';

MailModule.forRoot({
  transport: { /* ... */ },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
    partials: {
      header: './partials/header',
      footer: './partials/footer',
    },
    options: {
      helpers: {
        currency: (value: number) => `$${value.toFixed(2)}`,
      },
    },
    cache: {
      enabled: true,
      ttl: 60 * 60 * 1000,
      maxSize: 100,
    },
  },
});
```

### EJS / Pug

```ts
import { MailModule, TEMPLATE_ENGINE } from 'nestjs-mailable';

MailModule.forRoot({
  transport: { /* ... */ },
  templates: {
    engine: TEMPLATE_ENGINE.EJS, // or TEMPLATE_ENGINE.PUG
    directory: './templates',
    options: {
      compileDebug: false,
    },
    cache: {
      enabled: true,
      maxSize: 100,
    },
  },
});
```

## Core API

### `MailModule`

- `forRoot(config)`
- `forRootAsync({ imports, useFactory | useClass | useExisting, inject })`

Example:

```ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule, TransportType } from 'nestjs-mailable';

MailModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    transport: {
      type: TransportType.SMTP,
      host: config.get<string>('MAIL_HOST') || 'smtp.gmail.com',
      port: Number(config.get<string>('MAIL_PORT') || 587),
      secure: config.get<string>('MAIL_SECURE') === 'true',
      auth: {
        user: config.get<string>('MAIL_USERNAME') || '',
        pass: config.get<string>('MAIL_PASSWORD') || '',
      },
    },
    from: {
      address: config.get<string>('MAIL_FROM_ADDRESS') || 'noreply@example.com',
      name: config.get<string>('MAIL_FROM_NAME') || 'Example App',
    },
  }),
});
```

### `MailService`

- `to(address)` -> returns sender with `.cc()`, `.bcc()`, `.send()`
- `send(contentOrMailable)`
- `batch(items, options?)`
- `fake()`

### `MailableBuilder`

Useful for dynamic message creation without defining a class:

```ts
import { MailableBuilder } from 'nestjs-mailable';

const content = MailableBuilder.create()
  .subject('Weekly Update')
  .template('emails/weekly', { name: 'Alex' })
  .build();

await mailService.to('alex@example.com').send(content);
```

### Attachments with `AttachmentBuilder`

```ts
import {
  AttachmentBuilder,
  Mailable,
  MailableAttachment,
} from 'nestjs-mailable';

class InvoiceEmail extends Mailable {
  envelope() {
    return { subject: 'Invoice' };
  }

  content() {
    return {
      template: 'emails/invoice',
      with: { invoiceId: 'INV-2026-001' },
    };
  }

  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder.fromPath('./invoices/invoice.pdf')
        .as('Invoice.pdf')
        .withMime('application/pdf')
        .build(),
      AttachmentBuilder.fromData(() => Buffer.from('hello'), 'hello.txt')
        .withMime('text/plain')
        .build(),
    ];
  }
}
```

## Batch Sending

```ts
import { BatchItem } from 'nestjs-mailable';

const items: BatchItem[] = users.map((u) => ({
  to: u.email,
  mailable: new WelcomeEmail({ name: u.name }),
}));

const result = await mailService
  .batch(items, {
    batchSize: 50,
    concurrency: 5,
    continueOnError: true,
  })
  .send();

console.log(result.total, result.succeeded, result.failed);
```

`BatchOptions`:

- `batchSize` (default: `10`)
- `concurrency` (default: `5`)
- `continueOnError` (default: `true`)

## Retry with Backoff

Configure retry per transport:

```ts
import { MailModule, TransportType } from 'nestjs-mailable';

MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'smtp.example.com',
    auth: { user: 'u', pass: 'p' },
    retry: {
      attempts: 3,
      strategy: 'exponential', // 'fixed' | 'linear' | 'exponential'
      delay: 1000,
      maxDelay: 30_000,
      jitter: true,
    },
  },
});
```

When all attempts fail, `RetryExhaustedError` is thrown.

## Events

Enable and wire an event emitter:

```ts
import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import {
  MAIL_EVENT_EMITTER,
  MailModule,
  TransportType,
} from 'nestjs-mailable';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    MailModule.forRoot({
      events: { enabled: true },
      transport: {
        type: TransportType.SMTP,
        host: 'smtp.example.com',
        auth: { user: 'u', pass: 'p' },
      },
      providers: [
        {
          provide: MAIL_EVENT_EMITTER,
          useExisting: EventEmitter2,
        },
      ],
    }),
  ],
})
export class AppModule {}
```

Available constants/events:

- `MAIL_SENT_EVENT` (`mail.sent`)
- `MAIL_FAILED_EVENT` (`mail.failed`)
- `MAIL_BATCH_COMPLETED_EVENT` (`mail.batch.completed`)

## Testing

### Unified mock support (recommended)

```ts
import { createMailMockSupport } from 'nestjs-mailable/testing';

const { mailService, server } = createMailMockSupport();

await mailService.to('user@example.com').send({
  subject: 'Welcome',
  html: '<p>Hello</p>',
});

server.assertSentCount(1);
expect(server.getSentMails()[0].content.subject).toBe('Welcome');
```

### Other helpers

`nestjs-mailable/testing` also exports:

- Mail service mocks (`createMailServiceMock`, variants for errors/sequential responses)
- Transport mocks (`createSmtpTransportMock`, `createSESTransportMock`, `createMailgunTransportMock`, `createMailjetTransportMock`)
- Nest test module builders (`createTestModuleWithMockedMailService`, `TestModuleBuilder`)

## Troubleshooting

### Unsupported transport type

Only these transport types are currently available:

- `TransportType.SMTP`
- `TransportType.SES`
- `TransportType.MAILGUN`
- `TransportType.MAILJET`

### Template engine errors

Use one of the supported runtime engines configured in `templates.engine`:

- `handlebars`
- `ejs`
- `pug`

### Email not rendering template

If you call `mailService.send()` with a raw content object, use:

- `template` + `context` (not `with`)

For class-based mailables, return:

- `template` + `with` from `content()`

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, workflow, and pull request guidelines.

## Links

- Documentation: https://mahmudulazamshohan.github.io/nestjs-mailable
- Examples: https://github.com/Mahmudulazamshohan/nestjs-mailable/tree/main/examples
- Issues: https://github.com/Mahmudulazamshohan/nestjs-mailable/issues

## License

MIT. See [LICENSE](./LICENSE).
