---
sidebar_position: 7
---

# API Reference & Examples

Complete reference with practical examples for all NestJS Mailable features.

## MailService API

### Basic Methods

```typescript
import { MailService } from 'nestjs-mailable';

@Injectable()
export class EmailService {
  constructor(private mailService: MailService) {}

  // Fluent API example
  async sendEmail() {
    await this.mailService
      .to('user@example.com')
      .subject('Hello World')
      .html('<h1>Hello!</h1>')
      .send();
  }

  // Object-based sending
  async sendWithObject() {
    await this.mailService.send({
      to: 'user@example.com',
      subject: 'Hello World',
      html: '<h1>Hello!</h1>'
    });
  }

  // Send Mailable instance
  async sendMailable() {
    const mailable = new WelcomeMail(user);
    await this.mailService.send(mailable);
  }
}
```

### Address Configuration

```typescript
// Single recipient
.to('user@example.com')
.to({ address: 'user@example.com', name: 'John Doe' })

// Multiple recipients
.to(['user1@example.com', 'user2@example.com'])
.to([
  { address: 'user1@example.com', name: 'John Doe' },
  { address: 'user2@example.com', name: 'Jane Smith' }
])

// CC and BCC
.cc('manager@example.com')
.bcc(['admin@example.com', 'audit@example.com'])

// Reply-To
.replyTo('support@example.com')
```

### Content Methods

```typescript
// HTML content
.html('<h1>Hello World</h1>')

// Plain text
.text('Hello World')

// Template with context
.template('welcome', { name: 'John', appName: 'MyApp' })

// Subject and headers
.subject('Welcome to MyApp')
.header('X-Custom-Header', 'value')
.header('X-Priority', '1')

// Tags and metadata
.tag('welcome')
.tag('onboarding')
.metadata({ userId: '123', campaign: 'welcome-series' })
```

### Attachments

```typescript
// File attachments
.attach('/path/to/file.pdf')
.attach('/path/to/image.jpg', 'custom-name.jpg')

// Data attachments
.attachData(buffer, 'filename.pdf', 'application/pdf')
.attachData('Hello World', 'hello.txt', 'text/plain')

// Multiple attachments
.attach('/path/to/invoice.pdf')
.attach('/path/to/receipt.jpg')
.attachData(csvData, 'report.csv', 'text/csv')
```

## Mailable Class Reference

### Core Methods

```typescript
export class ExampleMail extends Mailable {
  protected build() {
    return this
      // Recipients
      .to(address, name?)
      .cc(address, name?)
      .bcc(address, name?)
      .replyTo(address, name?)
      
      // Content
      .subject(subject)
      .view(template, context?)
      .html(content)
      .text(content)
      
      // Headers and metadata
      .header(key, value)
      .tag(tag)
      .metadata(data)
      
      // Attachments
      .attach(path, name?, contentType?)
      .attachData(data, filename, contentType?);
  }
}
```

### Advanced Mailable Patterns

#### Conditional Content

```typescript
export class ConditionalMail extends Mailable {
  constructor(
    private user: User,
    private isPremium: boolean
  ) {
    super();
  }

  protected build() {
    let template = 'emails.standard';
    let subject = 'Welcome!';

    if (this.isPremium) {
      template = 'emails.premium';
      subject = '🌟 Welcome, Premium Member!';
    }

    return this
      .to(this.user.email)
      .subject(subject)
      .view(template, {
        userName: this.user.name,
        isPremium: this.isPremium,
        benefits: this.isPremium ? this.getPremiumBenefits() : []
      });
  }

  private getPremiumBenefits(): string[] {
    return ['Priority Support', 'Advanced Features', 'Exclusive Content'];
  }
}
```

#### Dynamic Attachments

```typescript
export class ReportMail extends Mailable {
  constructor(
    private recipient: User,
    private reportType: 'pdf' | 'excel' | 'csv',
    private data: any[]
  ) {
    super();
  }

  protected build() {
    return this
      .to(this.recipient.email)
      .subject(`Your ${this.reportType.toUpperCase()} Report`)
      .view('emails.report', {
        userName: this.recipient.name,
        reportType: this.reportType,
        recordCount: this.data.length
      })
      .attach(this.generateReport());
  }

  private generateReport(): string {
    switch (this.reportType) {
      case 'pdf':
        return this.generatePdfReport();
      case 'excel':
        return this.generateExcelReport();
      case 'csv':
        return this.generateCsvReport();
      default:
        throw new Error('Unsupported report type');
    }
  }

  private generatePdfReport(): string {
    // PDF generation logic
    return '/tmp/report.pdf';
  }

  private generateExcelReport(): string {
    // Excel generation logic
    return '/tmp/report.xlsx';
  }

  private generateCsvReport(): string {
    // CSV generation logic
    return '/tmp/report.csv';
  }
}
```

## Template Engine Examples

### Handlebars Advanced Features

```typescript
// Module configuration with helpers
MailModule.forRoot({
  config: {
    templates: {
      engine: 'handlebars',
      directory: './templates',
      options: {
        helpers: {
          // Date formatting
          formatDate: (date: Date, format: string) => {
            return new Intl.DateTimeFormat('en-US', {
              dateStyle: format as any
            }).format(date);
          },
          
          // Currency formatting
          currency: (amount: number, currency = 'USD') => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency
            }).format(amount);
          },
          
          // Conditional comparison
          ifEquals: function(arg1: any, arg2: any, options: any) {
            return arg1 === arg2 ? options.fn(this) : options.inverse(this);
          },
          
          // Math operations
          add: (a: number, b: number) => a + b,
          multiply: (a: number, b: number) => a * b,
          
          // String operations
          truncate: (str: string, length: number) => {
            return str.length > length ? str.substring(0, length) + '...' : str;
          },
          
          // JSON serialization
          json: (obj: any) => JSON.stringify(obj)
        },
        partials: './templates/partials'
      }
    }
  }
})
```

**Template Usage:**

```handlebars
<!-- templates/order-summary.hbs -->
<!DOCTYPE html>
<html>
<head>
    <title>Order Summary</title>
</head>
<body>
    <h1>Order #{{orderNumber}}</h1>
    <p>Date: {{formatDate orderDate 'long'}}</p>
    
    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {{#each items}}
            <tr>
                <td>{{truncate name 30}}</td>
                <td>{{quantity}}</td>
                <td>{{currency price}}</td>
                <td>{{currency (multiply quantity price)}}</td>
            </tr>
            {{/each}}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3"><strong>Total:</strong></td>
                <td><strong>{{currency total}}</strong></td>
            </tr>
        </tfoot>
    </table>
    
    {{#ifEquals status 'shipped'}}
        <p>Your order has been shipped!</p>
        <p>Tracking: {{trackingNumber}}</p>
    {{/ifEquals}}
</body>
</html>
```

### MJML Advanced Templates

```xml
<!-- templates/newsletter.mjml -->
<mjml>
  <mj-head>
    <mj-title>{{subject}}</mj-title>
    <mj-preview>{{previewText}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-button background-color="#007bff" color="white" />
    </mj-attributes>
    <mj-style>
      .highlight { background-color: #fff3cd; padding: 10px; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8f9fa">
    <!-- Header -->
    <mj-section background-color="white" padding="0">
      <mj-column>
        <mj-image src="{{logoUrl}}" alt="{{appName}}" width="200px" />
      </mj-column>
    </mj-section>
    
    <!-- Content -->
    <mj-section background-color="white">
      <mj-column>
        <mj-text font-size="24px" font-weight="bold">
          Hello {{subscriberName}}!
        </mj-text>
        
        {{#if featuredArticle}}
        <mj-divider border-color="#dee2e6" />
        <mj-text font-size="18px" font-weight="bold" color="#007bff">
          Featured Article
        </mj-text>
        <mj-image src="{{featuredArticle.imageUrl}}" alt="{{featuredArticle.title}}" />
        <mj-text font-size="16px" font-weight="bold">
          <a href="{{featuredArticle.url}}" style="color: #007bff; text-decoration: none;">
            {{featuredArticle.title}}
          </a>
        </mj-text>
        <mj-text>{{featuredArticle.excerpt}}</mj-text>
        <mj-button href="{{featuredArticle.url}}">Read More</mj-button>
        {{/if}}
        
        {{#if articles}}
        <mj-divider border-color="#dee2e6" />
        <mj-text font-size="18px" font-weight="bold">
          Latest Articles
        </mj-text>
        {{#each articles}}
        <mj-section background-color="#f8f9fa" padding="10px">
          <mj-column width="30%">
            <mj-image src="{{imageUrl}}" alt="{{title}}" />
          </mj-column>
          <mj-column width="70%">
            <mj-text font-size="14px" font-weight="bold">
              <a href="{{url}}" style="color: #343a40; text-decoration: none;">
                {{title}}
              </a>
            </mj-text>
            <mj-text font-size="12px" color="#6c757d">
              By {{author}} • {{readTime}} min read
            </mj-text>
            <mj-text font-size="13px">{{excerpt}}</mj-text>
          </mj-column>
        </mj-section>
        {{/each}}
        {{/if}}
      </mj-column>
    </mj-section>
    
    <!-- Footer -->
    <mj-section background-color="#343a40" padding="20px">
      <mj-column>
        <mj-text align="center" color="white" font-size="12px">
          © {{year}} {{appName}}. All rights reserved.
        </mj-text>
        <mj-text align="center" font-size="12px">
          <a href="{{unsubscribeUrl}}" style="color: #adb5bd;">Unsubscribe</a> |
          <a href="{{preferencesUrl}}" style="color: #adb5bd;">Preferences</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```


## Testing Examples

### Complete Testing Suite

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MailService, MailFake, MailModule } from 'nestjs-mailable';

describe('Email Integration Tests', () => {
  let app: TestingModule;
  let mailService: MailService;
  let mailFake: MailFake;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [
        MailModule.forRoot({
          config: {
            default: {
              transport: 'fake', // Use fake transport for testing
            },
          },
        }),
      ],
      providers: [EmailService],
    }).compile();

    mailService = app.get<MailService>(MailService);
    mailFake = mailService as MailFake;
  });

  afterEach(() => {
    mailFake.reset(); // Clear sent emails
  });

  describe('Welcome Email', () => {
    it('should send welcome email with correct content', async () => {
      const user = { email: 'test@example.com', name: 'John Doe' };
      
      await mailService
        .to(user.email)
        .subject('Welcome!')
        .template('welcome', { name: user.name })
        .send();

      // Assert email was sent
      mailFake.assertSent((mail) => {
        return mail.to.includes(user.email) && 
               mail.subject === 'Welcome!' &&
               mail.template === 'welcome';
      });

      // Check template context
      const sentEmail = mailFake.getSent()[0];
      expect(sentEmail.context.name).toBe(user.name);
    });

    it('should send welcome email using Mailable class', async () => {
      const user = { email: 'test@example.com', name: 'John Doe' };
      const welcomeMail = new WelcomeMail(user);
      
      await mailService.send(welcomeMail);

      mailFake.assertSent(WelcomeMail, (mail) => {
        return mail.hasTo(user.email) && 
               mail.hasSubject('Welcome!');
      });

      expect(mailFake.getSentCount()).toBe(1);
    });
  });

  describe('Bulk Emails', () => {
    it('should send newsletter to multiple subscribers', async () => {
      const subscribers = [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
        { email: 'user3@example.com', name: 'User 3' },
      ];

      for (const subscriber of subscribers) {
        await mailService
          .to(subscriber.email)
          .subject('Newsletter')
          .template('newsletter', { subscriber })
          .send();
      }

      expect(mailFake.getSentCount()).toBe(3);

      // Check each email
      subscribers.forEach((subscriber, index) => {
        const sentEmail = mailFake.getSent()[index];
        expect(sentEmail.to).toContain(subscriber.email);
        expect(sentEmail.subject).toBe('Newsletter');
      });
    });
  });

  describe('Email Attachments', () => {
    it('should send email with attachments', async () => {
      await mailService
        .to('test@example.com')
        .subject('Report')
        .text('Please find the report attached.')
        .attach('/path/to/report.pdf')
        .attachData('csv,data', 'data.csv', 'text/csv')
        .send();

      const sentEmail = mailFake.getSent()[0];
      expect(sentEmail.attachments).toHaveLength(2);
      expect(sentEmail.attachments[0].path).toBe('/path/to/report.pdf');
      expect(sentEmail.attachments[1].filename).toBe('data.csv');
    });
  });

  describe('Email Failures', () => {
    it('should handle email sending failures gracefully', async () => {
      // Simulate failure
      mailFake.shouldFail(true);

      await expect(
        mailService
          .to('test@example.com')
          .subject('Test')
          .text('Test')
          .send()
      ).rejects.toThrow();

      expect(mailFake.getSentCount()).toBe(0);
    });
  });
});
```

### Performance Testing

```typescript
describe('Email Performance Tests', () => {
  it('should handle high volume of emails efficiently', async () => {
    const startTime = Date.now();
    const emailCount = 1000;

    const promises = Array.from({ length: emailCount }, (_, index) =>
      mailService
        .to(`user${index}@example.com`)
        .subject(`Test Email ${index}`)
        .text(`This is test email number ${index}`)
        .send()
    );

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(mailFake.getSentCount()).toBe(emailCount);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

    console.log(`Sent ${emailCount} emails in ${duration}ms`);
  });
});
```

## Error Handling Examples

### Robust Error Handling

```typescript
@Injectable()
export class RobustEmailService {
  constructor(private mailService: MailService) {}

  async sendEmailWithRetry(emailData: any, maxAttempts = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.mailService
          .to(emailData.to)
          .subject(emailData.subject)
          .template(emailData.template, emailData.context)
          .send();
        
        return true;
      } catch (error) {
        console.error(`Email attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxAttempts) {
          // Log final failure
          console.error('All email attempts failed:', error);
          return false;
        }
        
        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    return false;
  }

  async sendBulkEmailsWithErrorHandling(emailList: any[]): Promise<{
    successful: number;
    failed: number;
    errors: any[];
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const emailData of emailList) {
      try {
        await this.mailService
          .to(emailData.to)
          .subject(emailData.subject)
          .template(emailData.template, emailData.context)
          .send();
        
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          email: emailData.to,
          error: error.message
        });
      }
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

This comprehensive API reference provides practical examples for every feature of the NestJS Mailable library, making it easy for developers to implement email functionality in their applications.

### MailService

The main service for sending emails.

```typescript
class MailService {
  constructor(
    private configService: MailConfigService,
    private transportFactory: MailTransportFactory,
    private templateEngineFactory: TemplateEngineFactory
  );

  // Send an email
  async send(content: Content): Promise<any>;

  // Get a fluent mail sender
  async to(address: string | Address | Array<string | Address>): Promise<MailSender>;

  // Create a specific mailer instance
  mailer(name: string): MailService;

  // Enable fake mode for testing
  fake(): MailFake;
}
```

#### Methods

**`send(content: Content): Promise<any>`**
- Sends an email with the provided content
- Returns transport-specific response object
- Throws error if sending fails

**`to(address): Promise<MailSender>`**
- Creates a fluent mail sender for the specified address(es)
- Returns a MailSender instance for method chaining

**`mailer(name: string): MailService`**
- Returns a new MailService instance configured for the specified mailer
- Useful for switching between different mail providers

**`fake(): MailFake`**
- Enables testing mode and returns a MailFake instance
- All subsequent sends will be captured instead of actually sent

### Mailable

Abstract base class for creating reusable email templates.

```typescript
abstract class Mailable {
  protected content: Content = {};

  // Template methods
  protected view(template: string, context?: Record<string, any>): this;
  protected with(key: string, value: any): this;
  protected with(data: Record<string, any>): this;

  // Content methods
  protected subject(subject: string): this;
  protected from(address: string, name?: string): this;
  protected replyTo(address: string, name?: string): this;

  // Attachment methods
  protected attach(path: string, options?: AttachmentOptions): this;
  protected attachData(data: Buffer | string, filename: string, options?: AttachmentOptions): this;

  // Metadata methods
  protected header(key: string, value: string): this;
  protected tag(tag: string): this;
  protected metadata(key: string, value: any): this;

  // Abstract method to be implemented by subclasses
  protected abstract build(): Content;

  // Public methods
  public getContent(): Content;
  public render(): Content;
}
```

#### Methods

**Template Methods:**
- `view(template, context?)` - Set the email template and context data
- `with(key, value)` or `with(data)` - Add context data for template rendering

**Content Methods:**
- `subject(subject)` - Set the email subject
- `from(address, name?)` - Set the sender address
- `replyTo(address, name?)` - Set the reply-to address

**Attachment Methods:**
- `attach(path, options?)` - Attach a file from filesystem
- `attachData(data, filename, options?)` - Attach data as a file

**Metadata Methods:**
- `header(key, value)` - Add custom email header
- `tag(tag)` - Add tag for tracking/categorization
- `metadata(key, value)` - Add custom metadata

### MailFake

Testing utility for capturing sent emails instead of actually sending them.

```typescript
class MailFake {
  // Assertion methods
  assertSentCount(count: number): void;
  assertSentCountMin(count: number): void;
  assertSentCountMax(count: number): void;
  assertNothingSent(): void;
  assertSent(callback: (mail: Content) => boolean): void;

  // Data access methods
  getSentMails(): Content[];
  reset(): void;
}
```

#### Methods

**Assertion Methods:**
- `assertSentCount(count)` - Assert exact number of emails sent
- `assertSentCountMin(count)` - Assert minimum number of emails sent
- `assertSentCountMax(count)` - Assert maximum number of emails sent
- `assertNothingSent()` - Assert no emails were sent
- `assertSent(callback)` - Assert that an email matching the callback was sent

**Data Access Methods:**
- `getSentMails()` - Get array of all captured emails
- `reset()` - Clear all captured emails

## Interfaces

### Content

Main interface for email content.

```typescript
interface Content {
  // Recipients
  to: Address | Address[];
  cc?: Address | Address[];
  bcc?: Address | Address[];

  // Sender information
  from?: Address;
  replyTo?: Address;

  // Content
  subject?: string;
  html?: string;
  text?: string;
  template?: string;
  context?: Record<string, any>;

  // Attachments
  attachments?: Attachment[];

  // Metadata
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, any>;
}
```

### Address

Interface for email addresses.

```typescript
interface Address {
  address: string;
  name?: string;
}
```

### Attachment

Interface for email attachments.

```typescript
interface Attachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  size?: number;
}
```

### MailConfiguration

Main configuration interface for the mail module.

```typescript
interface MailConfiguration {
  default: string;
  mailers: Record<string, MailerConfig>;
  from?: Address;
  replyTo?: Address;
  templates?: TemplateConfig;
}
```

### MailerConfig

Configuration for individual mailers.

```typescript
interface MailerConfig {
  transport: TransportType;
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  options?: any;
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
}
```

### TemplateConfig

Configuration for template engines.

```typescript
interface TemplateConfig {
  engine: 'handlebars' | 'ejs' | 'pug' | 'markdown' | 'mjml';
  directory: string;
  options?: {
    partials?: string;
    helpers?: Record<string, Function>;
    [key: string]: any;
  };
}
```

## Transport Interfaces

### MailTransport

Base interface that all transports must implement.

```typescript
interface MailTransport {
  send(content: Content): Promise<any>;
}
```

### Built-in Transports

**SmtpTransport**
```typescript
class SmtpTransport implements MailTransport {
  constructor(options: SmtpOptions);
  async send(content: Content): Promise<SmtpResult>;
  async verify(): Promise<boolean>;
}
```

**SesTransport**
```typescript
class SesTransport implements MailTransport {
  constructor(options: SesOptions);
  async send(content: Content): Promise<SesResult>;
}
```

**MailgunTransport**
```typescript
class MailgunTransport implements MailTransport {
  constructor(options: MailgunOptions);
  async send(content: Content): Promise<MailgunResult>;
}
```

## Type Definitions

### TransportType

```typescript
enum TransportType {
  SMTP = 'smtp',
  SES = 'ses',
  MAILGUN = 'mailgun'
}
```


## Module Configuration Types

### MailModuleOptions

```typescript
interface MailModuleOptions {
  config?: MailConfiguration;
  useFactory?: (...args: any[]) => MailConfiguration | Promise<MailConfiguration>;
  inject?: any[];
  imports?: any[];
  providers?: Provider[];
  exports?: any[];
}
```

### MailModuleAsyncOptions

```typescript
interface MailModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => MailConfiguration | Promise<MailConfiguration>;
  inject?: any[];
  useClass?: Type<MailModuleOptionsFactory>;
  useExisting?: Type<MailModuleOptionsFactory>;
  providers?: Provider[];
  exports?: any[];
}
```

### MailModuleOptionsFactory

```typescript
interface MailModuleOptionsFactory {
  createMailOptions(): MailConfiguration | Promise<MailConfiguration>;
}
```

## Error Classes

### MailError

Base error class for mail-related errors.

```typescript
class MailError extends Error {
  constructor(message: string, public cause?: Error);
}
```

### TransportError

Error thrown by transport implementations.

```typescript
class TransportError extends MailError {
  constructor(message: string, public transport: string, cause?: Error);
}
```

### TemplateError

Error thrown during template rendering.

```typescript
class TemplateError extends MailError {
  constructor(message: string, public template: string, cause?: Error);
}
```

## Utility Functions

### Address Helpers

```typescript
// Convert string to Address object
function parseAddress(address: string): Address;

// Convert Address to string
function formatAddress(address: Address): string;

// Validate email address
function isValidEmail(email: string): boolean;
```

### Template Helpers

```typescript
// Register custom template helper
function registerTemplateHelper(name: string, helper: Function): void;

// Compile template string
function compileTemplate(template: string, engine: string): CompiledTemplate;
```

## Constants

```typescript
// Default configuration values
export const DEFAULT_CONFIG: Partial<MailConfiguration>;

// Supported template engines
export const SUPPORTED_ENGINES: string[];

```

## Decorators

### @InjectMailService

Decorator for injecting MailService into your classes.

```typescript
@Injectable()
export class UserService {
  constructor(@InjectMailService() private mailService: MailService) {}
}
```

### @MailTemplate

Decorator for marking methods as email templates.

```typescript
class EmailTemplates {
  @MailTemplate('welcome')
  static welcomeTemplate(context: any): string {
    return `<h1>Welcome ${context.name}!</h1>`;
  }
}
```

This API reference covers all the main classes, interfaces, and types provided by NestJS Mailer Core. For more detailed examples and usage patterns, refer to the other documentation sections.