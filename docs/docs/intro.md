---
sidebar_position: 1
---

# NestJS Mailable

A comprehensive NestJS mail package with modern design patterns for seamless, scalable email handling in enterprise applications.

## Features

- 🚀 **Object-oriented Mailable classes** - Clean, testable email composition
- 📧 **Multiple transport support** - SMTP, SES, Mailgun out of the box
- 🎨 **Template engines** - Handlebars, EJS, Pug, Markdown, MJML support
- 🔄 **Async processing** - Background email processing support
- 🧪 **Testing utilities** - MailFake for easy testing
- 📊 **Built-in metrics** - Email tracking and analytics
- 🎯 **Fluent API** - Intuitive email building interface

## Quick Start

### Installation

```bash
npm install nestjs-mailable
```

### Basic Setup

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
              pass: 'your-app-password'
            }
          }
        },
        from: {
          address: 'noreply@yourapp.com',
          name: 'Your App Name'
        }
      }
    })
  ],
})
export class AppModule {}
```

### Send Your First Email

#### Using Fluent API

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from 'nestjs-mailable';

@Injectable()
export class UserService {
  constructor(private mailService: MailService) {}

  async sendWelcomeEmail(user: { email: string; name: string }) {
    await this.mailService
      .to({ address: user.email, name: user.name })
      .subject(`Welcome ${user.name}!`)
      .html(`<h1>Welcome to our platform!</h1>
             <p>Hi ${user.name}, thanks for joining us.</p>`)
      .tag('welcome')
      .tag('onboarding')
      .send();
  }
}
```

#### Using Mailable Classes

```typescript
import { Mailable } from 'nestjs-mailable';

export class WelcomeMail extends Mailable {
  constructor(private user: { email: string; name: string }) {
    super();
  }

  protected build() {
    return this
      .to({ address: this.user.email, name: this.user.name })
      .subject(`Welcome ${this.user.name}!`)
      .view('emails.welcome', {
        userName: this.user.name,
        appName: 'Your App',
        loginUrl: 'https://yourapp.com/login'
      })
      .tag('welcome');
  }
}

// Usage in service
@Injectable()
export class UserService {
  constructor(private mailService: MailService) {}

  async sendWelcomeEmail(user: { email: string; name: string }) {
    const welcomeMail = new WelcomeMail(user);
    await this.mailService.send(welcomeMail);
  }
}
```

#### Using Templates

Create a template file `templates/emails/welcome.hbs`:

```handlebars
<!DOCTYPE html>
<html>
<head>
    <title>Welcome {{userName}}!</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to {{appName}}!</h1>
    </div>
    <div class="content">
        <p>Hello {{userName}},</p>
        <p>Thank you for joining {{appName}}. We're excited to have you on board!</p>
        <p>
            <a href="{{loginUrl}}" class="button">Get Started</a>
        </p>
    </div>
</body>
</html>
```

## What's Next?

- 📖 **[Configuration Guide](./configuration)** - Set up different mail transports
- 🏗️ **[Mailable Classes](./mailables)** - Create reusable email templates
- 🧪 **[Testing](./testing)** - Test your emails effectively
- 🚀 **[Advanced Features](./advanced)** - Templates, monitoring, and more

## Why Choose NestJS Mailable?

### Modern Design Patterns
Built with proven design patterns for elegant and maintainable email handling, following NestJS best practices.

### Production Ready
Comprehensive error handling, retry mechanisms, and monitoring capabilities for enterprise applications.

### Developer Experience
Type-safe APIs, extensive documentation, and debugging tools make development a breeze.

### Flexible Architecture
Modular design allows you to use only what you need, with easy extensibility for custom requirements.