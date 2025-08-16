import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../services/mail.service';
import { MailConfigService } from '../services/mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TemplateEngineFactory } from '../services/template.service';
import { MailTransport, Content, MailConfiguration } from '../interfaces/mail.interface';
import { MailableBuilder } from '../builders/mailable.builder';
import { Mailable } from '../mailables/mailable';

// Mock transport classes for testing
class MockSmtpTransport implements MailTransport {
  public sentEmails: Content[] = [];

  async send(content: Content): Promise<any> {
    this.sentEmails.push(content);
    return {
      messageId: `smtp-mock-${Date.now()}`,
      response: '250 Message sent successfully',
      envelope: {
        from: content.from?.address,
        to: Array.isArray(content.to) ? content.to.map((t) => t.address) : [content.to?.address],
      },
    };
  }

  async verify(): Promise<boolean> {
    return true;
  }

  getSentEmails(): Content[] {
    return this.sentEmails;
  }

  reset(): void {
    this.sentEmails = [];
  }
}

class MockSesTransport implements MailTransport {
  public sentEmails: Content[] = [];

  async send(content: Content): Promise<any> {
    this.sentEmails.push(content);
    return {
      messageId: `ses-mock-${Date.now()}`,
      response: 'SES Message sent successfully',
      MessageId: `0000014a-f896-4c47-b8b0-6a24b2${Date.now()}`,
    };
  }

  getSentEmails(): Content[] {
    return this.sentEmails;
  }

  reset(): void {
    this.sentEmails = [];
  }
}

class MockMailgunTransport implements MailTransport {
  public sentEmails: Content[] = [];

  async send(content: Content): Promise<any> {
    this.sentEmails.push(content);
    return {
      messageId: `mailgun-mock-${Date.now()}`,
      response: 'Message sent successfully',
      id: `<${Date.now()}.1.60616e1f61914@sandbox-123.mailgun.org>`,
    };
  }

  getSentEmails(): Content[] {
    return this.sentEmails;
  }

  reset(): void {
    this.sentEmails = [];
  }
}

// Test Mailable class
class TestWelcomeMail extends Mailable {
  constructor(private user: { name: string; email: string }) {
    super();
  }

  protected build(): any {
    this.subject(`Welcome ${this.user.name}!`)
      .view('welcome', {
        name: this.user.name,
        appName: 'Test App',
      })
      .tag('onboarding')
      .metadata('user_email', this.user.email);
    return this.content;
  }
}

describe('Mail Transport Mocking Tests', () => {
  let mailService: MailService;
  let mockSmtpTransport: MockSmtpTransport;
  let mockSesTransport: MockSesTransport;
  let mockMailgunTransport: MockMailgunTransport;
  let transportFactory: MailTransportFactory;

  beforeEach(async () => {
    // Initialize mock transports
    mockSmtpTransport = new MockSmtpTransport();
    mockSesTransport = new MockSesTransport();
    mockMailgunTransport = new MockMailgunTransport();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: MailConfigService,
          useFactory: () =>
            new MailConfigService({
              default: 'smtp',
              mailers: {
                smtp: {
                  transport: 'smtp',
                  host: 'localhost',
                  port: 587,
                  secure: false,
                  auth: {
                    user: 'test@example.com',
                    pass: 'testpass',
                  },
                },
              },
              from: {
                address: 'noreply@example.com',
                name: 'Test App',
              },
            }),
        },
        {
          provide: MailTransportFactory,
          useValue: {
            createTransport: jest.fn().mockImplementation((config) => {
              switch (config.transport) {
                case 'smtp':
                  return mockSmtpTransport;
                case 'ses':
                  return mockSesTransport;
                case 'mailgun':
                  return mockMailgunTransport;
                default:
                  return mockSmtpTransport;
              }
            }),
          },
        },
        MailService,
        TemplateEngineFactory,
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    transportFactory = module.get<MailTransportFactory>(MailTransportFactory);

    // Reset all mocks before each test
    mockSmtpTransport.reset();
    mockSesTransport.reset();
    mockMailgunTransport.reset();
  });

  describe('SMTP Transport Mocking', () => {
    it('should mock SMTP transport and verify email sending', async () => {
      const testEmail = {
        to: { address: 'test@example.com', name: 'Test User' },
        subject: 'Test SMTP Email',
        html: '<h1>Hello from SMTP!</h1>',
        text: 'Hello from SMTP!',
      };

      const result = await mailService.send(testEmail);

      // Verify the mock transport was called
      expect(result.messageId).toContain('smtp-mock');
      expect(mockSmtpTransport.getSentEmails()).toHaveLength(1);

      const sentEmail = mockSmtpTransport.getSentEmails()[0];
      expect(sentEmail.subject).toBe('Test SMTP Email');
      expect(sentEmail.to).toEqual({ address: 'test@example.com', name: 'Test User' });
    });

    it('should handle SMTP transport with attachments', async () => {
      const emailWithAttachment = MailableBuilder.create()
        .to('recipient@example.com')
        .subject('Email with Attachment')
        .html('<p>Please find attachment.</p>')
        .attachData(Buffer.from('test content'), 'test.txt', {
          contentType: 'text/plain',
        })
        .build();

      await mailService.send(emailWithAttachment);

      const sentEmail = mockSmtpTransport.getSentEmails()[0];
      expect(sentEmail.attachments).toHaveLength(1);
      expect(sentEmail.attachments![0].filename).toBe('test.txt');
    });
  });

  describe('SES Transport Mocking', () => {
    beforeEach(() => {
      // Configure mail service to use SES transport
      const sesConfig: MailConfiguration = {
        default: 'ses',
        mailers: {
          ses: {
            transport: 'ses',
            options: {
              accessKeyId: 'mock-key',
              secretAccessKey: 'mock-secret',
              region: 'us-east-1',
            },
          },
        },
      };

      const configService = new MailConfigService(sesConfig);
      mailService = new MailService(configService, transportFactory, new TemplateEngineFactory());
    });

    it('should mock SES transport and verify email sending', async () => {
      const testEmail = {
        to: { address: 'test@example.com' },
        subject: 'Test SES Email',
        html: '<h1>Hello from SES!</h1>',
      };

      const result = await mailService.send(testEmail);

      expect(result.messageId).toContain('ses-mock');
      expect(result.MessageId).toBeDefined();
      expect(mockSesTransport.getSentEmails()).toHaveLength(1);

      const sentEmail = mockSesTransport.getSentEmails()[0];
      expect(sentEmail.subject).toBe('Test SES Email');
    });

    it('should handle SES transport with multiple recipients', async () => {
      const testEmail = {
        to: [
          { address: 'user1@example.com', name: 'User 1' },
          { address: 'user2@example.com', name: 'User 2' },
        ],
        subject: 'Bulk SES Email',
        html: '<h1>Bulk email via SES!</h1>',
      };

      await mailService.send(testEmail);

      const sentEmail = mockSesTransport.getSentEmails()[0];
      expect(Array.isArray(sentEmail.to)).toBe(true);
      expect((sentEmail.to as any[]).length).toBe(2);
    });
  });

  describe('Mailgun Transport Mocking', () => {
    beforeEach(() => {
      const mailgunConfig: MailConfiguration = {
        default: 'mailgun',
        mailers: {
          mailgun: {
            transport: 'mailgun',
            options: {
              apiKey: 'mock-api-key',
              domain: 'sandbox-123.mailgun.org',
            },
          },
        },
      };

      const configService = new MailConfigService(mailgunConfig);
      mailService = new MailService(configService, transportFactory, new TemplateEngineFactory());
    });

    it('should mock Mailgun transport and verify email sending', async () => {
      const testEmail = {
        to: { address: 'test@example.com' },
        subject: 'Test Mailgun Email',
        html: '<h1>Hello from Mailgun!</h1>',
        tags: ['newsletter', 'marketing'],
      };

      const result = await mailService.send(testEmail);

      expect(result.messageId).toContain('mailgun-mock');
      expect(result.id).toBeDefined();
      expect(mockMailgunTransport.getSentEmails()).toHaveLength(1);

      const sentEmail = mockMailgunTransport.getSentEmails()[0];
      expect(sentEmail.tags).toContain('newsletter');
      expect(sentEmail.tags).toContain('marketing');
    });
  });

  describe('Multiple Transport Testing', () => {
    it('should switch between different transports', async () => {
      // Test SMTP
      const smtpConfig: MailConfiguration = {
        default: 'smtp',
        mailers: {
          smtp: { transport: 'smtp', host: 'smtp.example.com', port: 587 },
        },
      };

      let configService = new MailConfigService(smtpConfig);
      let testMailService = new MailService(configService, transportFactory, new TemplateEngineFactory());

      await testMailService.send({
        to: { address: 'smtp@example.com' },
        subject: 'SMTP Test',
        html: '<p>SMTP</p>',
      });

      expect(mockSmtpTransport.getSentEmails()).toHaveLength(1);
      expect(mockSesTransport.getSentEmails()).toHaveLength(0);

      // Test SES
      const sesConfig: MailConfiguration = {
        default: 'ses',
        mailers: {
          ses: {
            transport: 'ses',
            options: { accessKeyId: 'key', secretAccessKey: 'secret', region: 'us-east-1' },
          },
        },
      };

      configService = new MailConfigService(sesConfig);
      testMailService = new MailService(configService, transportFactory, new TemplateEngineFactory());

      await testMailService.send({
        to: { address: 'ses@example.com' },
        subject: 'SES Test',
        html: '<p>SES</p>',
      });

      expect(mockSesTransport.getSentEmails()).toHaveLength(1);
      expect(mockSmtpTransport.getSentEmails()).toHaveLength(1); // Previous test
    });
  });

  describe('Mailable Class Testing with Different Transports', () => {
    it('should test mailable with SMTP transport', async () => {
      const user = { name: 'John Doe', email: 'john@example.com' };
      const welcomeMail = new TestWelcomeMail(user);

      await mailService.send(welcomeMail.render());

      const sentEmail = mockSmtpTransport.getSentEmails()[0];
      expect(sentEmail.subject).toBe('Welcome John Doe!');
      expect(sentEmail.tags).toContain('onboarding');
      expect(sentEmail.metadata?.user_email).toBe('john@example.com');
    });
  });

  describe('MailFake Testing', () => {
    it('should use built-in MailFake for testing', async () => {
      const fake = mailService.fake();

      const testEmail = {
        to: { address: 'fake@example.com' },
        subject: 'Fake Test Email',
        html: '<h1>This is a fake email!</h1>',
      };

      await fake.send(testEmail);

      // Use MailFake assertions
      fake.assertSent((mail) => mail.subject === 'Fake Test Email');
      fake.assertSentCount(1);

      const sentMails = fake.getSentMails();
      expect(sentMails).toHaveLength(1);
      expect(sentMails[0].to).toEqual({ address: 'fake@example.com' });
    });

    it('should assert multiple fake emails', async () => {
      const fake = mailService.fake();

      // Send multiple emails
      await fake.send({
        to: { address: 'user1@example.com' },
        subject: 'Email 1',
        html: '<p>First email</p>',
      });

      await fake.send({
        to: { address: 'user2@example.com' },
        subject: 'Email 2',
        html: '<p>Second email</p>',
      });

      fake.assertSentCount(2);
      fake.assertSent((mail) => mail.subject === 'Email 1');
      fake.assertSent((mail) => mail.subject === 'Email 2');

      const sentMails = fake.getSentMails();
      expect(sentMails.map((mail) => mail.subject)).toEqual(['Email 1', 'Email 2']);
    });
  });

  describe('Transport Error Handling', () => {
    it('should handle transport failures gracefully', async () => {
      // Mock a failing transport
      const failingTransport = {
        send: jest.fn().mockRejectedValue(new Error('Transport failed')),
      };

      // Create a new module with the failing transport
      const errorModule: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: MailConfigService,
            useFactory: () =>
              new MailConfigService({
                default: 'smtp',
                mailers: {
                  smtp: {
                    transport: 'smtp',
                    host: 'localhost',
                    port: 587,
                    secure: false,
                    auth: {
                      user: 'test@example.com',
                      pass: 'testpass',
                    },
                  },
                },
                from: {
                  address: 'noreply@example.com',
                  name: 'Test App',
                },
              }),
          },
          {
            provide: MailTransportFactory,
            useValue: {
              createTransport: jest.fn().mockReturnValue(failingTransport),
            },
          },
          MailService,
          TemplateEngineFactory,
        ],
      }).compile();

      const errorMailService = errorModule.get<MailService>(MailService);

      const testEmail = {
        to: { address: 'test@example.com' },
        subject: 'Test Email',
        html: '<p>Test</p>',
      };

      await expect(errorMailService.send(testEmail)).rejects.toThrow('Transport failed');
    });
  });

  describe('Builder Pattern with Different Transports', () => {
    it('should test builder pattern with metadata and tags', async () => {
      const complexEmail = MailableBuilder.create()
        .to('recipient@example.com')
        .cc('cc@example.com')
        .bcc('bcc@example.com')
        .subject('Complex Email Test')
        .html('<h1>Complex Email</h1>')
        .text('Complex Email (text)')
        .tag('test')
        .tag('complex')
        .metadata('campaign', 'test-campaign')
        .metadata('priority', 'high')
        .header('X-Custom-Header', 'custom-value')
        .build();

      await mailService.send(complexEmail);

      const sentEmail = mockSmtpTransport.getSentEmails()[0];
      expect(sentEmail.tags).toEqual(['test', 'complex']);
      expect(sentEmail.metadata?.campaign).toBe('test-campaign');
      expect(sentEmail.metadata?.priority).toBe('high');
      expect(sentEmail.headers?.['X-Custom-Header']).toBe('custom-value');
    });
  });
});
