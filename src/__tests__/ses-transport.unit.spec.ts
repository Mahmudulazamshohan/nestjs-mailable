const sendMailMock = jest.fn();
const verifyMock = jest.fn();
const closeMock = jest.fn();
const createTransportMock = jest.fn(() => ({
  sendMail: sendMailMock,
  verify: verifyMock,
  close: closeMock,
}));

const sendEmailPromiseMock = jest.fn();
const sendEmailMock = jest.fn(() => ({ promise: sendEmailPromiseMock }));
const SESMock = jest.fn().mockImplementation(() => ({
  sendEmail: sendEmailMock,
}));

jest.mock('nodemailer', () => ({
  __esModule: true,
  createTransport: createTransportMock,
}));

jest.mock('aws-sdk', () => ({
  __esModule: true,
  SES: SESMock,
}));

import { SesTransport } from '../transports/ses.transport';

describe('SesTransport (unit)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as any;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('throws when region is missing', () => {
    expect(() => new SesTransport({})).toThrow('SES transport requires region configuration');
  });

  it('creates nodemailer transport for non-local endpoint', () => {
    new SesTransport({
      endpoint: 'https://email.us-east-1.amazonaws.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
      },
    });

    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'email-smtp.us-east-1.amazonaws.com',
      port: 587,
      secure: false,
      auth: {
        user: 'ak',
        pass: 'sk',
      },
    });
  });

  it('uses explicit SMTP credentials when user/pass are provided', () => {
    new SesTransport({
      endpoint: 'https://email.us-east-1.amazonaws.com',
      region: 'us-east-1',
      host: 'smtp.custom.aws',
      port: 465,
      secure: true,
      credentials: {
        user: 'smtp-user',
        pass: 'smtp-pass',
        accessKeyId: 'ignored-ak',
        secretAccessKey: 'ignored-sk',
      },
    });

    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.custom.aws',
      port: 465,
      secure: true,
      auth: {
        user: 'smtp-user',
        pass: 'smtp-pass',
      },
    });
  });

  it('creates AWS SES client for local endpoint without non-test credentials', () => {
    new SesTransport({
      endpoint: 'http://localhost:4566',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    });

    expect(SESMock).toHaveBeenCalledWith({
      endpoint: 'http://localhost:4566',
      region: 'us-east-1',
    });
  });

  it('creates AWS SES client for local endpoint with full credentials', () => {
    new SesTransport({
      endpoint: 'http://127.0.0.1:4566',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'real-ak',
        secretAccessKey: 'real-sk',
        sessionToken: 'token',
      },
    });

    expect(SESMock).toHaveBeenCalledWith({
      endpoint: 'http://127.0.0.1:4566',
      region: 'us-east-1',
      accessKeyId: 'real-ak',
      secretAccessKey: 'real-sk',
      sessionToken: 'token',
    });
  });

  it('wraps validation errors when recipient is missing', async () => {
    const transport = new SesTransport({
      endpoint: 'https://email.us-east-1.amazonaws.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
      },
    });

    await expect(transport.send({ subject: 'No recipient' })).rejects.toThrow(
      'SES send failed: Recipient address (to) is required',
    );
  });

  it('sends with nodemailer transporter and strips undefined/empty fields', async () => {
    const transport = new SesTransport({
      endpoint: 'https://email.us-east-1.amazonaws.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
      },
    });

    sendMailMock.mockResolvedValue({ messageId: 'smtp-id' });

    await expect(
      transport.send({
        from: { address: 'from@example.com', name: 'From' },
        to: [{ address: 'to@example.com', name: 'To' }],
        cc: 'cc@example.com',
        bcc: { address: 'bcc@example.com' },
        replyTo: 'reply@example.com',
        subject: '',
        text: '',
        html: '<p>Hello</p>',
      }),
    ).resolves.toEqual({ messageId: 'smtp-id' });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'From <from@example.com>',
        to: 'To <to@example.com>',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        replyTo: 'reply@example.com',
        html: '<p>Hello</p>',
      }),
    );

    const sentOptions = sendMailMock.mock.calls[0][0];
    expect(sentOptions.subject).toBeUndefined();
    expect(sentOptions.text).toBeUndefined();
  });

  it('sends with nodemailer when from is omitted', async () => {
    const transport = new SesTransport({
      endpoint: 'https://email.us-east-1.amazonaws.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
      },
    });
    sendMailMock.mockResolvedValue({ messageId: 'smtp-id-no-from' });

    await expect(
      transport.send({
        to: 'to@example.com',
        html: '<p>Hello</p>',
      }),
    ).resolves.toEqual({ messageId: 'smtp-id-no-from' });

    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'to@example.com' }));
    expect(sendMailMock.mock.calls[0][0].from).toBeUndefined();
  });

  it('sends via AWS SES SDK for local endpoints', async () => {
    const transport = new SesTransport({
      endpoint: 'http://localhost:4566',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'real-ak',
        secretAccessKey: 'real-sk',
      },
    });

    sendEmailPromiseMock.mockResolvedValue({ MessageId: 'ses-id' });

    const result = await transport.send({
      from: { address: 'from@example.com', name: 'From' },
      to: [{ address: 'to1@example.com' }, { address: 'to2@example.com' }],
      cc: [{ address: 'cc@example.com' }],
      bcc: [{ address: 'bcc@example.com' }],
      subject: 'Hello',
      html: '<p>Hello</p>',
      text: 'Hello',
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      messageId: 'ses-id',
      accepted: ['to1@example.com', 'to2@example.com'],
      rejected: [],
      response: '250 OK',
      envelope: {
        from: 'From <from@example.com>',
        to: ['to1@example.com', 'to2@example.com'],
      },
    });
  });

  it('maps non-array local destination branches and default subject', async () => {
    const transport = new SesTransport({
      endpoint: 'http://localhost:4566',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'real-ak',
        secretAccessKey: 'real-sk',
      },
    });
    sendEmailPromiseMock.mockResolvedValue({ MessageId: 'ses-id-2' });

    await transport.send({
      to: { address: 'solo@example.com' },
      cc: 'solo-cc@example.com',
      bcc: { address: 'solo-bcc@example.com' },
    });

    const callArg = (sendEmailMock.mock.calls[0] as any)[0];
    expect(callArg.Destination).toEqual({
      ToAddresses: ['solo@example.com'],
      CcAddresses: ['solo-cc@example.com'],
      BccAddresses: ['solo-bcc@example.com'],
    });
    expect(callArg.Message.Subject.Data).toBe('No Subject');
  });

  it('maps mixed string/object array branches for local destination lists', async () => {
    const transport = new SesTransport({
      endpoint: 'http://localhost:4566',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'real-ak',
        secretAccessKey: 'real-sk',
      },
    });
    sendEmailPromiseMock.mockResolvedValue({ MessageId: 'ses-id-3' });

    await transport.send({
      to: ['to1@example.com', { address: 'to2@example.com' }],
      cc: ['cc1@example.com', { address: 'cc2@example.com' }],
      bcc: ['bcc1@example.com', { address: 'bcc2@example.com' }],
    });

    const callArg = (sendEmailMock.mock.calls[0] as any)[0];
    expect(callArg.Destination).toEqual({
      ToAddresses: ['to1@example.com', 'to2@example.com'],
      CcAddresses: ['cc1@example.com', 'cc2@example.com'],
      BccAddresses: ['bcc1@example.com', 'bcc2@example.com'],
    });
  });

  it('maps non-array object/string opposite branches for local cc and bcc', async () => {
    const transport = new SesTransport({
      endpoint: 'http://localhost:4566',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'real-ak',
        secretAccessKey: 'real-sk',
      },
    });
    sendEmailPromiseMock.mockResolvedValue({ MessageId: 'ses-id-4' });

    await transport.send({
      to: 'to@example.com',
      cc: { address: 'cc-object@example.com' },
      bcc: 'bcc-string@example.com',
    });

    const callArg = (sendEmailMock.mock.calls[0] as any)[0];
    expect(callArg.Destination).toEqual({
      ToAddresses: ['to@example.com'],
      CcAddresses: ['cc-object@example.com'],
      BccAddresses: ['bcc-string@example.com'],
    });
  });

  it('uses fetch raw-email fallback when transporter is unavailable and endpoint is non-local', async () => {
    const transport = new SesTransport({
      endpoint: 'https://email.us-east-1.amazonaws.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
      },
    });

    (transport as any).transporter = null;
    (transport as any).options.endpoint = 'https://ses.mock.internal';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ MessageId: 'raw-id' }),
    });

    const result = await transport.send({
      from: { address: 'from@example.com', name: 'From' },
      to: 'to@example.com',
      cc: 'cc@example.com',
      replyTo: 'reply@example.com',
      subject: 'Raw Subject',
      html: '<p>Body</p>',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://ses.mock.internal',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'SimpleEmailService.SendRawEmail',
        }),
      }),
    );

    expect(result).toEqual({
      messageId: 'raw-id',
      accepted: ['to@example.com'],
      rejected: [],
      response: '250 OK',
      envelope: {
        from: 'From <from@example.com>',
        to: ['to@example.com'],
      },
    });
  });

  it('uses fallback messageId and default envelope from in raw-email fallback', async () => {
    const transport = new SesTransport({
      endpoint: 'https://email.us-east-1.amazonaws.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
      },
    });

    (transport as any).transporter = null;
    (transport as any).options.endpoint = 'https://ses.mock.internal';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const result = (await transport.send({
      to: 'to@example.com',
    })) as any;

    expect(result.messageId).toMatch(/^<test\.\d+@ses-mock>$/);
    expect(result.envelope.from).toBe('noreply@example.com');
    expect(result.envelope.to).toEqual(['to@example.com']);
  });

  it('wraps fetch fallback errors when API responds with failure', async () => {
    const transport = new SesTransport({
      endpoint: 'https://email.us-east-1.amazonaws.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
      },
    });

    (transport as any).transporter = null;
    (transport as any).options.endpoint = 'https://ses.mock.internal';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    });

    await expect(
      transport.send({
        to: 'to@example.com',
        subject: 'Raw Subject',
        html: '<p>Body</p>',
      }),
    ).rejects.toThrow('SES send failed: SES API returned 500: Server Error');
  });

  it('verify() returns true for reachable mock endpoint and 404 HEAD responses', async () => {
    const transport = new SesTransport({
      endpoint: 'http://localhost:4566',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'real-ak',
        secretAccessKey: 'real-sk',
      },
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200 });
    await expect(transport.verify()).resolves.toBe(true);

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(transport.verify()).resolves.toBe(true);
  });

  it('verify() returns transporter result, default true, and false on errors', async () => {
    const transport = new SesTransport({
      endpoint: 'https://email.us-east-1.amazonaws.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
      },
    });

    verifyMock.mockResolvedValueOnce(true);
    await expect(transport.verify()).resolves.toBe(true);

    verifyMock.mockRejectedValueOnce(new Error('verify failed'));
    await expect(transport.verify()).resolves.toBe(false);

    (transport as any).transporter = null;
    (transport as any).options.endpoint = undefined;
    await expect(transport.verify()).resolves.toBe(true);

    (transport as any).options.endpoint = 'http://localhost:4566';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));
    await expect(transport.verify()).resolves.toBe(false);
  });

  it('close() closes transporter when present', async () => {
    const transport = new SesTransport({
      endpoint: 'https://email.us-east-1.amazonaws.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
      },
    });

    await transport.close();
    expect(closeMock).toHaveBeenCalledTimes(1);

    (transport as any).transporter = null;
    await expect(transport.close()).resolves.toBeUndefined();
  });

  it('format helpers handle invalid values via private methods', () => {
    const transport = new SesTransport({
      endpoint: 'https://email.us-east-1.amazonaws.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'ak',
        secretAccessKey: 'sk',
      },
    });

    expect((transport as any).formatSingleAddress({})).toBeUndefined();
    expect((transport as any).formatSingleAddress('plain@example.com')).toBe('plain@example.com');
    expect((transport as any).formatAddresses([{}, null])).toBeUndefined();
    expect((transport as any).formatAddresses(undefined)).toBeUndefined();
  });
});
