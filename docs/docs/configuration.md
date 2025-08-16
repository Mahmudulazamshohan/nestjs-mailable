---
sidebar_position: 2
---

# Configuration

Learn how to configure NestJS Mailable for different environments and transport providers.

## Module Configuration

### Basic Configuration

```typescript
import { MailModule } from 'nestjs-mailable';

@Module({
  imports: [
    MailModule.forRoot({
      config: {
        default: 'smtp', // Default mailer to use
        mailers: {
          // Define your mailers here
        },
        from: {
          address: 'noreply@yourapp.com',
          name: 'Your App'
        }
      }
    })
  ],
})
export class AppModule {}
```

### Async Configuration

For dynamic configuration using environment variables or external services:

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        default: configService.get('MAIL_MAILER', 'smtp'),
        mailers: {
          smtp: {
            transport: 'smtp',
            host: configService.get('MAIL_HOST'),
            port: configService.get('MAIL_PORT', 587),
            secure: configService.get('MAIL_SECURE') === 'true',
            auth: {
              user: configService.get('MAIL_USERNAME'),
              pass: configService.get('MAIL_PASSWORD'),
            },
          },
        },
        from: {
          address: configService.get('MAIL_FROM_ADDRESS'),
          name: configService.get('MAIL_FROM_NAME'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
```

## Transport Providers

### SMTP Transport

Perfect for most email providers like Gmail, Outlook, or custom SMTP servers.

```typescript
{
  mailers: {
    smtp: {
      transport: 'smtp',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password' // Use app-specific password for Gmail
      },
      // Optional: Connection pool settings
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    }
  }
}
```

#### Common SMTP Providers

**Gmail:**
```typescript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
}
```

**Outlook/Hotmail:**
```typescript
{
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@outlook.com',
    pass: 'your-password'
  }
}
```

**SendGrid:**
```typescript
{
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: 'your-sendgrid-api-key'
  }
}
```

### Amazon SES Transport

For high-volume email sending with AWS Simple Email Service.

```typescript
{
  mailers: {
    ses: {
      transport: 'ses',
      options: {
        accessKeyId: 'your-access-key',
        secretAccessKey: 'your-secret-key',
        region: 'us-east-1',
        // Optional: Custom SES configuration
        apiVersion: '2010-12-01'
      }
    }
  }
}
```

### Mailgun Transport

For transactional emails with Mailgun's reliable delivery.

```typescript
{
  mailers: {
    mailgun: {
      transport: 'mailgun',
      options: {
        apiKey: 'your-mailgun-api-key',
        domain: 'your-domain.com',
        host: 'api.mailgun.net', // or 'api.eu.mailgun.net' for EU
        // Optional: Additional settings
        testMode: false
      }
    }
  }
}
```

## Multiple Mailers

Configure multiple mailers for different purposes:

```typescript
{
  default: 'smtp',
  mailers: {
    smtp: {
      transport: 'smtp',
      host: 'smtp.gmail.com',
      // ... SMTP config
    },
    transactional: {
      transport: 'ses',
      options: {
        // ... SES config for transactional emails
      }
    },
    marketing: {
      transport: 'mailgun',
      options: {
        // ... Mailgun config for marketing emails
      }
    }
  }
}
```

Use different mailers in your service:

```typescript
@Injectable()
export class EmailService {
  constructor(private mailService: MailService) {}

  async sendWelcomeEmail(user: User) {
    // Uses default mailer (smtp)
    await this.mailService.send({
      to: { address: user.email },
      subject: 'Welcome!',
      html: '<p>Welcome to our platform!</p>'
    });
  }

  async sendMarketingEmail(user: User) {
    // Uses specific mailer
    const marketingMailer = this.mailService.mailer('marketing');
    await marketingMailer.send({
      to: { address: user.email },
      subject: 'Special Offer!',
      html: '<p>Check out our latest offers!</p>'
    });
  }
}
```

## Environment Variables

Create a `.env` file for your configuration:

```bash
# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourapp.com
MAIL_FROM_NAME="Your App Name"

# SES Configuration (if using SES)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1

# Mailgun Configuration (if using Mailgun)
MAILGUN_DOMAIN=your-domain.com
MAILGUN_SECRET=your-mailgun-api-key
```

## Template Configuration

Configure template engines for your emails:

```typescript
{
  config: {
    // ... other config
    templates: {
      engine: 'handlebars', // or 'ejs', 'pug', 'mjml'
      directory: './templates',
      options: {
        // Engine-specific options
        partials: './templates/partials',
        helpers: {
          uppercase: (str: string) => str.toUpperCase()
        }
      }
    }
  }
}
```

## Production Considerations

### Security
- Use environment variables for sensitive data
- Enable SSL/TLS for SMTP connections
- Use app-specific passwords for Gmail
- Rotate API keys regularly

### Performance
- Enable connection pooling for SMTP
- Implement rate limiting for high volume sending
- Monitor email delivery rates
- Set up proper error handling and retries

### Monitoring
```typescript
{
  config: {
    // ... other config
    monitoring: {
      enabled: true,
      trackDelivery: true,
      trackOpens: true,
      trackClicks: true
    }
  }
}
```