import { MailService, MailSender, MailFake } from '../services/mail.service';
import { MailConfigService } from '../services/mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TemplateEngineFactory } from '../services/template.service';
import { Mailable } from '../classes/mailable';
import { TEMPLATE_ENGINE } from '../constants/template.constants';
import { TransportType } from '../types/transport.type';

class SimpleMailable extends Mailable {
  envelope() {
    return {
      subject: 'From mailable',
    };
  }

  content() {
    return {
      html: '<p>Mailable body</p>',
    };
  }
}

describe('MailService Edge Cases', () => {
  const globalFrom = { address: 'noreply@example.com', name: 'Example App' };

  function createService(options?: {
    templateConfig?: any;
    eventsConfig?: { enabled: boolean } | undefined;
    isEngineSupported?: boolean;
    registerEngineImpl?: () => void;
    transportSendImpl?: (content: any) => Promise<unknown>;
    emitter?: { emit: jest.Mock } | null;
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
      getTemplateConfig: jest.fn().mockReturnValue(options?.templateConfig),
      getGlobalFrom: jest.fn().mockReturnValue(globalFrom),
      getEventsConfig: jest.fn().mockReturnValue(options?.eventsConfig),
    } as unknown as MailConfigService;

    const transportFactory = {
      createTransport: jest.fn().mockReturnValue(transport),
    } as unknown as MailTransportFactory;

    const templateEngineFactory = {
      isEngineSupported: jest.fn().mockReturnValue(options?.isEngineSupported ?? true),
      getSupportedEngines: jest.fn().mockReturnValue(['handlebars', 'ejs', 'pug']),
      registerEngine: jest.fn(options?.registerEngineImpl),
    } as unknown as TemplateEngineFactory;

    const service = new MailService(
      configService,
      transportFactory,
      templateEngineFactory,
      options?.emitter === undefined ? ({ emit: jest.fn() } as any) : options.emitter,
    );

    return {
      service,
      transport,
      configService,
      templateEngineFactory,
    };
  }

  it('builds and sends a Mailable instance', async () => {
    const { service, transport } = createService({ eventsConfig: { enabled: false } });

    await service.send(new SimpleMailable());

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'From mailable',
        html: '<p>Mailable body</p>',
        from: globalFrom,
      }),
    );
  });

  it('renders templates only when both template and context are present', async () => {
    const { service, transport } = createService({ eventsConfig: { enabled: false } });
    const render = jest.fn().mockResolvedValue('<p>Rendered</p>');
    (service as any).templateEngine = { render, compile: jest.fn() };

    await service.send({
      to: 'user@example.com',
      subject: 'Welcome',
      template: 'welcome',
      context: { name: 'Ada' },
    });

    expect(render).toHaveBeenCalledWith('welcome', { name: 'Ada' });
    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<p>Rendered</p>',
      }),
    );
  });

  it('does not render templates when context is missing', async () => {
    const { service, transport } = createService({ eventsConfig: { enabled: false } });
    const render = jest.fn().mockResolvedValue('<p>Rendered</p>');
    (service as any).templateEngine = { render, compile: jest.fn() };

    await service.send({
      to: 'user@example.com',
      subject: 'Welcome',
      template: 'welcome',
    });

    expect(render).not.toHaveBeenCalled();
    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'welcome',
      }),
    );
    expect(transport.send.mock.calls[0][0].html).toBeUndefined();
  });

  it('keeps existing from address instead of overwriting with global from', async () => {
    const { service, transport } = createService({ eventsConfig: { enabled: false } });
    const localFrom = { address: 'local@example.com', name: 'Local Sender' };

    await service.send({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Body</p>',
      from: localFrom,
    });

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: localFrom,
      }),
    );
  });

  it('throws a descriptive error for unsupported template engine', () => {
    expect(() =>
      createService({
        templateConfig: {
          engine: 'nunjucks',
          directory: '/tmp/templates',
        },
        isEngineSupported: false,
      }),
    ).toThrow("Unsupported template engine 'nunjucks'. Supported engines: handlebars, ejs, pug");
  });

  it('wraps template initialization errors when registerEngine fails', () => {
    expect(() =>
      createService({
        templateConfig: {
          engine: TEMPLATE_ENGINE.HANDLEBARS,
          directory: '/tmp/templates',
        },
        registerEngineImpl: () => {
          throw new Error('register failed');
        },
      }),
    ).toThrow("Failed to initialize template engine 'handlebars': register failed");
  });

  it('MailSender normalizes address inputs and merges them into outgoing content', async () => {
    const { service, transport } = createService({ eventsConfig: { enabled: false } });

    await service
      .to(['to1@example.com', { address: 'to2@example.com', name: 'To Two' }])
      .cc('cc@example.com')
      .bcc([{ address: 'bcc@example.com', name: 'Bcc Name' }])
      .send({
        subject: 'Hello',
        html: '<p>Hello</p>',
      });

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [{ address: 'to1@example.com' }, { address: 'to2@example.com', name: 'To Two' }],
        cc: { address: 'cc@example.com' },
        bcc: [{ address: 'bcc@example.com', name: 'Bcc Name' }],
      }),
    );
  });

  it('MailSender keeps original mailable addresses when fluent addresses are not set', async () => {
    const { service, transport } = createService({ eventsConfig: { enabled: false } });

    const sender = new MailSender(service);
    await sender.send({
      to: 'original-to@example.com',
      cc: 'original-cc@example.com',
      bcc: 'original-bcc@example.com',
      subject: 'Subject',
      html: '<p>Body</p>',
    });

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'original-to@example.com',
        cc: 'original-cc@example.com',
        bcc: 'original-bcc@example.com',
      }),
    );
  });

  it('MailSender supports cc() array normalization', async () => {
    const { service, transport } = createService({ eventsConfig: { enabled: false } });

    await service
      .to('to@example.com')
      .cc(['cc1@example.com', { address: 'cc2@example.com', name: 'CC Two' }])
      .send({
        subject: 'Hello',
        html: '<p>Hello</p>',
      });

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        cc: [{ address: 'cc1@example.com' }, { address: 'cc2@example.com', name: 'CC Two' }],
      }),
    );
  });

  it('MailSender supports bcc() string normalization', async () => {
    const { service, transport } = createService({ eventsConfig: { enabled: false } });

    await service.to('to@example.com').bcc('bcc@example.com').send({
      subject: 'Hello',
      html: '<p>Hello</p>',
    });

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        bcc: { address: 'bcc@example.com' },
      }),
    );
  });

  it('MailSender preserves bcc() object input without remapping', async () => {
    const { service, transport } = createService({ eventsConfig: { enabled: false } });

    await service.to('to@example.com').bcc({ address: 'bcc@example.com', name: 'Bcc Name' }).send({
      subject: 'Hello',
      html: '<p>Hello</p>',
    });

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        bcc: { address: 'bcc@example.com', name: 'Bcc Name' },
      }),
    );
  });

  it('MailSender preserves object addresses and maps mixed bcc arrays', async () => {
    const { service, transport } = createService({ eventsConfig: { enabled: false } });

    await service
      .to({ address: 'to@example.com', name: 'To Name' })
      .cc({ address: 'cc@example.com', name: 'Cc Name' })
      .bcc(['bcc1@example.com', { address: 'bcc2@example.com', name: 'Bcc Two' }])
      .send({
        subject: 'Hello',
        html: '<p>Hello</p>',
      });

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: { address: 'to@example.com', name: 'To Name' },
        cc: { address: 'cc@example.com', name: 'Cc Name' },
        bcc: [{ address: 'bcc1@example.com' }, { address: 'bcc2@example.com', name: 'Bcc Two' }],
      }),
    );
  });

  it('MailSender.send() handles Mailable instances', async () => {
    const { service, transport } = createService({ eventsConfig: { enabled: false } });

    await service.to('to@example.com').send(new SimpleMailable());

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: { address: 'to@example.com' },
        subject: 'From mailable',
        html: '<p>Mailable body</p>',
      }),
    );
  });

  it('emitEvent() is a no-op when events config is missing', () => {
    const emitter = { emit: jest.fn() };
    const { service } = createService({ eventsConfig: undefined, emitter });

    service.emitEvent('mail.sent', { any: 'payload' });

    expect(emitter.emit).not.toHaveBeenCalled();
  });

  describe('MailFake', () => {
    function createFake(): MailFake {
      const { service } = createService({ eventsConfig: { enabled: false } });
      return service.fake();
    }

    it('stores sent mails and supports assertSent with callback filters', async () => {
      const fake = createFake();

      await fake.send({ to: 'first@example.com', subject: 'First' });
      await fake.send({ to: 'second@example.com', subject: 'Second' });

      expect(() => fake.assertSent()).not.toThrow();
      expect(() => fake.assertSent((mail) => mail.subject === 'Second')).not.toThrow();
      expect(() => fake.assertSent((mail) => mail.subject === 'Missing')).toThrow('No mail was sent');
    });

    it('assertSentCount throws for mismatched totals', async () => {
      const fake = createFake();

      await fake.send({ to: 'first@example.com', subject: 'First' });

      expect(() => fake.assertSentCount(1)).not.toThrow();
      expect(() => fake.assertSentCount(2)).toThrow('Expected 2 mails to be sent, but 1 were sent');
    });

    it('getSentMails returns a copy of sent state', async () => {
      const fake = createFake();

      await fake.send({ to: 'first@example.com', subject: 'First' });
      const mails = fake.getSentMails();
      mails.push({ to: 'mutated@example.com', subject: 'Mutated' });

      expect(fake.getSentMails()).toHaveLength(1);
    });
  });
});
