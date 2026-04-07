import { MailService } from '../services/mail.service';
import { MailConfigService } from '../services/mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TemplateEngineFactory } from '../services/template.service';
import { TransportType } from '../types/transport.type';
import { MAIL_FAILED_EVENT, MAIL_SENT_EVENT, MailFailedEvent, MailSentEvent } from '../events/mail-events';
import { RetryExhaustedError } from '../retry/retry-transport';
import { MailBatchSender } from '../batch/mail-batch-sender';

describe('MailService', () => {
  const globalFrom = { address: 'noreply@example.com', name: 'Example App' };

  function createService(options?: {
    eventsEnabled?: boolean;
    transportSendImpl?: () => Promise<unknown>;
    emitter?: { emit: jest.Mock };
  }) {
    const transport = {
      send: jest.fn(options?.transportSendImpl ?? (() => Promise.resolve({ messageId: 'msg-1' }))),
      verify: jest.fn(),
      close: jest.fn(),
    };

    const configService = {
      getTransportConfig: jest.fn().mockReturnValue({
        type: TransportType.SMTP,
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
        secure: false,
        auth: { user: 'test', pass: 'test' },
      }),
      getTemplateConfig: jest.fn().mockReturnValue(undefined),
      getGlobalFrom: jest.fn().mockReturnValue(globalFrom),
      getEventsConfig: jest
        .fn()
        .mockReturnValue(options?.eventsEnabled === undefined ? { enabled: true } : { enabled: options.eventsEnabled }),
    } as unknown as MailConfigService;

    const transportFactory = {
      createTransport: jest.fn().mockReturnValue(transport),
    } as unknown as MailTransportFactory;

    const templateEngineFactory = {
      isEngineSupported: jest.fn(),
      getSupportedEngines: jest.fn(),
      registerEngine: jest.fn(),
    } as unknown as TemplateEngineFactory;

    const emitter = options?.emitter ?? { emit: jest.fn() };
    const service = new MailService(configService, transportFactory, templateEngineFactory, emitter);

    return { service, transport, emitter };
  }

  it('emits a sent event when delivery succeeds and events are enabled', async () => {
    const { service, transport, emitter } = createService();

    const result = await service.send({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hello</p>',
    });

    expect(result).toEqual({ messageId: 'msg-1' });
    expect(transport.send).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hello</p>',
      from: globalFrom,
    });
    expect(emitter.emit).toHaveBeenCalledWith(MAIL_SENT_EVENT, expect.any(MailSentEvent));

    const event = emitter.emit.mock.calls[0][1] as MailSentEvent;
    expect(event.content.from).toEqual(globalFrom);
    expect(event.result).toEqual({ messageId: 'msg-1' });
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  it('does not emit events when event delivery is disabled', async () => {
    const { service, emitter } = createService({ eventsEnabled: false });

    await service.send({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hello</p>',
    });

    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('still sends successfully when events are enabled but no emitter is injected', async () => {
    const transport = {
      send: jest.fn().mockResolvedValue({ messageId: 'msg-no-emitter' }),
      verify: jest.fn(),
      close: jest.fn(),
    };

    const configService = {
      getTransportConfig: jest.fn().mockReturnValue({
        type: TransportType.SMTP,
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
        secure: false,
        auth: { user: 'test', pass: 'test' },
      }),
      getTemplateConfig: jest.fn().mockReturnValue(undefined),
      getGlobalFrom: jest.fn().mockReturnValue(globalFrom),
      getEventsConfig: jest.fn().mockReturnValue({ enabled: true }),
    } as unknown as MailConfigService;

    const transportFactory = {
      createTransport: jest.fn().mockReturnValue(transport),
    } as unknown as MailTransportFactory;

    const templateEngineFactory = {
      isEngineSupported: jest.fn(),
      getSupportedEngines: jest.fn(),
      registerEngine: jest.fn(),
    } as unknown as TemplateEngineFactory;

    const service = new MailService(configService, transportFactory, templateEngineFactory);
    const result = await service.send({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hello</p>',
    });

    expect(result).toEqual({ messageId: 'msg-no-emitter' });
    expect(transport.send).toHaveBeenCalledTimes(1);
  });

  it('emits a failed event with a single attempt for transport errors', async () => {
    const transportError = new Error('transport down');
    const { service, emitter } = createService({
      transportSendImpl: () => Promise.reject(transportError),
    });

    await expect(
      service.send({
        to: 'user@example.com',
        subject: 'Hello',
        html: '<p>Hello</p>',
      }),
    ).rejects.toThrow('transport down');

    expect(emitter.emit).toHaveBeenCalledWith(MAIL_FAILED_EVENT, expect.any(MailFailedEvent));
    const event = emitter.emit.mock.calls[0][1] as MailFailedEvent;
    expect(event.error).toBe(transportError);
    expect(event.attempts).toBe(1);
    expect(event.content.from).toEqual(globalFrom);
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  it('emits the retry attempt count when a RetryExhaustedError is thrown', async () => {
    const retryError = new RetryExhaustedError(4, new Error('still failing'));
    const { service, emitter } = createService({
      transportSendImpl: () => Promise.reject(retryError),
    });

    await expect(
      service.send({
        to: 'user@example.com',
        subject: 'Hello',
        html: '<p>Hello</p>',
      }),
    ).rejects.toBe(retryError);

    const event = emitter.emit.mock.calls[0][1] as MailFailedEvent;
    expect(event.attempts).toBe(4);
    expect(event.error).toBe(retryError);
  });

  it('creates a MailBatchSender from batch()', () => {
    const { service } = createService();

    const batch = service.batch([
      {
        to: 'user@example.com',
        mailable: { subject: 'Hello', html: '<p>Hello</p>' },
      },
    ]);

    expect(batch).toBeInstanceOf(MailBatchSender);
  });
});
