---
sidebar_position: 2
---

# Configuration

Learn how to configure NestJS Mailable for different environments and transport providers.

## Module Configuration

### Basic Configuration

```typescript
import { MailModule, TransportType, TEMPLATE_ENGINE } from 'nestjs-mailable';

@Module({
  imports: [
    MailModule.forRoot({
      transport: {
        type: TransportType.SMTP,
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
        secure: false,
        auth: {
          user: 'test',
          pass: 'test'
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
  ],
})
export class AppModule {}
```

### Async Configuration

For dynamic configuration using environment variables or external services:

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailConfiguration } from 'nestjs-mailable';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<MailConfiguration> => ({
        transport: {
          type: configService.get('MAIL_TRANSPORT', TransportType.SMTP),
          host: configService.get('MAIL_HOST'),
          port: configService.get('MAIL_PORT', 587),
          secure: configService.get('MAIL_SECURE') === 'true',
          auth: {
            user: configService.get('MAIL_USERNAME'),
            pass: configService.get('MAIL_PASSWORD'),
          },
        },
        from: {
          address: configService.get('MAIL_FROM_ADDRESS'),
          name: configService.get('MAIL_FROM_NAME'),
        },
        templates: {
          engine: configService.get('TEMPLATE_ENGINE', TEMPLATE_ENGINE.HANDLEBARS) as any,
          directory: path.join(__dirname, '../templates'),
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
  transport: {
    type: TransportType.SMTP,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password' // Use app-specific password for Gmail
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

The SES transport automatically uses the appropriate method based on your environment:
- **Production AWS SES**: Uses nodemailer with SMTP credentials (`email-smtp.{region}.amazonaws.com:587`)
- **LocalStack/Mock**: Uses AWS SDK when endpoint contains `localhost`, `127.0.0.1`, or `4566`

#### Production AWS SES (Recommended)

```typescript
{
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    host: 'email-smtp.us-east-1.amazonaws.com', // Optional: auto-generated if not provided
    port: 587, // Optional: defaults to 587
    secure: false, // Optional: defaults to false
    credentials: {
      user: process.env.MAIL_USERNAME, // SES SMTP username
      pass: process.env.MAIL_PASSWORD, // SES SMTP password
    }
  }
}
```

> **Note**: For production AWS SES, use SMTP credentials (`user` and `pass`) obtained from IAM user with SES sending permissions. The transport uses nodemailer SMTP which connects to `email-smtp.{region}.amazonaws.com:587` with TLS.

#### LocalStack/Mock Development

```typescript
{
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    endpoint: 'http://localhost:4566', // Triggers AWS SDK mode
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    }
  }
}
```

### Mailgun Transport

For transactional emails with Mailgun's reliable delivery.

```typescript
{
  transport: {
    type: TransportType.MAILGUN,
    options: {
      apiKey: 'your-mailgun-api-key',
      domain: 'your-domain.com',
      host: 'api.mailgun.net' // or 'api.eu.mailgun.net' for EU
    }
  }
}
```

### Resend Transport

For modern, developer-friendly email delivery with excellent deliverability.

```typescript
{
  transport: {
    type: TransportType.RESEND,
    apiKey: process.env.RESEND_API_KEY
  }
}
```

**Environment Variables:**
```bash
RESEND_API_KEY=re_xxxxxxxxx
```

> **Note**: Resend requires domain verification. In test mode, you can only send to your own verified email. For production, verify your domain at [resend.com/domains](https://resend.com/domains) and use a from address with that verified domain.

## Single Transport Configuration (v1.1+)

The new v1.1+ configuration format focuses on single transport per module instance:

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password'
    }
  },
  from: {
    address: 'noreply@yourapp.com',
    name: 'Your App'
  }
})
```

Use the configured transport in your service:

```typescript
@Injectable()
export class EmailService {
  constructor(private mailService: MailService) {}

  async sendWelcomeEmail(user: User) {
    await this.mailService
      .to({ address: user.email })
      .send({
        subject: 'Welcome!',
        html: '<p>Welcome to our platform!</p>'
      });
  }

  async sendTemplateEmail(user: User) {
    await this.mailService
      .to({ address: user.email })
      .send({
        subject: 'Special Offer!',
        template: 'marketing/offer',
        context: { userName: user.name }
      });
  }
}
```

## Environment Variables

Create a `.env` file for your configuration:

```bash
# Mail Configuration
MAIL_TRANSPORT=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_SECURE=false
MAIL_FROM_ADDRESS=noreply@yourapp.com
MAIL_FROM_NAME="Your App Name"

# Template Configuration
TEMPLATE_ENGINE=handlebars

# SES Configuration (if using SES)
SES_REGION=us-east-1
MAIL_HOST=email-smtp.us-east-1.amazonaws.com
MAIL_PORT=587
MAIL_USERNAME=your-ses-smtp-username
MAIL_PASSWORD=your-ses-smtp-password
MAIL_SECURE=false

# Mailgun Configuration (if using Mailgun)
MAILGUN_DOMAIN=your-domain.com
MAILGUN_SECRET=your-mailgun-api-key

# Resend Configuration (if using Resend)
RESEND_API_KEY=re_xxxxxxxxx
```

## Template Configuration

Configure template engines for your emails:

```typescript
MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    // ... transport config
  },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS, // or TEMPLATE_ENGINE.EJS, TEMPLATE_ENGINE.PUG
    directory: './templates',
    partials: {
      header: './templates/partials/header',
      footer: './templates/partials/footer'
    },
    options: {
      helpers: {
        uppercase: (str: string) => str.toUpperCase(),
        currency: (amount: number) => `$${amount.toFixed(2)}`,
        formatDate: (date: Date) => date.toLocaleDateString()
      }
    }
  }
})
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

### Testing Configuration
```typescript
// Use fake transport for testing
MailModule.forRoot({
  transport: {
    type: 'fake' as any, // For testing
  },
  from: {
    address: 'test@example.com',
    name: 'Test App'
  }
})
```