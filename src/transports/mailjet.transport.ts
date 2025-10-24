import { MailTransport, MailjetOptions } from '../interfaces/mail.interface';
import * as MailjetModule from 'node-mailjet';

// Handle both ESM and CommonJS exports
const Mailjet = (MailjetModule as any).default || MailjetModule;
const apiConnect = Mailjet.apiConnect || (Mailjet as any).default?.apiConnect;
type Client = ReturnType<typeof apiConnect>;

interface MailjetTransportConfig {
  transport: string;
  options: MailjetOptions;
}

interface MailjetMessage {
  From?: { Email: string; Name?: string };
  To?: Array<{ Email: string; Name?: string }>;
  Cc?: Array<{ Email: string; Name?: string }>;
  Bcc?: Array<{ Email: string; Name?: string }>;
  ReplyTo?: { Email: string; Name?: string };
  Subject?: string;
  TextPart?: string;
  HTMLPart?: string;
  Attachments?: Array<{
    ContentType: string;
    Filename: string;
    Base64Content: string;
  }>;
  Headers?: Record<string, string>;
  [key: string]: unknown;
}

export class MailjetTransport implements MailTransport {
  private mailjet: Client;

  constructor(private readonly config: MailjetTransportConfig) {
    const options = config.options;
    if (!options || !options.apiKey || !options.apiSecret) {
      throw new Error('Mailjet API Key and Secret are required.');
    }

    if (!apiConnect) {
      throw new Error('Mailjet apiConnect function not found. Check node-mailjet module.');
    }

    this.mailjet = apiConnect(options.apiKey, options.apiSecret);
  }

  async send(mail: Record<string, unknown>): Promise<unknown> {
    const { from, to, cc, bcc, replyTo, subject, html, text, attachments, headers, ...rest } = mail;

    // Build the message object
    const message: MailjetMessage = {};

    // Add from address
    if (from) {
      message.From = this.formatAddress(from);
    }

    // Add to addresses
    if (to) {
      message.To = this.formatAddresses(to);
    }

    // Add cc addresses
    if (cc) {
      message.Cc = this.formatAddresses(cc);
    }

    // Add bcc addresses
    if (bcc) {
      message.Bcc = this.formatAddresses(bcc);
    }

    // Add reply-to address
    if (replyTo) {
      message.ReplyTo = this.formatAddress(replyTo);
    }

    // Add subject and content
    if (subject) {
      message.Subject = String(subject);
    }

    if (text) {
      message.TextPart = String(text);
    }

    if (html) {
      message.HTMLPart = String(html);
    }

    // Add custom headers
    if (headers && typeof headers === 'object') {
      message.Headers = headers as Record<string, string>;
    }

    // Add attachments
    if (attachments && Array.isArray(attachments)) {
      message.Attachments = (attachments as Array<{ content: unknown; filename: string }>).map((attachment) => ({
        ContentType: 'application/octet-stream',
        Filename: attachment.filename || 'attachment',
        Base64Content: this.toBase64(attachment.content),
      }));
    }

    // Add any other properties from rest
    for (const key in rest) {
      if (key !== 'context' && key !== 'template' && key !== 'engine') {
        message[key] = rest[key];
      }
    }

    try {
      const request = this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [message],
      });

      const response = await request;
      return response.body;
    } catch (error) {
      throw new Error(`Failed to send email via Mailjet: ${(error as Error).message}`);
    }
  }

  async verify(): Promise<boolean> {
    try {
      // Test API connection by making a simple request
      const request = this.mailjet.get('apitoken').request();
      await request;
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    // Mailjet client doesn't require explicit connection closing
    return Promise.resolve();
  }

  private formatAddress(address: unknown): { Email: string; Name?: string } {
    if (typeof address === 'string') {
      return { Email: address };
    }

    if (typeof address === 'object' && address !== null) {
      const addr = address as { address?: string; email?: string; name?: string };
      const email = addr.address || addr.email || '';
      return {
        Email: email,
        ...(addr.name && { Name: addr.name }),
      };
    }

    return { Email: String(address) };
  }

  private formatAddresses(addresses: unknown): Array<{ Email: string; Name?: string }> {
    if (typeof addresses === 'string') {
      return [{ Email: addresses }];
    }

    if (Array.isArray(addresses)) {
      return addresses.map((addr) => this.formatAddress(addr));
    }

    return [this.formatAddress(addresses)];
  }

  private toBase64(content: unknown): string {
    if (typeof content === 'string') {
      return Buffer.from(content).toString('base64');
    }

    if (Buffer.isBuffer(content)) {
      return content.toString('base64');
    }

    return Buffer.from(String(content)).toString('base64');
  }
}
