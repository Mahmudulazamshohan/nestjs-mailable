import { Test, TestingModule } from '@nestjs/testing';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TransportType } from '../types/transport.type';
import { SmtpTransport } from '../transports/smtp.transport';
import { SesTransport } from '../transports/ses.transport';
import { MailgunTransport } from '../transports/mailgun.transport';
import { TransportConfiguration } from '../interfaces/mail.interface';

// Mock external dependencies
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
    verify: jest.fn(),
    close: jest.fn(),
  }),
}));

jest.mock('aws-sdk', () => ({
  SES: jest.fn().mockImplementation(() => ({
    sendRawEmail: jest.fn(),
  })),
}));

jest.mock('mailgun.js', () => {
  const mockClient = {
    messages: {
      create: jest.fn(),
    },
  };

  return {
    default: jest.fn().mockImplementation(() => ({
      client: jest.fn().mockReturnValue(mockClient),
    })),
  };
});

// Mock form-data as a simple constructor
jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({}),
  }));
});

describe('Transport Verification', () => {
  let factory: MailTransportFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailTransportFactory],
    }).compile();

    factory = module.get<MailTransportFactory>(MailTransportFactory);
  });

  describe('SMTP Transport Creation and Verification', () => {
    it('should create SMTP transport with valid configuration', () => {
      const config: TransportConfiguration = {
        type: TransportType.SMTP,
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password',
        },
      };

      const transport = factory.createTransport(config);

      expect(transport).toBeInstanceOf(SmtpTransport);
    });

    it('should create SMTP transport with minimal configuration', () => {
      const config: TransportConfiguration = {
        type: TransportType.SMTP,
        host: 'localhost',
        port: 1025,
      };

      const transport = factory.createTransport(config);

      expect(transport).toBeInstanceOf(SmtpTransport);
    });

    it('should create SMTP transport with SSL configuration', () => {
      const config: TransportConfiguration = {
        type: TransportType.SMTP,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'test@gmail.com',
          pass: 'app-password',
        },
      };

      const transport = factory.createTransport(config);

      expect(transport).toBeInstanceOf(SmtpTransport);
    });

    it('should create SMTP transport with STARTTLS configuration', () => {
      const config: TransportConfiguration = {
        type: TransportType.SMTP,
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        ignoreTLS: false,
        auth: {
          user: 'test@ethereal.email',
          pass: 'password',
        },
      };

      const transport = factory.createTransport(config);

      expect(transport).toBeInstanceOf(SmtpTransport);
    });

    it('should create SMTP transport for local testing (MailHog)', () => {
      const config: TransportConfiguration = {
        type: TransportType.SMTP,
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
        secure: false,
      };

      const transport = factory.createTransport(config);

      expect(transport).toBeInstanceOf(SmtpTransport);
    });
  });

  describe('SES Transport Creation and Verification', () => {
    it('should create SES transport with valid configuration', () => {
      const config: TransportConfiguration = {
        type: TransportType.SES,
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        },
      };

      const transport = factory.createTransport(config);

      expect(transport).toBeInstanceOf(SesTransport);
    });

    it('should create SES transport with custom endpoint (LocalStack)', () => {
      const config: TransportConfiguration = {
        type: TransportType.SES,
        endpoint: 'http://localhost:4566',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
        },
      };

      const transport = factory.createTransport(config);

      expect(transport).toBeInstanceOf(SesTransport);
    });

    it('should create SES transport with session token', () => {
      const config: TransportConfiguration = {
        type: TransportType.SES,
        region: 'eu-west-1',
        credentials: {
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          sessionToken: 'SESSION_TOKEN',
        },
      };

      const transport = factory.createTransport(config);

      expect(transport).toBeInstanceOf(SesTransport);
    });

    it('should throw error when SES region is missing', () => {
      const config: TransportConfiguration = {
        type: TransportType.SES,
        credentials: {
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        },
      } as TransportConfiguration;

      expect(() => factory.createTransport(config)).toThrow(
        'SES transport requires region and credentials configuration',
      );
    });

    it('should throw error when SES credentials are missing', () => {
      const config: TransportConfiguration = {
        type: TransportType.SES,
        region: 'us-east-1',
      } as TransportConfiguration;

      expect(() => factory.createTransport(config)).toThrow(
        'SES transport requires region and credentials configuration',
      );
    });
  });

  describe('Mailgun Transport Creation and Verification', () => {
    it('should create Mailgun transport with valid configuration', () => {
      const config: TransportConfiguration = {
        type: TransportType.MAILGUN,
        options: {
          domain: 'mg.example.com',
          apiKey: 'key-1234567890abcdef1234567890abcdef',
        },
      };

      const transport = factory.createTransport(config);

      expect(transport).toBeInstanceOf(MailgunTransport);
    });

    it('should create Mailgun transport with custom host', () => {
      const config: TransportConfiguration = {
        type: TransportType.MAILGUN,
        options: {
          domain: 'mg.eu.example.com',
          apiKey: 'key-1234567890abcdef1234567890abcdef',
          host: 'api.eu.mailgun.net',
        },
      };

      const transport = factory.createTransport(config);

      expect(transport).toBeInstanceOf(MailgunTransport);
    });

    it('should create Mailgun transport with timeout configuration', () => {
      const config: TransportConfiguration = {
        type: TransportType.MAILGUN,
        options: {
          domain: 'mg.example.com',
          apiKey: 'key-1234567890abcdef1234567890abcdef',
          timeout: 30000,
        },
      };

      const transport = factory.createTransport(config);

      expect(transport).toBeInstanceOf(MailgunTransport);
    });

    it('should throw error when Mailgun options are missing', () => {
      const config: TransportConfiguration = {
        type: TransportType.MAILGUN,
      } as TransportConfiguration;

      expect(() => factory.createTransport(config)).toThrow('Mailgun transport requires options configuration');
    });
  });

  describe('Transport Factory Edge Cases', () => {
    it('should throw error for unsupported transport type', () => {
      const config = {
        type: 'unsupported' as TransportType,
      } as TransportConfiguration;

      expect(() => factory.createTransport(config)).toThrow('Unsupported transport type: unsupported');
    });

    it('should get list of available transports', () => {
      const availableTransports = factory.getAvailableTransports();

      expect(availableTransports).toContain(TransportType.SMTP);
      expect(availableTransports).toContain(TransportType.SES);
      expect(availableTransports).toContain(TransportType.MAILGUN);
      expect(availableTransports).toHaveLength(3);
    });
  });

  describe('Legacy Transport Factory', () => {
    it('should create SMTP transport with legacy configuration', () => {
      const legacyConfig = {
        transport: TransportType.SMTP,
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password',
        },
      };

      const transport = factory.createTransportLegacy(legacyConfig);

      expect(transport).toBeInstanceOf(SmtpTransport);
    });

    it('should create SES transport with legacy configuration', () => {
      const legacyConfig = {
        transport: TransportType.SES,
        options: {
          region: 'us-east-1',
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        },
      };

      const transport = factory.createTransportLegacy(legacyConfig);

      expect(transport).toBeInstanceOf(SesTransport);
    });

    it('should create Mailgun transport with legacy configuration', () => {
      const legacyConfig = {
        transport: TransportType.MAILGUN,
        options: {
          domain: 'mg.example.com',
          apiKey: 'key-1234567890abcdef1234567890abcdef',
        },
      };

      const transport = factory.createTransportLegacy(legacyConfig);

      expect(transport).toBeInstanceOf(MailgunTransport);
    });

    it('should throw error for legacy SES without options', () => {
      const legacyConfig = {
        transport: TransportType.SES,
      };

      expect(() => factory.createTransportLegacy(legacyConfig)).toThrow('SES transport requires options configuration');
    });

    it('should throw error for legacy Mailgun without options', () => {
      const legacyConfig = {
        transport: TransportType.MAILGUN,
      };

      expect(() => factory.createTransportLegacy(legacyConfig)).toThrow(
        'Mailgun transport requires options configuration',
      );
    });

    it('should throw error for unsupported legacy transport type', () => {
      const legacyConfig = {
        transport: 'unsupported' as TransportType,
      };

      expect(() => factory.createTransportLegacy(legacyConfig)).toThrow('Unsupported transport type: unsupported');
    });
  });

  describe('Custom Transport Registration', () => {
    it('should register custom transport', () => {
      const mockTransport = {
        send: jest.fn(),
        verify: jest.fn(),
        close: jest.fn(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customTransportFactory = (): any => mockTransport;

      expect(() => {
        factory.registerCustomTransport('custom', customTransportFactory);
      }).not.toThrow();
    });
  });

  describe('Real-world Configuration Examples', () => {
    it('should handle Gmail SMTP configuration', () => {
      const config: TransportConfiguration = {
        type: TransportType.SMTP,
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'your-email@gmail.com',
          pass: 'your-app-password',
        },
      };

      const transport = factory.createTransport(config);
      expect(transport).toBeInstanceOf(SmtpTransport);
    });

    it('should handle Outlook/Hotmail SMTP configuration', () => {
      const config: TransportConfiguration = {
        type: TransportType.SMTP,
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: 'your-email@outlook.com',
          pass: 'your-password',
        },
      };

      const transport = factory.createTransport(config);
      expect(transport).toBeInstanceOf(SmtpTransport);
    });

    it('should handle AWS SES production configuration', () => {
      const config: TransportConfiguration = {
        type: TransportType.SES,
        region: 'us-west-2',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
        },
      };

      const transport = factory.createTransport(config);
      expect(transport).toBeInstanceOf(SesTransport);
    });

    it('should handle Mailgun EU region configuration', () => {
      const config: TransportConfiguration = {
        type: TransportType.MAILGUN,
        options: {
          domain: 'mg.eu.yourdomain.com',
          apiKey: 'key-1234567890abcdef1234567890abcdef',
          host: 'api.eu.mailgun.net',
        },
      };

      const transport = factory.createTransport(config);
      expect(transport).toBeInstanceOf(MailgunTransport);
    });
  });
});
