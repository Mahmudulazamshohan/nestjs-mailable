import { TransportType } from '../types/transport.type';

// Core interfaces for mail functionality
export interface MailConfiguration {
  default: string;
  mailers: Record<string, MailerConfig>;
  from?: {
    address: string;
    name?: string;
  };
  replyTo?: {
    address: string;
    name?: string;
  };
}

export interface MailerConfig {
  transport: TransportType;
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  // Transport-specific options. For 'ses' transport, this should be SesMailerOptions.
  options?: SesMailerOptions | MailgunMailerOptions | Record<string, any>;
  // Failover/Round-robin configuration
  mailers?: string[];
  retryAfter?: number;
}

export interface MailgunMailerOptions {
  apiKey: string;
  domain: string;
  // Add any other Mailgun specific options here
}

export interface SesMailerOptions {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  // Add other SES-specific options as needed, e.g., sessionToken, httpOptions, etc.
}

export interface Attachment {
  filename?: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  cid?: string;
  encoding?: string;
  headers?: Record<string, string>;
}

export interface Address {
  name?: string;
  address: string;
}

export interface Content {
  subject?: string;
  from?: Address;
  to?: Address | Address[];
  cc?: Address | Address[];
  bcc?: Address | Address[];
  replyTo?: Address | Address[];
  html?: string;
  text?: string;
  template?: string;
  context?: Record<string, any>;
  attachments?: Attachment[];
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Defines the interface for a template engine, responsible for rendering and compiling email templates.
 */
export interface TemplateEngine {
  /**
   * Renders a template with the given context.
   * @param template The template string or path.
   * @param context The data to be used in the template.
   * @returns A promise that resolves to the rendered string.
   */
  render(template: string, context: Record<string, any>): Promise<string>;
  /**
   * Compiles a template source into a reusable function.
   * @param source The template source string.
   * @returns A promise that resolves to a function that can render the template with a given context.
   */
  compile(source: string): Promise<(context: Record<string, any>) => string>;
}

/**
 * Defines the interface for a mail transport service, responsible for sending emails.
 */
export interface MailTransport {
  /**
   * Sends an email with the given content.
   * @param content The email content to be sent.
   * @returns A promise that resolves to the transport's response.
   */
  send(content: Content): Promise<any>;
  /**
   * Verifies the transport configuration.
   * @returns A promise that resolves to true if the transport is valid, false otherwise.
   */
  verify?(): Promise<boolean>;
  /**
   * Closes the transport connection.
   * @returns A promise that resolves when the connection is closed.
   */
  close?(): Promise<void>;
}
