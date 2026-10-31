import { Injectable, Inject, Optional } from '@nestjs/common';
import { Content, MailTransport, Address, Attachment, TemplateEngine } from '../interfaces/mail.interface';
import { MailConfigService } from './mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import { Mailable } from '../classes/mailable';
import {
  TemplateEngineFactory,
  HandlebarsTemplateEngine,
  EjsTemplateEngine,
  PugTemplateEngine,
} from './template.service';
import { MailEventEmitter, MAIL_EVENT_EMITTER } from '../events/mail-events.interface';
import { MAIL_SENT_EVENT, MAIL_FAILED_EVENT, MailSentEvent, MailFailedEvent } from '../events/mail-events';
import { htmlToPlainText, inlineCss } from '../utils/html-processing';
import { RetryExhaustedError } from '../retry/retry-transport';
import { MAIL_QUEUE, MailQueue, QueuedMail } from '../queue/mail-queue.interface';
import { MailBatchSender } from '../batch/mail-batch-sender';
import { BatchItem, BatchOptions } from '../batch/batch.interface';

export interface SendOptions {
  /** Named mailer from the `mailers` configuration. Defaults to the main transport. */
  mailer?: string;
}

export interface QueueMailOptions extends SendOptions {
  /** Milliseconds to wait before delivery. */
  delay?: number;
}

/**
 * MailService provides email sending, queuing, and template rendering.
 */
@Injectable()
export class MailService {
  private transport: MailTransport;
  private namedTransports = new Map<string, MailTransport>();
  private templateEngine: TemplateEngine;
  private templateDir: string;
  private mainFile: string;

  /**
   * Creates a new MailService instance.
   * @param configService Provides mail and template configuration.
   * @param transportFactory Factory for creating mail transports.
   * @param templateEngineFactory Factory for template engines.
   * @param eventEmitter Optional event emitter for mail lifecycle events.
   */
  constructor(
    private configService: MailConfigService,
    private transportFactory: MailTransportFactory,
    private templateEngineFactory: TemplateEngineFactory,
    @Optional() @Inject(MAIL_EVENT_EMITTER) private eventEmitter: MailEventEmitter | null = null,
    @Optional() @Inject(MAIL_QUEUE) private mailQueue: MailQueue | null = null,
  ) {
    this.initializeTransport();
    this.initializeTemplateEngine();
    this.mailQueue?.process((job) => this.deliverQueued(job));
  }

  /**
   * Returns a MailSender for fluent address configuration.
   * @param address Recipient address(es).
   */
  to(address: string | Address | Array<string | Address>): MailSender {
    return new MailSender(this).to(address);
  }

  /**
   * Selects a named mailer (configured under `mailers`) for sending.
   * @param name Mailer name.
   * @throws Error when the mailer is not configured.
   */
  mailer(name: string): Mailer {
    this.getTransport(name);
    return new Mailer(this, name);
  }

  /**
   * Returns the transport for a mailer name, creating it on first use.
   * Without a name the default `transport` is returned.
   * @internal
   */
  getTransport(mailer?: string): MailTransport {
    if (!mailer) {
      return this.transport;
    }

    let transport = this.namedTransports.get(mailer);
    if (!transport) {
      const config = this.configService.getMailersConfig?.()?.[mailer];
      if (!config) {
        throw new Error(`Mailer '${mailer}' is not configured`);
      }
      transport = this.transportFactory.createTransport(config);
      this.namedTransports.set(mailer, transport);
    }
    return transport;
  }

  /**
   * Sends an email using the provided mailable content or Mailable instance.
   * Renders template if specified. Emits mail.sent or mail.failed events.
   * @param mailable The email content, metadata, or Mailable instance.
   * @param options Send options, e.g. a named `mailer`.
   */
  async send(mailable: Content | Mailable, options: SendOptions = {}): Promise<any> {
    const transport = this.getTransport(options.mailer);
    let content: Content;

    // Check if it's a Mailable instance
    if (mailable instanceof Mailable) {
      content = await mailable.build();
    } else {
      content = { ...mailable };
    }

    // Process template if needed
    if (content.template && content.context) {
      const renderedHtml = await this.templateEngine.render(content.template, content.context);
      content.html = renderedHtml;
    }

    this.applyHtmlProcessing(content);

    // Apply global from if not set
    if (!content.from) {
      const globalFrom = this.configService.getGlobalFrom();
      if (globalFrom) {
        content.from = globalFrom;
      }
    }

    try {
      const result = await transport.send(content);
      this.emitEvent(MAIL_SENT_EVENT, new MailSentEvent(content, result, new Date()));
      return result;
    } catch (error) {
      const attempts = error instanceof RetryExhaustedError ? error.attempts : 1;
      this.emitEvent(MAIL_FAILED_EVENT, new MailFailedEvent(content, error as Error, attempts, new Date()));
      throw error;
    }
  }

  /**
   * Builds the message now and enqueues it for background delivery.
   * Templates are rendered by the worker at delivery time.
   * @param mailable The email content or Mailable instance.
   * @param options Queue options: named `mailer` and `delay` in milliseconds.
   * @throws Error when no queue is configured.
   */
  async queue(mailable: Content | Mailable, options: QueueMailOptions = {}): Promise<any> {
    if (!this.mailQueue) {
      throw new Error("No mail queue configured. Set the 'queue' option on MailModule or provide MAIL_QUEUE.");
    }
    if (options.mailer) {
      this.getTransport(options.mailer);
    }

    const content = mailable instanceof Mailable ? await mailable.build() : { ...mailable };
    return this.mailQueue.dispatch({ content, mailer: options.mailer }, { delay: options.delay });
  }

  /**
   * Enqueues a message for delivery after a delay or at a point in time.
   * @param delay Milliseconds to wait, or the Date at which to deliver.
   * @param mailable The email content or Mailable instance.
   * @param options Queue options (named `mailer`).
   */
  async later(delay: number | Date, mailable: Content | Mailable, options: SendOptions = {}): Promise<any> {
    const ms = delay instanceof Date ? Math.max(0, delay.getTime() - Date.now()) : Math.max(0, delay);
    return this.queue(mailable, { ...options, delay: ms });
  }

  /**
   * Creates a MailBatchSender for sending multiple emails with concurrency control.
   * @param items Array of batch items (to address + mailable).
   * @param options Batch configuration (batchSize, concurrency, continueOnError).
   */
  batch(items: BatchItem[], options?: BatchOptions): MailBatchSender {
    return new MailBatchSender(this, items, options ?? {});
  }

  /**
   * Delivers a job taken from the queue.
   */
  private deliverQueued(job: QueuedMail): Promise<any> {
    return this.send(job.content, { mailer: job.mailer });
  }

  /**
   * Emits an event via the configured event emitter if events are enabled.
   * @internal
   */
  emitEvent(event: string, payload: unknown): void {
    const eventsConfig = this.configService.getEventsConfig();
    if (eventsConfig?.enabled && this.eventEmitter) {
      this.eventEmitter.emit(event, payload);
    }
  }

  /**
   * Returns a MailFake instance for testing mail sending.
   */
  fake(): MailFake {
    return new MailFake(this);
  }

  /**
   * Inlines CSS and derives the plain text part according to config. Mutates the (already copied) content.
   */
  private applyHtmlProcessing(content: Content): void {
    if (!content.html) {
      return;
    }

    const inline = this.configService.getInlineCss?.();
    if (inline) {
      content.html = inlineCss(content.html, inline === true ? undefined : inline);
    }

    const autoText = this.configService.getAutoText?.();
    if (autoText && !content.text) {
      content.text = htmlToPlainText(content.html, autoText === true ? undefined : autoText);
    }
  }

  /**
   * Initializes the mail transport using config.
   */
  private initializeTransport(): void {
    const config = this.configService.getTransportConfig();
    this.transport = this.transportFactory.createTransport(config);
  }

  /**
   * Initializes the template engine based on config.
   */
  private initializeTemplateEngine(): void {
    const templateConfig = this.configService.getTemplateConfig();

    if (!templateConfig) {
      // Use default template engine if no config provided
      this.templateEngine = new HandlebarsTemplateEngine('./templates', 'main.hbs');
      return;
    }

    this.templateDir = templateConfig.directory;
    const engineType = templateConfig.engine;

    // Validate supported engine types
    if (!this.templateEngineFactory.isEngineSupported(engineType)) {
      throw new Error(
        `Unsupported template engine '${engineType}'. Supported engines: ${this.templateEngineFactory.getSupportedEngines().join(', ')}`,
      );
    }

    try {
      switch (engineType) {
        case 'ejs':
          this.templateEngine = new EjsTemplateEngine(this.templateDir, 'main.ejs', templateConfig);
          break;
        case 'pug':
          this.templateEngine = new PugTemplateEngine(this.templateDir, 'main.pug', templateConfig);
          break;
        case 'handlebars':
        default:
          this.templateEngine = new HandlebarsTemplateEngine(this.templateDir, 'main.hbs', templateConfig);
          break;
      }

      this.templateEngineFactory.registerEngine(engineType, this.templateEngine);
    } catch (error) {
      throw new Error(`Failed to initialize template engine '${engineType}': ${(error as Error).message}`);
    }
  }
}

type AddressInput = string | Address | Array<string | Address>;

const normalizeAddresses = (address: AddressInput): Address | Address[] =>
  Array.isArray(address)
    ? address.map((addr) => (typeof addr === 'string' ? { address: addr } : addr))
    : typeof address === 'string'
      ? { address }
      : address;

/**
 * Fluent sender interface for building and sending mail.
 */
export class MailSender {
  private content: Content = {};

  constructor(
    private mailService: MailService,
    private mailerName?: string,
  ) {}

  /**
   * Sets the recipient address(es).
   * @param address Recipient address(es).
   */
  to(address: AddressInput): MailSender {
    this.content.to = normalizeAddresses(address);
    return this;
  }

  /**
   * Sets the CC address(es).
   * @param address CC address(es).
   */
  cc(address: AddressInput): MailSender {
    this.content.cc = normalizeAddresses(address);
    return this;
  }

  /**
   * Sets the BCC address(es).
   * @param address BCC address(es).
   */
  bcc(address: AddressInput): MailSender {
    this.content.bcc = normalizeAddresses(address);
    return this;
  }

  /**
   * Sets the sender address, overriding the global from.
   * @param address Sender address.
   */
  from(address: string | Address): MailSender {
    this.content.from = typeof address === 'string' ? { address } : address;
    return this;
  }

  /**
   * Sets the reply-to address(es).
   * @param address Reply-to address(es).
   */
  replyTo(address: AddressInput): MailSender {
    this.content.replyTo = normalizeAddresses(address);
    return this;
  }

  /**
   * Sets the subject line.
   * @param subject Subject text.
   */
  subject(subject: string): MailSender {
    this.content.subject = subject;
    return this;
  }

  /**
   * Sets the HTML body.
   * @param html HTML markup.
   */
  html(html: string): MailSender {
    this.content.html = html;
    return this;
  }

  /**
   * Sets the plain text body.
   * @param text Plain text.
   */
  text(text: string): MailSender {
    this.content.text = text;
    return this;
  }

  /**
   * Renders the named template with the given context when sent.
   * @param name Template name (extension resolved from the configured engine).
   * @param context Template variables.
   */
  template(name: string, context: Record<string, unknown> = {}): MailSender {
    this.content.template = name;
    this.content.context = context;
    return this;
  }

  /**
   * Adds an attachment.
   * @param attachment Attachment definition.
   */
  attach(attachment: Attachment): MailSender {
    this.content.attachments = [...(this.content.attachments || []), attachment];
    return this;
  }

  /**
   * Adds a custom header.
   * @param name Header name.
   * @param value Header value.
   */
  header(name: string, value: string): MailSender {
    this.content.headers = { ...this.content.headers, [name]: value };
    return this;
  }

  /**
   * Adds a provider tag.
   * @param tag Tag value.
   */
  tag(tag: string): MailSender {
    this.content.tags = [...(this.content.tags || []), tag];
    return this;
  }

  /**
   * Sets provider metadata.
   * @param metadata Key/value metadata.
   */
  metadata(metadata: Record<string, unknown>): MailSender {
    this.content.metadata = { ...this.content.metadata, ...metadata };
    return this;
  }

  /**
   * Sends the email with the configured addresses and content.
   * @param mailable Optional email content, metadata, or Mailable instance. Fluent values take precedence.
   */
  async send(mailable?: Content | Mailable): Promise<any> {
    return this.mailService.send(await this.resolve(mailable), { mailer: this.mailerName });
  }

  /**
   * Enqueues the message for background delivery.
   * @param mailable Optional email content or Mailable instance. Fluent values take precedence.
   * @param options Queue options, e.g. `delay` in milliseconds.
   */
  async queue(mailable?: Content | Mailable, options: Pick<QueueMailOptions, 'delay'> = {}): Promise<any> {
    return this.mailService.queue(await this.resolve(mailable), { ...options, mailer: this.mailerName });
  }

  /**
   * Enqueues the message for delivery after a delay or at a point in time.
   * @param delay Milliseconds to wait, or the Date at which to deliver.
   * @param mailable Optional email content or Mailable instance. Fluent values take precedence.
   */
  async later(delay: number | Date, mailable?: Content | Mailable): Promise<any> {
    return this.mailService.later(delay, await this.resolve(mailable), { mailer: this.mailerName });
  }

  /**
   * Merges fluent values over the mailable's built content.
   */
  protected async resolve(mailable?: Content | Mailable): Promise<Content> {
    const base: Content = mailable instanceof Mailable ? await mailable.build() : { ...(mailable || {}) };
    const merged: Content = { ...base };

    for (const [key, value] of Object.entries(this.content)) {
      if (value !== undefined) {
        merged[key] = value;
      }
    }

    return merged;
  }
}

/**
 * A named mailer bound to one configured transport.
 */
export class Mailer {
  constructor(
    private mailService: MailService,
    private name: string,
  ) {}

  /**
   * Starts a fluent message on this mailer.
   * @param address Recipient address(es).
   */
  to(address: AddressInput): MailSender {
    return new MailSender(this.mailService, this.name).to(address);
  }

  /**
   * Sends content or a Mailable through this mailer.
   * @param mailable The email content or Mailable instance.
   */
  async send(mailable: Content | Mailable): Promise<any> {
    return new MailSender(this.mailService, this.name).send(mailable);
  }

  /**
   * Enqueues content or a Mailable for background delivery through this mailer.
   * @param mailable The email content or Mailable instance.
   * @param options Queue options, e.g. `delay` in milliseconds.
   */
  async queue(mailable: Content | Mailable, options: Pick<QueueMailOptions, 'delay'> = {}): Promise<any> {
    return this.mailService.queue(mailable, { ...options, mailer: this.name });
  }

  /**
   * Enqueues content or a Mailable for delayed delivery through this mailer.
   * @param delay Milliseconds to wait, or the Date at which to deliver.
   * @param mailable The email content or Mailable instance.
   */
  async later(delay: number | Date, mailable: Content | Mailable): Promise<any> {
    return this.mailService.later(delay, mailable, { mailer: this.name });
  }
}

/**
 * Fake mail sender for testing and assertions.
 */
export class MailFake {
  private sentMails: Content[] = [];

  constructor(private originalService: MailService) {}

  /**
   * Simulates sending an email and stores it for assertions.
   * @param mailable The email content and metadata.
   */
  async send(mailable: Content): Promise<any> {
    this.sentMails.push(mailable);
    return { messageId: `fake-${Date.now()}` };
  }

  /**
   * Asserts that at least one mail was sent (optionally matching callback).
   * @param callback Optional filter function.
   */
  assertSent(callback?: (mail: Content) => boolean): void {
    const count = callback ? this.sentMails.filter(callback).length : this.sentMails.length;

    if (count === 0) {
      throw new Error('No mail was sent');
    }
  }

  /**
   * Asserts that the number of sent mails matches expected count.
   * @param expectedCount The expected number of sent mails.
   */
  assertSentCount(expectedCount: number): void {
    if (this.sentMails.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} mails to be sent, but ${this.sentMails.length} were sent`);
    }
  }

  /**
   * Returns all sent mails.
   */
  getSentMails(): Content[] {
    return [...this.sentMails];
  }
}
