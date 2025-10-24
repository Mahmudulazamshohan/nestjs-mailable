// Create mock clients first
const mockPostRequest = {
  request: jest.fn(),
};

const mockMailjetClient = {
  post: jest.fn().mockReturnValue(mockPostRequest),
  get: jest.fn().mockReturnValue(mockPostRequest),
};

const mockApiConnect = jest.fn(() => mockMailjetClient);

// Mock node-mailjet before importing
jest.mock('node-mailjet', () => {
  return {
    apiConnect: mockApiConnect,
    Request: jest.fn(),
    HttpMethods: jest.fn(),
    Client: jest.fn(),
  };
});

import { MailjetTransport } from '../transports/mailjet.transport';

describe('MailjetTransport', () => {
  let transport: MailjetTransport;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPostRequest.request.mockClear();
    (mockMailjetClient.post as jest.Mock).mockClear();
    (mockMailjetClient.get as jest.Mock).mockClear();
  });

  describe('Constructor', () => {
    it('should create client with valid API key and secret', () => {
      const config = {
        transport: 'mailjet',
        options: {
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret',
        },
      };

      transport = new MailjetTransport(config);

      expect(mockApiConnect).toHaveBeenCalledWith('test-api-key', 'test-api-secret');
    });

    it('should throw error when API key is missing', () => {
      const config: Record<string, unknown> = {
        transport: 'mailjet',
        options: {
          apiSecret: 'test-api-secret',
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => new MailjetTransport(config as any)).toThrow('Mailjet API Key and Secret are required.');
    });

    it('should throw error when API secret is missing', () => {
      const config: Record<string, unknown> = {
        transport: 'mailjet',
        options: {
          apiKey: 'test-api-key',
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => new MailjetTransport(config as any)).toThrow('Mailjet API Key and Secret are required.');
    });

    it('should throw error when options are not provided', () => {
      const config: Record<string, unknown> = {
        transport: 'mailjet',
        options: null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => new MailjetTransport(config as any)).toThrow('Mailjet API Key and Secret are required.');
    });
  });

  describe('send', () => {
    beforeEach(() => {
      transport = new MailjetTransport({
        transport: 'mailjet',
        options: {
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret',
        },
      });
    });

    it('should send email with basic content', async () => {
      const content: Record<string, unknown> = {
        from: { address: 'sender@example.com', name: 'Sender' },
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
        text: 'Test',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      const result = await transport.send(content);

      expect(mockMailjetClient.post).toHaveBeenCalledWith('send', { version: 'v3.1' });
      expect(mockPostRequest.request).toHaveBeenCalledWith({
        Messages: [
          {
            From: { Email: 'sender@example.com', Name: 'Sender' },
            To: [{ Email: 'recipient@example.com' }],
            Subject: 'Test Subject',
            HTMLPart: '<h1>Test</h1>',
            TextPart: 'Test',
          },
        ],
      });
      expect(result).toEqual(mockResponse.body);
    });

    it('should send email with string from address', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].From).toEqual({ Email: 'sender@example.com' });
    });

    it('should send email with multiple recipients', async () => {
      const content: Record<string, unknown> = {
        from: { address: 'sender@example.com' },
        to: [
          { address: 'recipient1@example.com', name: 'Recipient 1' },
          { address: 'recipient2@example.com', name: 'Recipient 2' },
          'recipient3@example.com',
        ],
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].To).toEqual([
        { Email: 'recipient1@example.com', Name: 'Recipient 1' },
        { Email: 'recipient2@example.com', Name: 'Recipient 2' },
        { Email: 'recipient3@example.com' },
      ]);
    });

    it('should send email with cc and bcc addresses', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        cc: [{ address: 'cc1@example.com', name: 'CC User' }],
        bcc: 'bcc@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].Cc).toEqual([{ Email: 'cc1@example.com', Name: 'CC User' }]);
      expect(callArgs.Messages[0].Bcc).toEqual([{ Email: 'bcc@example.com' }]);
    });

    it('should send email with reply-to address', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        replyTo: { address: 'reply@example.com', name: 'Reply' },
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].ReplyTo).toEqual({ Email: 'reply@example.com', Name: 'Reply' });
    });

    it('should send email with custom headers', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-Another-Header': 'another-value',
        },
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].Headers).toEqual({
        'X-Custom-Header': 'custom-value',
        'X-Another-Header': 'another-value',
      });
    });

    it('should send email with attachments', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
        attachments: [
          { filename: 'test.txt', content: 'test content' },
          { filename: 'buffer.bin', content: Buffer.from('binary content') },
        ],
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].Attachments).toHaveLength(2);
      expect(callArgs.Messages[0].Attachments[0]).toEqual({
        ContentType: 'application/octet-stream',
        Filename: 'test.txt',
        Base64Content: Buffer.from('test content').toString('base64'),
      });
      expect(callArgs.Messages[0].Attachments[1]).toEqual({
        ContentType: 'application/octet-stream',
        Filename: 'buffer.bin',
        Base64Content: Buffer.from('binary content').toString('base64'),
      });
    });

    it('should handle email with only html content', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].HTMLPart).toBe('<h1>Test</h1>');
      expect(callArgs.Messages[0].TextPart).toBeUndefined();
    });

    it('should handle email with only text content', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].TextPart).toBe('Test');
      expect(callArgs.Messages[0].HTMLPart).toBeUndefined();
    });

    it('should exclude context, template and engine properties', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
        context: { some: 'context' },
        template: 'welcome',
        engine: 'handlebars',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].context).toBeUndefined();
      expect(callArgs.Messages[0].template).toBeUndefined();
      expect(callArgs.Messages[0].engine).toBeUndefined();
    });

    it('should handle send error gracefully', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      const error = new Error('API Error');
      mockPostRequest.request.mockRejectedValue(error);

      await expect(transport.send(content)).rejects.toThrow('Failed to send email via Mailjet: API Error');
    });

    it('should handle multiple recipients as string array', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test Subject',
        html: '<h1>Test</h1>',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].To).toEqual([
        { Email: 'recipient1@example.com' },
        { Email: 'recipient2@example.com' },
      ]);
    });
  });

  describe('verify', () => {
    beforeEach(() => {
      transport = new MailjetTransport({
        transport: 'mailjet',
        options: {
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret',
        },
      });
    });

    it('should return true when verification succeeds', async () => {
      mockPostRequest.request.mockResolvedValue({ body: { Count: 1 } });

      const result = await transport.verify();

      expect(result).toBe(true);
      expect(mockMailjetClient.get).toHaveBeenCalledWith('apitoken');
    });

    it('should return false when verification fails', async () => {
      mockPostRequest.request.mockRejectedValue(new Error('Connection failed'));

      const result = await transport.verify();

      expect(result).toBe(false);
    });

    it('should handle different types of verification errors', async () => {
      const testCases = [new Error('Authentication failed'), new Error('ETIMEDOUT'), new Error('ECONNREFUSED')];

      for (const error of testCases) {
        mockPostRequest.request.mockRejectedValue(error);

        const result = await transport.verify();

        expect(result).toBe(false);
      }
    });
  });

  describe('close', () => {
    beforeEach(() => {
      transport = new MailjetTransport({
        transport: 'mailjet',
        options: {
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret',
        },
      });
    });

    it('should close gracefully', async () => {
      const result = await transport.close();

      expect(result).toBeUndefined();
    });
  });

  describe('Address formatting', () => {
    beforeEach(() => {
      transport = new MailjetTransport({
        transport: 'mailjet',
        options: {
          apiKey: 'test-api-key',
          apiSecret: 'test-api-secret',
        },
      });
    });

    it('should format address with name correctly', async () => {
      const content: Record<string, unknown> = {
        from: { address: 'sender@example.com', name: 'Sender Name' },
        to: { address: 'recipient@example.com', name: 'Recipient Name' },
        subject: 'Test',
        html: 'Test',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].From).toEqual({
        Email: 'sender@example.com',
        Name: 'Sender Name',
      });
      expect(callArgs.Messages[0].To[0]).toEqual({
        Email: 'recipient@example.com',
        Name: 'Recipient Name',
      });
    });

    it('should format address without name correctly', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: 'Test',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].From).toEqual({ Email: 'sender@example.com' });
      expect(callArgs.Messages[0].To[0]).toEqual({ Email: 'recipient@example.com' });
    });

    it('should handle mixed address formats', async () => {
      const content: Record<string, unknown> = {
        from: 'sender@example.com',
        to: [
          'plain@example.com',
          { address: 'with-name@example.com', name: 'With Name' },
          { address: 'no-name@example.com' },
        ],
        subject: 'Test',
        html: 'Test',
      };

      const mockResponse = { body: { Messages: [{ Status: 'success' }] } };
      mockPostRequest.request.mockResolvedValue(mockResponse);

      await transport.send(content);

      const callArgs = mockPostRequest.request.mock.calls[0][0];
      expect(callArgs.Messages[0].To).toEqual([
        { Email: 'plain@example.com' },
        { Email: 'with-name@example.com', Name: 'With Name' },
        { Email: 'no-name@example.com' },
      ]);
    });
  });
});
