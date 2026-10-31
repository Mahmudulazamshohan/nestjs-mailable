import axios from 'axios';
import { Address, Content, MailTransport, BrevoOptions } from '../interfaces/mail.interface';
import { attachmentToBase64, toAddressList } from './transport.utils';
import { describeHttpError } from './postmark.transport';

const BREVO_URL = 'https://api.brevo.com';

const toBrevo = (address: Address) => ({ email: address.address, ...(address.name && { name: address.name }) });

export class BrevoTransport implements MailTransport {
  constructor(private readonly options: BrevoOptions) {
    if (!options?.apiKey) {
      throw new Error('Brevo API Key is required.');
    }
  }

  async send(content: Content): Promise<unknown> {
    const to = toAddressList(content.to).map(toBrevo);
    if (to.length === 0) {
      throw new Error('Recipient address (to) is required');
    }

    const body: Record<string, unknown> = {
      sender: content.from ? toBrevo(content.from) : undefined,
      to,
      subject: content.subject,
      htmlContent: content.html,
      textContent: content.text,
    };

    const cc = toAddressList(content.cc).map(toBrevo);
    const bcc = toAddressList(content.bcc).map(toBrevo);
    const [replyTo] = toAddressList(content.replyTo);
    if (cc.length) body.cc = cc;
    if (bcc.length) body.bcc = bcc;
    if (replyTo) body.replyTo = toBrevo(replyTo);
    if (content.headers) body.headers = content.headers;
    if (content.tags?.length) body.tags = content.tags;
    if (content.attachments?.length) {
      body.attachment = content.attachments.map((attachment) => ({
        name: attachment.filename || 'attachment',
        content: attachmentToBase64(attachment),
      }));
    }

    try {
      const response = await axios.post(`${this.options.baseUrl || BREVO_URL}/v3/smtp/email`, body, {
        headers: this.headers(),
        timeout: this.options.timeout,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send email via Brevo: ${describeHttpError(error)}`);
    }
  }

  async verify(): Promise<boolean> {
    try {
      await axios.get(`${this.options.baseUrl || BREVO_URL}/v3/account`, {
        headers: this.headers(),
        timeout: this.options.timeout,
      });
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }

  private headers(): Record<string, string> {
    return { 'api-key': this.options.apiKey, accept: 'application/json', 'content-type': 'application/json' };
  }
}
