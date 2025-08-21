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
    case 'ses':
      return {
        type: TransportType.SES,
        endpoint: process.env.SES_ENDPOINT || 'http://localhost:4566',
        region: process.env.SES_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.SES_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.SES_SECRET_ACCESS_KEY || 'test',
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
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
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
            currency: (amount: number) => `${amount.toFixed(2)}`,
            formatDate: (date: Date) => date.toLocaleDateString(),
            uppercase: (str: string) => str.toUpperCase(),
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
