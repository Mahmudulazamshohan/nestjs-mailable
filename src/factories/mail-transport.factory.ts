import { Injectable } from '@nestjs/common';
import { MailTransport, TransportConfiguration } from '../interfaces/mail.interface';
import { SmtpTransport } from '../transports/smtp.transport';
import { SesTransport } from '../transports/ses.transport';
import { MailgunTransport } from '../transports/mailgun.transport';
import { MailjetTransport } from '../transports/mailjet.transport';
import { TransportType } from '../types/transport.type';
import { RetryTransport } from '../retry/retry-transport';

// Factory Pattern Implementation
@Injectable()
export class MailTransportFactory {
  private customTransports = new Map<string, () => MailTransport>();

  createTransport(config: TransportConfiguration): MailTransport {
    const transport = this.createBaseTransport(config);

    if (config.retry && config.retry.attempts > 1) {
      return new RetryTransport(transport, config.retry);
    }

    return transport;
  }

  private createBaseTransport(config: TransportConfiguration): MailTransport {
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
        });
      case TransportType.MAILJET:
        if (!config.options) {
          throw new Error('Mailjet transport requires options configuration');
        }
        return new MailjetTransport({
          transport: 'mailjet',
          options: config.options,
        });
      default: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
