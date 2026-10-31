import { MailService } from '../services/mail.service';
import { MailConfigService } from '../services/mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TemplateEngineFactory } from '../services/template.service';
import { TransportType } from '../types/transport.type';
import { MailConfiguration } from '../interfaces/mail.interface';
import { htmlToPlainText, inlineCss } from '../utils/html-processing';

const html =
  '<html><head><style>p { color: red; }</style></head><body><h1>Title</h1><p>Hello <a href="https://x.test">link</a></p></body></html>';

describe('html processing utils', () => {
  it('htmlToPlainText strips tags and keeps link targets', () => {
    const text = htmlToPlainText(html);
    expect(text).toContain('TITLE');
    expect(text).toContain('Hello link [https://x.test]');
    expect(text).not.toContain('<p>');
    expect(text).not.toContain('color: red');
  });

  it('htmlToPlainText honours custom options', () => {
    const text = htmlToPlainText('<h1>Title</h1>', { selectors: [{ selector: 'h1', options: { uppercase: false } }] });
    expect(text).toBe('Title');
  });

  it('inlineCss moves style rules onto elements', () => {
    const out = inlineCss(html);
    expect(out).toContain('<p style="color: red;">');
  });
});

describe('MailService html processing', () => {
  function setup(extra: Partial<MailConfiguration>) {
    const transport = { send: jest.fn().mockResolvedValue({}) };
    const factory = { createTransport: jest.fn().mockReturnValue(transport) } as unknown as MailTransportFactory;
    const config = new MailConfigService({
      transport: { type: TransportType.SMTP, host: 'h', auth: { user: 'u', pass: 'p' } },
      ...extra,
    });
    return { service: new MailService(config, factory, new TemplateEngineFactory()), transport };
  }

  it('does nothing by default', async () => {
    const { service, transport } = setup({});
    await service.send({ to: 'a@example.com', html });
    const sent = transport.send.mock.calls[0][0];
    expect(sent.text).toBeUndefined();
    expect(sent.html).toBe(html);
  });

  it('generates text when autoText is enabled', async () => {
    const { service, transport } = setup({ autoText: true });
    await service.send({ to: 'a@example.com', html });
    expect(transport.send.mock.calls[0][0].text).toContain('Hello link [https://x.test]');
  });

  it('keeps an explicit text part', async () => {
    const { service, transport } = setup({ autoText: true });
    await service.send({ to: 'a@example.com', html, text: 'custom' });
    expect(transport.send.mock.calls[0][0].text).toBe('custom');
  });

  it('passes html-to-text options through', async () => {
    const { service, transport } = setup({
      autoText: { selectors: [{ selector: 'h1', options: { uppercase: false } }] },
    });
    await service.send({ to: 'a@example.com', html });
    expect(transport.send.mock.calls[0][0].text).toContain('Title');
  });

  it('inlines css when enabled and derives text from the inlined html', async () => {
    const { service, transport } = setup({ inlineCss: true, autoText: true });
    await service.send({ to: 'a@example.com', html });
    const sent = transport.send.mock.calls[0][0];
    expect(sent.html).toContain('<p style="color: red;">');
    expect(sent.text).toBeDefined();
  });

  it('skips processing when there is no html', async () => {
    const { service, transport } = setup({ inlineCss: true, autoText: true });
    await service.send({ to: 'a@example.com', text: 'only text' });
    const sent = transport.send.mock.calls[0][0];
    expect(sent.html).toBeUndefined();
    expect(sent.text).toBe('only text');
  });

  it('processes rendered template output', async () => {
    const { service, transport } = setup({ autoText: true });
    (service as any).templateEngine = { render: jest.fn().mockResolvedValue('<p>Rendered</p>') };
    await service.send({ to: 'a@example.com', template: 't', context: {} });
    expect(transport.send.mock.calls[0][0].text).toBe('Rendered');
  });
});
