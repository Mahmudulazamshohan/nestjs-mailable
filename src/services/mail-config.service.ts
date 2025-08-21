import { Injectable } from '@nestjs/common';
import {
  MailConfiguration,
  TransportConfiguration,
  TemplateConfiguration,
  Address,
} from '../interfaces/mail.interface';
import { TransportType } from '../types/transport.type';
import { TEMPLATE_ENGINE } from '../constants/template.constants';

@Injectable()
export class MailConfigService {
  private config: MailConfiguration;

  constructor(config?: MailConfiguration) {
    this.config = config || this.getDefaultConfig();
  }

  setConfig(config: MailConfiguration): void {
    this.config = config;
  }

  getConfig(): MailConfiguration {
    return this.config;
  }

  getTransportConfig(): TransportConfiguration {
    return this.config.transport;
  }

  getGlobalFrom(): Address | undefined {
    return this.config.from;
  }

  getGlobalReplyTo(): Address | false | undefined {
    return this.config.replyTo;
  }

  getTemplateConfig(): TemplateConfiguration | undefined {
    return this.config.templates;
  }

  private getDefaultConfig(): MailConfiguration {
    return {
      transport: {
        type: TransportType.SMTP,
        host: process.env.MAIL_HOST || 'localhost',
        port: parseInt(process.env.MAIL_PORT || '587'),
        secure: process.env.MAIL_SECURE === 'true',
        auth: {
          user: process.env.MAIL_USERNAME || '',
          pass: process.env.MAIL_PASSWORD || '',
        },
      },
      from: {
        address: process.env.MAIL_FROM_ADDRESS || 'hello@example.com',
        name: process.env.MAIL_FROM_NAME || 'Example App',
      },
      templates: {
        engine: TEMPLATE_ENGINE.HANDLEBARS,
        directory: './templates',
      },
    };
  }
}
