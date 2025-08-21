import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailModule, TEMPLATE_ENGINE, TransportType } from '../../../../dist';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Example with Amazon SES Transport (LocalStack for testing)
    MailModule.forRoot({
      transport: {
        type: TransportType.SES,
        endpoint: process.env.SES_ENDPOINT || 'http://localhost:4566',
        region: process.env.SES_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.SES_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.SES_SECRET_ACCESS_KEY || 'test',
        },
      },
      from: {
        address: 'noreply@yourapp.com',
        name: 'Your App',
      },
      replyTo: {
        address: 'support@yourapp.com',
        name: 'Your App Support',
      },
      templates: {
        engine: TEMPLATE_ENGINE.HANDLEBARS,
        directory: path.join(__dirname, '../email/templates'),
        partials: {
          header: './partials/header',
          footer: './partials/footer',
        },
        options: {
          helpers: {
            currency: (amount: number) => `$${amount.toFixed(2)}`,
            formatDate: (date: Date) => date.toLocaleDateString(),
            uppercase: (str: string) => str.toUpperCase(),
          },
        },
      },
    }),
  ],
})
export class SESExampleModule {}
