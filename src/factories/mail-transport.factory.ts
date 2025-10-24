import { Injectable } from '@nestjs/common';
import { MailTransport, TransportConfiguration } from '../interfaces/mail.interface';
import { SmtpTransport } from '../transports/smtp.transport';
import { SesTransport } from '../transports/ses.transport';
import { MailgunTransport } from '../transports/mailgun.transport';
import { MailjetTransport } from '../transports/mailjet.transport';
import { TransportType } from '../types/transport.type';

// Factory Pattern Implementation
@Injectable()
export class MailTransportFactory {
  private customTransports = new Map<string, () => MailTransport>();

  createTransport(config: TransportConfiguration): MailTransport {
    // TypeScript will enforce that each case has the required fields
    switch (config.type) {
      case TransportType.SMTP:
        // TypeScript ensures config has host, auth.user, auth.pass as required
        return new SmtpTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          ignoreTLS: config.ignoreTLS,
          auth: config.auth,
        });
      case TransportType.SES:
        // TypeScript ensures config has region and credentials as required
        return new SesTransport({
          endpoint: config.endpoint,
          region: config.region,
          credentials: config.credentials,
        });
      case TransportType.MAILGUN:
        // Validate that options are provided
        if (!config.options) {
          throw new Error('Mailgun transport requires options configuration');
        }
        return new MailgunTransport({
          transport: 'mailgun',
          options: config.options,
        });
      case TransportType.MAILJET:
        // Validate that options are provided
        if (!config.options) {
          throw new Error('Mailjet transport requires options configuration');
        }
        return new MailjetTransport({
          transport: 'mailjet',
          options: config.options,
        });
      default: {
        // TypeScript will catch this at compile time if we miss any transport types
        throw new Error(`Unsupported transport type: ${(config as any).type || 'unknown'}`);
      }
    }
  }

  registerCustomTransport(name: string, factory: () => MailTransport): void {
    this.customTransports.set(name, factory);
  }

  // Transport Strategy Pattern
  getAvailableTransports(): TransportType[] {
    return [TransportType.SMTP, TransportType.SES, TransportType.MAILGUN, TransportType.MAILJET];
  }
}
