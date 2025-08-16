import { SmtpTransport } from '../transports/smtp.transport';
import { SesTransport } from '../transports/ses.transport';
import { MailgunTransport } from '../transports/mailgun.transport';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { Content, MailerConfig } from '../interfaces/mail.interface';
import { TransportType } from '../types/transport.type';

// Mock nodemailer
jest.mock('nodemailer');
const nodemailer = jest.requireActual('nodemailer');

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  SES: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        MessageId: '0000014a-f896-4c47-b8b0-6a24b2d9c2b8',
      }),
    }),
  })),
  config: {
    update: jest.fn(),
  },
}));

describe('Transport Implementations - Simple Tests', () => {
  let mockTransporter: any;
  let testEmail: Content;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'smtp-test-message-id',
        accepted: ['recipient@example.com'],
        rejected: [],
      }),
      verify: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(undefined),
    };

    nodemailer.createTransport = jest.fn().mockReturnValue(mockTransporter);

    testEmail = {
      to: { address: 'recipient@example.com', name: 'Test Recipient' },
      from: { address: 'sender@example.com', name: 'Test Sender' },
      subject: 'Test Email Subject',
      html: '<h1>Test HTML Content</h1><p>This is a test email.</p>',
      text: 'Test Text Content\n\nThis is a test email.',
    };
  });

  describe('SMTP Transport', () => {
    it('should create SMTP transport', () => {
      const config: MailerConfig = {
        transport: TransportType.SMTP,
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'test-password',
        },
      };

      new SmtpTransport(config);
      expect(nodemailer.createTransport).toHaveBeenCalledWith(config);
    });

    it('should send email successfully', async () => {
      const config: MailerConfig = {
        transport: TransportType.SMTP,
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'test-password',
        },
      };

      const transport = new SmtpTransport(config);
      const result = await transport.send(testEmail);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      expect(result.messageId).toBe('smtp-test-message-id');
    });

    it('should verify connection', async () => {
      const config: MailerConfig = {
        transport: TransportType.SMTP,
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'test-password',
        },
      };

      const transport = new SmtpTransport(config);
      const isVerified = await transport.verify();

      expect(isVerified).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });
  });

  describe('SES Transport', () => {
    it('should create SES transport', () => {
      const config: MailerConfig = {
        transport: TransportType.SES,
        options: {
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          region: 'us-east-1',
        },
      };

      const transport = new SesTransport(config.options);
      expect(transport).toBeInstanceOf(SesTransport);
    });
  });

  describe('Mailgun Transport', () => {
    it('should create Mailgun transport', () => {
      const config: MailerConfig = {
        transport: TransportType.MAILGUN,
        options: {
          apiKey: 'key-1234567890abcdef1234567890abcdef',
          domain: 'sandbox-123.mailgun.org',
        },
      };

      const transport = new MailgunTransport(config);
      expect(transport).toBeInstanceOf(MailgunTransport);
    });
  });

  describe('Transport Factory', () => {
    let factory: MailTransportFactory;

    beforeEach(() => {
      factory = new MailTransportFactory();
    });

    it('should create SMTP transport', () => {
      const config: MailerConfig = {
        transport: TransportType.SMTP,
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'test-password',
        },
      };

      const transport = factory.createTransport(config);
      expect(transport).toBeInstanceOf(SmtpTransport);
    });

    it('should create SES transport', () => {
      const config: MailerConfig = {
        transport: TransportType.SES,
        options: {
          accessKeyId: 'key',
          secretAccessKey: 'secret',
          region: 'us-east-1',
        },
      };

      const transport = factory.createTransport(config);
      expect(transport).toBeInstanceOf(SesTransport);
    });

    it('should create Mailgun transport', () => {
      const config: MailerConfig = {
        transport: TransportType.MAILGUN,
        options: {
          apiKey: 'key-123',
          domain: 'example.com',
        },
      };

      const transport = factory.createTransport(config);
      expect(transport).toBeInstanceOf(MailgunTransport);
    });

    it('should throw error for unknown transport', () => {
      const config: MailerConfig = {
        transport: 'unknown' as any,
        host: 'smtp.example.com',
      };

      expect(() => factory.createTransport(config)).toThrow('Unsupported transport type: unknown');
    });
  });
});
