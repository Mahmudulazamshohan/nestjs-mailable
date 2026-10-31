import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const messagesCreate = jest.fn();
const domainsGet = jest.fn();
const mockClientFactory = jest.fn(() => ({ messages: { create: messagesCreate }, domains: { get: domainsGet } }));
const mockMailgunCtor = jest.fn().mockImplementation(() => ({
  client: mockClientFactory,
}));

const appendMock = jest.fn();
const getHeadersMock = jest.fn(() => ({ 'content-type': 'multipart/form-data' }));
const MockFormData = jest.fn().mockImplementation(() => ({
  append: appendMock,
  getHeaders: getHeadersMock,
}));

const axiosPostMock = jest.fn();

jest.mock('mailgun.js', () => ({
  __esModule: true,
  default: mockMailgunCtor,
}));

jest.mock('form-data', () => ({
  __esModule: true,
  default: MockFormData,
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: axiosPostMock,
  },
}));

import { MailgunTransport } from '../transports/mailgun.transport';

describe('MailgunTransport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when required Mailgun options are missing', () => {
    expect(
      () =>
        new MailgunTransport({
          transport: 'mailgun',
          options: {
            domain: '',
            apiKey: '',
          },
        } as any),
    ).toThrow('Mailgun API Key and domain are required.');
  });

  it('creates a real Mailgun client when mock host/protocol are not provided', () => {
    new MailgunTransport({
      transport: 'mailgun',
      options: {
        domain: 'mg.example.com',
        apiKey: 'key-123',
      },
    });

    expect(mockMailgunCtor).toHaveBeenCalledTimes(1);
    expect(mockClientFactory).toHaveBeenCalledWith({
      username: 'api',
      key: 'key-123',
      url: 'https://api.mailgun.net',
    });
  });

  it('uses mock server mode when host and protocol are provided', async () => {
    axiosPostMock.mockResolvedValue({ data: { id: 'mock-id', message: 'Queued' } });

    const transport = new MailgunTransport({
      transport: 'mailgun',
      options: {
        domain: 'mg.example.com',
        apiKey: 'key-123',
        host: 'localhost:8787',
        protocol: 'http:',
      },
    });

    const result = await transport.send({
      from: 'from@example.com',
      to: 'to@example.com',
      subject: 'Hello',
      html: '<p>Hello</p>',
      text: 'Hello',
      attachments: [{ filename: 'file.txt', content: Buffer.from('data') }],
      custom: 'x-custom',
      nullable: null,
      optional: undefined,
    });

    expect(result).toEqual({ id: 'mock-id', message: 'Queued' });
    expect(appendMock).toHaveBeenCalledWith('from', 'from@example.com');
    expect(appendMock).toHaveBeenCalledWith('to', 'to@example.com');
    expect(appendMock).toHaveBeenCalledWith('subject', 'Hello');
    expect(appendMock).toHaveBeenCalledWith('custom', 'x-custom');
    expect(appendMock).toHaveBeenCalledWith('attachment', Buffer.from('data'), 'file.txt');
    expect(axiosPostMock).toHaveBeenCalledWith(
      'http://localhost:8787/v3/mg.example.com/messages',
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
  });

  describe('real API mode', () => {
    const create = () =>
      new MailgunTransport({ transport: 'mailgun', options: { domain: 'mg.example.com', apiKey: 'key-123' } });

    it('calls messages.create with the mapped message and returns the API response', async () => {
      messagesCreate.mockResolvedValue({ id: '<mg-1>', message: 'Queued. Thank you.', status: 200 });

      const result = await create().send({
        from: { address: 'from@example.com', name: 'From' },
        to: ['a@example.com', { address: 'b@example.com', name: 'B' }],
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        replyTo: 'reply@example.com',
        subject: 'Hello',
        html: '<p>Hello</p>',
        text: 'Hello',
        headers: { 'X-Test': '1' },
        tags: ['welcome'],
        metadata: { userId: 7, plan: 'pro' },
        template: 'ignored',
        context: { ignored: true },
      });

      expect(result).toEqual({ id: '<mg-1>', message: 'Queued. Thank you.', status: 200 });
      expect(messagesCreate).toHaveBeenCalledTimes(1);
      const [domain, data] = messagesCreate.mock.calls[0];
      expect(domain).toBe('mg.example.com');
      expect(data).toEqual({
        from: 'From <from@example.com>',
        to: ['a@example.com', 'B <b@example.com>'],
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        subject: 'Hello',
        html: '<p>Hello</p>',
        text: 'Hello',
        'h:Reply-To': 'reply@example.com',
        'h:X-Test': '1',
        'o:tag': ['welcome'],
        'v:userId': '7',
        'v:plan': 'pro',
      });
    });

    it('omits empty optional fields', async () => {
      messagesCreate.mockResolvedValue({ id: 'x' });
      await create().send({ from: 'from@example.com', to: 'to@example.com', subject: 'Hi', text: 'Hi' });
      const data = messagesCreate.mock.calls[0][1];
      expect(data.cc).toBeUndefined();
      expect(data.bcc).toBeUndefined();
      expect(data['h:Reply-To']).toBeUndefined();
      expect(data.attachment).toBeUndefined();
    });

    it('sends content and path attachments in the mailgun.js shape', async () => {
      messagesCreate.mockResolvedValue({ id: 'x' });
      const dir = mkdtempSync(join(tmpdir(), 'mg-'));
      const file = join(dir, 'report.txt');
      writeFileSync(file, 'from disk');

      await create().send({
        from: 'from@example.com',
        to: 'to@example.com',
        subject: 'Files',
        attachments: [{ filename: 'file.txt', content: Buffer.from('data') }, { path: file }],
      });

      expect(messagesCreate.mock.calls[0][1].attachment).toEqual([
        { filename: 'file.txt', data: Buffer.from('data') },
        { filename: 'report.txt', data: Buffer.from('from disk') },
      ]);
    });

    it('rejects attachments without content or path', async () => {
      await expect(
        create().send({ from: 'f@example.com', to: 't@example.com', attachments: [{ filename: 'x' }] }),
      ).rejects.toThrow("Attachment 'x' requires content or path");
    });

    it('wraps API errors', async () => {
      messagesCreate.mockRejectedValue(new Error('Forbidden'));
      await expect(create().send({ from: 'f@example.com', to: 't@example.com', subject: 's' })).rejects.toThrow(
        'Failed to send email via Mailgun: Forbidden',
      );
    });

    it('verify checks the domain and reports failures as false', async () => {
      domainsGet.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('401'));
      const transport = create();
      expect(await transport.verify()).toBe(true);
      expect(await transport.verify()).toBe(false);
      expect(domainsGet).toHaveBeenCalledWith('mg.example.com');
    });
  });

  it('formats address objects in mock server mode instead of stringifying them', async () => {
    axiosPostMock.mockResolvedValue({ data: {} });
    const transport = new MailgunTransport({
      transport: 'mailgun',
      options: { domain: 'mg.example.com', apiKey: 'k', host: 'localhost:8787', protocol: 'http:' },
    });
    await transport.send({
      from: { address: 'from@example.com', name: 'From' },
      to: [{ address: 'a@example.com' }, 'b@example.com'],
      subject: 's',
    });
    expect(appendMock).toHaveBeenCalledWith('from', 'From <from@example.com>');
    expect(appendMock).toHaveBeenCalledWith('to', 'a@example.com');
    expect(appendMock).toHaveBeenCalledWith('to', 'b@example.com');
  });

  it('verify is always true in mock server mode', async () => {
    const transport = new MailgunTransport({
      transport: 'mailgun',
      options: { domain: 'mg.example.com', apiKey: 'k', host: 'localhost:8787', protocol: 'http:' },
    });
    expect(await transport.verify()).toBe(true);
  });
});
