const mockClientFactory = jest.fn(() => ({ messages: {} }));
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

  it('returns true for non-mock send with attachments', async () => {
    const transport = new MailgunTransport({
      transport: 'mailgun',
      options: {
        domain: 'mg.example.com',
        apiKey: 'key-123',
      },
    });

    const result = await transport.send({
      from: 'from@example.com',
      to: 'to@example.com',
      subject: 'With Attachments',
      attachments: [{ filename: 'file.txt', content: Buffer.from('data') }],
    });

    expect(result).toBe(true);
    expect(appendMock).toHaveBeenCalledWith('attachment', Buffer.from('data'), 'file.txt');
  });

  it('returns true for non-mock send without attachments', async () => {
    const transport = new MailgunTransport({
      transport: 'mailgun',
      options: {
        domain: 'mg.example.com',
        apiKey: 'key-123',
      },
    });

    await expect(
      transport.send({
        from: 'from@example.com',
        to: 'to@example.com',
        subject: 'No Attachments',
      }),
    ).resolves.toBe(true);
  });
});
