import {
  createSMTPConfig,
  createSESConfig,
  createMailgunConfig,
  isSMTPConfig,
  isSESConfig,
  isMailgunConfig,
} from '../types/transport-config.helpers';
import { TransportType } from '../types/transport.type';

describe('transport-config.helpers', () => {
  it('creates typed SMTP config', () => {
    const config = createSMTPConfig({
      host: 'smtp.example.com',
      port: 2525,
      secure: true,
      ignoreTLS: false,
      auth: {
        user: 'u',
        pass: 'p',
      },
    });

    expect(config).toEqual({
      type: TransportType.SMTP,
      host: 'smtp.example.com',
      port: 2525,
      secure: true,
      ignoreTLS: false,
      auth: {
        user: 'u',
        pass: 'p',
      },
    });
  });

  it('creates typed SES config', () => {
    const config = createSESConfig({
      region: 'us-east-1',
      endpoint: 'http://localhost:4566',
      credentials: {
        accessKeyId: 'a',
        secretAccessKey: 's',
        sessionToken: 't',
      },
    });

    expect(config).toEqual({
      type: TransportType.SES,
      region: 'us-east-1',
      endpoint: 'http://localhost:4566',
      credentials: {
        accessKeyId: 'a',
        secretAccessKey: 's',
        sessionToken: 't',
      },
    });
  });

  it('creates typed Mailgun config', () => {
    const config = createMailgunConfig({
      domain: 'mg.example.com',
      apiKey: 'key-123',
      host: 'api.eu.mailgun.net',
      timeout: 30000,
    });

    expect(config).toEqual({
      type: TransportType.MAILGUN,
      options: {
        domain: 'mg.example.com',
        apiKey: 'key-123',
        host: 'api.eu.mailgun.net',
        timeout: 30000,
      },
    });
  });

  it('type guards return true for matching types and false otherwise', () => {
    expect(isSMTPConfig({ type: TransportType.SMTP })).toBe(true);
    expect(isSESConfig({ type: TransportType.SES })).toBe(true);
    expect(isMailgunConfig({ type: TransportType.MAILGUN })).toBe(true);

    expect(isSMTPConfig({ type: TransportType.SES })).toBe(false);
    expect(isSESConfig({ type: TransportType.MAILGUN })).toBe(false);
    expect(isMailgunConfig({ type: TransportType.SMTP })).toBe(false);

    expect(isSMTPConfig(null)).toBe(false);
    expect(isSESConfig(undefined)).toBe(false);
    expect(isMailgunConfig({})).toBe(false);
  });
});
