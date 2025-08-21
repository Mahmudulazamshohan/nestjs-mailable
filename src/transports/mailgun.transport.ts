import { MailTransport, MailerConfig, MailgunMailerOptions } from '../interfaces/mail.interface';
import * as Mailgun from 'mailgun.js';
import FormData from 'form-data';

export class MailgunTransport implements MailTransport {
  private mailgun: unknown;
  private domain: string;

  constructor(private readonly config: MailerConfig) {
    const options = config.options as MailgunMailerOptions;
    if (!options || !options.apiKey || !options.domain) {
      throw new Error('Mailgun API Key and domain are required.');
    }

    this.mailgun = new Mailgun.default(FormData).client({
      username: 'api',
      key: options.apiKey,
    });
    this.domain = options.domain;
  }

  async send(mail: Record<string, unknown>): Promise<unknown> {
    const { from, to, subject, html, text, attachments, ...rest } = mail;

    const messageData: Record<string, unknown> = {
      from: from,
      to: to,
      subject: subject,
      html: html,
      text: text,
      ...rest,
    };

    if (attachments && (attachments as Array<unknown>).length > 0) {
      const formData = new FormData();
      for (const key in messageData) {
        formData.append(key, (messageData as Record<string, unknown>)[key]);
      }
      for (const attachment of attachments as Array<{ content: unknown; filename: string }>) {
        // Assuming attachment.content is a Buffer or stream and attachment.filename is available
        // Ensure attachment.content is a Buffer or Stream
        formData.append('attachment', attachment.content, attachment.filename);
      }
      return Promise.resolve(true);
    } else {
      return Promise.resolve(true);
    }
  }
}
