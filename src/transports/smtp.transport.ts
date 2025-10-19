import { MailTransport, Content } from '../interfaces/mail.interface';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export class SmtpTransport implements MailTransport {
  private transporter: Transporter;

  constructor(private options: Record<string, unknown>) {
    // Add default pool configuration for better performance
    const defaultOptions = {
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
      ...options,
    } as any; // Type assertion for compatibility with nodemailer options

    this.transporter = nodemailer.createTransport(defaultOptions);
  }

  async send(content: Content): Promise<unknown> {
    try {
      // Validate required fields
      if (!content.to) {
        throw new Error('Recipient address (to) is required');
      }

      const mailOptions = {
        from: content.from ? this.formatSingleAddress(content.from) : undefined,
        to: this.formatAddresses(content.to),
        cc: this.formatAddresses(content.cc),
        bcc: this.formatAddresses(content.bcc),
        replyTo: this.formatAddresses(content.replyTo),
        subject: content.subject,
        text: content.text,
        html: content.html,
        attachments: content.attachments,
        headers: content.headers,
      };

      // Remove undefined and empty fields to clean up the mail options
      Object.keys(mailOptions).forEach((key) => {
        const value = mailOptions[key as keyof typeof mailOptions];
        if (value === undefined || value === '') {
          delete mailOptions[key as keyof typeof mailOptions];
        }
      });

      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      throw new Error(`SMTP send failed: ${(error as Error).message}`);
    }
  }

  async verify(): Promise<boolean> {
    try {
      const result = await this.transporter.verify();
      return result;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // SMTP verification failed - return false
      return false;
    }
  }

  async close(): Promise<void> {
    this.transporter.close();
  }

  private formatAddresses(addresses: unknown): string | undefined {
    if (!addresses) return undefined;

    if (Array.isArray(addresses)) {
      const formatted = addresses.map((addr) => this.formatSingleAddress(addr)).filter(Boolean);

      return formatted.length > 0 ? formatted.join(', ') : undefined;
    }

    return this.formatSingleAddress(addresses);
  }

  private formatSingleAddress(addr: unknown): string | undefined {
    if (!addr) return undefined;

    if (typeof addr === 'string') {
      return addr;
    }

    const addressObj = addr as { name?: string; address: string };
    if (!addressObj.address) {
      return undefined;
    }

    return addressObj.name ? `${addressObj.name} <${addressObj.address}>` : addressObj.address;
  }
}
