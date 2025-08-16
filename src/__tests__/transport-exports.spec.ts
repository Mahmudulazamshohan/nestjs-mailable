import { SesTransport } from '../transports/ses.transport';
import { SmtpTransport } from '../transports/smtp.transport';
import { MailgunTransport } from '../transports/mailgun.transport';

// Test transport index exports
import * as TransportIndex from '../transports/index';

describe('Transport Index Exports', () => {
  it('should export SesTransport from index', () => {
    expect(TransportIndex.SesTransport).toBeDefined();
    expect(TransportIndex.SesTransport).toBe(SesTransport);
  });

  it('should export SmtpTransport from index', () => {
    expect(TransportIndex.SmtpTransport).toBeDefined();
    expect(TransportIndex.SmtpTransport).toBe(SmtpTransport);
  });

  it('should export MailgunTransport from index', () => {
    expect(TransportIndex.MailgunTransport).toBeDefined();
    expect(TransportIndex.MailgunTransport).toBe(MailgunTransport);
  });

  it('should have all transport classes as functions', () => {
    expect(typeof TransportIndex.SesTransport).toBe('function');
    expect(typeof TransportIndex.SmtpTransport).toBe('function');
    expect(typeof TransportIndex.MailgunTransport).toBe('function');
  });
});
