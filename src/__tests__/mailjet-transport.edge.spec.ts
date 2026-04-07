describe('MailjetTransport edge branches', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('throws when node-mailjet does not expose apiConnect', () => {
    jest.isolateModules(() => {
      jest.doMock('node-mailjet', () => ({}));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { MailjetTransport } = require('../transports/mailjet.transport');

      expect(
        () =>
          new MailjetTransport({
            transport: 'mailjet',
            options: {
              apiKey: 'key',
              apiSecret: 'secret',
            },
          }),
      ).toThrow('Mailjet apiConnect function not found. Check node-mailjet module.');
    });
  });

  it('keeps extra rest fields and handles fallback address/base64 conversions', async () => {
    const requestMock = jest.fn().mockResolvedValue({ body: { ok: true } });
    const postMock = jest.fn().mockReturnValue({ request: requestMock });
    const getMock = jest.fn();
    const apiConnectMock = jest.fn(() => ({ post: postMock, get: getMock }));
    let MailjetTransportCtor: any;

    jest.isolateModules(() => {
      jest.doMock('node-mailjet', () => ({
        apiConnect: apiConnectMock,
      }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      MailjetTransportCtor = require('../transports/mailjet.transport').MailjetTransport;
    });

    const transport = new MailjetTransportCtor({
      transport: 'mailjet',
      options: {
        apiKey: 'key',
        apiSecret: 'secret',
      },
    });

    const result = await transport.send({
      from: 123,
      to: { email: 'to@example.com' },
      subject: 'edge',
      attachments: [{ content: { a: 1 } }],
      customField: 'custom-value',
    });

    expect(result).toEqual({ ok: true });

    const message = requestMock.mock.calls[0][0].Messages[0];
    expect(message.From).toEqual({ Email: '123' });
    expect(message.customField).toBe('custom-value');
    expect(message.Attachments[0]).toEqual({
      ContentType: 'application/octet-stream',
      Filename: 'attachment',
      Base64Content: Buffer.from('[object Object]').toString('base64'),
    });
    expect(message.To).toEqual([{ Email: 'to@example.com' }]);
  });

  it('falls back to empty string when address object has neither address nor email', async () => {
    const requestMock = jest.fn().mockResolvedValue({ body: { ok: true } });
    const postMock = jest.fn().mockReturnValue({ request: requestMock });
    const apiConnectMock = jest.fn(() => ({ post: postMock, get: jest.fn() }));
    let MailjetTransportCtor: any;

    jest.isolateModules(() => {
      jest.doMock('node-mailjet', () => ({
        apiConnect: apiConnectMock,
      }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      MailjetTransportCtor = require('../transports/mailjet.transport').MailjetTransport;
    });

    const transport = new MailjetTransportCtor({
      transport: 'mailjet',
      options: {
        apiKey: 'key',
        apiSecret: 'secret',
      },
    });

    await transport.send({
      from: {},
      to: 'to@example.com',
      subject: 'edge',
    });

    const message = requestMock.mock.calls[0][0].Messages[0];
    expect(message.From).toEqual({ Email: '' });
  });
});
