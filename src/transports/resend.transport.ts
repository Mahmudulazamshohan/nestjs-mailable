import { Resend } from 'resend';
import { Content, MailTransport, ResendOptions } from '../interfaces/mail.interface';
import { attachmentToBase64, formatAddress, toAddressList } from './transport.utils';

export class ResendTransport implements MailTransport {
  private client: Resend;

  constructor(private readonly options: ResendOptions) {
    if (!options?.apiKey) {
      throw new Error('Resend API Key is required.');
    }
    this.client = new Resend(options.apiKey);
  }

  async send(content: Content): Promise<unknown> {
    const to = toAddressList(content.to).map(formatAddress);
    if (to.length === 0) {
      throw new Error('Recipient address (to) is required');
    }

    const payload: Record<string, unknown> = {
      from: content.from ? formatAddress(content.from) : undefined,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      headers: content.headers,
    };

    const cc = toAddressList(content.cc).map(formatAddress);
    const bcc = toAddressList(content.bcc).map(formatAddress);
    const replyTo = toAddressList(content.replyTo).map(formatAddress);
    if (cc.length) payload.cc = cc;
    if (bcc.length) payload.bcc = bcc;
    if (replyTo.length) payload.replyTo = replyTo;

    if (content.tags?.length) {
      payload.tags = content.tags.map((tag) => ({ name: 'tag', value: tag }));
    }

    if (content.attachments?.length) {
      payload.attachments = content.attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachmentToBase64(attachment),
        ...(attachment.cid && { contentId: attachment.cid }),
      }));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await this.client.emails.send(payload as any);
    if (error) {
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }
    return data;
  }

  async verify(): Promise<boolean> {
    try {
      const { error } = await this.client.domains.list();
      return !error;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }
}
