import { SmtpTransport } from '../transports/smtp.transport';
import { Content } from '../interfaces/mail.interface';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');
const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe('SmtpTransport', () => {
  let transport: SmtpTransport;
  let mockTransporter: jest.Mocked<any>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
      close: jest.fn(),
    };

    // Mock createTransport to return our mock
    mockedNodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  describe('Constructor', () => {
    it('should create transporter with default pool configuration', () => {
      const options = {
        host: 'smtp.test.com',
        port: 587,
        auth: { user: 'test', pass: 'test' },
      };

      transport = new SmtpTransport(options);

      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
        ...options,
      });
    });

    it('should override default options with provided options', () => {
      const options = {
        host: 'smtp.test.com',
        port: 587,
        pool: false,
        maxConnections: 10,
        auth: { user: 'test', pass: 'test' },
      };

      transport = new SmtpTransport(options);

      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        pool: false,
        maxConnections: 10,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
        ...options,
      });
    });
  });

  describe('send', () => {
    beforeEach(() => {
      transport = new SmtpTransport({
        host: 'smtp.test.com',
        port: 587,
        auth: { user: 'test', pass: 'test' },
      });
    });

    it('should send email with basic content', async () => {
      const content: Content = {
        to: { address: 'test@example.com', name: 'Test User' },
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
        text: 'Test',
      };

      const mockResult = { messageId: 'test-message-id' };
      mockTransporter.sendMail.mockResolvedValue(mockResult);

      const result = await transport.send(content);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        to: 'Test User <test@example.com>',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
        text: 'Test',
      });
      expect(result).toBe(mockResult);
    });

    it('should send email with multiple recipients', async () => {
      const content: Content = {
        to: [
          { address: 'test1@example.com', name: 'Test User 1' },
          { address: 'test2@example.com', name: 'Test User 2' },
        ],
        cc: { address: 'cc@example.com' },
        bcc: [{ address: 'bcc@example.com' }],
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await transport.send(content);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        to: 'Test User 1 <test1@example.com>, Test User 2 <test2@example.com>',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      });
    });

    it('should send email with string addresses', async () => {
      const content: Content = {
        to: 'test@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await transport.send(content);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      });
    });

    it('should send email with from address', async () => {
      const content: Content = {
        from: { address: 'sender@example.com', name: 'Sender' },
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await transport.send(content);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'Sender <sender@example.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      });
    });

    it('should send email with attachments and headers', async () => {
      const content: Content = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
        attachments: [
          {
            filename: 'test.txt',
            content: 'test content',
          },
        ],
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await transport.send(content);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
        attachments: content.attachments,
        headers: content.headers,
      });
    });

    it('should filter out undefined fields', async () => {
      const content: Content = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
        cc: undefined,
        bcc: undefined,
        replyTo: undefined,
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await transport.send(content);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('cc');
      expect(callArgs).not.toHaveProperty('bcc');
      expect(callArgs).not.toHaveProperty('replyTo');
      expect(callArgs).toEqual({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      });
    });

    it('should handle empty address arrays', async () => {
      const content: Content = {
        to: 'test@example.com',
        cc: [],
        bcc: [],
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await transport.send(content);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('cc');
      expect(callArgs).not.toHaveProperty('bcc');
    });

    it('should handle invalid addresses gracefully', async () => {
      const content: Content = {
        to: [
          { address: 'valid@example.com', name: 'Valid User' },
          { address: '', name: 'Invalid User' } as any,
          null as any,
          { address: 'another@example.com' },
        ],
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await transport.send(content);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        to: 'Valid User <valid@example.com>, another@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      });
    });

    it('should throw error when no recipient is provided', async () => {
      const content: Content = {
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      await expect(transport.send(content)).rejects.toThrow('Recipient address (to) is required');
    });

    it('should wrap nodemailer errors', async () => {
      const content: Content = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      const originalError = new Error('Connection failed');
      mockTransporter.sendMail.mockRejectedValue(originalError);

      await expect(transport.send(content)).rejects.toThrow('SMTP send failed: Connection failed');
    });
  });

  describe('verify', () => {
    beforeEach(() => {
      transport = new SmtpTransport({
        host: 'smtp.test.com',
        port: 587,
        auth: { user: 'test', pass: 'test' },
      });
    });

    it('should return true when verification succeeds', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await transport.verify();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false when verification fails', async () => {
      const error = new Error('Connection failed');
      mockTransporter.verify.mockRejectedValue(error);

      // Mock console.warn to avoid console output in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await transport.verify();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('SMTP verification failed: Connection failed');

      consoleSpy.mockRestore();
    });

    it('should handle different types of verification errors', async () => {
      const testCases = [
        { error: new Error('Authentication failed'), message: 'Authentication failed' },
        { error: new Error('ETIMEDOUT'), message: 'ETIMEDOUT' },
        { error: new Error('ECONNREFUSED'), message: 'ECONNREFUSED' },
        { error: { message: 'Custom error' }, message: 'Custom error' },
      ];

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      for (const testCase of testCases) {
        mockTransporter.verify.mockRejectedValue(testCase.error);

        const result = await transport.verify();

        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(`SMTP verification failed: ${testCase.message}`);
      }

      consoleSpy.mockRestore();
    });
  });

  describe('close', () => {
    beforeEach(() => {
      transport = new SmtpTransport({
        host: 'smtp.test.com',
        port: 587,
        auth: { user: 'test', pass: 'test' },
      });
    });

    it('should close the transporter', async () => {
      await transport.close();

      expect(mockTransporter.close).toHaveBeenCalled();
    });
  });

  describe('Address formatting', () => {
    beforeEach(() => {
      transport = new SmtpTransport({
        host: 'smtp.test.com',
        port: 587,
        auth: { user: 'test', pass: 'test' },
      });
    });

    it('should format address with name correctly', async () => {
      const content: Content = {
        to: { address: 'test@example.com', name: 'Test User' },
        subject: 'Test',
        html: 'Test',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await transport.send(content);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('Test User <test@example.com>');
    });

    it('should format address without name correctly', async () => {
      const content: Content = {
        to: 'test@example.com',
        subject: 'Test',
        html: 'Test',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await transport.send(content);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('test@example.com');
    });

    it('should handle string addresses directly', async () => {
      const content: Content = {
        to: 'test@example.com',
        subject: 'Test',
        html: 'Test',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await transport.send(content);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('test@example.com');
    });

    it('should format multiple addresses correctly', async () => {
      const content: Content = {
        to: [
          'plain@example.com',
          { address: 'with-name@example.com', name: 'With Name' },
          { address: 'no-name@example.com' },
        ],
        subject: 'Test',
        html: 'Test',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

      await transport.send(content);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('plain@example.com, With Name <with-name@example.com>, no-name@example.com');
    });
  });
});
