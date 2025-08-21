import { Injectable } from '@nestjs/common';
import { MailTransport, MailerConfig, TransportConfiguration } from '../interfaces/mail.interface';
import { SmtpTransport } from '../transports/smtp.transport';
import { SesTransport } from '../transports/ses.transport';
import { MailgunTransport } from '../transports/mailgun.transport';
import { TransportType } from '../types/transport.type';

// Factory Pattern Implementation
@Injectable()
export class MailTransportFactory {
  private customTransports = new Map<string, () => MailTransport>();

  createTransport(config: TransportConfiguration): MailTransport {
    switch (config.type) {
      case TransportType.SMTP:
        return new SmtpTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          ignoreTLS: config.ignoreTLS,
          auth: config.auth,
        });
      case TransportType.SES:
        if (!config.region || !config.credentials) {
          throw new Error('SES transport requires region and credentials configuration');
        }
        return new SesTransport({
          endpoint: config.endpoint,
          region: config.region,
          credentials: config.credentials,
        });
      case TransportType.MAILGUN:
        if (!config.options) {
          throw new Error('Mailgun transport requires options configuration');
        }
        return new MailgunTransport({
          transport: 'mailgun',
          options: config.options,
        } as MailerConfig);
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }

  // Legacy method for backward compatibility
  createTransportLegacy(config: MailerConfig): MailTransport {
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
        if (!config.options) {
          throw new Error('SES transport requires options configuration');
        }
        return new SesTransport(config.options as Record<string, unknown>);
      case TransportType.MAILGUN:
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
    return [TransportType.SMTP, TransportType.SES, TransportType.MAILGUN];
  }
}
