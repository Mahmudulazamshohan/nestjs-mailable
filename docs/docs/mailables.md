---
sidebar_position: 4
---

# Mailable Classes

Create reusable email classes with clean, organized structure. Mailable classes help you build complex emails with attachments, custom headers, and dynamic content.

## Basic Mailable

```typescript
import { 
  Mailable, 
  MailableEnvelope, 
  MailableContent 
} from 'nestjs-mailable';

export class WelcomeEmail extends Mailable {
  constructor(private user: any) {
    super();
  }

  // Define subject, tags, metadata
  envelope(): MailableEnvelope {
    return {
      subject: `Welcome ${this.user.name}!`,
      tags: ['welcome', 'onboarding']
    };
  }

  // Define template and data
  content(): MailableContent {
    return {
      template: 'emails/welcome',
      with: { 
        user: this.user,
        appName: 'My App'
      }
    };
  }
}

// Usage - must specify recipient
await this.mailService.to(user.email).send(new WelcomeEmail(user));
```

## Mailable Structure

Every mailable has four methods you can use:

### 1. envelope() - Required
Define subject, tags, and metadata:

```typescript
envelope(): MailableEnvelope {
  return {
    subject: 'Your email subject',
    tags: ['tag1', 'tag2'],           // for tracking
    metadata: { userId: '123' }       // custom data
  };
}
```

### 2. content() - Required
Define what goes in the email:

```typescript
// Template with data
content(): MailableContent {
  return {
    template: 'emails/welcome',
    with: { name: 'John', date: new Date() }
  };
}

// HTML content
content(): MailableContent {
  return {
    html: '<h1>Hello World</h1><p>Welcome!</p>'
  };
}

// Text content
content(): MailableContent {
  return {
    text: 'Hello World\nWelcome!'
  };
}

// Markdown content
content(): MailableContent {
  return {
    markdown: '# Hello World\n\nWelcome to **our app**!'
  };
}
```

### 3. attachments() - Optional
Add files to the email:

```typescript
import { AttachmentBuilder } from 'nestjs-mailable';

attachments(): MailableAttachment[] {
  return [
    // File from path
    AttachmentBuilder
      .fromPath('./files/guide.pdf')
      .as('welcome-guide.pdf')
      .build(),

    // Generated data
    AttachmentBuilder
      .fromData(() => this.generateReport(), 'report.csv')
      .withMime('text/csv')
      .build(),

    // File from storage
    AttachmentBuilder
      .fromStorage('uploads/logo.png')
      .as('company-logo.png')
      .build()
  ];
}
```

### 4. headers() - Optional
Add custom email headers:

```typescript
headers(): MailableHeaders {
  return {
    messageId: `welcome-${this.user.id}@myapp.com`,
    references: ['parent-email@myapp.com'],
    text: {
      'X-Priority': '1',
      'X-Custom-Header': 'custom-value'
    }
  };
}
```

## Complete Example

```typescript
export class OrderConfirmation extends Mailable {
  constructor(
    private order: any,
    private customer: any
  ) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: `Order Confirmation #${this.order.id}`,
      tags: ['order', 'confirmation'],
      metadata: {
        orderId: this.order.id,
        customerId: this.customer.id,
        total: this.order.total
      }
    };
  }

  content(): MailableContent {
    return {
      template: 'emails/order-confirmation',
      with: {
        customerName: this.customer.name,
        orderNumber: this.order.id,
        items: this.order.items,
        total: this.order.total,
        trackingUrl: `https://mystore.com/track/${this.order.id}`
      }
    };
  }

  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder
        .fromPath(`./receipts/${this.order.id}.pdf`)
        .as(`receipt-${this.order.id}.pdf`)
        .withMime('application/pdf')
        .build()
    ];
  }

  headers(): MailableHeaders {
    return {
      messageId: `order-${this.order.id}@mystore.com`,
      text: {
        'X-Order-ID': this.order.id.toString()
      }
    };
  }
}

// Usage
await this.mailService
  .to(customer.email)
  .send(new OrderConfirmation(order, customer));
```

## More Examples

### Password Reset Email
```typescript
export class PasswordResetEmail extends Mailable {
  constructor(
    private user: any,
    private resetToken: string
  ) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: 'Reset Your Password',
      tags: ['password-reset', 'security']
    };
  }

  content(): MailableContent {
    return {
      template: 'emails/password-reset',
      with: {
        userName: this.user.name,
        resetUrl: `https://myapp.com/reset?token=${this.resetToken}`,
        expiresIn: '1 hour'
      }
    };
  }

  headers(): MailableHeaders {
    return {
      text: {
        'X-Priority': '1'  // High priority
      }
    };
  }
}
```

### Newsletter Email
```typescript
export class NewsletterEmail extends Mailable {
  constructor(
    private subscriber: any,
    private articles: any[]
  ) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: 'Weekly Newsletter',
      tags: ['newsletter', 'weekly'],
      metadata: {
        subscriberId: this.subscriber.id,
        articleCount: this.articles.length
      }
    };
  }

  content(): MailableContent {
    return {
      template: 'emails/newsletter',
      with: {
        subscriberName: this.subscriber.name,
        articles: this.articles,
        unsubscribeUrl: `https://myapp.com/unsubscribe/${this.subscriber.token}`
      }
    };
  }

  headers(): MailableHeaders {
    return {
      text: {
        'List-Unsubscribe': `<https://myapp.com/unsubscribe/${this.subscriber.token}>`
      }
    };
  }
}
```

## Attachment Types

### File Attachments
```typescript
// PDF from file system
AttachmentBuilder
  .fromPath('./documents/manual.pdf')
  .as('user-manual.pdf')
  .withMime('application/pdf')
  .build()

// Image from file system
AttachmentBuilder
  .fromPath('./images/logo.png')
  .as('company-logo.png')
  .build()
```

### Data Attachments
```typescript
// Generated CSV data
AttachmentBuilder
  .fromData(() => this.generateCsvReport(), 'report.csv')
  .withMime('text/csv')
  .build()

// JSON data
AttachmentBuilder
  .fromData(() => JSON.stringify(this.data, null, 2), 'data.json')
  .withMime('application/json')
  .build()

// PDF from buffer
AttachmentBuilder
  .fromData(() => this.generatePdfBuffer(), 'invoice.pdf')
  .withMime('application/pdf')
  .build()
```

### Storage Attachments
```typescript
// File from storage directory (relative to storage/)
AttachmentBuilder
  .fromStorage('uploads/user-avatar.jpg')
  .as('avatar.jpg')
  .build()
```

## Dynamic Content

Create emails that change based on data:

```typescript
export class ConditionalEmail extends Mailable {
  constructor(
    private user: any,
    private isPremium: boolean
  ) {
    super();
  }

  envelope(): MailableEnvelope {
    const subject = this.isPremium
      ? `Premium Member - Welcome ${this.user.name}!`
      : `Welcome ${this.user.name}!`;

    return {
      subject,
      tags: this.isPremium ? ['welcome', 'premium'] : ['welcome', 'basic']
    };
  }

  content(): MailableContent {
    const template = this.isPremium 
      ? 'emails/welcome-premium'
      : 'emails/welcome-basic';

    return {
      template,
      with: {
        user: this.user,
        isPremium: this.isPremium,
        benefits: this.isPremium ? this.getPremiumBenefits() : []
      }
    };
  }

  private getPremiumBenefits() {
    return ['Priority Support', 'Advanced Features', 'Early Access'];
  }
}
```

## Using in Services

```typescript
@Injectable()
export class EmailService {
  constructor(private mailService: MailService) {}

  async sendWelcome(user: any) {
    await this.mailService
      .to(user.email)
      .send(new WelcomeEmail(user));
  }

  async sendOrderConfirmation(order: any, customer: any) {
    await this.mailService
      .to(customer.email)
      .cc('orders@mystore.com')
      .send(new OrderConfirmation(order, customer));
  }

  async sendBulkNewsletter(subscribers: any[], articles: any[]) {
    for (const subscriber of subscribers) {
      await this.mailService
        .to(subscriber.email)
        .send(new NewsletterEmail(subscriber, articles));
    }
  }
}
```

## Testing Mailables

Test your mailable classes easily:

```typescript
describe('WelcomeEmail', () => {
  it('should build correct content', async () => {
    const user = { name: 'John', email: 'john@example.com' };
    const email = new WelcomeEmail(user);
    
    const content = await email.build();

    expect(content.subject).toBe('Welcome John!');
    expect(content.template).toBe('emails/welcome');
    expect(content.context.user).toBe(user);
    expect(content.tags).toContain('welcome');
  });

  it('should include attachments', async () => {
    const user = { name: 'John', email: 'john@example.com' };
    const email = new WelcomeEmail(user);
    
    const content = await email.build();

    expect(content.attachments).toHaveLength(1);
    expect(content.attachments[0].filename).toBe('welcome-guide.pdf');
  });
});
```

## Error Handling

Handle errors when sending mailables:

```typescript
@Injectable()
export class EmailService {
  constructor(private mailService: MailService) {}

  async sendEmailSafely(user: any) {
    try {
      await this.mailService
        .to(user.email)
        .send(new WelcomeEmail(user));
      
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error.message);
      // Log error, retry, or notify admin
    }
  }
}
```

Mailable classes keep your email logic organized and make emails easy to test and reuse throughout your application.