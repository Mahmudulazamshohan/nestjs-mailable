---
sidebar_position: 1
---

# Getting Started

NestJS Mailable is a simple and powerful email package for NestJS applications. Send emails using multiple transports (SMTP, SES, Mailgun) with template support and easy testing.

## Quick Start

### 1. Install

```bash
npm install nestjs-mailable
```

### 2. Import Module

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
          pass: 'your-password'
        }
      },
      from: {
        address: 'noreply@yourapp.com',
        name: 'Your App'
      },
      templates: {
        engine: TEMPLATE_ENGINE.HANDLEBARS,
        directory: './templates'
      }
    })
  ]
})
export class AppModule {}
```

### 3. Send Your First Email

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from 'nestjs-mailable';

@Injectable()
export class UserService {
  constructor(private mailService: MailService) {}

  async sendWelcome() {
    await this.mailService.to('user@example.com').send({
      subject: 'Welcome!',
      html: '<h1>Welcome to our app!</h1>'
    });
  }
}
```

## Three Ways to Send Emails

### 1. Direct Content (Simple)

```typescript
// Send HTML email directly
await this.mailService.send({
  to: 'user@example.com',
  subject: 'Hello!',
  html: '<p>Hello World!</p>'
});
```

### 2. Fluent API (Flexible)

```typescript
// Chain methods for complex emails
await this.mailService
  .to('user@example.com')
  .cc('manager@example.com')
  .bcc('admin@example.com')
  .send({
    subject: 'Team Update',
    template: 'team-update',
    context: { teamName: 'Development' }
  });
```

### 3. Mailable Classes (Advanced)

Choose between **Legacy Mailables** (simple) or **Advanced Mailables** (Laravel-style):

#### Legacy Mailable (Simple)
```typescript
import { Mailable } from 'nestjs-mailable';

export class WelcomeMail extends Mailable {
  constructor(private user: any) {
    super();
  }

  build() {
    return this.subject(`Welcome ${this.user.name}!`)
      .view('welcome', { user: this.user })
      .tag('welcome');
  }
}

// Usage
await this.mailService.send(new WelcomeMail(user));
```

#### Advanced Mailable (Laravel-style)
```typescript
import { Mailable as AdvancedMailable, MailableEnvelope, MailableContent } from 'nestjs-mailable';

export class WelcomeMail extends AdvancedMailable {
  constructor(private user: any) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: `Welcome ${this.user.name}!`,
      tags: ['welcome', 'onboarding']
    };
  }

  content(): MailableContent {
    return {
      template: 'emails/welcome',
      with: { user: this.user }
    };
  }
}

// Usage
await this.mailService.to(user.email).send(new WelcomeMail(user));
```

## Features

- **Multiple Transports**: SMTP, Amazon SES, Mailgun
- **Template Engines**: Handlebars, EJS, Pug
- **Two Mailable Styles**: Simple legacy or advanced Laravel-style  
- **Fluent API**: Chain methods for complex emails
- **Testing Support**: Built-in fake mailer for testing
- **Attachments**: File, data, and storage attachments
- **TypeScript**: Full type support

## What's Next?

- **[Configuration](./configuration)** - Set up transports and templates
- **[Basic Usage](./basic-usage)** - Learn the three sending methods
- **[Mailable Classes](./mailables)** - Create reusable email classes
- **[Templates](./templates)** - Use template engines
- **[Testing](./testing)** - Test your emails