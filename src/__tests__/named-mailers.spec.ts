import { MailService } from '../services/mail.service';
import { MailConfigService } from '../services/mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TemplateEngineFactory } from '../services/template.service';
import { TransportType } from '../types/transport.type';
import { MailConfiguration } from '../interfaces/mail.interface';

describe('Named mailers', () => {
  const smtp = (host: string) => ({ type: TransportType.SMTP, host, auth: { user: 'u', pass: 'p' } }) as const;

  function setup(config: Partial<MailConfiguration> = {}) {
    const transports: Record<string, { send: jest.Mock }> = {};
    const factory = {
      createTransport: jest.fn((cfg: { host: string }) => {
        transports[cfg.host] = { send: jest.fn().mockResolvedValue({ via: cfg.host }) };
        return transports[cfg.host];
      }),
    } as unknown as MailTransportFactory;
    const configService = new MailConfigService({
      transport: smtp('default-host'),
      mailers: { marketing: smtp('marketing-host'), alerts: smtp('alerts-host') },
      from: { address: 'noreply@example.com' },
      ...config,
    });
    const service = new MailService(configService, factory, new TemplateEngineFactory());
    return { service, factory, transports };
  }

  it('sends through the default transport without a mailer', async () => {
    const { service, transports } = setup();
    const result = await service.to('a@example.com').subject('s').text('t').send();
    expect(result).toEqual({ via: 'default-host' });
    expect(transports['default-host'].send).toHaveBeenCalledTimes(1);
  });

  it('sends through the selected named mailer via the fluent API', async () => {
    const { service, transports } = setup();
    const result = await service.mailer('marketing').to('a@example.com').subject('s').text('t').send();
    expect(result).toEqual({ via: 'marketing-host' });
    expect(transports['marketing-host'].send).toHaveBeenCalledTimes(1);
    expect(transports['default-host'].send).not.toHaveBeenCalled();
  });

  it('mailer().send() accepts content directly', async () => {
    const { service } = setup();
    const result = await service.mailer('alerts').send({ to: 'a@example.com', subject: 's', text: 't' });
    expect(result).toEqual({ via: 'alerts-host' });
  });

  it('creates each named transport lazily, once', async () => {
    const { service, factory } = setup();
    expect(factory.createTransport).toHaveBeenCalledTimes(1);
    await service.mailer('marketing').send({ to: 'a@example.com', text: 't' });
    await service.mailer('marketing').send({ to: 'b@example.com', text: 't' });
    expect(factory.createTransport).toHaveBeenCalledTimes(2);
  });

  it('throws for an unknown mailer', () => {
    const { service } = setup();
    expect(() => service.mailer('nope')).toThrow("Mailer 'nope' is not configured");
  });

  it('throws for an unknown mailer when none are configured', () => {
    const { service } = setup({ mailers: undefined });
    expect(() => service.mailer('marketing')).toThrow("Mailer 'marketing' is not configured");
  });

  it('applies global from and events with a named mailer', async () => {
    const { service, transports } = setup();
    await service.mailer('alerts').to('a@example.com').text('t').send();
    expect(transports['alerts-host'].send.mock.calls[0][0].from).toEqual({ address: 'noreply@example.com' });
  });
});
