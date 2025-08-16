import { Test } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { MailService } from '../services/mail.service';
import { MailConfigService } from '../services/mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TemplateEngineFactory } from '../services/template.service';
import { MailTransport, Content } from '../interfaces/mail.interface';

// Simple mock transport for testing
class MockTransport implements MailTransport {
  public sentEmails: Content[] = [];
  public transportType: string;

  constructor(transportType: string = 'mock') {
    this.transportType = transportType;
  }

  async send(content: Content): Promise<any> {
    this.sentEmails.push(content);
    return {
      messageId: `${this.transportType}-${Date.now()}`,
      accepted: [content.to],
      rejected: [],
      pending: [],
      response: '250 Message accepted for delivery',
    };
  }

  getSentEmails(): Content[] {
    return this.sentEmails;
  }

  getLastSentEmail(): Content | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  reset(): void {
    this.sentEmails = [];
  }
}

describe('Practical Email Testing Examples', () => {
  let _mailService: MailService;
  let mockTransport: MockTransport;

  beforeEach(async () => {
    mockTransport = new MockTransport();

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: MailConfigService,
          useFactory: (): MailConfigService =>
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
            createTransport: jest.fn().mockReturnValue(mockTransport),
          },
        },
        MailService,
        TemplateEngineFactory,
      ],
    }).compile();

    _mailService = moduleRef.get<MailService>(MailService);
    moduleRef.get<MailTransportFactory>(MailTransportFactory);

    mockTransport.reset();
  });

  describe('Testing Different Email Types', () => {
    it('should send welcome email', async () => {
      const welcomeEmail = {
        to: { address: 'newuser@example.com', name: 'New User' },
        subject: 'Welcome to Our Platform!',
        html: `
          <h1>Welcome!</h1>
          <p>Thank you for joining our platform.</p>
          <a href="https://example.com/verify">Verify Email</a>
        `,
        tags: ['welcome', 'onboarding'],
      };

      const result = await _mailService.send(welcomeEmail);

      expect(result.messageId).toBeDefined();
      expect(mockTransport.getSentEmails()).toHaveLength(1);

      const sentEmail = mockTransport.getLastSentEmail();
      expect(sentEmail?.subject).toBe('Welcome to Our Platform!');
      expect(sentEmail?.tags).toContain('welcome');
    });

    it('should send password reset email', async () => {
      const resetEmail = {
        to: { address: 'user@example.com' },
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password:</p>
          <a href="https://example.com/reset?token=abc123">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `,
        tags: ['password-reset', 'security'],
      };

      await _mailService.send(resetEmail);

      const sentEmail = mockTransport.getLastSentEmail();
      expect(sentEmail?.subject).toBe('Password Reset Request');
      expect(sentEmail?.html).toContain('Reset Password');
      expect(sentEmail?.tags).toContain('security');
    });

    it('should send order confirmation email with attachments', async () => {
      const invoicePdf = Buffer.from('fake PDF content');

      const orderEmail = {
        to: { address: 'customer@example.com', name: 'John Customer' },
        subject: 'Order Confirmation #12345',
        html: `
          <h2>Order Confirmed!</h2>
          <p>Your order #12345 has been confirmed.</p>
          <p>Total: $99.99</p>
        `,
        attachments: [
          {
            filename: 'invoice.pdf',
            content: invoicePdf,
            contentType: 'application/pdf',
          },
        ],
        tags: ['order', 'confirmation'],
      };

      await _mailService.send(orderEmail);

      const sentEmail = mockTransport.getLastSentEmail();
      expect(sentEmail?.attachments).toHaveLength(1);
      expect(sentEmail?.attachments?.[0].filename).toBe('invoice.pdf');
      expect(sentEmail?.tags).toContain('order');
    });
  });

  describe('Testing Email Content and Structure', () => {
    it('should verify email has all required fields', async () => {
      const testEmail = {
        to: { address: 'test@example.com', name: 'Test User' },
        from: { address: 'noreply@example.com', name: 'Test App' },
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
        replyTo: { address: 'support@example.com' },
      };

      await _mailService.send(testEmail);

      const sentEmail = mockTransport.getLastSentEmail();
      expect(sentEmail?.to).toEqual({ address: 'test@example.com', name: 'Test User' });
      expect(sentEmail?.from).toEqual({ address: 'noreply@example.com', name: 'Test App' });
      expect(sentEmail?.subject).toBe('Test Email');
      expect(sentEmail?.html).toBe('<p>Test content</p>');
      expect(sentEmail?.text).toBe('Test content');
      expect(sentEmail?.replyTo).toEqual({ address: 'support@example.com' });
    });

    it('should handle multiple recipients', async () => {
      const bulkEmail = {
        to: [
          { address: 'user1@example.com', name: 'User 1' },
          { address: 'user2@example.com', name: 'User 2' },
          { address: 'user3@example.com', name: 'User 3' },
        ],
        subject: 'Newsletter',
        html: '<h1>Monthly Newsletter</h1>',
      };

      await _mailService.send(bulkEmail);

      const sentEmail = mockTransport.getLastSentEmail();
      expect(Array.isArray(sentEmail?.to)).toBe(true);
      expect((sentEmail?.to as any[]).length).toBe(3);
    });

    it('should handle CC and BCC recipients', async () => {
      const emailWithCopies = {
        to: { address: 'primary@example.com' },
        cc: { address: 'cc@example.com' },
        bcc: [{ address: 'bcc1@example.com' }, { address: 'bcc2@example.com' }],
        subject: 'Email with copies',
        html: '<p>This email has CC and BCC recipients</p>',
      };

      await _mailService.send(emailWithCopies);

      const sentEmail = mockTransport.getLastSentEmail();
      expect(sentEmail?.cc).toEqual({ address: 'cc@example.com' });
      expect(Array.isArray(sentEmail?.bcc)).toBe(true);
      expect((sentEmail?.bcc as any[]).length).toBe(2);
    });
  });

  describe('Testing Different Transport Configurations', () => {
    it('should mock SMTP transport behavior', async () => {
      // The mockTransport is already set up in beforeEach, so we can use it directly
      await _mailService.send({
        to: { address: 'smtp-test@example.com' },
        subject: 'SMTP Test',
        html: '<p>SMTP Transport Test</p>',
      });

      expect(mockTransport.getSentEmails()).toHaveLength(1);
      const result = mockTransport.getLastSentEmail();
      expect(result?.subject).toBe('SMTP Test');
    });

    it('should mock SES transport behavior', async () => {
      const sesMock = {
        send: jest.fn().mockResolvedValue({
          MessageId: '0000014a-f896-4c47-b8b0-6a24b23d9c2b',
          ResponseMetadata: {
            RequestId: 'b25f48e8-84fd-11e6-a4c4-b1e0b5b6b14f',
          },
        }),
      };

      // Create a new module with SES mock
      const sesModule = await Test.createTestingModule({
        providers: [
          {
            provide: MailConfigService,
            useFactory: (): MailConfigService =>
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
              createTransport: jest.fn().mockReturnValue(sesMock),
            },
          },
          MailService,
          TemplateEngineFactory,
        ],
      }).compile();

      const sesMailService = sesModule.get<MailService>(MailService);

      const result = await sesMailService.send({
        to: { address: 'ses-test@example.com' },
        subject: 'SES Test',
        html: '<p>SES Transport Test</p>',
      });

      expect(result.MessageId).toBeDefined();
      expect(result.ResponseMetadata).toBeDefined();
    });

    it('should mock Mailgun transport behavior', async () => {
      const mailgunMock = {
        send: jest.fn().mockResolvedValue({
          id: '<20161025162244.163510.12345@sandbox-123.mailgun.org>',
          message: 'Message sent successfully',
        }),
      };

      // Create a new module with Mailgun mock
      const mailgunModule = await Test.createTestingModule({
        providers: [
          {
            provide: MailConfigService,
            useFactory: (): MailConfigService =>
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
              createTransport: jest.fn().mockReturnValue(mailgunMock),
            },
          },
          MailService,
          TemplateEngineFactory,
        ],
      }).compile();

      const mailgunMailService = mailgunModule.get<MailService>(MailService);

      const result = await mailgunMailService.send({
        to: { address: 'mailgun-test@example.com' },
        subject: 'Mailgun Test',
        html: '<p>Mailgun Transport Test</p>',
        tags: ['test', 'mailgun'],
      });

      expect(result.id).toBeDefined();
      expect(result.message).toBe('Message sent successfully');
    });
  });

  describe('Testing Error Scenarios', () => {
    it('should handle transport connection errors', async () => {
      const failingTransport = {
        send: jest.fn().mockRejectedValue(new Error('Connection refused')),
      };

      // Create a new module with the failing transport
      const errorModule = await Test.createTestingModule({
        providers: [
          {
            provide: MailConfigService,
            useFactory: (): MailConfigService =>
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

      await expect(
        errorMailService.send({
          to: { address: 'test@example.com' },
          subject: 'Test',
          html: '<p>Test</p>',
        }),
      ).rejects.toThrow('Connection refused');
    });

    it('should handle invalid email addresses', async () => {
      const mockWithValidation = {
        send: jest.fn().mockRejectedValue(new Error('Invalid recipient address')),
      };

      // Create a new module with the validation transport
      const validationModule = await Test.createTestingModule({
        providers: [
          {
            provide: MailConfigService,
            useFactory: (): MailConfigService =>
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
              createTransport: jest.fn().mockReturnValue(mockWithValidation),
            },
          },
          MailService,
          TemplateEngineFactory,
        ],
      }).compile();

      const validationMailService = validationModule.get<MailService>(MailService);

      await expect(
        validationMailService.send({
          to: { address: 'invalid-email' },
          subject: 'Test',
          html: '<p>Test</p>',
        }),
      ).rejects.toThrow('Invalid recipient address');
    });
  });

  describe('Using Built-in MailFake', () => {
    it('should use MailFake for simple testing', async () => {
      const fake = _mailService.fake();

      await fake.send({
        to: { address: 'fake@example.com' },
        subject: 'Fake Email',
        html: '<p>This email is faked for testing</p>',
      });

      // Test assertions
      fake.assertSentCount(1);
      fake.assertSent((mail) => mail.subject === 'Fake Email');
      fake.assertSent((mail) => {
        const to = mail.to as any;
        return to?.address === 'fake@example.com';
      });

      const sentMails = fake.getSentMails();
      expect(sentMails[0].html).toContain('faked for testing');
    });

    it('should track multiple fake emails', async () => {
      const fake = _mailService.fake();

      // Send multiple emails
      const emails = [
        { to: { address: 'user1@example.com' }, subject: 'Email 1', html: '<p>First</p>' },
        { to: { address: 'user2@example.com' }, subject: 'Email 2', html: '<p>Second</p>' },
        { to: { address: 'user3@example.com' }, subject: 'Email 3', html: '<p>Third</p>' },
      ];

      for (const email of emails) {
        await fake.send(email);
      }

      fake.assertSentCount(3);

      // Check specific emails were sent
      fake.assertSent((mail) => mail.subject === 'Email 1');
      fake.assertSent((mail) => mail.subject === 'Email 2');
      fake.assertSent((mail) => mail.subject === 'Email 3');

      const sentMails = fake.getSentMails();
      expect(sentMails.map((mail) => mail.subject)).toEqual(['Email 1', 'Email 2', 'Email 3']);
    });
  });

  describe('Template Testing', () => {
    it('should test email with template context', async () => {
      const templateEmail = {
        to: { address: 'template-test@example.com' },
        subject: 'Template Test',
        template: 'welcome',
        context: {
          name: 'John Doe',
          verificationUrl: 'https://example.com/verify?token=abc123',
          appName: 'Test App',
        },
      };

      await _mailService.send(templateEmail);

      const sentEmail = mockTransport.getLastSentEmail();
      expect(sentEmail?.template).toBe('welcome');
      expect(sentEmail?.context?.name).toBe('John Doe');
      expect(sentEmail?.context?.appName).toBe('Test App');
    });
  });
});

// Example of testing a service that uses email
@Injectable()
class UserService {
  constructor(private readonly mailService: MailService) {}

  async createUser(userData: { name: string; email: string }): Promise<{ id: number; name: string; email: string }> {
    // Create user logic here...

    // Send welcome email
    await this.mailService.send({
      to: { address: userData.email, name: userData.name },
      subject: `Welcome ${userData.name}!`,
      html: `<h1>Welcome ${userData.name}!</h1><p>Thanks for joining our platform.</p>`,
      tags: ['welcome', 'new-user'],
    });

    return { id: 1, ...userData };
  }

  async resetPassword(email: string): Promise<{ token: string }> {
    const token = 'reset-token-123';

    await this.mailService.send({
      to: { address: email },
      subject: 'Password Reset Request',
      html: `<p>Click <a href="https://example.com/reset?token=${token}">here</a> to reset your password.</p>`,
      tags: ['password-reset'],
    });

    return { token };
  }
}

describe('Service Integration Testing', () => {
  let userService: UserService;
  let mockTransport: MockTransport;

  beforeEach(async () => {
    mockTransport = new MockTransport();

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: MailConfigService,
          useFactory: (): MailConfigService =>
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
            createTransport: jest.fn().mockReturnValue(mockTransport),
          },
        },
        MailService,
        TemplateEngineFactory,
        UserService,
      ],
    }).compile();

    moduleRef.get<MailService>(MailService);
    userService = moduleRef.get<UserService>(UserService);

    mockTransport.reset();
  });

  it('should send welcome email when user is created', async () => {
    const newUser = await userService.createUser({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });

    expect(newUser.id).toBe(1);
    expect(mockTransport.getSentEmails()).toHaveLength(1);

    const welcomeEmail = mockTransport.getLastSentEmail();
    expect(welcomeEmail?.subject).toBe('Welcome Jane Doe!');
    expect(welcomeEmail?.to).toEqual({ address: 'jane@example.com', name: 'Jane Doe' });
    expect(welcomeEmail?.tags).toContain('welcome');
  });

  it('should send password reset email', async () => {
    const result = await userService.resetPassword('user@example.com');

    expect(result.token).toBe('reset-token-123');
    expect(mockTransport.getSentEmails()).toHaveLength(1);

    const resetEmail = mockTransport.getLastSentEmail();
    expect(resetEmail?.subject).toBe('Password Reset Request');
    expect(resetEmail?.html).toContain('reset-token-123');
    expect(resetEmail?.tags).toContain('password-reset');
  });
});
