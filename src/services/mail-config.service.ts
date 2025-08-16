import { Injectable } from '@nestjs/common';
import { MailConfiguration, MailerConfig } from '../interfaces/mail.interface';

@Injectable()
export class MailConfigService {
  private config: MailConfiguration;
  getTemplateConfig: any;

  constructor(config?: MailConfiguration) {
    this.config = config || this.getDefaultConfig();
  }

  setConfig(config: MailConfiguration): void {
    this.config = config;
  }

  getConfig(): MailConfiguration {
    return this.config;
  }

  getDefaultMailer(): string {
    return this.config.default;
  }

  getMailerConfig(name?: string): MailerConfig {
    const mailerName = name || this.config.default;
    const mailerConfig = this.config.mailers[mailerName];

    if (!mailerConfig) {
      throw new Error(`Mailer configuration for '${mailerName}' not found`);
    }

    return mailerConfig;
  }

  getGlobalFrom(): { address: string; name?: string } | undefined {
    return this.config.from;
  }

  getGlobalReplyTo(): { address: string; name?: string } | undefined {
    return this.config.replyTo;
  }

  private getDefaultConfig(): MailConfiguration {
    return {
      default: 'smtp',
      mailers: {
        smtp: {
          transport: 'smtp',
          host: process.env.MAIL_HOST || 'localhost',
          port: parseInt(process.env.MAIL_PORT || '587'),
          secure: process.env.MAIL_SECURE === 'true',
          auth: {
            user: process.env.MAIL_USERNAME || '',
            pass: process.env.MAIL_PASSWORD || '',
          },
        },
      },
      from: {
        address: process.env.MAIL_FROM_ADDRESS || 'hello@example.com',
        name: process.env.MAIL_FROM_NAME || 'Example App',
      },
    };
  }
}
