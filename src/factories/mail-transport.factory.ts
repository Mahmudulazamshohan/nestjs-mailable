import { Injectable } from '@nestjs/common';
import { MailTransport, MailerConfig, MailgunMailerOptions } from '../interfaces/mail.interface';
import { SmtpTransport } from '../transports/smtp.transport';

import { SesTransport } from '../transports/ses.transport';
import { MailgunTransport } from '../transports/mailgun.transport';
import { TransportType } from '../types/transport.type';

// Factory Pattern Implementation
@Injectable()
export class MailTransportFactory {
  private customTransports = new Map<string, () => MailTransport>();

  createTransport(config: MailerConfig): MailTransport {
    switch (config.transport) {
      case TransportType.SMTP:
        return new SmtpTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: config.auth,
          ...config.options,
        });
      case TransportType.SES:
        // SES transport support
        if (!config.options) {
          throw new Error('SES transport requires options configuration');
        }
        // Assuming SesTransport is imported and available
        return new SesTransport(config.options);
      case TransportType.MAILGUN:
        // Mailgun transport support
        if (!config.options) {
          throw new Error('Mailgun transport requires options configuration');
        }
        return new MailgunTransport(config as MailerConfig);
      default:
        throw new Error(`Unsupported transport type: ${config.transport}`);
    }
  }

  registerCustomTransport(name: string, factory: () => MailTransport): void {
    this.customTransports.set(name, factory);
  }

  // Transport Strategy Pattern
  getAvailableTransports(): TransportType[] {
    return [TransportType.SMTP, TransportType.SMTP, TransportType.MAILGUN];
  }

  // Builder method for complex transport configurations
  buildTransportChain(): TransportChainBuilder {
    return new TransportChainBuilder(this);
  }
}

export class TransportChainBuilder {
  private transports: (() => MailTransport)[] = [];

  constructor(private factory: MailTransportFactory) {}

  addSmtp(config: any): TransportChainBuilder {
    this.transports.push(() => new SmtpTransport(config));
    return this;
  }

  addSes(config: any): TransportChainBuilder {
    this.transports.push(() => new SesTransport(config));
    return this;
  }

  addMailgun(config: MailgunMailerOptions): TransportChainBuilder {
    this.transports.push(() => new MailgunTransport({ transport: 'mailgun', options: config }));
    return this;
  }
}
