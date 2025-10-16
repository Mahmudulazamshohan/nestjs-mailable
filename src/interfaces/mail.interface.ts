import { TransportType } from '../types/transport.type';
import { TemplateEngineType } from '../constants/template.constants';

// Core interfaces for mail functionality
export interface MailConfiguration {
  transport: TransportConfiguration;
  from?: Address;
  replyTo?: Address | false;
  templates?: TemplateConfiguration;
}

// Discriminated union types for transport-specific configurations
export interface SMTPTransportConfiguration {
  type: typeof TransportType.SMTP;
  host: string;
  port?: number;
  secure?: boolean;
  ignoreTLS?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface SESTransportConfiguration {
  type: typeof TransportType.SES;
  region: string;
  host?: string;
  port?: number;
  secure?: boolean;
  credentials: {
    user?: string;
    pass?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
  };
  endpoint?: string;
}

export interface MailgunTransportConfiguration {
  type: typeof TransportType.MAILGUN;
  options: MailgunOptions;
}

export interface ResendTransportConfiguration {
  type: typeof TransportType.RESEND;
  apiKey: string;
}

// Union type that enforces transport-specific required fields
export type TransportConfiguration =
  | SMTPTransportConfiguration
  | SESTransportConfiguration
  | MailgunTransportConfiguration
  | ResendTransportConfiguration;

export interface MailgunOptions {
  domain: string;
  apiKey: string;
  host?: string;
  protocol?: string;
  timeout?: number;
}

export interface TemplateConfiguration {
  engine: TemplateEngineType;
  directory: string;
  partials?: Record<string, string>;
  options?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    helpers?: Record<string, (...args: any[]) => any>;
    [key: string]: unknown;
  };
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
  to?: string | Address | Array<string | Address>;
  cc?: string | Address | Array<string | Address>;
  bcc?: string | Address | Array<string | Address>;
  replyTo?: string | Address | Array<string | Address>;
  html?: string;
  text?: string;
  template?: string;
  context?: Record<string, unknown>;
  attachments?: Attachment[];
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, unknown>;
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
  render(template: string, context: Record<string, unknown>): Promise<string>;
  /**
   * Compiles a template source into a reusable function.
   * @param source The template source string.
   * @returns A promise that resolves to a function that can render the template with a given context.
   */
  compile(source: string): Promise<(context: Record<string, unknown>) => string>;
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
  send(content: Content): Promise<unknown>;
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

/**
 * Mailable envelope configuration interface
 */
export interface MailableEnvelope {
  subject?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  using?: Array<(message: unknown) => void>;
}

/**
 * Mailable content configuration interface
 */
export interface MailableContent {
  html?: string;
  text?: string;
  markdown?: string;
  template?: string;
  with?: Record<string, unknown>;
}

/**
 * Mailable headers configuration interface
 */
export interface MailableHeaders {
  messageId?: string;
  references?: string[];
  text?: Record<string, string>;
}

/**
 * Mailable attachment configuration interface
 */
export interface MailableAttachment {
  path?: string;
  storage?: string;
  data?: () => string | Buffer;
  filename?: string;
  as?: string;
  mime?: string;
}
