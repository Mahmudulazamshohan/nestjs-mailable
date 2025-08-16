import { MailConfigService } from '../services/mail-config.service';
import { MailConfiguration } from '../interfaces/mail.interface';

describe('MailConfigService', () => {
  let service: MailConfigService;

  beforeEach(() => {
    service = new MailConfigService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set and get configuration', () => {
    const config: MailConfiguration = {
      default: 'test',
      mailers: {
        test: {
          transport: 'smtp',
          host: 'test.example.com',
          port: 123,
        },
      },
    };
    service.setConfig(config);
    expect(service.getConfig()).toEqual(config);
  });

  it('should return default mailer', () => {
    expect(service.getDefaultMailer()).toBe('smtp');
  });

  it('should return mailer config by name', () => {
    const smtpConfig = service.getMailerConfig('smtp');
    expect(smtpConfig).toBeDefined();
    expect(smtpConfig.transport).toBe('smtp');
  });

  it('should throw error if mailer config not found', () => {
    expect(() => service.getMailerConfig('nonexistent')).toThrowError(
      "Mailer configuration for 'nonexistent' not found",
    );
  });

  it('should return global from address', () => {
    const from = service.getGlobalFrom();
    expect(from).toBeDefined();
    expect(from?.address).toBe(process.env.MAIL_FROM_ADDRESS || 'hello@example.com');
  });

  it('should return global replyTo address', () => {
    const replyTo = service.getGlobalReplyTo();
    // Assuming replyTo is not set by default, so it should be undefined
    expect(replyTo).toBeUndefined();
  });

  it('should initialize with default config if no config provided', () => {
    const defaultConfig = service.getConfig();
    expect(defaultConfig.default).toBe('smtp');
    expect(defaultConfig.mailers.smtp).toBeDefined();
  });

  it('should handle initial config provided in constructor', () => {
    const initialConfig: MailConfiguration = {
      default: 'custom',
      mailers: {
        custom: {
          transport: 'ses',
          options: {
            region: 'us-west-2',
          },
        },
      },
    };

    const customService = new MailConfigService(initialConfig);
    expect(customService.getConfig()).toEqual(initialConfig);
  });
});
