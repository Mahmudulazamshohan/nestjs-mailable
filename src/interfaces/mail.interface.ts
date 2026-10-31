import type { HtmlToTextOptions } from 'html-to-text';
import type { InlineCssOptions } from '../utils/html-processing';
import type { QueueConfiguration } from '../queue/mail-queue.interface';
import { TransportType } from '../types/transport.type';
import { TemplateEngineType } from '../constants/template.constants';

export type RetryStrategy = 'fixed' | 'exponential' | 'linear';

export interface RetryOptions {
  attempts: number;
  strategy?: RetryStrategy;
  delay?: number;
  maxDelay?: number;
  jitter?: boolean;
}

export interface TemplateCacheConfiguration {
  enabled: boolean;
  ttl?: number;
  maxSize?: number;
}

export interface EventsConfiguration {
  enabled: boolean;
}

export interface MailConfiguration {
  transport: TransportConfiguration;
  /** Additional named mailers, selected with `mailService.mailer(name)`. `transport` stays the default mailer. */
  mailers?: Record<string, TransportConfiguration>;
  from?: Address;
  replyTo?: Address | false;
  templates?: TemplateConfiguration;
  events?: EventsConfiguration;
  /** Queue driver used by `queue()` and `later()`. Omit to disable queueing. */
  queue?: QueueConfiguration;
  /** Generate a plain text part from the HTML when no text is set. Pass options to customise html-to-text. */
  autoText?: boolean | HtmlToTextOptions;
  /** Inline `<style>` CSS into element style attributes before sending. Pass options to customise juice. */
  inlineCss?: boolean | InlineCssOptions;
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
  retry?: RetryOptions;
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
  retry?: RetryOptions;
}

export interface MailgunTransportConfiguration {
  type: typeof TransportType.MAILGUN;
  options: MailgunOptions;
  retry?: RetryOptions;
}

export interface MailjetTransportConfiguration {
  type: typeof TransportType.MAILJET;
  options: MailjetOptions;
  retry?: RetryOptions;
}

export interface ResendTransportConfiguration {
  type: typeof TransportType.RESEND;
  options: ResendOptions;
  retry?: RetryOptions;
}

export interface PostmarkTransportConfiguration {
  type: typeof TransportType.POSTMARK;
  options: PostmarkOptions;
  retry?: RetryOptions;
}

export interface SendGridTransportConfiguration {
  type: typeof TransportType.SENDGRID;
  options: SendGridOptions;
  retry?: RetryOptions;
}

export interface BrevoTransportConfiguration {
  type: typeof TransportType.BREVO;
  options: BrevoOptions;
  retry?: RetryOptions;
}

export interface FailoverTransportConfiguration {
  type: typeof TransportType.FAILOVER;
  transports: TransportConfiguration[];
  strategy?: 'ordered' | 'roundrobin';
  retry?: RetryOptions;
}

export type TransportConfiguration =
  | SMTPTransportConfiguration
  | SESTransportConfiguration
  | MailgunTransportConfiguration
  | MailjetTransportConfiguration
  | ResendTransportConfiguration
  | PostmarkTransportConfiguration
  | SendGridTransportConfiguration
  | BrevoTransportConfiguration
  | FailoverTransportConfiguration;

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

export interface ResendOptions {
  apiKey: string;
}

export interface PostmarkOptions {
  serverToken: string;
  messageStream?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface SendGridOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface BrevoOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface TemplateConfiguration {
  engine: TemplateEngineType;
  directory: string;
  partials?: Record<string, string>;
  cache?: TemplateCacheConfiguration;
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
