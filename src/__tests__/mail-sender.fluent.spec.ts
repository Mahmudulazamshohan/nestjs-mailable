import { MailService } from '../services/mail.service';
import { MailConfigService } from '../services/mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TemplateEngineFactory } from '../services/template.service';
import { TransportType } from '../types/transport.type';

describe('MailSender fluent API', () => {
  function createService() {
    const transport = { send: jest.fn().mockResolvedValue({ messageId: 'm1' }) };
    const configService = {
      getTransportConfig: jest.fn().mockReturnValue({
        type: TransportType.SMTP,
        host: 'localhost',
        auth: { user: 'u', pass: 'p' },
      }),
      getTemplateConfig: jest.fn().mockReturnValue(undefined),
      getGlobalFrom: jest.fn().mockReturnValue({ address: 'noreply@example.com' }),
      getEventsConfig: jest.fn().mockReturnValue({ enabled: false }),
    } as unknown as MailConfigService;
    const factory = { createTransport: jest.fn().mockReturnValue(transport) } as unknown as MailTransportFactory;
    const service = new MailService(configService, factory, new TemplateEngineFactory());
    return { service, transport };
  }

  it('builds content from fluent calls without a mailable', async () => {
    const { service, transport } = createService();

    await service
      .to('a@example.com')
      .cc(['b@example.com', { address: 'c@example.com', name: 'C' }])
      .bcc('d@example.com')
      .from({ address: 'me@example.com', name: 'Me' })
      .replyTo('reply@example.com')
      .subject('Hello')
      .html('<p>Hi</p>')
      .text('Hi')
      .attach({ filename: 'a.txt', content: 'x' })
      .header('X-Test', '1')
      .tag('welcome')
      .metadata({ userId: 1 })
      .send();

    expect(transport.send).toHaveBeenCalledWith({
      to: { address: 'a@example.com' },
      cc: [{ address: 'b@example.com' }, { address: 'c@example.com', name: 'C' }],
      bcc: { address: 'd@example.com' },
      from: { address: 'me@example.com', name: 'Me' },
      replyTo: { address: 'reply@example.com' },
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
      attachments: [{ filename: 'a.txt', content: 'x' }],
      headers: { 'X-Test': '1' },
      tags: ['welcome'],
      metadata: { userId: 1 },
    });
  });

  it('fluent values override mailable content, other fields are kept', async () => {
    const { service, transport } = createService();

    await service.to('a@example.com').subject('Override').send({ subject: 'Base', html: '<b>x</b>' });

    const sent = transport.send.mock.calls[0][0];
    expect(sent.subject).toBe('Override');
    expect(sent.html).toBe('<b>x</b>');
    expect(sent.from).toEqual({ address: 'noreply@example.com' });
  });

  it('falls back to the global from when none is set', async () => {
    const { service, transport } = createService();
    await service.to('a@example.com').subject('s').text('t').send();
    expect(transport.send.mock.calls[0][0].from).toEqual({ address: 'noreply@example.com' });
  });

  it('does not mutate the content object passed to send()', async () => {
    const { service } = createService();
    const content = { to: 'a@example.com', subject: 's', text: 't' };
    await service.send(content);
    expect(content).toEqual({ to: 'a@example.com', subject: 's', text: 't' });
  });
});
