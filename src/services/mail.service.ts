import { Injectable, Inject, Optional } from '@nestjs/common';
import { Content, MailTransport, Address, TemplateEngine } from '../interfaces/mail.interface';
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
import { RetryExhaustedError } from '../retry/retry-transport';
import { MailBatchSender } from '../batch/mail-batch-sender';
import { BatchItem, BatchOptions } from '../batch/batch.interface';

/**
 * MailService provides email sending, queuing, and template rendering.
 */
@Injectable()
export class MailService {
  private transport: MailTransport;
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
  ) {
    this.initializeTransport();
    this.initializeTemplateEngine();
  }

  /**
   * Returns a MailSender for fluent address configuration.
   * @param address Recipient address(es).
   */
  to(address: string | Address | Array<string | Address>): MailSender {
    return new MailSender(this).to(address);
  }

  /**
   * Sends an email using the provided mailable content or Mailable instance.
   * Renders template if specified. Emits mail.sent or mail.failed events.
   * @param mailable The email content, metadata, or Mailable instance.
   */
  async send(mailable: Content | Mailable): Promise<any> {
    let content: Content;

    // Check if it's a Mailable instance
    if (mailable instanceof Mailable) {
      content = await mailable.build();
    } else {
      content = mailable;
    }

    // Process template if needed
    if (content.template && content.context) {
      const renderedHtml = await this.templateEngine.render(content.template, content.context);
      content.html = renderedHtml;
    }

    // Apply global from if not set
    if (!content.from) {
      const globalFrom = this.configService.getGlobalFrom();
      if (globalFrom) {
        content.from = globalFrom;
      }
    }

    try {
      const result = await this.transport.send(content);
      this.emitEvent(MAIL_SENT_EVENT, new MailSentEvent(content, result, new Date()));
      return result;
    } catch (error) {
      const attempts = error instanceof RetryExhaustedError ? error.attempts : 1;
      this.emitEvent(MAIL_FAILED_EVENT, new MailFailedEvent(content, error as Error, attempts, new Date()));
      throw error;
    }
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

/**
 * Fluent sender interface for building and sending mail.
 */
export class MailSender {
  private content: Content = {};

  constructor(private mailService: MailService) {}

  /**
   * Sets the recipient address(es).
   * @param address Recipient address(es).
   */
  to(address: string | Address | Array<string | Address>): MailSender {
    if (Array.isArray(address)) {
      this.content.to = address.map((addr) => (typeof addr === 'string' ? { address: addr } : addr));
    } else {
      this.content.to = typeof address === 'string' ? { address } : address;
    }
    return this;
  }

  /**
   * Sets the CC address(es).
   * @param address CC address(es).
   */
  cc(address: string | Address | Array<string | Address>): MailSender {
    if (Array.isArray(address)) {
      this.content.cc = address.map((addr) => (typeof addr === 'string' ? { address: addr } : addr));
    } else {
      this.content.cc = typeof address === 'string' ? { address } : address;
    }
    return this;
  }

  /**
   * Sets the BCC address(es).
   * @param address BCC address(es).
   */
  bcc(address: string | Address | Array<string | Address>): MailSender {
    if (Array.isArray(address)) {
      this.content.bcc = address.map((addr) => (typeof addr === 'string' ? { address: addr } : addr));
    } else {
      this.content.bcc = typeof address === 'string' ? { address } : address;
    }
    return this;
  }

  /**
   * Sends the email with the configured addresses and content.
   * @param mailable The email content, metadata, or Mailable instance.
   */
  async send(mailable: Content | Mailable): Promise<any> {
    let content: Content;

    // Check if it's a Mailable instance
    if (mailable instanceof Mailable) {
      content = await mailable.build();
    } else {
      content = mailable;
    }

    // Merge the addresses with the mailable content
    const finalContent = {
      ...content,
      to: this.content.to || content.to,
      cc: this.content.cc || content.cc,
      bcc: this.content.bcc || content.bcc,
    };

    return await this.mailService.send(finalContent);
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
