import { MailTransportFactory, TransportChainBuilder } from '../factories/mail-transport.factory';
import { TransportType } from '../types/transport.type';
import { MailTransport, MailerConfig } from '../interfaces/mail.interface';

// Mock transport for testing custom transport functionality
class MockTransport implements MailTransport {
  async send(_mail: any): Promise<any> {
    return { success: true, messageId: 'mock-123' };
  }
}

describe('MailTransportFactory Coverage', () => {
  let factory: MailTransportFactory;

  beforeEach(() => {
    factory = new MailTransportFactory();
  });

  describe('Custom Transport Registration', () => {
    it('should register custom transport', () => {
      const customTransportFactory = (): MockTransport => new MockTransport();

      factory.registerCustomTransport('mock', customTransportFactory);

      // Test that it doesn't throw when registering
      expect(() => factory.registerCustomTransport('mock', customTransportFactory)).not.toThrow();
    });

    it('should register multiple custom transports', () => {
      const transport1 = (): MockTransport => new MockTransport();
      const transport2 = (): MockTransport => new MockTransport();

      factory.registerCustomTransport('mock1', transport1);
      factory.registerCustomTransport('mock2', transport2);

      expect(() => factory.registerCustomTransport('mock1', transport1)).not.toThrow();
      expect(() => factory.registerCustomTransport('mock2', transport2)).not.toThrow();
    });
  });

  describe('Available Transports', () => {
    it('should return available transport types', () => {
      const availableTransports = factory.getAvailableTransports();

      expect(availableTransports).toBeDefined();
      expect(Array.isArray(availableTransports)).toBe(true);
      expect(availableTransports).toContain(TransportType.SMTP);
      expect(availableTransports).toContain(TransportType.MAILGUN);
    });

    it('should return transport types array with expected length', () => {
      const availableTransports = factory.getAvailableTransports();

      expect(availableTransports.length).toBeGreaterThan(0);
    });
  });

  describe('Transport Chain Builder', () => {
    it('should create transport chain builder', () => {
      const chainBuilder = factory.buildTransportChain();

      expect(chainBuilder).toBeDefined();
      expect(chainBuilder).toBeInstanceOf(TransportChainBuilder);
    });

    it('should return TransportChainBuilder instance', () => {
      const chainBuilder = factory.buildTransportChain();

      expect(typeof chainBuilder.addSmtp).toBe('function');
      expect(typeof chainBuilder.addSes).toBe('function');
      expect(typeof chainBuilder.addMailgun).toBe('function');
    });
  });

  describe('Error Cases', () => {
    it('should throw error for SES transport without options', () => {
      const config: MailerConfig = {
        transport: TransportType.SES,
        // options is undefined
      };

      expect(() => factory.createTransport(config)).toThrow('SES transport requires options configuration');
    });

    it('should throw error for Mailgun transport without options', () => {
      const config: MailerConfig = {
        transport: TransportType.MAILGUN,
        // options is undefined
      };

      expect(() => factory.createTransport(config)).toThrow('Mailgun transport requires options configuration');
    });

    it('should throw error for unsupported transport type', () => {
      const config: MailerConfig = {
        transport: 'unsupported' as any,
      };

      expect(() => factory.createTransport(config)).toThrow('Unsupported transport type: unsupported');
    });
  });
});

describe('TransportChainBuilder Coverage', () => {
  let factory: MailTransportFactory;
  let chainBuilder: TransportChainBuilder;

  beforeEach(() => {
    factory = new MailTransportFactory();
    chainBuilder = factory.buildTransportChain();
  });

  describe('Chain Building Methods', () => {
    it('should add SMTP transport to chain', () => {
      const smtpConfig = {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: { user: 'test', pass: 'test' },
      };

      const result = chainBuilder.addSmtp(smtpConfig);

      expect(result).toBe(chainBuilder);
      expect(result).toBeInstanceOf(TransportChainBuilder);
    });

    it('should add SES transport to chain', () => {
      const sesConfig = {
        sesConfig: { region: 'us-east-1' },
        nodemailerOptions: {},
      };

      const result = chainBuilder.addSes(sesConfig);

      expect(result).toBe(chainBuilder);
      expect(result).toBeInstanceOf(TransportChainBuilder);
    });

    it('should add Mailgun transport to chain', () => {
      const mailgunConfig = {
        apiKey: 'key-123',
        domain: 'example.com',
      };

      const result = chainBuilder.addMailgun(mailgunConfig);

      expect(result).toBe(chainBuilder);
      expect(result).toBeInstanceOf(TransportChainBuilder);
    });

    it('should chain multiple transports', () => {
      const smtpConfig = { host: 'smtp.example.com', port: 587 };
      const sesConfig = { sesConfig: { region: 'us-east-1' } };
      const mailgunConfig = { apiKey: 'key-123', domain: 'example.com' };

      const result = chainBuilder.addSmtp(smtpConfig).addSes(sesConfig).addMailgun(mailgunConfig);

      expect(result).toBe(chainBuilder);
      expect(result).toBeInstanceOf(TransportChainBuilder);
    });
  });
});
