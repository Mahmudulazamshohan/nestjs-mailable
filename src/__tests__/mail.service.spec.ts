import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../services/mail.service';
import { MailConfigService } from '../services/mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TemplateEngineFactory } from '../services/template.service';
import { MailTransport, Content } from '../interfaces/mail.interface';
import { Mailable } from '../mailables/mailable';

// Simple Mock Transport
class MockTransport implements MailTransport {
  public sentEmails: Content[] = [];

  async send(content: Content): Promise<any> {
    this.sentEmails.push({ ...content });
    return {
      messageId: `mock-${Date.now()}`,
      accepted: [content.to],
      rejected: [],
      response: '250 Message accepted',
    };
  }

  getSentEmails(): Content[] {
    return this.sentEmails;
  }

  reset(): void {
    this.sentEmails = [];
  }
}

// Test Mailable
class TestMailable extends Mailable {
  constructor(
    private email: string,
    private name: string,
  ) {
    super();
  }

  protected build(): any {
    this.subject('Test Email')
      .from('test@example.com')
      .view('test-template', { name: this.name })
      .tag('test')
      .metadata('user_email', this.email);
    return this.content;
  }
}

describe('MailService - Fixed Tests', () => {
  let mailService: MailService;
  let mockTransport: MockTransport;

  beforeEach(async () => {
    mockTransport = new MockTransport();

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
            createTransport: jest.fn().mockReturnValue(mockTransport),
          },
        },
        MailService,
        TemplateEngineFactory,
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    module.get<MailTransportFactory>(MailTransportFactory);

    mockTransport.reset();
  });

  describe('Basic Email Sending', () => {
    it('should send simple email successfully', async () => {
      const email: Content = {
        to: { address: 'test@example.com', name: 'Test User' },
        subject: 'Test Email',
        html: '<h1>Hello World!</h1>',
        text: 'Hello World!',
      };

      const result = await mailService.send(email);

      expect(result.messageId).toBeDefined();
      expect(mockTransport.getSentEmails()).toHaveLength(1);

      const sentEmail = mockTransport.getSentEmails()[0];
      expect(sentEmail.subject).toBe('Test Email');
      expect(sentEmail.to).toEqual({ address: 'test@example.com', name: 'Test User' });
    });

    it('should send email with multiple recipients', async () => {
      const email: Content = {
        to: [
          { address: 'user1@example.com', name: 'User 1' },
          { address: 'user2@example.com', name: 'User 2' },
        ],
        subject: 'Bulk Email',
        html: '<h1>Bulk Email Content</h1>',
      };

      await mailService.send(email);

      expect(mockTransport.getSentEmails()).toHaveLength(1);

      const sentEmail = mockTransport.getSentEmails()[0];
      expect(Array.isArray(sentEmail.to)).toBe(true);
      expect((sentEmail.to as any[]).length).toBe(2);
    });

    it('should handle attachments', async () => {
      const email: Content = {
        to: { address: 'user@example.com' },
        subject: 'Email with Attachment',
        html: '<p>Please find attachment.</p>',
        attachments: [
          {
            filename: 'test.txt',
            content: Buffer.from('test content'),
            contentType: 'text/plain',
          },
        ],
      };

      await mailService.send(email);

      const sentEmail = mockTransport.getSentEmails()[0];
      expect(sentEmail.attachments).toHaveLength(1);
      expect(sentEmail.attachments![0].filename).toBe('test.txt');
    });
  });

  describe('Mailable Classes', () => {
    it('should send email using Mailable class', async () => {
      const testMailable = new TestMailable('john@example.com', 'John Doe');
      const content = testMailable.render();

      // Set the recipient since it's not set in build method
      content.to = { address: 'john@example.com', name: 'John Doe' };

      await mailService.send(content);

      const sentEmail = mockTransport.getSentEmails()[0];
      expect(sentEmail.subject).toBe('Test Email');
      expect(sentEmail.tags).toContain('test');
      expect(sentEmail.metadata?.user_email).toBe('john@example.com');
    });
  });

  describe('Fluent Interface', () => {
    it('should support fluent email building through MailSender', async () => {
      const mailSender = await mailService.to('recipient@example.com');
      const result = await mailSender.send({
        subject: 'Fluent Interface Test',
        html: '<h1>Fluent Email</h1>',
        tags: ['fluent'],
        metadata: { test_id: 'fluent-001' },
      });

      expect(result.messageId).toBeDefined();

      const sentEmail = mockTransport.getSentEmails()[0];
      expect(sentEmail.to).toEqual({ address: 'recipient@example.com' });
      expect(sentEmail.subject).toBe('Fluent Interface Test');
    });
  });

  describe('Template Integration', () => {
    it('should send email with template', async () => {
      const email: Content = {
        to: { address: 'template@example.com', name: 'Template User' },
        subject: 'Template Email',
        template: 'welcome',
        context: {
          name: 'Template User',
          appName: 'Test App',
        },
      };

      await mailService.send(email);

      const sentEmail = mockTransport.getSentEmails()[0];
      expect(sentEmail.template).toBe('welcome');
      expect(sentEmail.context?.name).toBe('Template User');
    });
  });

  describe('Multiple Mailer Configuration', () => {
    it('should switch between different mailers', async () => {
      // Test default mailer
      await mailService.send({
        to: { address: 'default@example.com' },
        subject: 'Default Mailer',
        html: '<p>Default</p>',
      });

      expect(mockTransport.getSentEmails()).toHaveLength(1);

      // Test mailer method returns new service instance
      const sesMailer = mailService.mailer('smtp'); // Use smtp since it's configured
      expect(sesMailer).toBeDefined();
      expect(sesMailer).not.toBe(mailService); // Should be different instance
    });
  });

  describe('MailFake Testing Utilities', () => {
    it('should use MailFake for testing', async () => {
      const fake = mailService.fake();

      const testEmail: Content = {
        to: { address: 'fake@example.com', name: 'Fake User' },
        subject: 'Fake Email Test',
        html: '<h1>This is a fake email!</h1>',
        tags: ['fake', 'test'],
      };

      await fake.send(testEmail);

      // Test MailFake assertions
      fake.assertSentCount(1);
      fake.assertSent((mail) => mail.subject === 'Fake Email Test');
      fake.assertSent((mail) => {
        const to = mail.to as any;
        return to?.address === 'fake@example.com';
      });
      fake.assertSent((mail) => mail.tags?.includes('fake'));

      const sentMails = fake.getSentMails();
      expect(sentMails).toHaveLength(1);
      expect(sentMails[0].subject).toBe('Fake Email Test');
    });

    it('should handle multiple fake emails with assertions', async () => {
      const fake = mailService.fake();

      const emails = [
        { to: { address: 'user1@example.com' }, subject: 'Welcome Email', html: '<p>Welcome</p>', tags: ['welcome'] },
        {
          to: { address: 'user2@example.com' },
          subject: 'Newsletter',
          html: '<p>Newsletter</p>',
          tags: ['newsletter'],
        },
        { to: { address: 'user3@example.com' }, subject: 'Invoice', html: '<p>Invoice</p>', tags: ['invoice'] },
      ];

      for (const email of emails) {
        await fake.send(email);
      }

      fake.assertSentCount(3);
      fake.assertSent((mail) => mail.tags?.includes('welcome'));
      fake.assertSent((mail) => mail.tags?.includes('newsletter'));
      fake.assertSent((mail) => mail.tags?.includes('invoice'));

      // Test that we can find specific emails
      const welcomeEmail = fake.getSentMails().find((mail) => mail.subject === 'Welcome Email');
      expect(welcomeEmail?.tags).toContain('welcome');
    });
  });

  describe('Header and Metadata', () => {
    it('should handle custom headers', async () => {
      const email: Content = {
        to: { address: 'headers@example.com' },
        subject: 'Custom Headers Test',
        html: '<p>Headers test</p>',
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-Priority': 'high',
        },
      };

      await mailService.send(email);

      const sentEmail = mockTransport.getSentEmails()[0];
      expect(sentEmail.headers?.['X-Custom-Header']).toBe('custom-value');
      expect(sentEmail.headers?.['X-Priority']).toBe('high');
    });

    it('should handle metadata', async () => {
      const email: Content = {
        to: { address: 'metadata@example.com' },
        subject: 'Metadata Test',
        html: '<p>Metadata test</p>',
        metadata: {
          campaign_id: 'campaign-123',
          user_id: 'user-456',
        },
      };

      await mailService.send(email);

      const sentEmail = mockTransport.getSentEmails()[0];
      expect(sentEmail.metadata?.campaign_id).toBe('campaign-123');
      expect(sentEmail.metadata?.user_id).toBe('user-456');
    });
  });

  describe('Global Configuration', () => {
    it('should apply global from address when not specified', async () => {
      const email: Content = {
        to: { address: 'global@example.com' },
        subject: 'Global From Test',
        html: '<p>Testing global from</p>',
      };

      await mailService.send(email);

      const sentEmail = mockTransport.getSentEmails()[0];
      // Should have the global from address applied
      expect(sentEmail.from).toEqual({
        address: 'noreply@example.com',
        name: 'Test App',
      });
    });

    it('should override global from when explicitly set', async () => {
      const email: Content = {
        to: { address: 'override@example.com' },
        from: { address: 'custom@example.com', name: 'Custom Sender' },
        subject: 'Override From Test',
        html: '<p>Testing override from</p>',
      };

      await mailService.send(email);

      const sentEmail = mockTransport.getSentEmails()[0];
      expect(sentEmail.from).toEqual({
        address: 'custom@example.com',
        name: 'Custom Sender',
      });
    });
  });

  describe('CC and BCC Recipients', () => {
    it('should handle CC and BCC recipients', async () => {
      const email: Content = {
        to: { address: 'primary@example.com' },
        cc: { address: 'cc@example.com' },
        bcc: [{ address: 'bcc1@example.com' }, { address: 'bcc2@example.com' }],
        subject: 'CC and BCC Test',
        html: '<p>Testing CC and BCC</p>',
      };

      await mailService.send(email);

      const sentEmail = mockTransport.getSentEmails()[0];
      expect(sentEmail.cc).toEqual({ address: 'cc@example.com' });
      expect(Array.isArray(sentEmail.bcc)).toBe(true);
      expect((sentEmail.bcc as any[]).length).toBe(2);
    });
  });

  describe('Reply-To Configuration', () => {
    it('should set reply-to address', async () => {
      const email: Content = {
        to: { address: 'user@example.com' },
        subject: 'Reply-To Test',
        html: '<p>Reply to this email</p>',
        replyTo: { address: 'support@example.com', name: 'Support Team' },
      };

      await mailService.send(email);

      const sentEmail = mockTransport.getSentEmails()[0];
      expect(sentEmail.replyTo).toEqual({ address: 'support@example.com', name: 'Support Team' });
    });
  });

  describe('Statistics', () => {
    it('should track sent emails count', async () => {
      const emails = [
        { to: { address: 'user1@example.com' }, subject: 'Email 1', html: '<p>1</p>' },
        { to: { address: 'user2@example.com' }, subject: 'Email 2', html: '<p>2</p>' },
        { to: { address: 'user3@example.com' }, subject: 'Email 3', html: '<p>3</p>' },
      ];

      for (const email of emails) {
        await mailService.send(email);
      }

      expect(mockTransport.getSentEmails()).toHaveLength(3);
    });

    it('should find specific sent emails', async () => {
      await mailService.send({
        to: { address: 'search@example.com' },
        subject: 'Searchable Email',
        html: '<p>Find me</p>',
        tags: ['searchable'],
      });

      const sentEmails = mockTransport.getSentEmails();
      const foundEmail = sentEmails.find((email) => email.subject === 'Searchable Email');

      expect(foundEmail).toBeDefined();
      expect(foundEmail?.tags).toContain('searchable');
    });
  });
});
