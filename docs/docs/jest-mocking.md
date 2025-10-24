---
sidebar_position: 7
---

# Jest Mocking Guide

Complete guide to mocking NestJS Mailable functionality in your Jest tests with practical examples for all components.

## Overview

When testing applications that use NestJS Mailable, you'll want to mock email sending to avoid:
- Sending actual emails during tests
- External API calls (Mailgun, SES, Resend, etc.)
- Dependency on SMTP servers
- Long test execution times

This guide covers mocking strategies for all NestJS Mailable components.

## Mocking the MailService

### Basic MailService Mock

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from 'nestjs-mailable';

describe('UserService with Mocked MailService', () => {
  let userService: UserService;
  let mailService: MailService;

  beforeEach(async () => {
    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      cc: jest.fn().mockReturnThis(),
      bcc: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      replyTo: jest.fn().mockReturnThis(),
      subject: jest.fn().mockReturnThis(),
      html: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      template: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(true),
      fake: jest.fn(),
      clearSent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    mailService = module.get<MailService>(MailService);
  });

  it('should send welcome email on registration', async () => {
    const user = { id: 1, name: 'John', email: 'john@example.com' };

    await userService.registerUser(user);

    expect(mailService.to).toHaveBeenCalledWith(user.email);
    expect(mailService.send).toHaveBeenCalled();
  });
});
```

### MailService with Fluent API Mocking

```typescript
describe('Fluent API Mocking', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      cc: jest.fn().mockReturnThis(),
      bcc: jest.fn().mockReturnThis(),
      subject: jest.fn().mockReturnThis(),
      html: jest.fn().mockReturnThis(),
      template: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue({ id: 'email-123' }),
    };

    const module = await Test.createTestingModule({
      providers: [
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should support method chaining', async () => {
    const result = await mailService
      .to('user@example.com')
      .cc('manager@example.com')
      .subject('Test')
      .html('<p>Test</p>')
      .send();

    expect(mailService.to).toHaveBeenCalledWith('user@example.com');
    expect(mailService.cc).toHaveBeenCalledWith('manager@example.com');
    expect(mailService.subject).toHaveBeenCalledWith('Test');
    expect(result).toEqual({ id: 'email-123' });
  });
});
```

## Mocking Mailable Classes

### Mock Mailable Implementation

```typescript
import {
  MailableClass as Mailable,
  MailableEnvelope,
  MailableContent,
} from 'nestjs-mailable';

describe('Mailable Class Testing', () => {
  it('should mock WelcomeEmail mailable', () => {
    const mockMailable = {
      envelope: jest.fn().mockReturnValue({
        subject: 'Welcome to Our App',
      }),
      content: jest.fn().mockReturnValue({
        template: 'welcome',
        with: { name: 'John' },
      }),
      attachments: jest.fn().mockReturnValue([]),
      headers: jest.fn().mockReturnValue({}),
    };

    expect(mockMailable.envelope()).toEqual({
      subject: 'Welcome to Our App',
    });

    expect(mockMailable.content()).toEqual({
      template: 'welcome',
      with: { name: 'John' },
    });
  });

  it('should send with mocked mailable', async () => {
    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(true),
    };

    const mockMailable = {
      envelope: jest.fn().mockReturnValue({
        subject: 'Test',
      }),
      content: jest.fn().mockReturnValue({
        template: 'test',
      }),
    };

    await mockMailService
      .to('user@example.com')
      .send(mockMailable);

    expect(mockMailService.to).toHaveBeenCalledWith('user@example.com');
    expect(mockMailService.send).toHaveBeenCalledWith(mockMailable);
  });
});
```

## Mocking Different Transports

### Mock SMTP Transport

```typescript
describe('SMTP Transport Mocking', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const mockTransport = {
      send: jest.fn().mockResolvedValue({
        messageId: '<test@example.com>',
        response: '250 OK',
      }),
      verify: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(undefined),
    };

    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue({ messageId: '<test@example.com>' }),
      getTransport: jest.fn().mockReturnValue(mockTransport),
    };

    const module = await Test.createTestingModule({
      providers: [
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should mock SMTP transport send', async () => {
    const result = await mailService
      .to('user@example.com')
      .send();

    expect(result).toEqual({ messageId: '<test@example.com>' });
  });
});
```

### Mock AWS SES Transport

```typescript
describe('AWS SES Transport Mocking', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const mockSESTransport = {
      send: jest.fn().mockResolvedValue({
        MessageId: 'ses-message-id-123',
      }),
      verify: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(undefined),
    };

    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      subject: jest.fn().mockReturnThis(),
      html: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue({ MessageId: 'ses-message-id-123' }),
    };

    const module = await Test.createTestingModule({
      providers: [
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should mock SES send', async () => {
    const result = await mailService
      .to('user@example.com')
      .subject('Test')
      .html('<p>Test</p>')
      .send();

    expect(result).toEqual({ MessageId: 'ses-message-id-123' });
  });
});
```

### Mock Mailgun Transport

```typescript
describe('Mailgun Transport Mocking', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const mockMailgunResponse = {
      id: '<20230101.123456.mailgun-id@mg.example.com>',
      message: 'Queued. Thank you.',
    };

    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      subject: jest.fn().mockReturnThis(),
      html: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(mockMailgunResponse),
    };

    const module = await Test.createTestingModule({
      providers: [
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should mock Mailgun send', async () => {
    const result = await mailService
      .to('user@example.com')
      .subject('Test')
      .html('<p>Test</p>')
      .send();

    expect(result.id).toMatch(/mailgun-id/);
    expect(result.message).toContain('Queued');
  });
});
```

### Mock Resend Transport

```typescript
describe('Resend Transport Mocking', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const mockResendResponse = {
      id: 'resend-email-id-123',
      from: 'noreply@example.com',
      to: 'user@example.com',
      created_at: '2023-01-01T00:00:00Z',
    };

    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      subject: jest.fn().mockReturnThis(),
      html: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(mockResendResponse),
    };

    const module = await Test.createTestingModule({
      providers: [
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should mock Resend send', async () => {
    const result = await mailService
      .to('user@example.com')
      .subject('Test')
      .html('<p>Test</p>')
      .send();

    expect(result.id).toBe('resend-email-id-123');
    expect(result.to).toBe('user@example.com');
  });
});
```

## Mocking Template Engine

### Mock Template Rendering

```typescript
describe('Template Engine Mocking', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const mockTemplateEngine = {
      render: jest.fn().mockResolvedValue('<h1>Rendered HTML</h1>'),
      compile: jest.fn().mockReturnValue((context) => '<h1>Rendered HTML</h1>'),
    };

    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      template: jest.fn().mockReturnThis(),
      send: jest.fn().mockImplementation(async () => {
        const html = await mockTemplateEngine.render('welcome', { name: 'John' });
        return { html };
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should render template with context', async () => {
    const result = await mailService
      .to('user@example.com')
      .template('welcome', { name: 'John' })
      .send();

    expect(result.html).toContain('Rendered HTML');
  });
});
```

### Mock Handlebars with Partials

```typescript
describe('Handlebars Template Mocking', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const mockHandlebars = {
      registerPartial: jest.fn(),
      registerHelper: jest.fn(),
      compile: jest.fn().mockReturnValue((context) => {
        return `<h1>Hello ${context.name}</h1>`;
      }),
    };

    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      template: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue({
        html: '<h1>Hello John</h1>',
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should mock Handlebars compilation', async () => {
    const result = await mailService
      .to('user@example.com')
      .template('welcome', { name: 'John' })
      .send();

    expect(result.html).toContain('Hello John');
  });
});
```

## Mocking Attachments

### Mock Attachment Builder

```typescript
import { AttachmentBuilder } from 'nestjs-mailable';

describe('Attachment Mocking', () => {
  it('should mock attachment builder', () => {
    const mockAttachment = {
      filename: 'document.pdf',
      content: Buffer.from('mock pdf content'),
      contentType: 'application/pdf',
    };

    expect(mockAttachment.filename).toBe('document.pdf');
    expect(mockAttachment.contentType).toBe('application/pdf');
  });

  it('should mock email with attachments', async () => {
    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      subject: jest.fn().mockReturnThis(),
      html: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue({
        messageId: 'msg-123',
        attachments: [
          { filename: 'invoice.pdf', size: 1024 },
        ],
      }),
    };

    const result = await mockMailService
      .to('user@example.com')
      .subject('Invoice')
      .html('<p>See attached invoice</p>')
      .send();

    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].filename).toBe('invoice.pdf');
  });
});
```

### Mock File System in Attachment Tests

```typescript
describe('Attachment with File System Mock', () => {
  beforeEach(() => {
    jest.mock('fs');
  });

  afterEach(() => {
    jest.unmock('fs');
  });

  it('should mock file reading for attachments', async () => {
    const fs = require('fs');
    const mockBuffer = Buffer.from('mock pdf content');

    fs.readFileSync = jest.fn().mockReturnValue(mockBuffer);

    const mockAttachment = {
      fromPath: (path: string) => ({
        filename: 'document.pdf',
        content: fs.readFileSync(path),
      }),
    };

    const attachment = mockAttachment.fromPath('./document.pdf');

    expect(fs.readFileSync).toHaveBeenCalledWith('./document.pdf');
    expect(attachment.content).toEqual(mockBuffer);
  });
});
```

## Mocking Configuration and Providers

### Mock MailModule Configuration

```typescript
describe('MailModule Configuration Mocking', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const mockMailService = {
      getConfig: jest.fn().mockReturnValue({
        transport: {
          type: 'smtp',
          host: 'localhost',
          port: 1025,
        },
        from: {
          address: 'noreply@example.com',
          name: 'Test App',
        },
        templates: {
          engine: 'handlebars',
          directory: './templates',
        },
      }),
      to: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(true),
    };

    const module = await Test.createTestingModule({
      providers: [
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should provide mail configuration', () => {
    const config = mailService.getConfig();

    expect(config.transport.type).toBe('smtp');
    expect(config.from.address).toBe('noreply@example.com');
  });
});
```

### Mock ConfigService Integration

```typescript
import { ConfigService } from '@nestjs/config';

describe('ConfigService with Mail Integration', () => {
  let mailService: MailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          MAIL_HOST: 'smtp.example.com',
          MAIL_PORT: '587',
          MAIL_USER: 'test@example.com',
          MAIL_PASS: 'password',
        };
        return config[key];
      }),
    };

    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(true),
    };

    const module = await Test.createTestingModule({
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    mailService = module.get<MailService>(MailService);
  });

  it('should get mail configuration from config service', () => {
    expect(configService.get('MAIL_HOST')).toBe('smtp.example.com');
    expect(configService.get('MAIL_PORT')).toBe('587');
  });
});
```

## Testing Error Scenarios

### Mock Error Handling

```typescript
describe('Mail Service Error Handling', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const mockMailService = {
      to: jest.fn().mockReturnThis(),
      send: jest.fn().mockRejectedValue(
        new Error('SMTP connection failed')
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should handle send errors', async () => {
    await expect(
      mailService
        .to('user@example.com')
        .send()
    ).rejects.toThrow('SMTP connection failed');
  });
});
```

### Mock Transport Verification Errors

```typescript
describe('Transport Verification Mocking', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const mockMailService = {
      verifyTransport: jest.fn().mockRejectedValue(
        new Error('Invalid SMTP credentials')
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should handle transport verification errors', async () => {
    await expect(mailService.verifyTransport()).rejects.toThrow(
      'Invalid SMTP credentials'
    );
  });
});
```

## Complete Integration Test with Mocks

```typescript
describe('Complete Mail Integration with Mocks', () => {
  let userService: UserService;
  let mailService: MailService;
  let mailServiceMock: any;

  beforeEach(async () => {
    // Setup comprehensive mail service mock
    mailServiceMock = {
      to: jest.fn().mockReturnThis(),
      cc: jest.fn().mockReturnThis(),
      bcc: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      replyTo: jest.fn().mockReturnThis(),
      subject: jest.fn().mockReturnThis(),
      html: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      template: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue({
        messageId: 'msg-123',
        status: 'sent',
      }),
      fake: jest.fn().mockReturnValue({
        assertSent: jest.fn(),
        getSentMails: jest.fn().mockReturnValue([]),
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: MailService, useValue: mailServiceMock },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    mailService = module.get<MailService>(MailService);
  });

  describe('User Registration Workflow', () => {
    it('should send welcome email after registration', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'secure-password',
      };

      await userService.registerUser(userData);

      // Verify mail service was called correctly
      expect(mailServiceMock.to).toHaveBeenCalledWith(userData.email);
      expect(mailServiceMock.subject).toHaveBeenCalled();
      expect(mailServiceMock.template).toHaveBeenCalledWith(
        'emails/welcome',
        expect.objectContaining({
          name: userData.name,
        })
      );
      expect(mailServiceMock.send).toHaveBeenCalled();
    });

    it('should send confirmation email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secure-password',
      };

      await userService.registerUser(userData);

      // Verify all method calls in chain
      expect(mailServiceMock.to).toHaveBeenCalledWith(userData.email);
      expect(mailServiceMock.subject).toHaveBeenCalled();
      expect(mailServiceMock.send).toHaveBeenCalled();
    });

    it('should handle registration failures gracefully', async () => {
      mailServiceMock.send.mockRejectedValueOnce(
        new Error('Email service unavailable')
      );

      const userData = {
        name: 'Error Test',
        email: 'error@example.com',
        password: 'secure-password',
      };

      await expect(userService.registerUser(userData)).rejects.toThrow(
        'Email service unavailable'
      );
    });
  });

  describe('Reset Password Workflow', () => {
    it('should send password reset email', async () => {
      const user = { id: 1, email: 'user@example.com', name: 'User' };
      const resetToken = 'reset-token-123';

      await userService.sendPasswordResetEmail(user, resetToken);

      expect(mailServiceMock.to).toHaveBeenCalledWith(user.email);
      expect(mailServiceMock.template).toHaveBeenCalledWith(
        'emails/reset-password',
        expect.objectContaining({
          resetToken,
          userName: user.name,
        })
      );
      expect(mailServiceMock.send).toHaveBeenCalled();
    });
  });

  describe('Bulk Email Workflow', () => {
    it('should send newsletter to multiple subscribers', async () => {
      const subscribers = [
        { email: 'sub1@example.com', name: 'Sub 1' },
        { email: 'sub2@example.com', name: 'Sub 2' },
        { email: 'sub3@example.com', name: 'Sub 3' },
      ];

      for (const subscriber of subscribers) {
        mailServiceMock.to.mockClear();
        mailServiceMock.send.mockClear();

        await userService.sendNewsletter(subscriber);

        expect(mailServiceMock.to).toHaveBeenCalledWith(subscriber.email);
        expect(mailServiceMock.send).toHaveBeenCalled();
      }
    });
  });
});
```

## Best Practices for Mocking

### 1. Use Type-Safe Mocks

```typescript
// Good
interface IMailService {
  to(email: string): IMailService;
  send(): Promise<any>;
}

const mockMailService: jest.Mocked<IMailService> = {
  to: jest.fn().mockReturnThis(),
  send: jest.fn().mockResolvedValue({}),
};
```

### 2. Reset Mocks Between Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetAllMocks();
});
```

### 3. Mock Return Values Strategically

```typescript
// Specific return values for different scenarios
const mockMailService = {
  send: jest
    .fn()
    .mockResolvedValueOnce({ messageId: 'msg-1' })
    .mockResolvedValueOnce({ messageId: 'msg-2' })
    .mockRejectedValueOnce(new Error('Failed')),
};
```

### 4. Test Call Arguments

```typescript
it('should call mail service with correct arguments', async () => {
  await userService.notifyUser(user);

  expect(mailService.to).toHaveBeenCalledWith(user.email);
  expect(mailService.send).toHaveBeenCalledWith(expect.any(WelcomeEmail));
});
```

### 5. Mock External Dependencies

```typescript
// Mock file system for attachments
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from('content')),
}));

// Mock external APIs
jest.mock('mailgun.js');
jest.mock('aws-sdk');
```

## Running Tests with Coverage

```bash
# Run tests with coverage
yarn test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Common Pitfalls to Avoid

1. **Not resetting mocks** - Always clear mocks between tests
2. **Over-mocking** - Only mock external dependencies, not your own code
3. **Ignoring error cases** - Test both success and failure scenarios
4. **Not testing integration** - Mix mocks with integration tests
5. **Mock implementation too simple** - Make mocks realistic

## Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://docs.nestjs.com/fundamentals/testing#testing-services)
