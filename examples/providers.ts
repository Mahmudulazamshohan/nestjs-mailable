import { Module, Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MailModule, MailService, Mailable } from '../dist';

// 1. SMTP Configuration Mailable
class SMTPMailable extends Mailable {
  constructor(private readonly data: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject('SMTP Provider Test').view('smtp-template.hbs', this.data).with('provider', 'SMTP');
    return super.build();
  }
}

// 2. SES Configuration Mailable
class SESMailable extends Mailable {
  constructor(private readonly data: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject('AWS SES Provider Test')
      .view('aws-ses-template.hbs', this.data)
      .with('provider', 'AWS SES')
      .tag('aws-email')
      .metadata('region', 'us-east-1');
    return super.build();
  }
}

// 3. Mailgun Configuration Mailable
class MailgunMailable extends Mailable {
  constructor(private readonly data: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject('Mailgun Provider Test')
      .view('mailgun-template.hbs', this.data)
      .with('provider', 'Mailgun')
      .tag('mailgun-email')
      .metadata('campaign', 'provider-test');
    return super.build();
  }
}

// 4. Multi-Provider Service
@Injectable()
class MultiProviderService {
  constructor(private readonly mailService: MailService) {}

  async sendViaSMTP() {
    const smtpService = this.mailService.mailer('smtp');
    const data = { message: 'Sent via SMTP provider' };
    const mailable = new SMTPMailable(data);

    const sender = await smtpService.to('smtp-test@example.com');
    return await sender.send(mailable);
  }

  async sendViaSES() {
    const sesService = this.mailService.mailer('ses');
    const data = { message: 'Sent via AWS SES provider' };
    const mailable = new SESMailable(data);

    const sender = await sesService.to('ses-test@example.com');
    return await sender.send(mailable);
  }

  async sendViaMailgun() {
    const mailgunService = this.mailService.mailer('mailgun');
    const data = { message: 'Sent via Mailgun provider' };
    const mailable = new MailgunMailable(data);

    const sender = await mailgunService.to('mailgun-test@example.com');
    return await sender.send(mailable);
  }

  async sendWithFailover() {
    // Try multiple providers in sequence
    const providers = ['smtp', 'ses', 'mailgun'];
    const data = { message: 'Failover test email' };

    for (const provider of providers) {
      try {
        console.log(`Attempting to send via ${provider}...`);
        const service = this.mailService.mailer(provider);

        const content = {
          subject: `Failover Test - ${provider.toUpperCase()}`,
          html: `<h1>Email sent via ${provider}</h1><p>${data.message}</p>`,
        };

        const sender = await service.to('failover-test@example.com');
        const result = await sender.send(content);

        console.log(`✓ Successfully sent via ${provider}`);
        return result;
      } catch (error) {
        console.log(`✗ Failed to send via ${provider}: ${error.message}`);
        continue;
      }
    }

    throw new Error('All providers failed');
  }

  async demonstrateProviders() {
    try {
      console.log('=== Multi-Provider Examples ===');

      console.log('Testing SMTP provider...');
      await this.sendViaSMTP();
      console.log('✓ SMTP provider test completed');

      console.log('Testing AWS SES provider...');
      await this.sendViaSES();
      console.log('✓ AWS SES provider test completed');

      console.log('Testing Mailgun provider...');
      await this.sendViaMailgun();
      console.log('✓ Mailgun provider test completed');

      console.log('Testing failover mechanism...');
      await this.sendWithFailover();
      console.log('✓ Failover test completed');
    } catch (error) {
      console.error('Provider test error:', error);
    }
  }
}

// 5. Multiple Configuration Module
@Module({
  imports: [
    MailModule.forRoot({
      config: {
        default: 'smtp',
        mailers: {
          // SMTP Configuration
          smtp: {
            transport: 'smtp',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: 'your-email@gmail.com',
              pass: 'your-app-password',
            },
          },

          // AWS SES Configuration
          ses: {
            transport: 'ses',
            options: {
              accessKeyId: 'your-access-key-id',
              secretAccessKey: 'your-secret-access-key',
              region: 'us-east-1',
            },
          },

          // Mailgun Configuration
          mailgun: {
            transport: 'mailgun',
            options: {
              apiKey: 'your-mailgun-api-key',
              domain: 'your-domain.com',
            },
          },
        },
        from: {
          address: 'noreply@example.com',
          name: 'Multi-Provider Example',
        },
      },
    }),
  ],
  providers: [MultiProviderService],
})
class MultiProviderModule {}

// 6. Async Configuration Example
@Injectable()
class ConfigService {
  getMailConfig() {
    return {
      default: 'smtp',
      mailers: {
        smtp: {
          transport: 'smtp',
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
        ses: {
          transport: 'ses',
          options: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1',
          },
        },
      },
      from: {
        address: process.env.MAIL_FROM_ADDRESS || 'noreply@example.com',
        name: process.env.MAIL_FROM_NAME || 'Example App',
      },
    };
  }
}

@Module({
  imports: [
    MailModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        return configService.getMailConfig();
      },
      inject: [ConfigService],
      providers: [ConfigService],
    }),
  ],
  providers: [MultiProviderService, ConfigService],
})
class AsyncConfigModule {}

// 7. Example Runner
async function providerExample() {
  const app = await NestFactory.create(MultiProviderModule);
  const multiProviderService = app.get(MultiProviderService);

  try {
    await multiProviderService.demonstrateProviders();
    console.log('✓ All provider examples completed successfully!');
  } catch (error) {
    console.error('✗ Provider example error:', error.message);
  }

  await app.close();
}

// 8. Async Configuration Example Runner
async function asyncConfigExample() {
  // Set environment variables for demo
  process.env.SMTP_HOST = 'smtp.gmail.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'your-email@gmail.com';
  process.env.SMTP_PASS = 'your-app-password';
  process.env.MAIL_FROM_ADDRESS = 'async@example.com';
  process.env.MAIL_FROM_NAME = 'Async Config Example';

  const app = await NestFactory.create(AsyncConfigModule);
  const multiProviderService = app.get(MultiProviderService);

  try {
    console.log('=== Async Configuration Example ===');

    const content = {
      subject: 'Async Configuration Test',
      html: '<h1>This email was sent using async configuration!</h1>',
    };

    const sender = await multiProviderService.mailService.to('async-test@example.com');
    await sender.send(content);

    console.log('✓ Async configuration example completed successfully!');
  } catch (error) {
    console.error('✗ Async configuration error:', error.message);
  }

  await app.close();
}

// Export for testing
export {
  providerExample,
  asyncConfigExample,
  SMTPMailable,
  SESMailable,
  MailgunMailable,
  MultiProviderService,
  MultiProviderModule,
  AsyncConfigModule,
  ConfigService,
};

// Run if called directly
if (require.main === module) {
  const example = process.argv[2];

  if (example === 'async') {
    asyncConfigExample();
  } else {
    providerExample();
  }
}
