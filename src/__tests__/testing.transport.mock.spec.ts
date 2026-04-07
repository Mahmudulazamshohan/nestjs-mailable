import {
  createSmtpTransportMock,
  createSESTransportMock,
  createMailgunTransportMock,
  createMailjetTransportMock,
  createResendTransportMock,
  createFailingTransportMock,
  createConfiguredTransportMock,
} from '../testing/transport.mock';

describe('testing/transport.mock', () => {
  it('creates SMTP transport mock with expected shape', async () => {
    const mock = createSmtpTransportMock();

    await expect(mock.send({})).resolves.toEqual({
      messageId: '<test@example.com>',
      response: '250 OK',
    });
    await expect(mock.verify()).resolves.toBe(true);
    await expect(mock.close()).resolves.toBeUndefined();
    expect(mock.isIdle()).toBe(true);
  });

  it('creates SES, Mailgun, Mailjet and Resend mocks', async () => {
    await expect(createSESTransportMock().send({})).resolves.toHaveProperty('MessageId');
    await expect(createMailgunTransportMock().send({})).resolves.toHaveProperty('message', 'Queued. Thank you.');
    await expect(createMailjetTransportMock().send({})).resolves.toHaveProperty('Messages');
    await expect(createResendTransportMock().send({})).resolves.toHaveProperty('id');
  });

  it('creates failing transport mock', async () => {
    const mock = createFailingTransportMock(new Error('transport fail'));

    await expect(mock.send({})).rejects.toThrow('transport fail');
    await expect(mock.verify()).rejects.toThrow('transport fail');
    await expect(mock.close()).resolves.toBeUndefined();
  });

  it('createConfiguredTransportMock supports shouldFail branch', async () => {
    const mock = createConfiguredTransportMock({
      shouldFail: true,
      failError: new Error('configured fail'),
    });

    await expect(mock.send({})).rejects.toThrow('configured fail');
  });

  it('createConfiguredTransportMock supports customResponse branch', async () => {
    const mock = createConfiguredTransportMock({
      customResponse: { messageId: 'custom' },
    });

    await expect(mock.send({})).resolves.toEqual({ messageId: 'custom' });
  });

  it('createConfiguredTransportMock supports verifyFailure branch', async () => {
    const mock = createConfiguredTransportMock({
      verifyFailure: true,
    });

    await expect(mock.verify()).rejects.toThrow('Verification failed');
  });
});
