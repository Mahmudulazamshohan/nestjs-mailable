---
sidebar_position: 6
---

# Advanced Features

Explore the advanced features and patterns available in NestJS Mailable for complex email scenarios.

## Advanced Mailable Features

### Custom Headers and Metadata

```typescript
import { Mailable, MailableEnvelope, MailableContent, MailableHeaders } from 'nestjs-mailable';

export class OrderConfirmationMail extends Mailable {
  constructor(private order: Order) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: `Order Confirmation #${this.order.id}`,
      tags: ['order', 'confirmation', 'transactional'],
      metadata: {
        orderId: this.order.id,
        customerId: this.order.customerId,
        orderTotal: this.order.total
      }
    };
  }

  headers(): MailableHeaders {
    return {
      'Message-ID': `<order-${this.order.id}@yourapp.com>`,
      'X-Order-ID': this.order.id.toString(),
      'X-Customer-ID': this.order.customerId.toString(),
      'List-Unsubscribe': '<mailto:unsubscribe@yourapp.com>',
      'Return-Path': 'bounces@yourapp.com'
    };
  }

  content(): MailableContent {
    return {
      template: 'emails/order-confirmation',
      with: {
        order: this.order,
        customer: this.order.customer,
        items: this.order.items
      }
    };
  }
}
```

### Multiple Attachments with Builder Pattern

```typescript
import { Mailable, AttachmentBuilder, MailableAttachment } from 'nestjs-mailable';
import * as fs from 'fs';

export class InvoiceEmail extends Mailable {
  constructor(
    private invoice: Invoice,
    private receiptPath: string
  ) {
    super();
  }

  attachments(): MailableAttachment[] {
    return [
      // File attachment
      AttachmentBuilder
        .fromPath(this.receiptPath)
        .as(`invoice-${this.invoice.number}.pdf`)
        .withMime('application/pdf')
        .build(),

      // Data attachment
      AttachmentBuilder
        .fromData(this.generateCSVData(), 'text/csv')
        .as(`order-details-${this.invoice.number}.csv`)
        .build(),

      // Storage attachment  
      AttachmentBuilder
        .fromStorage('./storage/terms-and-conditions.pdf')
        .as('terms-and-conditions.pdf')
        .withMime('application/pdf')
        .build()
    ];
  }

  private generateCSVData(): string {
    const headers = ['Item', 'Quantity', 'Price', 'Total'];
    const rows = this.invoice.items.map(item => 
      [item.name, item.quantity, item.price, item.total].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}
```

## Template Engine Customization

### Advanced Handlebars Configuration

```typescript
import { MailModule, TEMPLATE_ENGINE } from 'nestjs-mailable';

@Module({
  imports: [
    MailModule.forRoot({
      transport: {
        type: TransportType.SMTP,
        // ... transport config
      },
      templates: {
        engine: TEMPLATE_ENGINE.HANDLEBARS,
        directory: './email/templates',
        partials: {
          header: './partials/email-header',
          footer: './partials/email-footer',
          button: './partials/cta-button',
          productList: './partials/product-list'
        },
        options: {
          helpers: {
            // Custom helper functions
            currency: (amount: number, currency = 'USD') => {
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
              }).format(amount);
            },
            
            formatDate: (date: Date, format = 'long') => {
              return new Intl.DateTimeFormat('en-US', {
                dateStyle: format as any
              }).format(date);
            },
            
            ifEquals: function(arg1: any, arg2: any, options: any) {
              return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
            },
            
            times: function(n: number, options: any) {
              let result = '';
              for (let i = 0; i < n; i++) {
                result += options.fn(i);
              }
              return result;
            }
          }
        }
      }
    })
  ]
})
export class MailModule {}
```

### Template Usage with Custom Helpers

```handlebars
{{> header company="Your Company" }}

<div class="email-body">
  <h1>Order Confirmation</h1>
  
  <p>Hi {{customer.name}},</p>
  <p>Your order placed on {{formatDate order.date 'short'}} has been confirmed.</p>
  
  <div class="order-details">
    <h2>Order #{{order.id}}</h2>
    
    {{#each order.items}}
    <div class="item">
      <span>{{name}}</span>
      <span>{{quantity}} × {{currency price}}</span>
      <span>{{currency total}}</span>
    </div>
    {{/each}}
    
    <div class="total">
      <strong>Total: {{currency order.total}}</strong>
    </div>
  </div>
  
  {{#ifEquals order.status 'paid'}}
    {{> button text="View Order" url=order.viewUrl }}
  {{else}}
    {{> button text="Complete Payment" url=order.paymentUrl }}
  {{/ifEquals}}
</div>

{{> footer }}
```

## Testing Email Functionality

### Using MailFake for Testing

```typescript
import { Test } from '@nestjs/testing';
import { MailService } from 'nestjs-mailable';

describe('OrderService', () => {
  let mailService: MailService;
  let orderService: OrderService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrderService, MailService],
    }).compile();

    mailService = module.get<MailService>(MailService);
    orderService = module.get<OrderService>(OrderService);
    
    // Enable fake mode for testing
    const mailFake = mailService.fake();
  });

  it('should send order confirmation email', async () => {
    const mailFake = mailService.fake();
    const order = { id: 123, customer: { email: 'test@example.com' } };
    
    await orderService.confirmOrder(order);
    
    // Assert email was sent
    const sentMails = mailFake.getSentMails();
    expect(sentMails).toHaveLength(1);
    
    const sentEmail = sentMails[0];
    expect(sentEmail.to).toBe('test@example.com');
    expect(sentEmail.subject).toContain('Order Confirmation');
  });

  it('should track sent emails in fake mode', async () => {
    const mailFake = mailService.fake();
    const order = { id: 123, customer: { email: 'test@example.com' } };
    
    await orderService.confirmOrder(order);
    
    // Verify emails are tracked in fake mode
    mailFake.assertSentCount(1);
    mailFake.assertSent((mail) => mail.to === 'test@example.com');
  });
});
```

### Testing Mailable Classes

```typescript
import { OrderConfirmationMail } from './order-confirmation.mailable';

describe('OrderConfirmationMail', () => {
  let mailable: OrderConfirmationMail;
  let mockOrder: Order;

  beforeEach(() => {
    mockOrder = {
      id: 12345,
      customerId: 1,
      customer: { name: 'John Doe', email: 'john@example.com' },
      items: [
        { name: 'Widget', quantity: 2, price: 10.99, total: 21.98 }
      ],
      total: 21.98,
      date: new Date('2024-01-15')
    };
    
    mailable = new OrderConfirmationMail(mockOrder);
  });

  it('should generate correct envelope', () => {
    const envelope = mailable.envelope();
    
    expect(envelope.subject).toBe('Order Confirmation #12345');
    expect(envelope.tags).toContain('order');
    expect(envelope.tags).toContain('confirmation');
    expect(envelope.metadata?.orderId).toBe(12345);
  });

  it('should generate correct headers', () => {
    const headers = mailable.headers();
    
    expect(headers['Message-ID']).toBe('<order-12345@yourapp.com>');
    expect(headers['X-Order-ID']).toBe('12345');
    expect(headers['X-Customer-ID']).toBe('1');
  });

  it('should provide correct template data', () => {
    const content = mailable.content();
    
    expect(content.template).toBe('emails/order-confirmation');
    expect(content.with?.order).toEqual(mockOrder);
    expect(content.with?.customer).toEqual(mockOrder.customer);
  });
});
```

## Transport-Specific Features

### SES-Specific Configuration

```typescript
import { MailModule, TransportType } from 'nestjs-mailable';

@Module({
  imports: [
    MailModule.forRoot({
      transport: {
        type: TransportType.SES,
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        },
        // SES-specific endpoint for LocalStack testing
        endpoint: process.env.NODE_ENV === 'test' ? 'http://localhost:4566' : undefined
      },
      from: {
        address: 'noreply@yourdomain.com',
        name: 'Your App'
      }
    })
  ]
})
export class AppModule {}
```

### Mailgun-Specific Features

```typescript
// Using Mailgun with custom domain and mock server support
MailModule.forRoot({
  transport: {
    type: TransportType.MAILGUN,
    options: {
      domain: 'mg.yourdomain.com',
      apiKey: process.env.MAILGUN_API_KEY!,
      // For development/testing with mock server
      host: process.env.NODE_ENV === 'development' ? 'localhost:3001' : undefined,
      protocol: process.env.NODE_ENV === 'development' ? 'http:' : undefined
    }
  }
})
```

## Error Handling and Resilience

### Graceful Error Handling

```typescript
@Injectable()
export class NotificationService {
  constructor(private mailService: MailService) {}

  async sendWelcomeEmail(user: User): Promise<void> {
    try {
      await this.mailService
        .to(user.email)
        .send(new WelcomeEmail(user));
        
      console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error(`Failed to send welcome email to ${user.email}:`, error.message);
      
      // Log error for monitoring
      this.logEmailError(user.email, 'welcome', error);
      
      // Don't throw - email failure shouldn't break user registration
      // Instead, queue for retry or use fallback notification method
      await this.queueEmailRetry(user.email, 'welcome', user);
    }
  }

  private async logEmailError(email: string, type: string, error: Error): Promise<void> {
    // Log to your monitoring service
    console.error({
      event: 'email_send_failed',
      email,
      type,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  private async queueEmailRetry(email: string, type: string, data: any): Promise<void> {
    // Queue for retry with exponential backoff
    // This could use Bull, Bee, or any job queue system
  }
}
```

### Template Engine Fallbacks

```typescript
@Injectable()
export class EmailService {
  constructor(private mailService: MailService) {}

  async sendWithFallback(user: User): Promise<void> {
    try {
      // Try to send with template
      await this.mailService
        .to(user.email)
        .template('welcome', { user })
        .send();
    } catch (templateError) {
      console.warn('Template rendering failed, falling back to HTML:', templateError.message);
      
      // Fallback to simple HTML
      await this.mailService
        .to(user.email)
        .subject('Welcome!')
        .html(`<h1>Welcome ${user.name}!</h1><p>Thanks for joining us.</p>`)
        .send();
    }
  }
}
```

This documentation now focuses specifically on features that are actually available in the nestjs-mailable library, including advanced Mailable class usage, template customization, testing utilities, transport-specific configurations, and practical error handling patterns.