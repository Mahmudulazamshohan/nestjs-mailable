import { FailoverTransport, FailoverExhaustedError } from '../transports/failover.transport';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { RetryTransport } from '../retry/retry-transport';
import { TransportType } from '../types/transport.type';
import { MailTransport } from '../interfaces/mail.interface';

const ok = (id: string): jest.Mocked<MailTransport> => ({
  send: jest.fn().mockResolvedValue({ id }),
  verify: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(undefined),
});
const failing = (message: string): jest.Mocked<MailTransport> => ({
  send: jest.fn().mockRejectedValue(new Error(message)),
  verify: jest.fn().mockResolvedValue(false),
  close: jest.fn().mockResolvedValue(undefined),
});

describe('FailoverTransport', () => {
  it('requires at least one transport', () => {
    expect(() => new FailoverTransport([])).toThrow('at least one transport');
  });

  it('uses the first transport when healthy', async () => {
    const [a, b] = [ok('a'), ok('b')];
    const result = await new FailoverTransport([a, b]).send({ to: 'x@example.com' });
    expect(result).toEqual({ id: 'a' });
    expect(b.send).not.toHaveBeenCalled();
  });

  it('falls through to the next transport on failure', async () => {
    const [a, b] = [failing('a down'), ok('b')];
    const result = await new FailoverTransport([a, b]).send({ to: 'x@example.com' });
    expect(result).toEqual({ id: 'b' });
    expect(a.send).toHaveBeenCalledTimes(1);
  });

  it('throws FailoverExhaustedError with all errors when every transport fails', async () => {
    const transport = new FailoverTransport([failing('a down'), failing('b down')]);
    const error = (await transport.send({ to: 'x@example.com' }).catch((e) => e)) as FailoverExhaustedError;
    expect(error).toBeInstanceOf(FailoverExhaustedError);
    expect(error.errors.map((e) => e.message)).toEqual(['a down', 'b down']);
    expect(error.message).toContain('a down | b down');
  });

  it('rotates the starting transport with roundrobin', async () => {
    const [a, b, c] = [ok('a'), ok('b'), ok('c')];
    const transport = new FailoverTransport([a, b, c], 'roundrobin');
    const ids = [];
    for (let i = 0; i < 4; i++) {
      ids.push(((await transport.send({})) as { id: string }).id);
    }
    expect(ids).toEqual(['a', 'b', 'c', 'a']);
  });

  it('roundrobin still fails over past a dead transport', async () => {
    const transport = new FailoverTransport([failing('a down'), ok('b')], 'roundrobin');
    expect(await transport.send({})).toEqual({ id: 'b' });
    expect(await transport.send({})).toEqual({ id: 'b' });
  });

  it('verify is true when any transport verifies, false when none do', async () => {
    expect(await new FailoverTransport([failing('x'), ok('b')]).verify()).toBe(true);
    expect(await new FailoverTransport([failing('x'), failing('y')]).verify()).toBe(false);
  });

  it('close closes every transport', async () => {
    const [a, b] = [ok('a'), ok('b')];
    await new FailoverTransport([a, b]).close();
    expect(a.close).toHaveBeenCalled();
    expect(b.close).toHaveBeenCalled();
  });
});

describe('MailTransportFactory failover', () => {
  const factory = new MailTransportFactory();
  const smtp = { type: TransportType.SMTP, host: 'localhost', auth: { user: 'u', pass: 'p' } } as const;

  it('builds a FailoverTransport from child configs', () => {
    const transport = factory.createTransport({ type: TransportType.FAILOVER, transports: [smtp, smtp] });
    expect(transport).toBeInstanceOf(FailoverTransport);
  });

  it('wraps the failover in retry when configured', () => {
    const transport = factory.createTransport({
      type: TransportType.FAILOVER,
      transports: [smtp],
      retry: { attempts: 2 },
    });
    expect(transport).toBeInstanceOf(RetryTransport);
  });

  it('throws when no child transports are given', () => {
    expect(() => factory.createTransport({ type: TransportType.FAILOVER, transports: [] })).toThrow(
      'at least one transport',
    );
  });

  it('supports nested failover groups', () => {
    const nested = factory.createTransport({
      type: TransportType.FAILOVER,
      transports: [{ type: TransportType.FAILOVER, transports: [smtp] }, smtp],
    });
    expect(nested).toBeInstanceOf(FailoverTransport);
  });
});
