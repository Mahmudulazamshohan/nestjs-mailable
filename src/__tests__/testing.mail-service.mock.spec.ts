import {
  createMailServiceMock,
  createMailServiceMockWithError,
  createMailServiceMockWithResponse,
  createMailServiceMockWithSequentialResponses,
  createMailServiceMockWithFake,
  createConfiguredMailServiceMock,
} from '../testing/mail-service.mock';

describe('testing/mail-service.mock', () => {
  it('createMailServiceMock provides chainable methods and default send response', async () => {
    const mock = createMailServiceMock();

    const chain = mock.to('a').cc('b').bcc('c').subject('s').html('<p>x</p>').template('t').replyTo('r').from('f');

    expect(chain).toBe(mock);
    await expect(mock.send({})).resolves.toEqual({ messageId: 'mock-msg-id' });
    expect(mock.hasSent()).toBe(false);
    expect(mock.hasSentTo('x@example.com')).toBe(false);
    expect(mock.getSent()).toEqual([]);
    await expect(mock.verifyTransport()).resolves.toBe(true);
    await expect(mock.close()).resolves.toBeUndefined();
  });

  it('createMailServiceMockWithError rejects on send', async () => {
    const error = new Error('smtp down');
    const mock = createMailServiceMockWithError(error);

    await expect(mock.send({})).rejects.toThrow('smtp down');
  });

  it('createMailServiceMockWithResponse resolves with custom response', async () => {
    const mock = createMailServiceMockWithResponse({ messageId: 'custom-id', status: 'queued' });

    await expect(mock.send({})).resolves.toEqual({ messageId: 'custom-id', status: 'queued' });
  });

  it('createMailServiceMockWithSequentialResponses resolves in order', async () => {
    const mock = createMailServiceMockWithSequentialResponses([{ id: 1 }, { id: 2 }]);

    await expect(mock.send({})).resolves.toEqual({ id: 1 });
    await expect(mock.send({})).resolves.toEqual({ id: 2 });
    await expect(mock.send({})).resolves.toBeUndefined();
  });

  it('createMailServiceMockWithFake tracks sent mails and supports helpers', async () => {
    const mock = createMailServiceMockWithFake();

    await expect(mock.send({ subject: 'A' })).resolves.toEqual({ messageId: 'msg-1' });
    await expect(mock.send({ subject: 'B' })).resolves.toEqual({ messageId: 'msg-2' });

    expect(mock.getSent()).toHaveLength(2);
    expect(mock.hasSent()).toBe(false);
    expect(mock.hasSentTo('test@example.com')).toBe(true);
    expect(mock.hasSentTo('@example.com')).toBe(true);

    const fake = mock.fake();
    expect(fake.getSentMails()).toHaveLength(2);

    mock.clearSent();
    expect(mock.getSent()).toHaveLength(0);
  });

  it('createConfiguredMailServiceMock supports sequential responses branch', async () => {
    const mock = createConfiguredMailServiceMock({
      sequentialResponses: [{ id: 1 }, { id: 2 }],
    });

    await expect(mock.send({})).resolves.toEqual({ id: 1 });
    await expect(mock.send({})).resolves.toEqual({ id: 2 });
  });

  it('createConfiguredMailServiceMock supports shouldFail branch', async () => {
    const mock = createConfiguredMailServiceMock({
      shouldFail: true,
      failError: new Error('forced failure'),
    });

    await expect(mock.send({})).rejects.toThrow('forced failure');
  });

  it('createConfiguredMailServiceMock supports defaultResponse and fallback branch', async () => {
    const withDefault = createConfiguredMailServiceMock({ defaultResponse: { id: 'ok' } });
    const fallback = createConfiguredMailServiceMock({});

    await expect(withDefault.send({})).resolves.toEqual({ id: 'ok' });
    await expect(fallback.send({})).resolves.toEqual({ messageId: 'mock-msg-id' });
  });
});
