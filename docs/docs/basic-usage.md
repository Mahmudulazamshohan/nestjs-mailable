---
sidebar_position: 3
---

# Basic Usage

Learn the three ways to send emails with NestJS Mailable, from simple to advanced.

## Method 1: Direct Content

Send emails directly with content objects. Perfect for simple emails.

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from 'nestjs-mailable';

@Injectable()
export class EmailService {
  constructor(private mailService: MailService) {}

  // Simple HTML email
  async sendSimple() {
    await this.mailService.send({
      to: 'user@example.com',
      subject: 'Hello World',
      html: '<h1>Hello!</h1><p>This is a test email.</p>'
    });
  }

  // Email with multiple recipients
  async sendToMany() {
    await this.mailService.send({
      to: ['user1@example.com', 'user2@example.com'],
      cc: 'manager@example.com',
      bcc: 'admin@example.com',
      subject: 'Team Update',
      html: '<p>Here is the team update...</p>'
    });
  }

  // Email with template
  async sendWithTemplate() {
    await this.mailService.send({
      to: 'user@example.com',
      subject: 'Welcome!',
      template: 'welcome',
      context: {
        name: 'John Doe',
        appName: 'My App'
      }
    });
  }
}
```

### Content Options

```typescript
interface Content {
  // Recipients
  to?: string | Address | Array<string | Address>;
  cc?: string | Address | Array<string | Address>;
  bcc?: string | Address | Array<string | Address>;
  
  // Sender (optional, uses global config if not set)
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

## Method 2: Fluent API

Chain methods to build emails step by step. Great for dynamic emails.

```typescript
@Injectable()
export class EmailService {
  constructor(private mailService: MailService) {}

  // Basic fluent email
  async sendFluent() {
    await this.mailService
      .to('user@example.com')
      .send({
        subject: 'Hello',
        html: '<p>Hello World!</p>'
      });
  }

  // Complex fluent email
  async sendComplexFluent(user: any, manager: any) {
    await this.mailService
      .to({ address: user.email, name: user.name })
      .cc(manager.email)
      .bcc('audit@company.com')
      .send({
        subject: `Welcome ${user.name}!`,
        template: 'onboarding',
        context: {
          user: user,
          manager: manager,
          startDate: new Date()
        }
      });
  }

  // Send to multiple people individually
  async sendToMultiple(users: any[]) {
    for (const user of users) {
      await this.mailService
        .to(user.email)
        .send({
          subject: `Personal message for ${user.name}`,
          template: 'personal',
          context: { user }
        });
    }
  }
}
```

### Available Chain Methods

```typescript
// Set recipients
.to(address)         // Main recipient(s)
.cc(address)         // Carbon copy
.bcc(address)        // Blind carbon copy

// Send the email
.send(content)       // Send with content or Mailable
```

### Address Formats

```typescript
// String
.to('user@example.com')

// Address object  
.to({ address: 'user@example.com', name: 'John Doe' })

// Array of strings
.to(['user1@example.com', 'user2@example.com'])

// Array of Address objects
.to([
  { address: 'user1@example.com', name: 'User One' },
  { address: 'user2@example.com', name: 'User Two' }
])
```

## Method 3: Mailable Classes

Create reusable email classes. Perfect for complex emails used in multiple places.

### Legacy Mailable (Simple)

```typescript
import { Mailable } from 'nestjs-mailable';

export class WelcomeEmail extends Mailable {
  constructor(
    private user: { name: string; email: string },
    private company: string
  ) {
    super();
  }

  build() {
    return this
      .subject(`Welcome to ${this.company}, ${this.user.name}!`)
      .view('emails/welcome', {
        userName: this.user.name,
        companyName: this.company
      })
      .tag('welcome')
      .tag('onboarding')
      .metadata('userId', this.user.email);
  }
}

// Usage
@Injectable()
export class UserService {
  constructor(private mailService: MailService) {}

  async welcomeNewUser(user: any) {
    const welcomeEmail = new WelcomeEmail(user, 'Acme Corp');
    await this.mailService.send(welcomeEmail);
  }
}
```

### Advanced Mailable (Laravel-style)

```typescript
import { 
  Mailable as AdvancedMailable, 
  MailableEnvelope, 
  MailableContent,
  MailableAttachment,
  AttachmentBuilder 
} from 'nestjs-mailable';

export class OrderConfirmation extends AdvancedMailable {
  constructor(private order: any) {
    super();
  }

  envelope(): MailableEnvelope {
    return {
      subject: `Order Confirmation #${this.order.id}`,
      tags: ['order', 'confirmation'],
      metadata: { 
        orderId: this.order.id,
        customerId: this.order.customerId 
      }
    };
  }

  content(): MailableContent {
    return {
      template: 'emails/order-confirmation',
      with: {
        order: this.order,
        customer: this.order.customer,
        total: this.order.total
      }
    };
  }

  attachments(): MailableAttachment[] {
    return [
      AttachmentBuilder
        .fromPath('./receipts/receipt.pdf')
        .as(`receipt-${this.order.id}.pdf`)
        .build()
    ];
  }
}

// Usage
await this.mailService
  .to(order.customer.email)
  .send(new OrderConfirmation(order));
```

## Attachments

### Direct Content Attachments

```typescript
await this.mailService.send({
  to: 'user@example.com',
  subject: 'Files attached',
  html: '<p>Please find files attached.</p>',
  attachments: [
    {
      filename: 'report.pdf',
      path: './files/report.pdf'
    },
    {
      filename: 'data.csv',
      content: Buffer.from('name,email\nJohn,john@example.com'),
      contentType: 'text/csv'
    }
  ]
});
```

### Legacy Mailable Attachments

```typescript
export class ReportEmail extends Mailable {
  constructor(private reportData: string) {
    super();
  }

  build() {
    return this
      .subject('Monthly Report')
      .view('reports/monthly')
      .attach('./reports/monthly.pdf')
      .attachData(Buffer.from(this.reportData), 'data.csv', {
        contentType: 'text/csv'
      });
  }
}
```

### Advanced Mailable Attachments

```typescript
export class InvoiceEmail extends AdvancedMailable {
  constructor(private invoice: any) {
    super();
  }

  attachments(): MailableAttachment[] {
    return [
      // File attachment
      AttachmentBuilder
        .fromPath(`./invoices/${this.invoice.id}.pdf`)
        .as(`invoice-${this.invoice.number}.pdf`)
        .withMime('application/pdf')
        .build(),
      
      // Data attachment
      AttachmentBuilder
        .fromData(() => this.generateCsvData(), 'details.csv')
        .withMime('text/csv')
        .build(),
      
      // Storage attachment
      AttachmentBuilder
        .fromStorage(`logos/company-logo.png`)
        .as('logo.png')
        .build()
    ];
  }

  private generateCsvData(): string {
    return 'item,price\nService,100.00';
  }
}
```

## Headers and Metadata

### Custom Headers

```typescript
await this.mailService.send({
  to: 'user@example.com',
  subject: 'Custom Headers',
  html: '<p>Email with custom headers</p>',
  headers: {
    'X-Priority': '1',
    'X-Mailer': 'My App'
  }
});
```

### Tags (for tracking)

```typescript
await this.mailService.send({
  to: 'user@example.com',
  subject: 'Newsletter',
  html: '<p>Monthly newsletter</p>',
  tags: ['newsletter', 'monthly', 'marketing']
});
```

### Metadata (for analytics)

```typescript
await this.mailService.send({
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<p>Welcome!</p>',
  metadata: {
    userId: '123',
    campaign: 'welcome-series',
    version: 'A'
  }
});
```

## Error Handling

```typescript
@Injectable()
export class EmailService {
  constructor(private mailService: MailService) {}

  async sendWithErrorHandling() {
    try {
      await this.mailService.send({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test message</p>'
      });
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error.message);
      // Handle error - retry, log, notify admin, etc.
    }
  }

  async sendBulkWithErrorHandling(users: any[]) {
    const results = [];
    
    for (const user of users) {
      try {
        await this.mailService.to(user.email).send({
          subject: 'Bulk Email',
          template: 'bulk',
          context: { user }
        });
        results.push({ user: user.email, status: 'sent' });
      } catch (error) {
        results.push({ user: user.email, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }
}
```

## Best Practices

### 1. Use Templates for Reusable Content
```typescript
// Good: Use templates
await this.mailService.send({
  template: 'welcome',
  context: { name: user.name }
});

// Avoid: Hardcoded HTML
await this.mailService.send({
  html: '<h1>Welcome John!</h1>' // Hard to maintain
});
```

### 2. Use Mailable Classes for Complex Emails
```typescript
// Good: Organized in classes
export class OrderConfirmation extends AdvancedMailable {
  // Logic here
}

// Avoid: Complex inline content
await this.mailService.send({
  /* lots of complex content here */
});
```

### 3. Handle Errors Gracefully
```typescript
// Good: Handle errors
try {
  await this.mailService.send(email);
} catch (error) {
  this.logger.error('Email failed', error);
}

// Avoid: Unhandled errors
await this.mailService.send(email); // Might crash app
```

### 4. Use Tags for Analytics
```typescript
// Good: Trackable emails
await this.mailService.send({
  // ... content
  tags: ['newsletter', 'december-2023']
});
```

This covers all the basic usage patterns. Next, check out [Mailable Classes](./mailables) for more advanced patterns and [Templates](./templates) for template engine usage.