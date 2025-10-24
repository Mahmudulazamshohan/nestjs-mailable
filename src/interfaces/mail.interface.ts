import { TransportType } from '../types/transport.type';
import { TemplateEngineType } from '../constants/template.constants';

export interface MailConfiguration {
  transport: TransportConfiguration;
  from?: Address;
  replyTo?: Address | false;
  templates?: TemplateConfiguration;
}

// Discriminated union enforces transport-specific required fields
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
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  endpoint?: string;
}

export interface MailgunTransportConfiguration {
  type: typeof TransportType.MAILGUN;
  options: MailgunOptions;
}

export interface MailjetTransportConfiguration {
  type: typeof TransportType.MAILJET;
  options: MailjetOptions;
}

export type TransportConfiguration =
  | SMTPTransportConfiguration
  | SESTransportConfiguration
  | MailgunTransportConfiguration
  | MailjetTransportConfiguration;

export interface MailgunOptions {
  domain: string;
  apiKey: string;
  host?: string;
  protocol?: string;
  timeout?: number;
}

export interface MailjetOptions {
  apiKey: string;
  apiSecret: string;
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

/** Template engine interface for rendering and compiling email templates */
export interface TemplateEngine {
  render(template: string, context: Record<string, unknown>): Promise<string>;
  compile(source: string): Promise<(context: Record<string, unknown>) => string>;
}

/** Mail transport interface for sending emails */
export interface MailTransport {
  send(content: Content): Promise<unknown>;
  verify?(): Promise<boolean>;
  close?(): Promise<void>;
}

export interface MailableEnvelope {
  subject?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  using?: Array<(message: unknown) => void>;
}

export interface MailableContent {
  html?: string;
  text?: string;
  markdown?: string;
  template?: string;
  with?: Record<string, unknown>;
}

export interface MailableHeaders {
  messageId?: string;
  references?: string[];
  text?: Record<string, string>;
}

export interface MailableAttachment {
  path?: string;
  storage?: string;
  data?: () => string | Buffer;
  filename?: string;
  as?: string;
  mime?: string;
}
