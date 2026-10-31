import axios from 'axios';
import { Address, Content, MailTransport, SendGridOptions } from '../interfaces/mail.interface';
import { attachmentToBase64, toAddressList } from './transport.utils';
import { describeHttpError } from './postmark.transport';

const SENDGRID_URL = 'https://api.sendgrid.com';

const toSendGrid = (address: Address) => ({ email: address.address, ...(address.name && { name: address.name }) });

export class SendGridTransport implements MailTransport {
  constructor(private readonly options: SendGridOptions) {
    if (!options?.apiKey) {
      throw new Error('SendGrid API Key is required.');
    }
  }

  async send(content: Content): Promise<unknown> {
    const to = toAddressList(content.to).map(toSendGrid);
    if (to.length === 0) {
      throw new Error('Recipient address (to) is required');
    }

    const personalization: Record<string, unknown> = { to };
    const cc = toAddressList(content.cc).map(toSendGrid);
    const bcc = toAddressList(content.bcc).map(toSendGrid);
    if (cc.length) personalization.cc = cc;
    if (bcc.length) personalization.bcc = bcc;
    if (content.metadata) {
      personalization.custom_args = Object.fromEntries(
        Object.entries(content.metadata).map(([k, v]) => [k, String(v)]),
      );
    }

    const parts: Array<{ type: string; value: string }> = [];
    if (content.text) parts.push({ type: 'text/plain', value: content.text });
    if (content.html) parts.push({ type: 'text/html', value: content.html });

    const body: Record<string, unknown> = {
      personalizations: [personalization],
      from: content.from ? toSendGrid(content.from) : undefined,
      subject: content.subject,
      content: parts,
    };

    const [replyTo] = toAddressList(content.replyTo);
    if (replyTo) body.reply_to = toSendGrid(replyTo);
    if (content.headers) body.headers = content.headers;
    if (content.tags?.length) body.categories = content.tags;
    if (content.attachments?.length) {
      body.attachments = content.attachments.map((attachment) => ({
        content: attachmentToBase64(attachment),
        filename: attachment.filename || 'attachment',
        type: attachment.contentType,
        disposition: attachment.cid ? 'inline' : 'attachment',
        ...(attachment.cid && { content_id: attachment.cid }),
      }));
    }

    try {
      const response = await axios.post(`${this.options.baseUrl || SENDGRID_URL}/v3/mail/send`, body, {
        headers: this.headers(),
        timeout: this.options.timeout,
      });
      return { messageId: response.headers?.['x-message-id'], status: response.status };
    } catch (error) {
      throw new Error(`Failed to send email via SendGrid: ${describeSendGridError(error)}`);
    }
  }

  async verify(): Promise<boolean> {
    try {
      await axios.get(`${this.options.baseUrl || SENDGRID_URL}/v3/scopes`, {
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
    return { Authorization: `Bearer ${this.options.apiKey}`, 'Content-Type': 'application/json' };
  }
}

function describeSendGridError(error: unknown): string {
  const errors = (error as { response?: { data?: { errors?: Array<{ message: string }> } } }).response?.data?.errors;
  return errors?.length ? errors.map((e) => e.message).join('; ') : describeHttpError(error);
}
