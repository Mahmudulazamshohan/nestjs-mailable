import * as transports from '../transports';

describe('transports/index exports', () => {
  it('re-exports all transport classes', () => {
    expect(transports).toHaveProperty('SesTransport');
    expect(transports).toHaveProperty('SmtpTransport');
    expect(transports).toHaveProperty('MailgunTransport');
    expect(transports).toHaveProperty('MailjetTransport');
  });
});
