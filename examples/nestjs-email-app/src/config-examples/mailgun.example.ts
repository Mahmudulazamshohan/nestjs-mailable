import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailModule, TEMPLATE_ENGINE, TransportType } from '../../../../dist';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Example with Mailgun Transport (supports mock server for development)
    MailModule.forRoot({
      transport: {
        type: TransportType.MAILGUN,
        options: {
          domain: process.env.MAILGUN_DOMAIN || 'mg.yourdomain.com',
          apiKey: process.env.MAILGUN_API_KEY || 'your-mailgun-api-key',
          // For mock server (development/testing)
          host: process.env.MAILGUN_HOST || undefined, // Use 'localhost:3001' for mock
          protocol: process.env.MAILGUN_PROTOCOL || undefined, // Use 'http:' for mock
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
        engine: TEMPLATE_ENGINE.PUG,
        directory: path.join(__dirname, '../email/templates'),
        options: {
          // Pug specific options
          pretty: false,
          compileDebug: false,
        },
      },
    }),
  ],
})
export class MailgunExampleModule {}
