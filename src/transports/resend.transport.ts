import { MailTransport, Content, Address, Attachment } from '../interfaces/mail.interface';

interface ResendAttachment {
  filename?: string;
  content?: Buffer | string;
  path?: string;
}

interface ResendEmailPayload {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string | string[];
  attachments?: ResendAttachment[];
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export class ResendTransport implements MailTransport {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resend: any;

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('Resend API key is required.');
    }

    try {
      // Dynamic import to avoid bundling Resend if not used
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const { Resend } = require('resend');
      this.resend = new Resend(apiKey);
    } catch {
      throw new Error('Resend package is not installed. Please install it with: npm install resend');
    }
  }

  async send(content: Content): Promise<unknown> {
    const payload = this.buildPayload(content);

    try {
      const { data, error } = await this.resend.emails.send(payload);

      if (error) {
        throw new Error(`Resend API error: ${error.message || JSON.stringify(error)}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to send email via Resend: ${error.message}`);
      }
      throw error;
    }
  }

  async verify(): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error('Resend transport verification failed:', error);
      return false;
    }
  }

  private buildPayload(content: Content): ResendEmailPayload {
    const payload: ResendEmailPayload = {
      from: this.formatAddress(content.from),
      to: this.formatAddresses(content.to),
      subject: content.subject || '',
    };

    if (content.html) {
      payload.html = content.html;
    }

    if (content.text) {
      payload.text = content.text;
    }

    if (content.cc) {
      payload.cc = this.formatAddresses(content.cc);
    }

    if (content.bcc) {
      payload.bcc = this.formatAddresses(content.bcc);
    }

    if (content.replyTo) {
      payload.reply_to = this.formatAddresses(content.replyTo);
    }

    if (content.attachments && content.attachments.length > 0) {
      payload.attachments = this.formatAttachments(content.attachments);
    }

    if (content.headers) {
      payload.headers = content.headers;
    }

    if (content.tags && content.tags.length > 0) {
      payload.tags = content.tags.map((tag) => {
        if (typeof tag === 'string') {
          const [name, value] = tag.split(':');
          return { name, value: value || '' };
        }
        return tag;
      });
    }

    return payload;
  }

  private formatAddress(address: string | Address | undefined): string {
    if (!address) {
      throw new Error('From address is required');
    }

    if (typeof address === 'string') {
      return address;
    }

    if (address.name) {
      return `${address.name} <${address.address}>`;
    }

    return address.address;
  }

  private formatAddresses(addresses: string | Address | Array<string | Address> | undefined): string | string[] {
    if (!addresses) {
      return [];
    }

    if (Array.isArray(addresses)) {
      return addresses.map((addr) => this.formatAddress(addr));
    }

    return this.formatAddress(addresses);
  }

  private formatAttachments(attachments: Attachment[]): ResendAttachment[] {
    return attachments.map((attachment) => {
      const resendAttachment: ResendAttachment = {};

      if (attachment.filename) {
        resendAttachment.filename = attachment.filename;
      }

      if (attachment.content) {
        resendAttachment.content = attachment.content;
      }

      if (attachment.path) {
        resendAttachment.path = attachment.path;
      }

      return resendAttachment;
    });
  }
}
