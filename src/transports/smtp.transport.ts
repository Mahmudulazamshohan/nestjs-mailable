import { MailTransport, Content } from '../interfaces/mail.interface';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export class SmtpTransport implements MailTransport {
  private transporter: Transporter;

  constructor(private options: any) {
    this.transporter = nodemailer.createTransport(options);
  }

  async send(content: Content): Promise<any> {
    const mailOptions = {
      from: content.from ? `${content.from.name} <${content.from.address}>` : undefined,
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

    return await this.transporter.sendMail(mailOptions);
  }

  async verify(): Promise<boolean> {
    return await this.transporter.verify();
  }

  async close(): Promise<void> {
    this.transporter.close();
  }

  private formatAddresses(addresses: any): string | undefined {
    if (!addresses) return undefined;
    if (Array.isArray(addresses)) {
      return addresses.map((addr) => (typeof addr === 'string' ? addr : `${addr.name} <${addr.address}>`)).join(', ');
    }
    return typeof addresses === 'string' ? addresses : `${addresses.name} <${addresses.address}>`;
  }
}
