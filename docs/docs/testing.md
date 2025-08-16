---
sidebar_position: 4
---

# Testing

Learn how to effectively test your email functionality with NestJS Mailable's built-in testing utilities.

## MailFake - Testing Made Easy

MailFake allows you to test email functionality without actually sending emails, providing comprehensive testing utilities for email workflows.

### Basic Testing Setup

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from 'nestjs-mailable';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, MailService],
    }).compile();

    userService = module.get<UserService>(UserService);
    mailService = module.get<MailService>(MailService);
  });

  it('should send welcome email after registration', async () => {
    // Enable fake mode
    const fake = mailService.fake();

    // Perform action that sends email
    await userService.registerUser({
      name: 'John Doe',
      email: 'john@example.com'
    });

    // Assert email was sent
    fake.assertSentCount(1);
    fake.assertSent((mail) => mail.subject === 'Welcome John Doe!');
    fake.assertSent((mail) => mail.to.address === 'john@example.com');
  });
});
```

## MailFake Assertions

### Count Assertions

```typescript
it('should send multiple emails', async () => {
  const fake = mailService.fake();

  await userService.sendBulkEmails(['user1@example.com', 'user2@example.com']);

  // Assert specific count
  fake.assertSentCount(2);

  // Assert minimum count
  fake.assertSentCountMin(1);

  // Assert maximum count
  fake.assertSentCountMax(5);

  // Assert no emails sent
  fake.assertNothingSent();
});
```

### Content Assertions

```typescript
it('should send email with correct content', async () => {
  const fake = mailService.fake();

  await userService.sendOrderConfirmation(order);

  // Assert by subject
  fake.assertSent((mail) => mail.subject.includes('Order Confirmation'));

  // Assert by recipient
  fake.assertSent((mail) => mail.to.address === 'customer@example.com');

  // Assert by content
  fake.assertSent((mail) => mail.html?.includes('Thank you for your order'));

  // Assert by tags
  fake.assertSent((mail) => mail.tags?.includes('order'));

  // Assert by metadata
  fake.assertSent((mail) => mail.metadata?.order_id === order.id);
});
```

### Complex Assertions

```typescript
it('should send personalized welcome email', async () => {
  const fake = mailService.fake();
  const user = { name: 'Jane Smith', email: 'jane@example.com', vip: true };

  await userService.sendWelcomeEmail(user);

  fake.assertSent((mail) => {
    return mail.subject === 'Welcome Jane Smith!' &&
           mail.to.address === 'jane@example.com' &&
           mail.tags?.includes('vip') &&
           mail.metadata?.user_type === 'premium';
  });
});
```

## Testing Mailable Classes

### Unit Testing Mailables

```typescript
import { WelcomeMail } from './welcome.mail';

describe('WelcomeMail', () => {
  it('should build welcome email correctly', () => {
    const user = { name: 'John Doe', email: 'john@example.com' };
    const welcomeMail = new WelcomeMail(user);
    const content = welcomeMail.render();

    expect(content.subject).toBe('Welcome John Doe!');
    expect(content.from?.address).toBe('welcome@yourapp.com');
    expect(content.template).toBe('emails/welcome');
    expect(content.context?.userName).toBe('John Doe');
    expect(content.tags).toContain('welcome');
    expect(content.tags).toContain('onboarding');
  });

  it('should include correct metadata', () => {
    const user = { name: 'John Doe', email: 'john@example.com', id: 123 };
    const welcomeMail = new WelcomeMail(user);
    const content = welcomeMail.render();

    expect(content.metadata?.user_id).toBe(123);
    expect(content.metadata?.email_type).toBe('welcome');
  });

  it('should handle different user types', () => {
    const vipUser = { 
      name: 'VIP User', 
      email: 'vip@example.com', 
      type: 'premium' 
    };
    const welcomeMail = new WelcomeMail(vipUser);
    const content = welcomeMail.render();

    expect(content.tags).toContain('vip');
    expect(content.subject).toContain('VIP');
  });
});
```

### Testing with Dependencies

```typescript
describe('OrderConfirmationMail', () => {
  let orderCalculator: OrderCalculatorService;

  beforeEach(() => {
    orderCalculator = {
      calculateTotal: jest.fn().mockReturnValue(99.99),
      calculateTax: jest.fn().mockReturnValue(8.99),
    } as any;
  });

  it('should calculate order totals correctly', () => {
    const order = { id: 1, items: [] };
    const user = { name: 'John', email: 'john@example.com' };
    
    const mail = new OrderConfirmationMail(order, user, orderCalculator);
    const content = mail.render();

    expect(orderCalculator.calculateTotal).toHaveBeenCalledWith(order);
    expect(content.context?.totalAmount).toBe(99.99);
  });
});
```

## Integration Testing

### Testing Email Flows

```typescript
describe('User Registration Flow', () => {
  let app: INestApplication;
  let userService: UserService;
  let mailService: MailService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userService = app.get<UserService>(UserService);
    mailService = app.get<MailService>(MailService);
  });

  it('should send welcome and verification emails', async () => {
    const fake = mailService.fake();

    await userService.registerUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });

    // Assert welcome email
    fake.assertSent((mail) => 
      mail.subject.includes('Welcome') && 
      mail.tags?.includes('welcome')
    );

    // Assert verification email
    fake.assertSent((mail) => 
      mail.subject.includes('Verify') && 
      mail.tags?.includes('verification')
    );

    fake.assertSentCount(2);
  });
});
```

### Testing Email Templates

```typescript
describe('Email Templates', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MailModule.forRoot({
        config: {
          default: 'smtp',
          mailers: { /* config */ },
          templates: {
            engine: 'handlebars',
            directory: './test-templates'
          }
        }
      })],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should render template with context data', async () => {
    const fake = mailService.fake();

    await mailService.send({
      to: { address: 'test@example.com' },
      subject: 'Template Test',
      template: 'welcome',
      context: {
        name: 'John Doe',
        appName: 'Test App'
      }
    });

    const sentMail = fake.getSentMails()[0];
    expect(sentMail.html).toContain('Hello John Doe');
    expect(sentMail.html).toContain('Welcome to Test App');
  });
});
```

## Mock Transports for Testing

### Creating Mock Transport

```typescript
import { MailTransport, Content } from 'nestjs-mailable';

class MockTransport implements MailTransport {
  public sentEmails: Content[] = [];

  async send(content: Content): Promise<any> {
    this.sentEmails.push(content);
    return {
      messageId: `mock-${Date.now()}`,
      accepted: [content.to],
      rejected: [],
      response: '250 Message accepted'
    };
  }

  getSentEmails(): Content[] {
    return this.sentEmails;
  }

  reset(): void {
    this.sentEmails = [];
  }
}
```

### Using Mock Transport in Tests

```typescript
describe('Email Service with Mock Transport', () => {
  let emailService: EmailService;
  let mockTransport: MockTransport;

  beforeEach(async () => {
    mockTransport = new MockTransport();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailTransportFactory,
          useValue: {
            createTransport: () => mockTransport
          }
        }
      ],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
  });

  it('should send email through mock transport', async () => {
    await emailService.sendWelcomeEmail({
      name: 'John Doe',
      email: 'john@example.com'
    });

    expect(mockTransport.getSentEmails()).toHaveLength(1);
    const sentEmail = mockTransport.getSentEmails()[0];
    expect(sentEmail.subject).toBe('Welcome John Doe!');
  });
});
```

## Testing Error Scenarios

### Testing Transport Failures

```typescript
describe('Email Error Handling', () => {
  it('should handle transport connection errors', async () => {
    const failingTransport = {
      send: jest.fn().mockRejectedValue(new Error('Connection refused'))
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailTransportFactory,
          useValue: {
            createTransport: () => failingTransport
          }
        }
      ],
    }).compile();

    const mailService = module.get<MailService>(MailService);

    await expect(mailService.send({
      to: { address: 'test@example.com' },
      subject: 'Test',
      html: '<p>Test</p>'
    })).rejects.toThrow('Connection refused');
  });

  it('should retry failed emails', async () => {
    let attempts = 0;
    const retryingTransport = {
      send: jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { messageId: 'success' };
      })
    };

    // Test retry logic implementation
    // ... test code
  });
});
```

### Testing Invalid Email Addresses

```typescript
describe('Email Validation', () => {
  it('should reject invalid email addresses', async () => {
    const mailService = // ... get mail service

    await expect(mailService.send({
      to: { address: 'invalid-email' },
      subject: 'Test',
      html: '<p>Test</p>'
    })).rejects.toThrow('Invalid email address');
  });

  it('should handle bounced emails', async () => {
    const bouncingTransport = {
      send: jest.fn().mockResolvedValue({
        messageId: 'bounced',
        rejected: ['bounced@example.com'],
        accepted: []
      })
    };

    // Test bounce handling
    // ... test code
  });
});
```

## Performance Testing

### Testing Email Volume

```typescript
describe('Email Performance', () => {
  it('should handle bulk email sending', async () => {
    const fake = mailService.fake();
    const recipients = Array.from({ length: 1000 }, (_, i) => 
      `user${i}@example.com`
    );

    const start = Date.now();
    await emailService.sendBulkEmails(recipients, {
      subject: 'Newsletter',
      html: '<p>Newsletter content</p>'
    });
    const duration = Date.now() - start;

    fake.assertSentCount(1000);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });
});
```

### Memory Usage Testing

```typescript
describe('Memory Usage', () => {
  it('should not leak memory during bulk operations', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < 100; i++) {
      await emailService.sendEmail({
        to: { address: `test${i}@example.com` },
        subject: 'Memory Test',
        html: '<p>Test content</p>'
      });
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## Best Practices for Testing

### 1. Use MailFake for Unit Tests
Always use `mailService.fake()` for isolated unit tests to avoid sending real emails.

### 2. Test Email Content Thoroughly
```typescript
fake.assertSent((mail) => {
  expect(mail.subject).toMatch(/Welcome .+!/);
  expect(mail.html).toContain('verification link');
  expect(mail.tags).toContain('onboarding');
  expect(mail.metadata?.user_id).toBeDefined();
  return true;
});
```

### 3. Test Different Scenarios
- Happy path
- Error conditions
- Edge cases (empty data, special characters)
- Different user types/roles

### 4. Use Descriptive Test Names
```typescript
it('should send welcome email with verification link for new users', () => {
  // Test implementation
});

it('should include VIP badge in welcome email for premium users', () => {
  // Test implementation
});
```

### 5. Clean Up After Tests
```typescript
afterEach(() => {
  // Reset mail fake state
  mailService.fake()?.reset();
  
  // Clear any test data
  jest.clearAllMocks();
});
```