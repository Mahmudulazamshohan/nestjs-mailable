const queueAdd = jest.fn().mockResolvedValue({ id: 'job-1' });
const queueClose = jest.fn().mockResolvedValue(undefined);
const workerClose = jest.fn().mockResolvedValue(undefined);
const QueueCtor = jest.fn().mockImplementation(() => ({ add: queueAdd, close: queueClose }));
let workerProcessor: (job: { data: unknown }) => Promise<unknown>;
const WorkerCtor = jest.fn().mockImplementation((_name, processor) => {
  workerProcessor = processor;
  return { close: workerClose };
});
jest.mock('bullmq', () => ({ Queue: QueueCtor, Worker: WorkerCtor }), { virtual: true });

import { Test } from '@nestjs/testing';
import { MailModule, MAIL_QUEUE } from '../mail.module';
import { MailService } from '../services/mail.service';
import { MailConfigService } from '../services/mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TemplateEngineFactory } from '../services/template.service';
import { Mailable } from '../classes/mailable';
import { TransportType } from '../types/transport.type';
import { InMemoryMailQueue } from '../queue/in-memory-mail-queue';
import { BullMqMailQueue } from '../queue/bullmq-mail-queue';
import { createMailQueue } from '../queue/mail-queue.factory';
import { reviveJob, serializeJob } from '../queue/job-serialization';
import { MailQueue, QueuedMail } from '../queue/mail-queue.interface';
import { MailConfiguration } from '../interfaces/mail.interface';

const smtp = (host: string) => ({ type: TransportType.SMTP, host, auth: { user: 'u', pass: 'p' } }) as const;

function setup(queue: MailQueue | null, config: Partial<MailConfiguration> = {}) {
  const transports: Record<string, { send: jest.Mock }> = {};
  const factory = {
    createTransport: jest.fn((cfg: { host: string }) => {
      transports[cfg.host] = { send: jest.fn().mockResolvedValue({ via: cfg.host }) };
      return transports[cfg.host];
    }),
  } as unknown as MailTransportFactory;
  const configService = new MailConfigService({
    transport: smtp('default-host'),
    mailers: { marketing: smtp('marketing-host') },
    from: { address: 'noreply@example.com' },
    ...config,
  });
  const service = new MailService(configService, factory, new TemplateEngineFactory(), null, queue);
  return { service, transports };
}

describe('MailService queueing', () => {
  afterEach(() => jest.useRealTimers());

  it('queue() throws when no queue is configured', async () => {
    const { service } = setup(null);
    await expect(service.queue({ to: 'a@example.com' })).rejects.toThrow('No mail queue configured');
  });

  it('registers itself as the queue processor and delivers dispatched jobs', async () => {
    const queue = new InMemoryMailQueue();
    const { service, transports } = setup(queue);

    const result = await service.to('a@example.com').subject('s').text('t').queue();
    expect(result).toEqual({ id: '1' });
    await new Promise((r) => setTimeout(r, 5));
    await queue.drain();

    expect(transports['default-host'].send).toHaveBeenCalledTimes(1);
    expect(transports['default-host'].send.mock.calls[0][0]).toMatchObject({
      to: { address: 'a@example.com' },
      subject: 's',
      from: { address: 'noreply@example.com' },
    });
  });

  it('does not send synchronously', async () => {
    const queue = new InMemoryMailQueue();
    const { service, transports } = setup(queue);
    await service.queue({ to: 'a@example.com', text: 't' });
    expect(transports['default-host'].send).not.toHaveBeenCalled();
    await queue.close();
  });

  it('builds Mailable instances before enqueueing', async () => {
    class Welcome extends Mailable {
      envelope() {
        return { subject: 'Welcome' };
      }
      content() {
        return { text: 'hi' };
      }
    }
    const dispatch = jest.fn().mockResolvedValue({ id: 'x' });
    const { service } = setup({ dispatch, process: jest.fn() });
    await service.to('a@example.com').queue(new Welcome());
    expect(dispatch).toHaveBeenCalledWith(
      {
        content: expect.objectContaining({ subject: 'Welcome', text: 'hi', to: { address: 'a@example.com' } }),
        mailer: undefined,
      },
      { delay: undefined },
    );
  });

  it('later() converts a Date to a millisecond delay', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2030-01-01T00:00:00Z'));
    const dispatch = jest.fn().mockResolvedValue({});
    const { service } = setup({ dispatch, process: jest.fn() });
    await service.later(new Date('2030-01-01T00:01:00Z'), { to: 'a@example.com', text: 't' });
    expect(dispatch.mock.calls[0][1]).toEqual({ delay: 60000 });
  });

  it('later() passes numeric delays and clamps past dates to zero', async () => {
    const dispatch = jest.fn().mockResolvedValue({});
    const { service } = setup({ dispatch, process: jest.fn() });
    await service.later(1500, { to: 'a@example.com' });
    await service.later(new Date(Date.now() - 10000), { to: 'a@example.com' });
    expect(dispatch.mock.calls[0][1]).toEqual({ delay: 1500 });
    expect(dispatch.mock.calls[1][1]).toEqual({ delay: 0 });
  });

  it('fluent later() applies the delay and fluent values', async () => {
    const dispatch = jest.fn().mockResolvedValue({});
    const { service } = setup({ dispatch, process: jest.fn() });
    await service.to('a@example.com').subject('Soon').later(2000, { text: 't' });
    expect(dispatch).toHaveBeenCalledWith(
      { content: expect.objectContaining({ subject: 'Soon', text: 't' }), mailer: undefined },
      { delay: 2000 },
    );
  });

  it('routes queued mail through the named mailer', async () => {
    const queue = new InMemoryMailQueue();
    const { service, transports } = setup(queue);
    await service.mailer('marketing').to('a@example.com').text('t').queue();
    await new Promise((r) => setTimeout(r, 5));
    await queue.drain();
    expect(transports['marketing-host'].send).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown mailer at enqueue time', async () => {
    const { service } = setup(new InMemoryMailQueue());
    await expect(service.queue({ to: 'a@example.com' }, { mailer: 'nope' })).rejects.toThrow(
      "Mailer 'nope' is not configured",
    );
  });
});

describe('InMemoryMailQueue', () => {
  it('honours delay', async () => {
    jest.useFakeTimers();
    const queue = new InMemoryMailQueue();
    const handler = jest.fn().mockResolvedValue(undefined);
    queue.process(handler);
    await queue.dispatch({ content: {} }, { delay: 1000 });
    jest.advanceTimersByTime(999);
    expect(handler).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('swallows and logs handler failures', async () => {
    const queue = new InMemoryMailQueue();
    queue.process(jest.fn().mockRejectedValue(new Error('boom')));
    await queue.dispatch({ content: {} });
    await new Promise((r) => setTimeout(r, 5));
    await expect(queue.drain()).resolves.toBeUndefined();
  });

  it('close cancels pending jobs', async () => {
    const queue = new InMemoryMailQueue();
    const handler = jest.fn().mockResolvedValue(undefined);
    queue.process(handler);
    await queue.dispatch({ content: {} }, { delay: 20 });
    await queue.close();
    await new Promise((r) => setTimeout(r, 40));
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('job serialization', () => {
  it('round-trips Buffer attachments through JSON', () => {
    const job: QueuedMail = {
      content: { to: 'a@example.com', attachments: [{ filename: 'a.bin', content: Buffer.from([1, 2, 3]) }] },
    };
    const revived = reviveJob(JSON.parse(JSON.stringify(serializeJob(job))));
    expect(Buffer.isBuffer(revived.content.attachments[0].content)).toBe(true);
    expect(revived.content.attachments[0].content).toEqual(Buffer.from([1, 2, 3]));
  });

  it('leaves string attachments and jobs without attachments untouched', () => {
    const job: QueuedMail = { content: { attachments: [{ filename: 'a.txt', content: 'hi' }] } };
    expect(reviveJob(serializeJob(job))).toEqual(job);
    expect(serializeJob({ content: {} })).toEqual({ content: {} });
  });
});

describe('BullMqMailQueue', () => {
  beforeEach(() => jest.clearAllMocks());
  const connection = { host: 'localhost', port: 6379 };

  it('requires a connection', () => {
    expect(() => new BullMqMailQueue({ driver: 'bullmq', connection: undefined })).toThrow('connection');
  });

  it('creates the queue with defaults and dispatches with delay', async () => {
    const queue = new BullMqMailQueue({ driver: 'bullmq', connection, defaultJobOptions: { attempts: 3 } });
    expect(QueueCtor).toHaveBeenCalledWith('mail', { connection, defaultJobOptions: { attempts: 3 } });

    const result = await queue.dispatch({ content: { to: 'a@example.com' } }, { delay: 5000 });
    expect(result).toEqual({ id: 'job-1' });
    expect(queueAdd).toHaveBeenCalledWith('send-mail', { content: { to: 'a@example.com' } }, { delay: 5000 });
  });

  it('dispatches without a delay option when none is given', async () => {
    const queue = new BullMqMailQueue({ driver: 'bullmq', connection, queueName: 'custom' });
    await queue.dispatch({ content: {} });
    expect(QueueCtor).toHaveBeenCalledWith('custom', expect.anything());
    expect(queueAdd.mock.calls[0][2]).toEqual({});
  });

  it('worker revives jobs and calls the handler', async () => {
    const queue = new BullMqMailQueue({ driver: 'bullmq', connection, workerOptions: { concurrency: 5 } });
    const handler = jest.fn().mockResolvedValue('ok');
    queue.process(handler);
    expect(WorkerCtor).toHaveBeenCalledWith('mail', expect.any(Function), { connection, concurrency: 5 });

    const serialized = serializeJob({
      content: { attachments: [{ filename: 'a.bin', content: Buffer.from('x') }] },
      mailer: 'marketing',
    });
    await expect(workerProcessor({ data: JSON.parse(JSON.stringify(serialized)) })).resolves.toBe('ok');
    expect(handler.mock.calls[0][0].content.attachments[0].content).toEqual(Buffer.from('x'));
    expect(handler.mock.calls[0][0].mailer).toBe('marketing');
  });

  it('propagates handler failures so BullMQ can retry', async () => {
    const queue = new BullMqMailQueue({ driver: 'bullmq', connection });
    queue.process(jest.fn().mockRejectedValue(new Error('smtp down')));
    await expect(workerProcessor({ data: { content: {} } })).rejects.toThrow('smtp down');
  });

  it('close shuts down worker and queue', async () => {
    const queue = new BullMqMailQueue({ driver: 'bullmq', connection });
    queue.process(jest.fn());
    await queue.close();
    expect(workerClose).toHaveBeenCalled();
    expect(queueClose).toHaveBeenCalled();
  });
});

describe('createMailQueue', () => {
  it('returns null without config, an adapter per driver, and rejects unknown drivers', () => {
    expect(createMailQueue()).toBeNull();
    expect(createMailQueue({ driver: 'memory' })).toBeInstanceOf(InMemoryMailQueue);
    expect(createMailQueue({ driver: 'bullmq', connection: {} })).toBeInstanceOf(BullMqMailQueue);
    expect(() => createMailQueue({ driver: 'sqs' } as never)).toThrow('Unsupported queue driver: sqs');
  });
});

describe('MailModule queue wiring', () => {
  const base = { transport: smtp('localhost') };

  it('provides a null MAIL_QUEUE when no queue is configured', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [MailModule.forRoot(base)] }).compile();
    expect(moduleRef.get(MAIL_QUEUE)).toBeNull();
    await expect(moduleRef.get(MailService).queue({ to: 'a@example.com' })).rejects.toThrow('No mail queue');
  });

  it('creates the configured queue in forRoot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MailModule.forRoot({ ...base, queue: { driver: 'memory' } })],
    }).compile();
    expect(moduleRef.get(MAIL_QUEUE)).toBeInstanceOf(InMemoryMailQueue);
  });

  it('creates the configured queue in forRootAsync', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MailModule.forRootAsync({ useFactory: () => ({ ...base, queue: { driver: 'memory' } }) })],
    }).compile();
    expect(moduleRef.get(MAIL_QUEUE)).toBeInstanceOf(InMemoryMailQueue);
  });

  it('lets a custom MAIL_QUEUE provider override the built-in one', async () => {
    const custom: MailQueue = { dispatch: jest.fn().mockResolvedValue({ id: 'c' }), process: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      imports: [MailModule.forRoot({ ...base, providers: [{ provide: MAIL_QUEUE, useValue: custom }] })],
    }).compile();
    const service = moduleRef.get(MailService);
    expect(await service.queue({ to: 'a@example.com' })).toEqual({ id: 'c' });
    expect(custom.process).toHaveBeenCalledTimes(1);
  });
});
