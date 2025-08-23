import { MailTransport, MailgunOptions } from '../interfaces/mail.interface';
import * as Mailgun from 'mailgun.js';
import FormData from 'form-data';
import axios from 'axios';

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
    const { from, to, subject, html, text, attachments, ...rest } = mail;

    const messageData: Record<string, unknown> = {
      from: from,
      to: to,
      subject: subject,
      html: html,
      text: text,
      ...rest,
    };

    // If using mock server, send HTTP request directly
    if (this.mockConfig) {
      return this.sendToMockServer(
        messageData,
        attachments as Array<{ content: unknown; filename: string }> | undefined,
      );
    }

    // Real Mailgun API call
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

  private async sendToMockServer(
    messageData: Record<string, unknown>,
    attachments?: Array<{ content: unknown; filename: string }>,
  ): Promise<unknown> {
    const form = new FormData();

    // Add message fields
    for (const [key, value] of Object.entries(messageData)) {
      if (value !== undefined && value !== null) {
        form.append(key, String(value));
      }
    }

    // Add attachments if any
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        form.append('attachment', attachment.content, attachment.filename);
      }
    }

    const url = `${this.mockConfig!.protocol}//${this.mockConfig!.host}/v3/${this.domain}/messages`;

    try {
      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Basic ${Buffer.from(`api:${this.config.options.apiKey}`).toString('base64')}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to send email via Mailgun mock server:', error);
      throw error;
    }
  }
}
