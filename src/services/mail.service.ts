import { Injectable } from '@nestjs/common';
import { Content, MailTransport, Address } from '../interfaces/mail.interface';
import { MailConfigService } from './mail-config.service';
import { MailTransportFactory } from '../factories/mail-transport.factory';
import {
  TemplateEngineFactory,
  HandlebarsTemplateEngine,
  MarkdownTemplateEngine,
  MjmlTemplateEngine,
} from './template.service';

/**
 * MailService provides email sending, queuing, and template rendering.
 */
@Injectable()
export class MailService {
  private transport: MailTransport;
  private templateEngine: any;
  private templateDir: string;
  private mainFile: string;

  /**
   * Creates a new MailService instance.
   * @param configService Provides mail and template configuration.
   * @param transportFactory Factory for creating mail transports.
   * @param templateEngineFactory Factory for template engines.
   */
  constructor(
    private configService: MailConfigService,
    private transportFactory: MailTransportFactory,
    private templateEngineFactory: TemplateEngineFactory,
  ) {
    // Get template config from MailConfigService
    const templateConfig = this.configService.getTemplateConfig
      ? this.configService.getTemplateConfig()
      : { dir: './templates', main: 'main.hbs', type: 'handlebars' };
    this.templateDir = templateConfig.dir;
    this.mainFile = templateConfig.main;
    this.initializeTransport();
    this.initializeTemplateEngine(templateConfig.type);
  }

  /**
   * Returns a MailSender for fluent address configuration.
   * @param address Recipient address(es).
   */
  async to(address: string | Address | Array<string | Address>): Promise<MailSender> {
    return new MailSender(this).to(address);
  }

  /**
   * Sends an email using the provided mailable content.
   * Renders template if specified.
   * @param mailable The email content and metadata.
   */
  async send(mailable: Content): Promise<any> {
    // Process template if needed
    if (mailable.template && mailable.context) {
      const renderedHtml = await this.templateEngine.render(mailable.template, mailable.context);
      mailable.html = renderedHtml;
    }

    // Apply global from if not set
    if (!mailable.from) {
      const globalFrom = this.configService.getGlobalFrom();
      if (globalFrom) {
        mailable.from = globalFrom;
      }
    }

    // Send the email
    const result = await this.transport.send(mailable);

    return result;
  }

  /**
   * Returns a new MailService instance for a specific mailer config.
   * @param name The mailer configuration name.
   */
  mailer(name: string): MailService {
    const mailerConfig = this.configService.getMailerConfig(name);
    const transport = this.transportFactory.createTransport(mailerConfig);

    const newService = new MailService(this.configService, this.transportFactory, this.templateEngineFactory);
    newService.transport = transport;

    return newService;
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
    const config = this.configService.getMailerConfig();
    this.transport = this.transportFactory.createTransport(config);
  }

  /**
   * Initializes the template engine based on config type.
   * @param type The template engine type ('handlebars', 'markdown', 'mjml').
   */
  private initializeTemplateEngine(type?: string): void {
    // Use type from config, default to handlebars
    let engine: any;
    switch (type) {
      case 'markdown':
        engine = new MarkdownTemplateEngine(this.templateDir, this.mainFile);
        break;
      case 'mjml':
        engine = new MjmlTemplateEngine(this.templateDir, this.mainFile);
        break;
      case 'handlebars':
      default:
        engine = new HandlebarsTemplateEngine(this.templateDir, this.mainFile);
        break;
    }
    this.templateEngineFactory.registerEngine(type || 'handlebars', engine);
    this.templateEngine = engine;
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
   * @param mailable The email content and metadata.
   */
  async send(mailable: Content | any): Promise<any> {
    // Merge the addresses with the mailable content
    const finalContent = {
      ...mailable,
      to: this.content.to || mailable.to,
      cc: this.content.cc || mailable.cc,
      bcc: this.content.bcc || mailable.bcc,
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
