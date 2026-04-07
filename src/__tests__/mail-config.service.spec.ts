import { MailConfigService } from '../services/mail-config.service';
import { TEMPLATE_ENGINE } from '../constants/template.constants';
import { TransportType } from '../types/transport.type';

describe('MailConfigService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses default configuration when no config is provided', () => {
    delete process.env.MAIL_HOST;
    delete process.env.MAIL_PORT;
    delete process.env.MAIL_SECURE;
    delete process.env.MAIL_USERNAME;
    delete process.env.MAIL_PASSWORD;
    delete process.env.MAIL_FROM_ADDRESS;
    delete process.env.MAIL_FROM_NAME;

    const service = new MailConfigService();

    expect(service.getTransportConfig()).toEqual({
      type: TransportType.SMTP,
      host: 'localhost',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: '',
      },
    });
    expect(service.getGlobalFrom()).toEqual({
      address: 'hello@example.com',
      name: 'Example App',
    });
    expect(service.getTemplateConfig()).toEqual({
      engine: TEMPLATE_ENGINE.HANDLEBARS,
      directory: './templates',
    });
    expect(service.getEventsConfig()).toBeUndefined();
  });

  it('reads default configuration from environment variables', () => {
    process.env.MAIL_HOST = 'smtp.example.com';
    process.env.MAIL_PORT = '2525';
    process.env.MAIL_SECURE = 'true';
    process.env.MAIL_USERNAME = 'user';
    process.env.MAIL_PASSWORD = 'pass';
    process.env.MAIL_FROM_ADDRESS = 'team@example.com';
    process.env.MAIL_FROM_NAME = 'Team';

    const service = new MailConfigService();

    expect(service.getTransportConfig()).toEqual({
      type: TransportType.SMTP,
      host: 'smtp.example.com',
      port: 2525,
      secure: true,
      auth: {
        user: 'user',
        pass: 'pass',
      },
    });
    expect(service.getGlobalFrom()).toEqual({
      address: 'team@example.com',
      name: 'Team',
    });
  });

  it('setConfig replaces config and updates all getters', () => {
    const service = new MailConfigService();

    service.setConfig({
      transport: {
        type: TransportType.SES,
        region: 'us-east-1',
        endpoint: 'http://localhost:4566',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'secret',
        },
      },
      from: { address: 'noreply@example.com', name: 'App' },
      replyTo: false,
      templates: {
        engine: TEMPLATE_ENGINE.EJS,
        directory: '/tmp/templates',
      },
      events: {
        enabled: true,
      },
    });

    expect(service.getConfig()).toEqual({
      transport: {
        type: TransportType.SES,
        region: 'us-east-1',
        endpoint: 'http://localhost:4566',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'secret',
        },
      },
      from: { address: 'noreply@example.com', name: 'App' },
      replyTo: false,
      templates: {
        engine: TEMPLATE_ENGINE.EJS,
        directory: '/tmp/templates',
      },
      events: {
        enabled: true,
      },
    });

    expect(service.getGlobalReplyTo()).toBe(false);
    expect(service.getEventsConfig()).toEqual({ enabled: true });
  });
});
