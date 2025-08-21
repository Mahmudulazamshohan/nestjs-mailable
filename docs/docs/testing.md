---
sidebar_position: 6
---

# Testing

Test your emails easily with the built-in fake mailer. No emails are actually sent during testing.

## Basic Testing

Use `mailService.fake()` to capture emails instead of sending them:

```typescript
import { Test } from '@nestjs/testing';
import { MailService } from 'nestjs-mailable';

describe('EmailService', () => {
  let mailService: MailService;
  let mailFake: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      // your module setup
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailFake = mailService.fake();
  });

  it('should send welcome email', async () => {
    // Send email
    await mailService.send({
      to: 'user@example.com',
      subject: 'Welcome!',
      html: '<p>Welcome to our app!</p>'
    });

    // Check it was sent
    expect(mailFake.getSentMails()).toHaveLength(1);
    
    const sentEmail = mailFake.getSentMails()[0];
    expect(sentEmail.to).toBe('user@example.com');
    expect(sentEmail.subject).toBe('Welcome!');
  });
});
```

## Fake Mailer Methods

### getSentMails()
Get all emails that were "sent":

```typescript
it('should send multiple emails', async () => {
  await mailService.send({ to: 'user1@example.com', subject: 'Hello' });
  await mailService.send({ to: 'user2@example.com', subject: 'Hi' });

  const sentEmails = mailFake.getSentMails();
  expect(sentEmails).toHaveLength(2);
  expect(sentEmails[0].to).toBe('user1@example.com');
  expect(sentEmails[1].to).toBe('user2@example.com');
});
```

### assertSentCount()
Check exact number of emails sent:

```typescript
it('should send correct number of emails', async () => {
  await mailService.send({ to: 'user@example.com', subject: 'Test' });
  
  mailFake.assertSentCount(1);  // Passes
  mailFake.assertSentCount(2);  // Throws error
});
```

### assertSent()
Check that at least one email was sent, optionally with conditions:

```typescript
it('should send email with correct content', async () => {
  await mailService.send({
    to: 'user@example.com',
    subject: 'Welcome!',
    tags: ['welcome']
  });

  // Check any email was sent
  mailFake.assertSent();

  // Check email with condition
  mailFake.assertSent((mail) => {
    return mail.to === 'user@example.com' && 
           mail.subject === 'Welcome!';
  });

  // Check email has specific tag
  mailFake.assertSent((mail) => {
    return mail.tags?.includes('welcome');
  });
});
```

## Testing Different Email Types

### Direct Content
```typescript
it('should send HTML email', async () => {
  await mailService.send({
    to: 'user@example.com',
    subject: 'HTML Email',
    html: '<h1>Hello World</h1>'
  });

  mailFake.assertSent((mail) => {
    return mail.html?.includes('<h1>Hello World</h1>');
  });
});
```

### Template Emails
```typescript
it('should send template email', async () => {
  await mailService.send({
    to: 'user@example.com',
    subject: 'Template Email',
    template: 'welcome',
    context: { name: 'John' }
  });

  mailFake.assertSent((mail) => {
    return mail.template === 'welcome' &&
           mail.context?.name === 'John';
  });
});
```

### Fluent API
```typescript
it('should send email with fluent API', async () => {
  await mailService
    .to('user@example.com')
    .cc('manager@example.com')
    .bcc('admin@example.com')
    .send({
      subject: 'Fluent Email',
      html: '<p>Test email</p>'
    });

  mailFake.assertSent((mail) => {
    return mail.to === 'user@example.com' &&
           mail.cc === 'manager@example.com' &&
           mail.bcc === 'admin@example.com';
  });
});
```

## Testing Mailable Classes

```typescript
import { WelcomeEmail } from './welcome-email';

describe('WelcomeEmail', () => {
  it('should send welcome email using Mailable', async () => {
    const user = { name: 'John', email: 'john@example.com' };
    
    await mailService.to(user.email).send(new WelcomeEmail(user));

    mailFake.assertSent((mail) => {
      return mail.subject?.includes('Welcome John!') &&
             mail.template === 'emails/welcome';
    });
  });

  it('should include correct template data', async () => {
    const user = { name: 'Jane', email: 'jane@example.com' };
    
    await mailService.to(user.email).send(new WelcomeEmail(user));

    const sentEmail = mailFake.getSentMails()[0];
    expect(sentEmail.context?.user).toEqual(user);
    expect(sentEmail.context?.appName).toBe('My App');
  });
});
```

## Testing Email Properties

### Check Recipients
```typescript
it('should send to multiple recipients', async () => {
  await mailService.send({
    to: ['user1@example.com', 'user2@example.com'],
    subject: 'Bulk Email'
  });

  mailFake.assertSent((mail) => {
    return Array.isArray(mail.to) && mail.to.length === 2;
  });
});
```

### Check Attachments
```typescript
it('should include attachments', async () => {
  await mailService.send({
    to: 'user@example.com',
    subject: 'Email with Attachment',
    attachments: [
      { filename: 'test.pdf', path: './test.pdf' }
    ]
  });

  mailFake.assertSent((mail) => {
    return mail.attachments?.length === 1 &&
           mail.attachments[0].filename === 'test.pdf';
  });
});
```

### Check Headers and Metadata
```typescript
it('should include custom headers and tags', async () => {
  await mailService.send({
    to: 'user@example.com',
    subject: 'Tagged Email',
    headers: { 'X-Priority': '1' },
    tags: ['important', 'urgent'],
    metadata: { userId: '123' }
  });

  mailFake.assertSent((mail) => {
    return mail.headers?.['X-Priority'] === '1' &&
           mail.tags?.includes('important') &&
           mail.metadata?.userId === '123';
  });
});
```

## Complete Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MailModule, MailService, TransportType } from 'nestjs-mailable';

describe('Email Integration Tests', () => {
  let module: TestingModule;
  let mailService: MailService;
  let mailFake: any;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MailModule.forRoot({
          transport: {
            type: TransportType.SMTP,
            host: 'localhost',
            port: 1025
          },
          from: {
            address: 'test@example.com',
            name: 'Test App'
          }
        })
      ]
    }).compile();

    mailService = module.get<MailService>(MailService);
    mailFake = mailService.fake();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('User Registration', () => {
    it('should send welcome email after registration', async () => {
      const user = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      // Simulate user registration
      await mailService.send({
        to: user.email,
        subject: `Welcome ${user.name}!`,
        template: 'welcome',
        context: { user },
        tags: ['registration', 'welcome']
      });

      // Assert email was sent
      mailFake.assertSentCount(1);
      
      mailFake.assertSent((mail) => {
        return mail.to === user.email &&
               mail.subject === `Welcome ${user.name}!` &&
               mail.template === 'welcome' &&
               mail.context?.user === user &&
               mail.tags?.includes('registration');
      });
    });
  });

  describe('Order Confirmation', () => {
    it('should send order confirmation with receipt', async () => {
      const order = {
        id: 'ORDER-123',
        total: 99.99,
        items: [{ name: 'Product 1', price: 99.99 }]
      };

      await mailService.send({
        to: 'customer@example.com',
        subject: `Order Confirmation #${order.id}`,
        template: 'order-confirmation',
        context: { order },
        tags: ['order', 'confirmation'],
        attachments: [
          { filename: 'receipt.pdf', path: './receipts/receipt.pdf' }
        ]
      });

      mailFake.assertSentCount(1);
      
      const sentEmail = mailFake.getSentMails()[0];
      expect(sentEmail.subject).toBe('Order Confirmation #ORDER-123');
      expect(sentEmail.context?.order).toEqual(order);
      expect(sentEmail.attachments).toHaveLength(1);
      expect(sentEmail.attachments[0].filename).toBe('receipt.pdf');
    });
  });

  describe('Bulk Emails', () => {
    it('should send newsletter to multiple subscribers', async () => {
      const subscribers = [
        { email: 'user1@example.com', name: 'User 1' },
        { email: 'user2@example.com', name: 'User 2' },
        { email: 'user3@example.com', name: 'User 3' }
      ];

      // Send newsletter to all subscribers
      for (const subscriber of subscribers) {
        await mailService.send({
          to: subscriber.email,
          subject: 'Weekly Newsletter',
          template: 'newsletter',
          context: { subscriber },
          tags: ['newsletter', 'weekly']
        });
      }

      mailFake.assertSentCount(3);

      // Check each email was sent correctly
      const sentEmails = mailFake.getSentMails();
      subscribers.forEach((subscriber, index) => {
        expect(sentEmails[index].to).toBe(subscriber.email);
        expect(sentEmails[index].subject).toBe('Weekly Newsletter');
        expect(sentEmails[index].context?.subscriber).toEqual(subscriber);
      });
    });
  });

  describe('Error Cases', () => {
    it('should handle missing template gracefully', async () => {
      await expect(
        mailService.send({
          to: 'user@example.com',
          subject: 'Test',
          template: 'nonexistent-template',
          context: {}
        })
      ).rejects.toThrow();

      // No emails should be sent if there's an error
      mailFake.assertSentCount(0);
    });
  });
});
```

## Testing Tips

### 1. Reset Between Tests
The fake mailer keeps all sent emails until you get a new fake instance:

```typescript
beforeEach(() => {
  mailFake = mailService.fake();  // Fresh fake for each test
});
```

### 2. Test Email Content, Not Templates
Focus on testing the data passed to templates, not template rendering:

```typescript
// Good
mailFake.assertSent((mail) => {
  return mail.context?.userName === 'John';
});

// Avoid testing rendered HTML (that's the template engine's job)
```

### 3. Use Specific Assertions
Be specific about what you're testing:

```typescript
// Good - specific assertion
mailFake.assertSent((mail) => {
  return mail.to === 'user@example.com' &&
         mail.tags?.includes('welcome');
});

// Avoid - too general
mailFake.assertSent();
```

### 4. Test Different Scenarios
Test both success and error cases:

```typescript
describe('Password Reset', () => {
  it('should send reset email for valid user', async () => {
    // Test success case
  });

  it('should not send email for invalid user', async () => {
    // Test error case
  });
});
```

The fake mailer makes it easy to test your email functionality without actually sending emails or needing external services.