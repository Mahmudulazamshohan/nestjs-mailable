import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule, TEMPLATE_ENGINE, TransportType, MailConfiguration } from '../../../../dist';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Example with forRootAsync using useFactory
    MailModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService): Promise<MailConfiguration> => ({
        transport: {
          type: TransportType.SMTP,
          host: configService.get('MAIL_HOST', 'localhost'),
          port: configService.get('MAIL_PORT', 1025),
          ignoreTLS: configService.get('MAIL_IGNORE_TLS', true),
          secure: configService.get('MAIL_SECURE', false),
          auth: {
            user: configService.get('MAIL_USERNAME') || '',
            pass: configService.get('MAIL_PASSWORD') || '',
          },
        },
        from: {
          address: configService.get('MAIL_FROM_ADDRESS', 'noreply@yourapp.com'),
          name: configService.get('MAIL_FROM_NAME', 'Your App'),
        },
        replyTo: {
          address: configService.get('MAIL_REPLY_TO_ADDRESS', 'support@yourapp.com'),
          name: configService.get('MAIL_REPLY_TO_NAME', 'Your App Support'),
        },
        templates: {
          engine: configService.get('TEMPLATE_ENGINE', TEMPLATE_ENGINE.HANDLEBARS) as any,
          directory: path.join(__dirname, '../email/templates'),
          partials: {
            header: './partials/header',
            footer: './partials/footer',
          },
          options: {
            helpers: {
              currency: (amount: number) => `$${amount.toFixed(2)}`,
              formatDate: (date: Date) => date.toLocaleDateString(),
            },
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class ForRootAsyncExampleModule {}
