import { MailTransport, MailerConfig, MailgunMailerOptions } from '../interfaces/mail.interface';
import * as Mailgun from 'mailgun.js';
import { MessagesSendResult } from 'mailgun.js/definitions';
import FormData from 'form-data';

export class MailgunTransport implements MailTransport {
  private mailgun: any;
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

  async send(mail: any): Promise<any> {
    const { from, to, subject, html, text, attachments, ...rest } = mail;

    const messageData: any = {
      from: from,
      to: to,
      subject: subject,
      html: html,
      text: text,
      ...rest,
    };

    const mg = this.mailgun;

    if (attachments && attachments.length > 0) {
      const formData = new FormData();
      for (const key in messageData) {
        formData.append(key, messageData[key]);
      }
      for (const attachment of attachments) {
        // Assuming attachment.content is a Buffer or stream and attachment.filename is available
        // Ensure attachment.content is a Buffer or Stream
        formData.append('attachment', attachment.content, attachment.filename);
      }
      return mg.messages
        .create(this.domain, formData)
        .then((_res: MessagesSendResult) => {
          return true;
        })
        .catch((err: any) => {
          throw err;
        });
    } else {
      return mg.messages
        .create(this.domain, messageData)
        .then((_res: MessagesSendResult) => {
          return true;
        })
        .catch((err: any) => {
          throw err;
        });
    }
  }
}
