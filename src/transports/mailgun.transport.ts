import { readFile } from 'fs/promises';
import { basename } from 'path';
import { Attachment, Content, MailTransport, MailgunOptions } from '../interfaces/mail.interface';
import { formatAddress, toAddressList } from './transport.utils';
import * as Mailgun from 'mailgun.js';
import * as FormDataModule from 'form-data';
import axios from 'axios';

// form-data is CommonJS without a default export and tsconfig has no esModuleInterop
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FormData: typeof FormDataModule = (FormDataModule as any).default ?? FormDataModule;

interface MailgunTransportConfig {
  transport: string;
  options: MailgunOptions;
}

export class MailgunTransport implements MailTransport {
  private mailgun: unknown;
  private domain: string;
  private mockConfig?: { host: string; protocol: string };

  constructor(private readonly config: MailgunTransportConfig) {
    const options = config.options;
    if (!options || !options.apiKey || !options.domain) {
      throw new Error('Mailgun API Key and domain are required.');
    }

    // Check if we're using mock server configuration
    if (options.host && options.protocol) {
      this.mockConfig = {
        host: options.host,
        protocol: options.protocol,
      };
    }

    if (!this.mockConfig) {
      this.mailgun = new Mailgun.default(FormData).client({
        username: 'api',
        key: options.apiKey,
        url: options.host || 'https://api.mailgun.net',
      });
    }
    this.domain = options.domain;
  }

  async send(mail: Record<string, unknown>): Promise<unknown> {
    const { attachments, ...rest } = mail as Content & Record<string, unknown>;
    const messageData = this.buildMessageData(rest);

    // If using mock server, send HTTP request directly
    if (this.mockConfig) {
      return this.sendToMockServer(messageData, attachments as Attachment[] | undefined);
    }

    const data: Record<string, unknown> = { ...messageData };
    if (attachments?.length) {
      data.attachment = await Promise.all((attachments as Attachment[]).map((a) => this.toMailgunAttachment(a)));
    }

    try {
      const client = this.mailgun as { messages: { create(domain: string, data: unknown): Promise<unknown> } };
      return await client.messages.create(this.domain, data);
    } catch (error) {
      throw new Error(`Failed to send email via Mailgun: ${(error as Error).message}`);
    }
  }

  async verify(): Promise<boolean> {
    if (this.mockConfig) {
      return true;
    }
    try {
      const client = this.mailgun as { domains: { get(domain: string): Promise<unknown> } };
      await client.domains.get(this.domain);
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Maps Content onto Mailgun message fields. Unknown extra fields are passed through untouched.
   */
  private buildMessageData(mail: Record<string, unknown>): Record<string, unknown> {
    const { from, to, cc, bcc, replyTo, subject, html, text, headers, tags, metadata, template, context, ...rest } =
      mail as Content & Record<string, unknown>;
    void template;
    void context;

    const list = (input: Content['to']) => {
      const addresses = toAddressList(input).map(formatAddress);
      return addresses.length ? addresses : undefined;
    };
    const single = (input: Content['from']) => (input ? formatAddress(toAddressList(input)[0]) : undefined);

    const data: Record<string, unknown> = {
      from: single(from),
      to: list(to),
      cc: list(cc),
      bcc: list(bcc),
      subject,
      html,
      text,
      ...rest,
    };

    const replyToList = list(replyTo);
    if (replyToList) {
      data['h:Reply-To'] = replyToList.join(', ');
    }
    for (const [name, value] of Object.entries(headers || {})) {
      data[`h:${name}`] = value;
    }
    if (tags?.length) {
      data['o:tag'] = tags;
    }
    for (const [key, value] of Object.entries(metadata || {})) {
      data[`v:${key}`] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    return data;
  }

  private async toMailgunAttachment(attachment: Attachment): Promise<{ filename: string; data: Buffer | string }> {
    const filename = attachment.filename || (attachment.path ? basename(attachment.path) : 'attachment');
    if (attachment.content !== undefined) {
      return { filename, data: attachment.content };
    }
    if (attachment.path) {
      return { filename, data: await readFile(attachment.path) };
    }
    throw new Error(`Attachment '${filename}' requires content or path`);
  }

  private async sendToMockServer(messageData: Record<string, unknown>, attachments?: Attachment[]): Promise<unknown> {
    const form = new FormData();

    // Add message fields
    for (const [key, value] of Object.entries(messageData)) {
      if (value === undefined || value === null) {
        continue;
      }
      for (const item of Array.isArray(value) ? value : [value]) {
        form.append(key, String(item));
      }
    }

    // Add attachments if any
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        form.append('attachment', attachment.content, attachment.filename);
      }
    }

    const url = `${this.mockConfig!.protocol}//${this.mockConfig!.host}/v3/${this.domain}/messages`;

    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Basic ${Buffer.from(`api:${this.config.options.apiKey}`).toString('base64')}`,
      },
    });

    return response.data;
  }
}
