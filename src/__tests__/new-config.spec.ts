import { Test, TestingModule } from '@nestjs/testing';
import { MailModule, MailService, TEMPLATE_ENGINE, TransportType } from '../index';
import { MailConfigService } from '../services/mail-config.service';
import * as path from 'path';

describe('New Configuration System', () => {
  describe('SMTP Configuration', () => {
    let app: TestingModule;
    let mailService: MailService;
    let configService: MailConfigService;

    beforeEach(async () => {
      app = await Test.createTestingModule({
        imports: [
          MailModule.forRoot({
            transport: {
              type: TransportType.SMTP,
              host: 'localhost',
              port: 1025,
              ignoreTLS: true,
              secure: false,
              auth: {
                user: 'test',
                pass: 'test',
              },
            },
            from: {
              address: 'noreply@test.com',
              name: 'Test App',
            },
            replyTo: {
              address: 'support@test.com',
              name: 'Test Support',
            },
            templates: {
              engine: TEMPLATE_ENGINE.HANDLEBARS,
              directory: path.join(__dirname, './test-templates'),
              partials: {
                header: './partials/header',
                footer: './partials/footer',
              },
              options: {
                helpers: {
                  currency: (amount: number) => `$${amount.toFixed(2)}`,
                  uppercase: (str: string) => str.toUpperCase(),
                },
              },
            },
          }),
        ],
      }).compile();

      mailService = app.get<MailService>(MailService);
      configService = app.get<MailConfigService>(MailConfigService);
    });

    afterEach(async () => {
      await app.close();
    });

    it('should be defined', () => {
      expect(mailService).toBeDefined();
      expect(configService).toBeDefined();
    });

    it('should have correct transport configuration', () => {
      const config = configService.getTransportConfig();
      expect(config.type).toBe(TransportType.SMTP);
      if (config.type === TransportType.SMTP) {
        expect(config.host).toBe('localhost');
        expect(config.port).toBe(1025);
        expect(config.ignoreTLS).toBe(true);
        expect(config.secure).toBe(false);
      }
    });

    it('should have correct from configuration', () => {
      const from = configService.getGlobalFrom();
      expect(from).toEqual({
        address: 'noreply@test.com',
        name: 'Test App',
      });
    });

    it('should have correct replyTo configuration', () => {
      const replyTo = configService.getGlobalReplyTo();
      expect(replyTo).toEqual({
        address: 'support@test.com',
        name: 'Test Support',
      });
    });

    it('should have correct template configuration', () => {
      const templateConfig = configService.getTemplateConfig();
      expect(templateConfig).toBeDefined();
      expect(templateConfig!.engine).toBe(TEMPLATE_ENGINE.HANDLEBARS);
      expect(templateConfig!.directory).toBe(path.join(__dirname, './test-templates'));
      expect(templateConfig!.partials).toEqual({
        header: './partials/header',
        footer: './partials/footer',
      });
      expect(templateConfig!.options?.helpers).toBeDefined();
    });

    it('should support fluent API', () => {
      const mailSender = mailService.to('test@example.com');
      expect(mailSender).toBeDefined();
      expect(typeof mailSender.send).toBe('function');
    });
  });

  describe('SES Configuration', () => {
    let app: TestingModule;
    let configService: MailConfigService;

    beforeEach(async () => {
      app = await Test.createTestingModule({
        imports: [
          MailModule.forRoot({
            transport: {
              type: TransportType.SES,
              endpoint: 'http://localhost:4566',
              region: 'us-east-1',
              credentials: {
                accessKeyId: 'test',
                secretAccessKey: 'test',
              },
            },
            from: {
              address: 'noreply@test.com',
              name: 'Test App',
            },
            templates: {
              engine: TEMPLATE_ENGINE.EJS,
              directory: './templates',
            },
          }),
        ],
      }).compile();

      configService = app.get<MailConfigService>(MailConfigService);
    });

    afterEach(async () => {
      await app.close();
    });

    it('should have correct SES transport configuration', () => {
      const config = configService.getTransportConfig();
      expect(config.type).toBe(TransportType.SES);
      if (config.type === TransportType.SES) {
        expect(config.endpoint).toBe('http://localhost:4566');
        expect(config.region).toBe('us-east-1');
        expect(config.credentials).toEqual({
          accessKeyId: 'test',
          secretAccessKey: 'test',
        });
      }
    });

    it('should have EJS template engine configured', () => {
      const templateConfig = configService.getTemplateConfig();
      expect(templateConfig!.engine).toBe(TEMPLATE_ENGINE.EJS);
    });
  });

  describe('Mailgun Configuration', () => {
    let app: TestingModule;
    let configService: MailConfigService;

    beforeEach(async () => {
      app = await Test.createTestingModule({
        imports: [
          MailModule.forRoot({
            transport: {
              type: TransportType.MAILGUN,
              options: {
                domain: 'mg.test.com',
                apiKey: 'test-api-key',
              },
            },
            from: {
              address: 'noreply@test.com',
              name: 'Test App',
            },
            templates: {
              engine: TEMPLATE_ENGINE.PUG,
              directory: './templates',
              options: {
                pretty: false,
                compileDebug: false,
              },
            },
          }),
        ],
      }).compile();

      configService = app.get<MailConfigService>(MailConfigService);
    });

    afterEach(async () => {
      await app.close();
    });

    it('should have correct Mailgun transport configuration', () => {
      const config = configService.getTransportConfig();
      expect(config.type).toBe(TransportType.MAILGUN);
      if (config.type === TransportType.MAILGUN) {
        expect(config.options).toEqual({
          domain: 'mg.test.com',
          apiKey: 'test-api-key',
        });
      }
    });

    it('should have Pug template engine configured', () => {
      const templateConfig = configService.getTemplateConfig();
      expect(templateConfig!.engine).toBe(TEMPLATE_ENGINE.PUG);
      expect(templateConfig!.options).toEqual({
        pretty: false,
        compileDebug: false,
      });
    });
  });

  describe('Template Engine Constants', () => {
    it('should export TEMPLATE_ENGINE constants', () => {
      expect(TEMPLATE_ENGINE.HANDLEBARS).toBe('handlebars');
      expect(TEMPLATE_ENGINE.EJS).toBe('ejs');
      expect(TEMPLATE_ENGINE.PUG).toBe('pug');
      expect(TEMPLATE_ENGINE.MJML).toBe('mjml');
    });
  });

  describe('Transport Type Constants', () => {
    it('should export TransportType constants', () => {
      expect(TransportType.SMTP).toBe('smtp');
      expect(TransportType.SES).toBe('ses');
      expect(TransportType.MAILGUN).toBe('mailgun');
    });
  });
});
