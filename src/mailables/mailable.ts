import { Content } from '../interfaces/mail.interface';

/**
 * @class Mailable
 * @description Abstract Mailable class for building email content.
 *              Extend this class to define your email's content, view, and metadata.
 *              It provides a fluent interface for configuring various aspects of an email.
 */
export abstract class Mailable {
  /**
   * @protected
   * @property content
   * @description Stores the content and configuration for the email.
   */
  protected content: Content = {};

  /**
   * @method view
   * @description Sets the template for the email and optionally provides initial context data.
   * @param template The name or path of the template to use.
   * @param context Optional. An object containing data to be passed to the template.
   * @returns The current Mailable instance for chaining.
   */
  protected view(template: string, context?: Record<string, unknown>): this {
    this.content.template = template;
    if (context) {
      this.content.context = { ...this.content.context, ...context };
    }
    return this;
  }

  /**
   * @method with
   * @description Adds data to the template context. Can be used to add a single key-value pair or merge an object.
   * @param keyOrData Either the key for a single data point, or an object of key-value pairs to merge.
   * @param value Optional. The value for the specified key, if `keyOrData` is a string.
   * @returns The current Mailable instance for chaining.
   */
  protected with(key: string, value: unknown): this;
  protected with(data: Record<string, unknown>): this;
  protected with(keyOrData: string | Record<string, unknown>, value?: unknown): this {
    if (!this.content.context) {
      this.content.context = {};
    }
    if (typeof keyOrData === 'string') {
      this.content.context[keyOrData] = value;
    } else {
      this.content.context = { ...this.content.context, ...keyOrData };
    }
    return this;
  }

  /**
   * @method subject
   * @description Sets the subject line of the email.
   * @param subject The subject string.
   * @returns The current Mailable instance for chaining.
   */
  protected subject(subject: string): this {
    this.content.subject = subject;
    return this;
  }

  /**
   * @method from
   * @description Sets the sender's email address and optional name.
   * @param address The sender's email address.
   * @param name Optional. The sender's name.
   * @returns The current Mailable instance for chaining.
   */
  protected from(address: string, name?: string): this {
    this.content.from = { address, name };
    return this;
  }

  /**
   * @method replyTo
   * @description Sets the reply-to email address and optional name.
   * @param address The reply-to email address.
   * @param name Optional. The reply-to name.
   * @returns The current Mailable instance for chaining.
   */
  protected replyTo(address: string, name?: string): this {
    this.content.replyTo = { address, name };
    return this;
  }

  /**
   * @method attach
   * @description Attaches a file from a given path to the email.
   * @param path The file path of the attachment.
   * @param options Optional. Additional options for the attachment (e.g., filename, contentType).
   * @returns The current Mailable instance for chaining.
   */
  protected attach(path: string, options?: Record<string, unknown>): this {
    if (!this.content.attachments) {
      this.content.attachments = [];
    }
    this.content.attachments.push({ path, ...options });
    return this;
  }

  /**
   * @method attachData
   * @description Attaches data (e.g., Buffer, string) as a file to the email.
   * @param data The content of the attachment as a Buffer or string.
   * @param filename The desired filename for the attachment.
   * @param options Optional. Additional options for the attachment (e.g., contentType).
   * @returns The current Mailable instance for chaining.
   */
  protected attachData(data: Buffer | string, filename: string, options?: Record<string, unknown>): this {
    if (!this.content.attachments) {
      this.content.attachments = [];
    }
    this.content.attachments.push({ content: data, filename, ...options });
    return this;
  }

  // --- Headers, Tags, Metadata ---
  /**
   * @method header
   * @description Adds a custom header to the email.
   * @param key The header name.
   * @param value The header value.
   * @returns The current Mailable instance for chaining.
   */
  protected header(key: string, value: string): this {
    if (!this.content.headers) {
      this.content.headers = {};
    }
    this.content.headers[key] = value;
    return this;
  }

  /**
   * @method tag
   * @description Adds a tag to the email, useful for tracking or categorization.
   * @param tag The tag string.
   * @returns The current Mailable instance for chaining.
   */
  protected tag(tag: string): this {
    if (!this.content.tags) {
      this.content.tags = [];
    }
    this.content.tags.push(tag);
    return this;
  }

  /**
   * @method metadata
   * @description Adds custom metadata to the email.
   * @param key The metadata key.
   * @param value The metadata value.
   * @returns The current Mailable instance for chaining.
   */
  protected metadata(key: string, value: unknown): this {
    if (!this.content.metadata) {
      this.content.metadata = {};
    }
    this.content.metadata[key] = value;
    return this;
  }

  /**
   * @method build
   * @description Protected method to finalize and return the email content object.
   *              This method can be overridden by subclasses to perform additional processing.
   * @returns The complete email content object.
   */
  protected build(): Content {
    return this.content;
  }

  /**
   * @method getContent
   * @description Public method to retrieve the finalized email content object.
   * @returns The complete email content object.
   */
  public getContent(): Content {
    return this.build();
  }

  /**
   * @method render
   * @description Renders the email content, combining the base content with any built content.
   * @returns The rendered email content object.
   */
  public render(): Content {
    const built = this.build();
    return { ...this.content, ...built };
  }
}
