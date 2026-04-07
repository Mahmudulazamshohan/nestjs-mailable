import { RetryTransport, RetryExhaustedError } from '../retry/retry-transport';
import { MailTransport, Content } from '../interfaces/mail.interface';

const content: Content = {
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Test</p>',
};

function makeInner(impl?: Partial<MailTransport>): jest.Mocked<MailTransport> {
  return {
    send: jest.fn(),
    verify: jest.fn(),
    close: jest.fn(),
    ...impl,
  } as jest.Mocked<MailTransport>;
}

describe('RetryExhaustedError', () => {
  it('should carry the attempt count', () => {
    const cause = new Error('network down');
    const err = new RetryExhaustedError(3, cause);

    expect(err.attempts).toBe(3);
    expect(err.message).toContain('3 attempt(s)');
    expect(err.message).toContain('network down');
    expect(err.name).toBe('RetryExhaustedError');
  });

  it('should be an instance of Error', () => {
    const err = new RetryExhaustedError(1, new Error('x'));
    expect(err).toBeInstanceOf(Error);
  });
});

describe('RetryTransport', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('success path', () => {
    it('should return the result on first attempt without retrying', async () => {
      const inner = makeInner();
      inner.send.mockResolvedValue({ messageId: 'ok' });

      const transport = new RetryTransport(inner, { attempts: 3, delay: 0 });
      const result = await transport.send(content);

      expect(result).toEqual({ messageId: 'ok' });
      expect(inner.send).toHaveBeenCalledTimes(1);
    });

    it('should succeed on a retry attempt after earlier failures', async () => {
      const inner = makeInner();
      inner.send
        .mockRejectedValueOnce(new Error('transient'))
        .mockRejectedValueOnce(new Error('transient'))
        .mockResolvedValue({ messageId: 'ok' });

      const transport = new RetryTransport(inner, { attempts: 3, delay: 0, strategy: 'fixed' });
      const promise = transport.send(content);
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ messageId: 'ok' });
      expect(inner.send).toHaveBeenCalledTimes(3);
    });
  });

  describe('failure path', () => {
    it('should throw RetryExhaustedError after exhausting all attempts', async () => {
      const inner = makeInner();
      inner.send.mockRejectedValue(new Error('always fails'));

      const transport = new RetryTransport(inner, { attempts: 3, delay: 0, strategy: 'fixed' });
      const expectation = expect(transport.send(content)).rejects.toThrow(RetryExhaustedError);
      await jest.runAllTimersAsync();

      await expectation;
      expect(inner.send).toHaveBeenCalledTimes(3);
    });

    it('should set the correct attempt count on RetryExhaustedError', async () => {
      const inner = makeInner();
      inner.send.mockRejectedValue(new Error('fail'));

      const transport = new RetryTransport(inner, { attempts: 4, delay: 0, strategy: 'fixed' });
      const expectation = expect(transport.send(content)).rejects.toMatchObject({ attempts: 4 });
      await jest.runAllTimersAsync();

      await expectation;
      expect(inner.send).toHaveBeenCalledTimes(4);
    });

    it('should propagate the last error message inside RetryExhaustedError', async () => {
      const inner = makeInner();
      inner.send.mockRejectedValueOnce(new Error('first failure')).mockRejectedValue(new Error('final failure'));

      const transport = new RetryTransport(inner, { attempts: 2, delay: 0, strategy: 'fixed' });
      const expectation = expect(transport.send(content)).rejects.toThrow('final failure');
      await jest.runAllTimersAsync();

      await expectation;
    });

    it('should not retry when attempts is 1', async () => {
      const inner = makeInner();
      inner.send.mockRejectedValue(new Error('fail'));

      const transport = new RetryTransport(inner, { attempts: 1, delay: 0 });
      const expectation = expect(transport.send(content)).rejects.toThrow(RetryExhaustedError);
      await jest.runAllTimersAsync();

      await expectation;
      expect(inner.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('delay strategies', () => {
    it('should apply fixed delay between retries', async () => {
      const inner = makeInner();
      inner.send.mockRejectedValue(new Error('fail'));
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const transport = new RetryTransport(inner, { attempts: 3, delay: 1000, strategy: 'fixed' });
      const expectation = expect(transport.send(content)).rejects.toThrow(RetryExhaustedError);
      await jest.runAllTimersAsync();

      await expectation;

      // Two sleeps for 3 attempts (between attempt 1→2 and 2→3)
      const delayArgs = setTimeoutSpy.mock.calls.map(([, ms]) => ms);
      expect(delayArgs).toEqual(expect.arrayContaining([1000, 1000]));
    });

    it('should apply linear delay between retries', async () => {
      const inner = makeInner();
      inner.send.mockRejectedValue(new Error('fail'));
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const transport = new RetryTransport(inner, { attempts: 3, delay: 500, strategy: 'linear' });
      const expectation = expect(transport.send(content)).rejects.toThrow(RetryExhaustedError);
      await jest.runAllTimersAsync();

      await expectation;

      const delayArgs = setTimeoutSpy.mock.calls.map(([, ms]) => ms);
      // attempt 1 → sleep 500*1=500, attempt 2 → sleep 500*2=1000
      expect(delayArgs).toEqual(expect.arrayContaining([500, 1000]));
    });

    it('should apply exponential delay between retries', async () => {
      const inner = makeInner();
      inner.send.mockRejectedValue(new Error('fail'));
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const transport = new RetryTransport(inner, { attempts: 3, delay: 100, strategy: 'exponential' });
      const expectation = expect(transport.send(content)).rejects.toThrow(RetryExhaustedError);
      await jest.runAllTimersAsync();

      await expectation;

      const delayArgs = setTimeoutSpy.mock.calls.map(([, ms]) => ms);
      // attempt 1 → 100*2^0=100, attempt 2 → 100*2^1=200
      expect(delayArgs).toEqual(expect.arrayContaining([100, 200]));
    });

    it('should default to exponential strategy when strategy is omitted', async () => {
      const inner = makeInner();
      inner.send.mockRejectedValue(new Error('fail'));
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const transport = new RetryTransport(inner, { attempts: 3, delay: 100 });
      const expectation = expect(transport.send(content)).rejects.toThrow(RetryExhaustedError);
      await jest.runAllTimersAsync();

      await expectation;

      const delayArgs = setTimeoutSpy.mock.calls.map(([, ms]) => ms);
      expect(delayArgs).toEqual(expect.arrayContaining([100, 200]));
    });

    it('should use default delay of 1000ms when delay is omitted', async () => {
      const inner = makeInner();
      inner.send.mockRejectedValue(new Error('fail'));
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const transport = new RetryTransport(inner, { attempts: 2, strategy: 'fixed' });
      const expectation = expect(transport.send(content)).rejects.toThrow(RetryExhaustedError);
      await jest.runAllTimersAsync();

      await expectation;

      const delayArgs = setTimeoutSpy.mock.calls.map(([, ms]) => ms);
      expect(delayArgs).toContain(1000);
    });

    it('should cap delay at maxDelay', async () => {
      const inner = makeInner();
      inner.send.mockRejectedValue(new Error('fail'));
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const transport = new RetryTransport(inner, {
        attempts: 4,
        delay: 1000,
        strategy: 'exponential',
        maxDelay: 2500,
      });
      const expectation = expect(transport.send(content)).rejects.toThrow(RetryExhaustedError);
      await jest.runAllTimersAsync();

      await expectation;

      const delayArgs = setTimeoutSpy.mock.calls.map(([, ms]) => ms);
      // Without cap: 1000, 2000, 4000. With cap: 1000, 2000, 2500
      expect(delayArgs.every((d) => d <= 2500)).toBe(true);
      expect(delayArgs).toContain(2500);
    });

    it('should add jitter when enabled', async () => {
      const inner = makeInner();
      inner.send.mockRejectedValue(new Error('fail'));
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      const transport = new RetryTransport(inner, {
        attempts: 2,
        delay: 1000,
        strategy: 'fixed',
        jitter: true,
      });
      const expectation = expect(transport.send(content)).rejects.toThrow(RetryExhaustedError);
      await jest.runAllTimersAsync();

      await expectation;

      // fixed delay 1000 + jitter (0.5 * 1000 = 500) = 1500
      const delayArgs = setTimeoutSpy.mock.calls.map(([, ms]) => ms);
      expect(delayArgs[0]).toBe(1500);
    });
  });

  describe('verify()', () => {
    it('should delegate to inner.verify()', async () => {
      const inner = makeInner();
      inner.verify!.mockResolvedValue(true);

      const transport = new RetryTransport(inner, { attempts: 3, delay: 0 });
      const result = await transport.verify();

      expect(result).toBe(true);
      expect(inner.verify).toHaveBeenCalledTimes(1);
    });

    it('should return true when inner has no verify method', async () => {
      const inner = { send: jest.fn() } as MailTransport;
      const transport = new RetryTransport(inner, { attempts: 3, delay: 0 });

      const result = await transport.verify();

      expect(result).toBe(true);
    });
  });

  describe('close()', () => {
    it('should delegate to inner.close()', async () => {
      const inner = makeInner();
      inner.close!.mockResolvedValue(undefined);

      const transport = new RetryTransport(inner, { attempts: 3, delay: 0 });
      await transport.close();

      expect(inner.close).toHaveBeenCalledTimes(1);
    });

    it('should not throw when inner has no close method', async () => {
      const inner = { send: jest.fn() } as MailTransport;
      const transport = new RetryTransport(inner, { attempts: 3, delay: 0 });

      await expect(transport.close()).resolves.toBeUndefined();
    });
  });
});
