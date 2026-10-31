import { Injectable } from '@nestjs/common';
import { MailTransport, TransportConfiguration } from '../interfaces/mail.interface';
import { SmtpTransport } from '../transports/smtp.transport';
import { SesTransport } from '../transports/ses.transport';
import { MailgunTransport } from '../transports/mailgun.transport';
import { MailjetTransport } from '../transports/mailjet.transport';
import { ResendTransport } from '../transports/resend.transport';
import { PostmarkTransport } from '../transports/postmark.transport';
import { SendGridTransport } from '../transports/sendgrid.transport';
import { BrevoTransport } from '../transports/brevo.transport';
import { FailoverTransport } from '../transports/failover.transport';
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
      case TransportType.RESEND:
        return new ResendTransport(this.requireOptions(config, 'Resend'));
      case TransportType.POSTMARK:
        return new PostmarkTransport(this.requireOptions(config, 'Postmark'));
      case TransportType.SENDGRID:
        return new SendGridTransport(this.requireOptions(config, 'SendGrid'));
      case TransportType.BREVO:
        return new BrevoTransport(this.requireOptions(config, 'Brevo'));
      case TransportType.FAILOVER:
        if (!config.transports?.length) {
          throw new Error('Failover transport requires at least one transport');
        }
        return new FailoverTransport(
          config.transports.map((child) => this.createTransport(child)),
          config.strategy,
        );
      default: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error(`Unsupported transport type: ${(config as any).type || 'unknown'}`);
      }
    }
  }

  private requireOptions<T>(config: { options?: T }, name: string): T {
    if (!config.options) {
      throw new Error(`${name} transport requires options configuration`);
    }
    return config.options;
  }

  registerCustomTransport(name: string, factory: () => MailTransport): void {
    this.customTransports.set(name, factory);
  }

  // Transport Strategy Pattern
  getAvailableTransports(): TransportType[] {
    return [
      TransportType.SMTP,
      TransportType.SES,
      TransportType.MAILGUN,
      TransportType.MAILJET,
      TransportType.RESEND,
      TransportType.POSTMARK,
      TransportType.SENDGRID,
      TransportType.BREVO,
      TransportType.FAILOVER,
    ];
  }
}
