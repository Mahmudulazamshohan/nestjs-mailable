import { MailTransport, Content } from '../interfaces/mail.interface';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import { SES } from 'aws-sdk';

export class SesTransport implements MailTransport {
  private transporter: Transporter | null = null;
  private ses: SES;

  constructor(private options: Record<string, unknown>) {
    // Validate required options
    if (!options.region) {
      throw new Error('SES transport requires region configuration');
    }

    const endpoint = options.endpoint as string;
    const isLocalEndpoint =
      endpoint && (endpoint.includes('localhost') || endpoint.includes('127.0.0.1') || endpoint.includes('4566'));

    // For real AWS SES, use nodemailer with SMTP
    if (!isLocalEndpoint) {
      const region = options.region as string;
      const creds = options.credentials as any;

      // Get SMTP configuration from options
      const host = (options.host as string) || `email-smtp.${region}.amazonaws.com`;
      const port = (options.port as number) || 587;
      const secure = (options.secure as boolean) || false;
      const username = creds?.user || creds?.accessKeyId;
      const password = creds?.pass || creds?.secretAccessKey;

      this.transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: secure,
        auth: {
          user: username,
          pass: password,
        },
      });
    } else {
      // For LocalStack/mock, use AWS SDK
      const sesConfig: any = {
        endpoint: endpoint,
        region: options.region as string,
      };

      if (options.credentials) {
        const creds = options.credentials as any;
        if (creds.accessKeyId && creds.accessKeyId !== 'test') {
          sesConfig.accessKeyId = creds.accessKeyId;
          sesConfig.secretAccessKey = creds.secretAccessKey;
          sesConfig.sessionToken = creds.sessionToken;
        }
      }

      this.ses = new SES(sesConfig);
    }
  }

  async send(content: Content): Promise<unknown> {
    try {
      // Validate required fields
      if (!content.to) {
        throw new Error('Recipient address (to) is required');
      }

      // Use nodemailer transporter if available (real AWS SES via SMTP)
      if (this.transporter) {
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

        // Remove undefined fields
        Object.keys(mailOptions).forEach((key) => {
          const value = mailOptions[key as keyof typeof mailOptions];
          if (value === undefined || value === '') {
            delete mailOptions[key as keyof typeof mailOptions];
          }
        });

        const result = await this.transporter.sendMail(mailOptions);

        return result;
      }

      // Otherwise use AWS SDK for LocalStack/mock
      const endpoint = this.options.endpoint as string;
      const isLocalEndpoint =
        endpoint && (endpoint.includes('localhost') || endpoint.includes('127.0.0.1') || endpoint.includes('4566'));

      if (isLocalEndpoint) {
        // Build email parameters for AWS SES
        const destination: any = {
          ToAddresses: Array.isArray(content.to)
            ? content.to.map((t: any) => (typeof t === 'string' ? t : t.address))
            : [typeof content.to === 'string' ? content.to : (content.to as any).address],
        };

        if (content.cc) {
          destination.CcAddresses = Array.isArray(content.cc)
            ? content.cc.map((c: any) => (typeof c === 'string' ? c : c.address))
            : [typeof content.cc === 'string' ? content.cc : (content.cc as any).address];
        }

        if (content.bcc) {
          destination.BccAddresses = Array.isArray(content.bcc)
            ? content.bcc.map((b: any) => (typeof b === 'string' ? b : b.address))
            : [typeof content.bcc === 'string' ? content.bcc : (content.bcc as any).address];
        }

        const params = {
          Source: content.from ? this.formatSingleAddress(content.from) : undefined,
          Destination: destination,
          Message: {
            Subject: {
              Data: content.subject || 'No Subject',
              Charset: 'UTF-8',
            },
            Body: {} as any,
          },
        };

        if (content.html) {
          params.Message.Body.Html = {
            Data: content.html,
            Charset: 'UTF-8',
          };
        }

        if (content.text) {
          params.Message.Body.Text = {
            Data: content.text,
            Charset: 'UTF-8',
          };
        }

        // Send using AWS SDK
        const result = await this.ses.sendEmail(params).promise();

        return {
          messageId: result.MessageId,
          accepted: destination.ToAddresses,
          rejected: [],
          response: '250 OK',
          envelope: {
            from: params.Source,
            to: destination.ToAddresses,
          },
        };
      }

      // For mock server testing, create a raw email message
      const emailMessage = this.createRawEmail(content);

      // Send directly to our SES mock server
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'SimpleEmailService.SendRawEmail',
          Authorization: `AWS4-HMAC-SHA256 Credential=${(this.options.credentials as any)?.accessKeyId}/...`,
        },
        body: emailMessage,
      });

      if (!response.ok) {
        throw new Error(`SES API returned ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as any;
      return {
        messageId: result.MessageId || `<test.${Date.now()}@ses-mock>`,
        accepted: [this.formatAddresses(content.to)],
        rejected: [],
        response: '250 OK',
        envelope: {
          from: content.from ? this.formatSingleAddress(content.from) : 'noreply@example.com',
          to: [this.formatAddresses(content.to)].filter(Boolean),
        },
      };
    } catch (error) {
      throw new Error(`SES send failed: ${(error as Error).message}`);
    }
  }

  private createRawEmail(content: Content): string {
    const lines: string[] = [];

    // Email headers
    if (content.from) {
      lines.push(`From: ${this.formatSingleAddress(content.from)}`);
    }
    if (content.to) {
      lines.push(`To: ${this.formatAddresses(content.to)}`);
    }
    if (content.cc) {
      lines.push(`Cc: ${this.formatAddresses(content.cc)}`);
    }
    if (content.replyTo) {
      lines.push(`Reply-To: ${this.formatAddresses(content.replyTo)}`);
    }
    if (content.subject) {
      lines.push(`Subject: ${content.subject}`);
    }

    lines.push('MIME-Version: 1.0');
    lines.push('Content-Type: text/html; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: 7bit');
    lines.push('');

    // Email body
    lines.push(content.html || content.text || '');

    return lines.join('\r\n');
  }

  async verify(): Promise<boolean> {
    try {
      // For mock server, just test if we can reach the endpoint
      const endpoint = this.options.endpoint as string;
      if (endpoint && !endpoint.includes('amazonaws.com')) {
        // Test mock server connectivity
        const response = await fetch(endpoint, { method: 'HEAD' });
        return response.ok || response.status === 404; // 404 is fine for HEAD on mock server
      }

      // For real AWS SES, test with transporter if available
      if (this.transporter) {
        const result = await this.transporter.verify();
        return result;
      }

      return true; // Assume AWS SES is available
    } catch (error) {
      console.warn(`SES verification failed: ${(error as Error).message}`);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
    }
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
