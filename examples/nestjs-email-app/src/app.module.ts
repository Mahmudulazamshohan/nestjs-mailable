import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailModule, TEMPLATE_ENGINE, TransportType } from '../../../dist';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailController } from './email/email.controller';
import { EmailService } from './email/email.service';
import * as path from 'path';

const getTemplateEngine = () => {
  const engine = process.env.MAIL_TEMPLATE_ENGINE?.toLowerCase();
  switch (engine) {
    case 'ejs':
      return TEMPLATE_ENGINE.EJS;
    case 'pug':
      return TEMPLATE_ENGINE.PUG;
    case 'handlebars':
    default:
      return TEMPLATE_ENGINE.HANDLEBARS;
  }
};

const getTransportConfig = () => {
  const transportType = process.env.MAIL_TRANSPORT?.toLowerCase() || 'smtp';

  switch (transportType) {
    case 'ses': {
      const region = process.env.SES_REGION || 'us-east-1';
      const sesConfig: any = {
        type: TransportType.SES,
        region: region,
        host: process.env.MAIL_HOST || `email-smtp.${region}.amazonaws.com`,
        port: parseInt(process.env.MAIL_PORT || '587'),
        secure: process.env.MAIL_SECURE === 'true',
        credentials: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        },
      };

      // Only set endpoint if explicitly provided (for LocalStack/mock)
      if (process.env.SES_ENDPOINT) {
        sesConfig.endpoint = process.env.SES_ENDPOINT;
      } else if (!process.env.AWS_PROFILE && sesConfig.credentials.accessKeyId === 'test') {
        // If no AWS profile and using default test credentials, assume LocalStack
        sesConfig.endpoint = 'http://localhost:4566';
      }

      return sesConfig;
    }
    case 'mailgun':
      return {
        type: TransportType.MAILGUN,
        options: {
          domain: process.env.MAILGUN_DOMAIN || 'test-domain.com',
          apiKey: process.env.MAILGUN_API_KEY || 'test-api-key',
          host: process.env.MAILGUN_HOST || 'localhost:3001',
          protocol: process.env.MAILGUN_PROTOCOL || 'http:',
        },
      };
    case 'smtp':
    default:
      return {
        type: TransportType.SMTP,
        host: process.env.MAIL_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.MAIL_PORT || '587'),
        secure: process.env.MAIL_SECURE === 'true',
        ignoreTLS: process.env.MAIL_IGNORE_TLS === 'true',
        auth: {
          user: process.env.MAIL_USERNAME || 'princess.stanton@ethereal.email',
          pass: process.env.MAIL_PASSWORD || 'kfakfxczrwCwVyvwgW',
        },
      };
  }
};

const getTemplateConfig = () => {
  const engine = getTemplateEngine();

  const baseConfig: any = {
    engine,
    directory: path.join(__dirname, './email/templates'),
  };

  switch (engine) {
    case TEMPLATE_ENGINE.HANDLEBARS:
      return {
        ...baseConfig,
        partials: {
          header: './partials/header',
          footer: './partials/footer',
        },
        options: {
          helpers: {
            currency: (amount: number) => `$${(amount || 0).toFixed(2)}`,
            formatDate: (date: Date) => (date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString()),
            uppercase: (str: string) => (str || '').toString().toUpperCase(),
          },
        },
      };
    case TEMPLATE_ENGINE.EJS:
      return baseConfig;
    case TEMPLATE_ENGINE.PUG:
      return {
        ...baseConfig,
        options: {
          pretty: true,
        },
      };
    default:
      return baseConfig;
  }
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailModule.forRoot({
      transport: getTransportConfig(),
      from: {
        address: process.env.MAIL_FROM_ADDRESS || 'noreply@yourapp.com',
        name: process.env.MAIL_FROM_NAME || 'Your App',
      },
      replyTo: {
        address: process.env.MAIL_REPLY_TO || 'support@yourapp.com',
        name: process.env.MAIL_FROM_NAME || 'Your App Support',
      },
      templates: getTemplateConfig(),
    }),
  ],
  controllers: [AppController, EmailController],
  providers: [AppService, EmailService],
})
export class AppModule {}
