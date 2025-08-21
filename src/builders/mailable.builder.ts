import { Content, Address, Attachment } from '../interfaces/mail.interface';

// Builder Pattern for constructing mail content
export class MailableBuilder {
  protected content: Content = {};

  subject(subject: string): MailableBuilder {
    this.content.subject = subject;
    return this;
  }

  from(address: string | Address): MailableBuilder {
    this.content.from = typeof address === 'string' ? { address } : address;
    return this;
  }

  to(address: string | Address | Array<string | Address>): MailableBuilder {
    if (Array.isArray(address)) {
      this.content.to = address.map((addr) => (typeof addr === 'string' ? { address: addr } : addr));
    } else {
      this.content.to = typeof address === 'string' ? { address } : address;
    }
    return this;
  }

  cc(address: string | Address | Array<string | Address>): MailableBuilder {
    if (Array.isArray(address)) {
      this.content.cc = address.map((addr) => (typeof addr === 'string' ? { address: addr } : addr));
    } else {
      this.content.cc = typeof address === 'string' ? { address } : address;
    }
    return this;
  }

  bcc(address: string | Address | Array<string | Address>): MailableBuilder {
    if (Array.isArray(address)) {
      this.content.bcc = address.map((addr) => (typeof addr === 'string' ? { address: addr } : addr));
    } else {
      this.content.bcc = typeof address === 'string' ? { address } : address;
    }
    return this;
  }

  replyTo(address: string | Address | Array<string | Address>): MailableBuilder {
    if (Array.isArray(address)) {
      this.content.replyTo = address.map((addr) => (typeof addr === 'string' ? { address: addr } : addr));
    } else {
      this.content.replyTo = typeof address === 'string' ? { address } : address;
    }
    return this;
  }

  html(html: string): MailableBuilder {
    this.content.html = html;
    return this;
  }

  text(text: string): MailableBuilder {
    this.content.text = text;
    return this;
  }

  template(template: string, context?: Record<string, unknown>): MailableBuilder {
    this.content.template = template;
    if (context) {
      this.content.context = { ...this.content.context, ...context };
    }
    return this;
  }

  with(key: string, value: unknown): MailableBuilder;
  with(data: Record<string, unknown>): MailableBuilder;
  with(keyOrData: string | Record<string, unknown>, value?: unknown): MailableBuilder {
    if (typeof keyOrData === 'string') {
      this.content.context = { ...this.content.context, [keyOrData]: value };
    } else {
      this.content.context = { ...this.content.context, ...keyOrData };
    }
    return this;
  }

  attach(attachment: Attachment): MailableBuilder {
    if (!this.content.attachments) {
      this.content.attachments = [];
    }
    this.content.attachments.push(attachment);
    return this;
  }

  attachFromPath(path: string, options?: Partial<Attachment>): MailableBuilder {
    return this.attach({
      path,
      ...options,
    });
  }

  attachData(content: Buffer | string, filename: string, options?: Partial<Attachment>): MailableBuilder {
    return this.attach({
      content,
      filename,
      ...options,
    });
  }

  header(key: string, value: string): MailableBuilder {
    if (!this.content.headers) {
      this.content.headers = {};
    }
    this.content.headers[key] = value;
    return this;
  }

  headers(headers: Record<string, string>): MailableBuilder {
    this.content.headers = { ...this.content.headers, ...headers };
    return this;
  }

  tag(tag: string): MailableBuilder {
    if (!this.content.tags) {
      this.content.tags = [];
    }
    this.content.tags.push(tag);
    return this;
  }

  tags(tags: string[]): MailableBuilder {
    this.content.tags = [...(this.content.tags || []), ...tags];
    return this;
  }

  metadata(key: string, value: unknown): MailableBuilder;
  metadata(data: Record<string, unknown>): MailableBuilder;
  metadata(keyOrData: string | Record<string, unknown>, value?: unknown): MailableBuilder {
    if (!this.content.metadata) {
      this.content.metadata = {};
    }

    if (typeof keyOrData === 'string') {
      this.content.metadata[keyOrData] = value;
    } else {
      this.content.metadata = { ...this.content.metadata, ...keyOrData };
    }
    return this;
  }

  build(): Content {
    return { ...this.content };
  }

  // Factory method for creating a new builder
  static create(): MailableBuilder {
    return new MailableBuilder();
  }

  // Clone method for creating a copy
  clone(): MailableBuilder {
    const cloned = new MailableBuilder();
    cloned.content = JSON.parse(JSON.stringify(this.content));
    return cloned;
  }
}
