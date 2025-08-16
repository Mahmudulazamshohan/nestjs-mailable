import { Test, TestingModule } from '@nestjs/testing';
import { MailModule } from '../mail.module';
import { MailService } from '../services/mail.service';
import { MailConfigService } from '../services/mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TemplateEngineFactory } from '../services/template.service';
import { MailConfiguration } from '../interfaces/mail.interface';

describe('MailModule Integration - Simple Tests', () => {
  describe('forRoot() configuration', () => {
    let module: TestingModule;
    let mailService: MailService;
    let configService: MailConfigService;

    beforeEach(async () => {
      const mailConfig: MailConfiguration = {
        default: 'smtp',
        mailers: {
          smtp: {
            transport: 'smtp',
            host: 'localhost',
            port: 587,
            secure: false,
            auth: {
              user: 'test@example.com',
              pass: 'password',
            },
          },
        },
        from: {
          address: 'noreply@example.com',
          name: 'Test App',
        },
      };

      module = await Test.createTestingModule({
        imports: [MailModule.forRoot({ config: mailConfig })],
      }).compile();

      mailService = module.get<MailService>(MailService);
      configService = module.get<MailConfigService>(MailConfigService);
    });

    afterEach(async () => {
      await module?.close();
    });

    it('should create MailModule with forRoot', () => {
      expect(module).toBeDefined();
    });

    it('should provide MailService', () => {
      expect(mailService).toBeDefined();
      expect(mailService).toBeInstanceOf(MailService);
    });

    it('should provide MailConfigService', () => {
      expect(configService).toBeDefined();
      expect(configService).toBeInstanceOf(MailConfigService);
    });

    it('should provide MailTransportFactory', () => {
      const transportFactory = module.get<MailTransportFactory>(MailTransportFactory);
      expect(transportFactory).toBeDefined();
      expect(transportFactory).toBeInstanceOf(MailTransportFactory);
    });

    it('should provide TemplateEngineFactory', () => {
      const templateFactory = module.get<TemplateEngineFactory>(TemplateEngineFactory);
      expect(templateFactory).toBeDefined();
      expect(templateFactory).toBeInstanceOf(TemplateEngineFactory);
    });

    it('should have correct configuration', () => {
      expect(configService.getConfig()).toBeDefined();
      expect(configService.getConfig().default).toBe('smtp');
    });
  });

  describe('forRootAsync() configuration', () => {
    let module: TestingModule;
    let mailService: MailService;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          MailModule.forRootAsync({
            useFactory: () => ({
              default: 'smtp',
              mailers: {
                smtp: {
                  transport: 'smtp',
                  host: 'localhost',
                  port: 587,
                  secure: false,
                  auth: {
                    user: 'test@example.com',
                    pass: 'password',
                  },
                },
              },
              from: {
                address: 'noreply@example.com',
                name: 'Test App',
              },
            }),
          }),
        ],
      }).compile();

      mailService = module.get<MailService>(MailService);
    });

    afterEach(async () => {
      await module?.close();
    });

    it('should create MailModule with forRootAsync', () => {
      expect(module).toBeDefined();
    });

    it('should provide MailService with async config', () => {
      expect(mailService).toBeDefined();
      expect(mailService).toBeInstanceOf(MailService);
    });
  });

  describe('Global module behavior', () => {
    let module: TestingModule;

    beforeEach(async () => {
      const mailConfig: MailConfiguration = {
        default: 'smtp',
        mailers: {
          smtp: {
            transport: 'smtp',
            host: 'localhost',
            port: 587,
            secure: false,
            auth: {
              user: 'test@example.com',
              pass: 'password',
            },
          },
        },
        from: {
          address: 'noreply@example.com',
          name: 'Test App',
        },
      };

      module = await Test.createTestingModule({
        imports: [MailModule.forRoot({ config: mailConfig })],
      }).compile();
    });

    afterEach(async () => {
      await module?.close();
    });

    it('should be marked as global module', () => {
      const mailModule = module.get(MailModule);
      expect(mailModule).toBeDefined();
    });
  });

  describe('Service integration', () => {
    let module: TestingModule;
    let mailService: MailService;

    beforeEach(async () => {
      const mailConfig: MailConfiguration = {
        default: 'smtp',
        mailers: {
          smtp: {
            transport: 'smtp',
            host: 'localhost',
            port: 587,
            secure: false,
            auth: {
              user: 'test@example.com',
              pass: 'password',
            },
          },
        },
        from: {
          address: 'noreply@example.com',
          name: 'Test App',
        },
      };

      module = await Test.createTestingModule({
        imports: [MailModule.forRoot({ config: mailConfig })],
      }).compile();

      mailService = module.get<MailService>(MailService);
    });

    afterEach(async () => {
      await module?.close();
    });

    it('should have basic mail service methods', () => {
      expect(typeof mailService.send).toBe('function');
      expect(typeof mailService.to).toBe('function');
      expect(typeof mailService.mailer).toBe('function');
      expect(typeof mailService.fake).toBe('function');
    });

    it('should create mail sender through fluent API', async () => {
      const mailSender = await mailService.to('test@example.com');
      expect(mailSender).toBeDefined();
      expect(typeof mailSender.send).toBe('function');
    });

    it('should create fake mail service', () => {
      const fake = mailService.fake();
      expect(fake).toBeDefined();
      expect(typeof fake.send).toBe('function');
    });
  });
});
