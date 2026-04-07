import { MailTransportFactory } from '../factories/mail-transport.factory';
import { RetryTransport } from '../retry/retry-transport';
import { MailjetTransport } from '../transports/mailjet.transport';
import { SmtpTransport } from '../transports/smtp.transport';
import { TransportType } from '../types/transport.type';

describe('MailTransportFactory', () => {
  let factory: MailTransportFactory;

  beforeEach(() => {
    factory = new MailTransportFactory();
  });

  it('wraps the base transport with RetryTransport when retry attempts exceed one', () => {
    const transport = factory.createTransport({
      type: TransportType.SMTP,
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
      secure: false,
      auth: { user: 'test', pass: 'test' },
      retry: {
        attempts: 3,
        strategy: 'fixed',
        delay: 10,
      },
    });

    expect(transport).toBeInstanceOf(RetryTransport);
  });

  it('returns the base transport when retry attempts are not configured', () => {
    const transport = factory.createTransport({
      type: TransportType.SMTP,
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
      secure: false,
      auth: { user: 'test', pass: 'test' },
    });

    expect(transport).toBeInstanceOf(SmtpTransport);
    expect(transport).not.toBeInstanceOf(RetryTransport);
  });

  it('returns the base transport when retry attempts is one', () => {
    const transport = factory.createTransport({
      type: TransportType.SMTP,
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
      secure: false,
      auth: { user: 'test', pass: 'test' },
      retry: {
        attempts: 1,
        strategy: 'fixed',
        delay: 10,
      },
    });

    expect(transport).toBeInstanceOf(SmtpTransport);
    expect(transport).not.toBeInstanceOf(RetryTransport);
  });

  it('throws when Mailjet options are missing', () => {
    expect(() =>
      factory.createTransport({
        type: TransportType.MAILJET,
      } as any),
    ).toThrow('Mailjet transport requires options configuration');
  });

  it('creates Mailjet transport when options are provided', () => {
    const transport = factory.createTransport({
      type: TransportType.MAILJET,
      options: {
        apiKey: 'api-key',
        apiSecret: 'api-secret',
      },
    });

    expect(transport).toBeInstanceOf(MailjetTransport);
  });

  it('throws unknown transport fallback when type is absent', () => {
    expect(() => factory.createTransport({} as any)).toThrow('Unsupported transport type: unknown');
  });
});
