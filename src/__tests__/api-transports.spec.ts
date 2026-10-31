const axiosPost = jest.fn();
const axiosGet = jest.fn();
jest.mock('axios', () => ({ __esModule: true, default: { post: axiosPost, get: axiosGet } }));

const resendSend = jest.fn();
const domainsList = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: resendSend }, domains: { list: domainsList } })),
}));

import { ResendTransport } from '../transports/resend.transport';
import { PostmarkTransport } from '../transports/postmark.transport';
import { SendGridTransport } from '../transports/sendgrid.transport';
import { BrevoTransport } from '../transports/brevo.transport';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { TransportType } from '../types/transport.type';

const content = {
  from: { address: 'from@example.com', name: 'From' },
  to: ['a@example.com', { address: 'b@example.com', name: 'B' }],
  cc: 'cc@example.com',
  bcc: 'bcc@example.com',
  replyTo: 'reply@example.com',
  subject: 'Subject',
  html: '<p>Hi</p>',
  text: 'Hi',
  headers: { 'X-Test': '1' },
  tags: ['welcome'],
  metadata: { userId: 7 },
  attachments: [{ filename: 'a.txt', content: 'hello', contentType: 'text/plain' }],
};
const b64 = Buffer.from('hello').toString('base64');

describe('API transports', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('ResendTransport', () => {
    it('requires an api key', () => {
      expect(() => new ResendTransport({ apiKey: '' })).toThrow('Resend API Key is required.');
    });

    it('maps content to the Resend payload', async () => {
      resendSend.mockResolvedValue({ data: { id: 'r1' }, error: null });
      const result = await new ResendTransport({ apiKey: 'k' }).send(content);

      expect(result).toEqual({ id: 'r1' });
      expect(resendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'From <from@example.com>',
          to: ['a@example.com', 'B <b@example.com>'],
          cc: ['cc@example.com'],
          bcc: ['bcc@example.com'],
          replyTo: ['reply@example.com'],
          subject: 'Subject',
          tags: [{ name: 'tag', value: 'welcome' }],
          attachments: [{ filename: 'a.txt', content: b64 }],
        }),
      );
    });

    it('throws when Resend returns an error', async () => {
      resendSend.mockResolvedValue({ data: null, error: { message: 'bad domain' } });
      await expect(new ResendTransport({ apiKey: 'k' }).send(content)).rejects.toThrow(
        'Failed to send email via Resend: bad domain',
      );
    });

    it('rejects without recipients', async () => {
      await expect(new ResendTransport({ apiKey: 'k' }).send({ subject: 's' })).rejects.toThrow('Recipient');
    });

    it('verify reflects the domains call', async () => {
      domainsList.mockResolvedValueOnce({ error: null }).mockRejectedValueOnce(new Error('x'));
      const transport = new ResendTransport({ apiKey: 'k' });
      expect(await transport.verify()).toBe(true);
      expect(await transport.verify()).toBe(false);
    });
  });

  describe('PostmarkTransport', () => {
    it('requires a server token', () => {
      expect(() => new PostmarkTransport({ serverToken: '' })).toThrow('Postmark server token is required.');
    });

    it('maps content and sends the token header', async () => {
      axiosPost.mockResolvedValue({ data: { MessageID: 'p1' } });
      const result = await new PostmarkTransport({ serverToken: 'tok', messageStream: 'outbound' }).send(content);

      expect(result).toEqual({ MessageID: 'p1' });
      const [url, body, config] = axiosPost.mock.calls[0];
      expect(url).toBe('https://api.postmarkapp.com/email');
      expect(config.headers['X-Postmark-Server-Token']).toBe('tok');
      expect(body).toMatchObject({
        From: 'From <from@example.com>',
        To: 'a@example.com,B <b@example.com>',
        Cc: 'cc@example.com',
        Bcc: 'bcc@example.com',
        ReplyTo: 'reply@example.com',
        Subject: 'Subject',
        HtmlBody: '<p>Hi</p>',
        TextBody: 'Hi',
        Tag: 'welcome',
        MessageStream: 'outbound',
        Headers: [{ Name: 'X-Test', Value: '1' }],
        Metadata: { userId: '7' },
        Attachments: [{ Name: 'a.txt', Content: b64, ContentType: 'text/plain' }],
      });
    });

    it('wraps http errors', async () => {
      axiosPost.mockRejectedValue({ response: { status: 422, data: { Message: 'Invalid' } } });
      await expect(new PostmarkTransport({ serverToken: 't' }).send(content)).rejects.toThrow(
        'Failed to send email via Postmark: 422 Invalid',
      );
    });

    it('verify returns false on failure', async () => {
      axiosGet.mockRejectedValue(new Error('x'));
      expect(await new PostmarkTransport({ serverToken: 't' }).verify()).toBe(false);
    });
  });

  describe('SendGridTransport', () => {
    it('requires an api key', () => {
      expect(() => new SendGridTransport({ apiKey: '' })).toThrow('SendGrid API Key is required.');
    });

    it('maps content to the v3 payload', async () => {
      axiosPost.mockResolvedValue({ status: 202, headers: { 'x-message-id': 'sg1' } });
      const result = await new SendGridTransport({ apiKey: 'k' }).send(content);

      expect(result).toEqual({ messageId: 'sg1', status: 202 });
      const [url, body, config] = axiosPost.mock.calls[0];
      expect(url).toBe('https://api.sendgrid.com/v3/mail/send');
      expect(config.headers.Authorization).toBe('Bearer k');
      expect(body).toMatchObject({
        personalizations: [
          {
            to: [{ email: 'a@example.com' }, { email: 'b@example.com', name: 'B' }],
            cc: [{ email: 'cc@example.com' }],
            bcc: [{ email: 'bcc@example.com' }],
            custom_args: { userId: '7' },
          },
        ],
        from: { email: 'from@example.com', name: 'From' },
        reply_to: { email: 'reply@example.com' },
        subject: 'Subject',
        content: [
          { type: 'text/plain', value: 'Hi' },
          { type: 'text/html', value: '<p>Hi</p>' },
        ],
        categories: ['welcome'],
        headers: { 'X-Test': '1' },
        attachments: [{ content: b64, filename: 'a.txt', type: 'text/plain', disposition: 'attachment' }],
      });
    });

    it('surfaces SendGrid error messages', async () => {
      axiosPost.mockRejectedValue({ response: { status: 400, data: { errors: [{ message: 'bad from' }] } } });
      await expect(new SendGridTransport({ apiKey: 'k' }).send(content)).rejects.toThrow(
        'Failed to send email via SendGrid: bad from',
      );
    });
  });

  describe('BrevoTransport', () => {
    it('requires an api key', () => {
      expect(() => new BrevoTransport({ apiKey: '' })).toThrow('Brevo API Key is required.');
    });

    it('maps content to the Brevo payload', async () => {
      axiosPost.mockResolvedValue({ data: { messageId: 'b1' } });
      const result = await new BrevoTransport({ apiKey: 'k' }).send(content);

      expect(result).toEqual({ messageId: 'b1' });
      const [url, body, config] = axiosPost.mock.calls[0];
      expect(url).toBe('https://api.brevo.com/v3/smtp/email');
      expect(config.headers['api-key']).toBe('k');
      expect(body).toMatchObject({
        sender: { email: 'from@example.com', name: 'From' },
        to: [{ email: 'a@example.com' }, { email: 'b@example.com', name: 'B' }],
        cc: [{ email: 'cc@example.com' }],
        bcc: [{ email: 'bcc@example.com' }],
        replyTo: { email: 'reply@example.com' },
        subject: 'Subject',
        htmlContent: '<p>Hi</p>',
        textContent: 'Hi',
        tags: ['welcome'],
        headers: { 'X-Test': '1' },
        attachment: [{ name: 'a.txt', content: b64 }],
      });
    });

    it('rejects path-only attachments', async () => {
      await expect(
        new BrevoTransport({ apiKey: 'k' }).send({ to: 'a@example.com', attachments: [{ path: '/tmp/x' }] }),
      ).rejects.toThrow('requires inline content');
    });
  });

  describe('MailTransportFactory', () => {
    const factory = new MailTransportFactory();

    it.each([
      [TransportType.RESEND, ResendTransport, { apiKey: 'k' }],
      [TransportType.POSTMARK, PostmarkTransport, { serverToken: 't' }],
      [TransportType.SENDGRID, SendGridTransport, { apiKey: 'k' }],
      [TransportType.BREVO, BrevoTransport, { apiKey: 'k' }],
    ])('creates %s transport', (type, Ctor, options) => {
      expect(factory.createTransport({ type, options } as any)).toBeInstanceOf(Ctor);
    });

    it.each([TransportType.RESEND, TransportType.POSTMARK, TransportType.SENDGRID, TransportType.BREVO])(
      'throws when %s options missing',
      (type) => {
        expect(() => factory.createTransport({ type } as any)).toThrow('requires options configuration');
      },
    );

    it('lists the new transports', () => {
      expect(factory.getAvailableTransports()).toEqual(
        expect.arrayContaining(['resend', 'postmark', 'sendgrid', 'brevo']),
      );
    });
  });
});
