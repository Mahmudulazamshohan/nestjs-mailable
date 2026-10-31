import axios from 'axios';
import { Content, MailTransport, PostmarkOptions } from '../interfaces/mail.interface';
import { attachmentToBase64, formatAddress, toAddressList } from './transport.utils';

const POSTMARK_URL = 'https://api.postmarkapp.com';

export class PostmarkTransport implements MailTransport {
  constructor(private readonly options: PostmarkOptions) {
    if (!options?.serverToken) {
      throw new Error('Postmark server token is required.');
    }
  }

  async send(content: Content): Promise<unknown> {
    const to = toAddressList(content.to).map(formatAddress);
    if (to.length === 0) {
      throw new Error('Recipient address (to) is required');
    }

    const body: Record<string, unknown> = {
      From: content.from ? formatAddress(content.from) : undefined,
      To: to.join(','),
      Subject: content.subject,
      HtmlBody: content.html,
      TextBody: content.text,
      MessageStream: this.options.messageStream,
    };

    const cc = toAddressList(content.cc).map(formatAddress);
    const bcc = toAddressList(content.bcc).map(formatAddress);
    const replyTo = toAddressList(content.replyTo).map(formatAddress);
    if (cc.length) body.Cc = cc.join(',');
    if (bcc.length) body.Bcc = bcc.join(',');
    if (replyTo.length) body.ReplyTo = replyTo.join(',');

    if (content.headers) {
      body.Headers = Object.entries(content.headers).map(([Name, Value]) => ({ Name, Value }));
    }
    if (content.tags?.length) {
      // Postmark supports a single tag per message.
      body.Tag = content.tags[0];
    }
    if (content.metadata) {
      body.Metadata = Object.fromEntries(Object.entries(content.metadata).map(([k, v]) => [k, String(v)]));
    }
    if (content.attachments?.length) {
      body.Attachments = content.attachments.map((attachment) => ({
        Name: attachment.filename || 'attachment',
        Content: attachmentToBase64(attachment),
        ContentType: attachment.contentType || 'application/octet-stream',
        ...(attachment.cid && { ContentID: `cid:${attachment.cid}` }),
      }));
    }

    try {
      const response = await axios.post(`${this.options.baseUrl || POSTMARK_URL}/email`, body, {
        headers: this.headers(),
        timeout: this.options.timeout,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send email via Postmark: ${describeHttpError(error)}`);
    }
  }

  async verify(): Promise<boolean> {
    try {
      await axios.get(`${this.options.baseUrl || POSTMARK_URL}/server`, {
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
    return {
      'X-Postmark-Server-Token': this.options.serverToken,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }
}

export function describeHttpError(error: unknown): string {
  const err = error as {
    response?: { status?: number; data?: { Message?: string; message?: string } };
    message?: string;
  };
  const detail = err.response?.data?.Message || err.response?.data?.message || err.message;
  return err.response?.status ? `${err.response.status} ${detail}` : String(detail);
}
