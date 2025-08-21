import {
  Content,
  Attachment,
  MailableEnvelope,
  MailableContent,
  MailableHeaders,
  MailableAttachment,
} from '../interfaces/mail.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Abstract Mailable class that provides advanced mailable functionality
 */
export abstract class Mailable {
  /**
   * Build the message envelope
   */
  abstract envelope(): MailableEnvelope;

  /**
   * Build the message content
   */
  abstract content(): MailableContent;

  /**
   * Get the attachments for the message
   */
  attachments(): MailableAttachment[] {
    return [];
  }

  /**
   * Get the message headers
   */
  headers(): MailableHeaders {
    return {};
  }

  /**
   * Build the final mail content by combining all mailable components
   */
  async build(): Promise<Content> {
    const envelope = this.envelope();
    const content = this.content();
    const headers = this.headers();
    const attachments = await this.buildAttachments();

    const mailContent: Content = {
      subject: envelope.subject,
      tags: envelope.tags,
      metadata: envelope.metadata,
      headers: headers.text,
      attachments,
    };

    // Handle content
    if (content.html) {
      mailContent.html = content.html;
    }

    if (content.text) {
      mailContent.text = content.text;
    }

    if (content.template) {
      mailContent.template = content.template;
      mailContent.context = content.with;
    }

    if (content.markdown) {
      mailContent.template = 'markdown';
      mailContent.context = {
        markdown: content.markdown,
        ...(content.with || {}),
      };
    }

    // Apply envelope customizations
    if (envelope.using) {
      // Store the customizations to be applied by the mail service
      mailContent.metadata = {
        ...mailContent.metadata,
        envelopeCustomizations: envelope.using,
      };
    }

    // Apply custom headers
    if (headers.messageId || headers.references) {
      const customHeaders: Record<string, string> = { ...(mailContent.headers || {}) };

      if (headers.messageId) {
        customHeaders['Message-ID'] = headers.messageId;
      }

      if (headers.references && headers.references.length > 0) {
        customHeaders['References'] = headers.references.join(' ');
      }

      mailContent.headers = customHeaders;
    }

    return mailContent;
  }

  /**
   * Convert mailable attachments to Content attachments
   */
  private async buildAttachments(): Promise<Attachment[]> {
    const mailableAttachments = this.attachments();
    const attachments: Attachment[] = [];

    for (const attachment of mailableAttachments) {
      if (attachment.path) {
        // File path attachment
        const content = await fs.readFile(attachment.path);
        attachments.push({
          filename: attachment.as || path.basename(attachment.path),
          content,
          contentType: attachment.mime,
        });
      } else if (attachment.storage) {
        // Storage attachment (assuming relative to storage directory)
        const storagePath = path.join(process.cwd(), 'storage', attachment.storage);
        const content = await fs.readFile(storagePath);
        attachments.push({
          filename: attachment.as || path.basename(attachment.storage),
          content,
          contentType: attachment.mime,
        });
      } else if (attachment.data) {
        // In-memory data attachment
        const content = attachment.data();
        attachments.push({
          filename: attachment.as || attachment.filename || 'attachment',
          content: typeof content === 'string' ? Buffer.from(content) : content,
          contentType: attachment.mime,
        });
      }
    }

    return attachments;
  }
}

/**
 * Helper functions for creating attachments
 */
export class AttachmentBuilder {
  static fromPath(filePath: string): MailableAttachmentBuilder {
    return new MailableAttachmentBuilder({ path: filePath });
  }

  static fromStorage(storagePath: string): MailableAttachmentBuilder {
    return new MailableAttachmentBuilder({ storage: storagePath });
  }

  static fromData(dataFn: () => string | Buffer, filename: string): MailableAttachmentBuilder {
    return new MailableAttachmentBuilder({ data: dataFn, filename });
  }
}

/**
 * Builder for mailable attachments
 */
export class MailableAttachmentBuilder {
  private attachment: MailableAttachment;

  constructor(attachment: MailableAttachment) {
    this.attachment = { ...attachment };
  }

  as(filename: string): MailableAttachmentBuilder {
    this.attachment.as = filename;
    return this;
  }

  withMime(mimeType: string): MailableAttachmentBuilder {
    this.attachment.mime = mimeType;
    return this;
  }

  build(): MailableAttachment {
    return this.attachment;
  }
}
