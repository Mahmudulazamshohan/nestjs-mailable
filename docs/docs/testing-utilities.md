---
sidebar_position: 8
---

# Testing Utilities Reference

Complete reference for NestJS Mailable testing utilities and mock factories.

## Installation

Testing utilities are included in the main package and can be imported from:

```typescript
import {
  createMailServiceMock,
  createSmtpTransportMock,
  createTestModuleWithMockedMailService,
  // ... other utilities
} from 'nestjs-mailable/testing';
```

## Mail Service Mocks

### `createMailServiceMock()`

Creates a basic mock MailService with all methods stubbed and returning sensible defaults.

```typescript
import { createMailServiceMock } from 'nestjs-mailable/testing';

const mockMailService = createMailServiceMock();

// Use in tests
await mockMailService
  .to('user@example.com')
  .subject('Test')
  .send();

expect(mockMailService.to).toHaveBeenCalledWith('user@example.com');
```

**Mocked Methods:**
- `to()`, `cc()`, `bcc()` - Return the mock itself for chaining
- `from()`, `replyTo()` - Return the mock itself for chaining
- `subject()`, `html()`, `text()` - Return the mock itself for chaining
- `template()` - Return the mock itself for chaining
- `send()` - Returns `Promise<{ messageId: 'mock-msg-id' }>`
- `fake()`, `clearSent()`, `hasSent()`, `hasSentTo()`, `getSent()` - Utility methods
- `verifyTransport()` - Returns `Promise<true>`
- `close()` - Returns `Promise<void>`

### `createMailServiceMockWithError(error)`

Creates a mock MailService that throws an error when `send()` is called.

```typescript
const error = new Error('SMTP connection failed');
const mockMailService = createMailServiceMockWithError(error);

await expect(
  mockMailService.to('user@example.com').send()
).rejects.toThrow('SMTP connection failed');
```

### `createMailServiceMockWithResponse(response)`

Creates a mock MailService that returns a specific response.

```typescript
const response = { messageId: 'msg-123', status: 'sent' };
const mockMailService = createMailServiceMockWithResponse(response);

const result = await mockMailService
  .to('user@example.com')
  .send();

expect(result).toEqual({ messageId: 'msg-123', status: 'sent' });
```

### `createMailServiceMockWithSequentialResponses(responses)`

Creates a mock that returns different responses for sequential calls.

```typescript
const mockMailService = createMailServiceMockWithSequentialResponses([
  { messageId: 'msg-1' },
  { messageId: 'msg-2' },
  { messageId: 'msg-3' },
]);

const result1 = await mockMailService.to('user1@example.com').send();
const result2 = await mockMailService.to('user2@example.com').send();

expect(result1.messageId).toBe('msg-1');
expect(result2.messageId).toBe('msg-2');
```

### `createMailServiceMockWithFake()`

Creates a mock that tracks all "sent" emails (useful for email verification).

```typescript
const mockMailService = createMailServiceMockWithFake();

await mockMailService.to('user1@example.com').send();
await mockMailService.to('user2@example.com').send();

const sentEmails = mockMailService.getSent();
expect(sentEmails).toHaveLength(2);
```

### `createConfiguredMailServiceMock(config)`

Creates a mail service mock with custom configuration.

```typescript
interface MockMailServiceConfig {
  defaultResponse?: any;
  shouldFail?: boolean;
  failError?: Error;
  sequentialResponses?: any[];
}

const mockMailService = createConfiguredMailServiceMock({
  defaultResponse: { messageId: 'test-msg' },
  shouldFail: false,
});
```

## Transport Mocks

### `createSmtpTransportMock()`

Creates a mock SMTP transport.

```typescript
import { createSmtpTransportMock } from 'nestjs-mailable/testing';

const mockTransport = createSmtpTransportMock();

const result = await mockTransport.send({
  to: 'user@example.com',
  subject: 'Test',
  html: '<p>Test</p>',
});

expect(result).toEqual({
  messageId: '<test@example.com>',
  response: '250 OK',
});
```

### `createSESTransportMock()`

Creates a mock AWS SES transport.

```typescript
const mockSESTransport = createSESTransportMock();

const result = await mockSESTransport.send({});

expect(result).toHaveProperty('MessageId');
expect(result.$metadata.httpStatusCode).toBe(200);
```

### `createMailgunTransportMock()`

Creates a mock Mailgun transport.

```typescript
const mockMailgunTransport = createMailgunTransportMock();

const result = await mockMailgunTransport.send({});

expect(result.id).toMatch(/mailgun-id/);
expect(result.message).toContain('Queued');
```

### `createMailjetTransportMock()`

Creates a mock Mailjet transport.

```typescript
const mockMailjetTransport = createMailjetTransportMock();

const result = await mockMailjetTransport.send({});

expect(result.Messages).toBeDefined();
expect(result.Messages[0].Status).toBe('success');
```

### `createResendTransportMock()`

Creates a mock Resend transport.

```typescript
const mockResendTransport = createResendTransportMock();

const result = await mockResendTransport.send({});

expect(result.id).toBe('resend-email-id-123456789');
expect(result.to).toBe('user@example.com');
```

### `createFailingTransportMock(error)`

Creates a mock transport that fails.

```typescript
const error = new Error('Connection timeout');
const mockTransport = createFailingTransportMock(error);

await expect(mockTransport.send({})).rejects.toThrow('Connection timeout');
```

### `createConfiguredTransportMock(config)`

Creates a transport mock with custom configuration.

```typescript
interface TransportMockConfig {
  shouldFail?: boolean;
  failError?: Error;
  customResponse?: any;
  verifyFailure?: boolean;
}

const mockTransport = createConfiguredTransportMock({
  shouldFail: true,
  failError: new Error('SMTP error'),
});
```

## Module Mocks

### `createTestModuleWithMockedMailService(providers)`

Creates a NestJS test module with mocked MailService.

```typescript
import { createTestModuleWithMockedMailService } from 'nestjs-mailable/testing';

const module = await createTestModuleWithMockedMailService([UserService]);

const userService = module.get<UserService>(UserService);
const mailService = module.get<MailService>(MailService);

await userService.registerUser(user);
expect(mailService.to).toHaveBeenCalledWith(user.email);
```

### `createTestModuleWithFailingMailService(error, providers)`

Creates a test module with a MailService that fails.

```typescript
const error = new Error('SMTP error');
const module = await createTestModuleWithFailingMailService(
  error,
  [UserService]
);

const userService = module.get<UserService>(UserService);

await expect(userService.registerUser(user)).rejects.toThrow('SMTP error');
```

### `createTestModuleWithFakeMailService(providers)`

Creates a test module with a fake MailService that tracks emails.

```typescript
const module = await createTestModuleWithFakeMailService([UserService]);

const userService = module.get<UserService>(UserService);
const mailService = module.get<MailService>(MailService);

await userService.registerUser(user);
expect(mailService.getSent()).toHaveLength(1);
```

### `createConfiguredTestModule(config, providers)`

Creates a test module with custom configuration.

```typescript
interface ModuleMockConfig {
  withMailService?: boolean;
  shouldFail?: boolean;
  failError?: Error;
  withFake?: boolean;
  customResponse?: any;
}

const module = await createConfiguredTestModule(
  {
    withMailService: true,
    shouldFail: false,
    customResponse: { messageId: 'test' },
  },
  [UserService]
);
```

### `TestModuleBuilder`

Fluent builder for creating test modules.

```typescript
import { TestModuleBuilder } from 'nestjs-mailable/testing';

const module = await new TestModuleBuilder()
  .withMockedMailService()
  .addProvider(UserService)
  .addProvider(AuthService)
  .build();

const userService = module.get<UserService>(UserService);
```

**Methods:**
- `withMockedMailService()` - Add mocked MailService
- `withFailingMailService(error)` - Add MailService that fails
- `addProvider(provider)` - Add a single provider
- `addProviders(providers)` - Add multiple providers
- `build()` - Build and return the test module

## Complete Examples

### Testing a Service with Mail Functionality

```typescript
import { Test } from '@nestjs/testing';
import { createMailServiceMock } from 'nestjs-mailable/testing';
import { UserService } from './user.service';
import { MailService } from 'nestjs-mailable';

describe('UserService', () => {
  let userService: UserService;
  let mailService: MailService;

  beforeEach(async () => {
    const mockMailService = createMailServiceMock();

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    mailService = module.get<MailService>(MailService);
  });

  it('should send welcome email on registration', async () => {
    const user = { name: 'John', email: 'john@example.com' };

    await userService.registerUser(user);

    expect(mailService.to).toHaveBeenCalledWith(user.email);
    expect(mailService.send).toHaveBeenCalled();
  });

  it('should handle email sending errors', async () => {
    const error = new Error('Email service down');
    jest.spyOn(mailService, 'send').mockRejectedValueOnce(error);

    const user = { name: 'Jane', email: 'jane@example.com' };

    await expect(userService.registerUser(user)).rejects.toThrow(
      'Email service down'
    );
  });
});
```

### Testing Multiple Email Sends

```typescript
const module = await createTestModuleWithFakeMailService([UserService]);
const userService = module.get<UserService>(UserService);
const mailService = module.get<MailService>(MailService);

// Send to multiple users
const users = [
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' },
  { email: 'user3@example.com', name: 'User 3' },
];

for (const user of users) {
  await userService.sendNotification(user);
}

// Verify all emails were sent
expect(mailService.getSent()).toHaveLength(3);
users.forEach((user, index) => {
  expect(mailService.getSent()[index].to).toBe(user.email);
});
```

### Testing with Different Transports

```typescript
import {
  createSmtpTransportMock,
  createSESTransportMock,
  createMailgunTransportMock,
} from 'nestjs-mailable/testing';

describe('Multi-Transport Tests', () => {
  it('should work with SMTP', async () => {
    const transport = createSmtpTransportMock();
    const result = await transport.send({});
    expect(result.messageId).toBeDefined();
  });

  it('should work with SES', async () => {
    const transport = createSESTransportMock();
    const result = await transport.send({});
    expect(result.MessageId).toBeDefined();
  });

  it('should work with Mailgun', async () => {
    const transport = createMailgunTransportMock();
    const result = await transport.send({});
    expect(result.id).toBeDefined();
  });
});
```

### Testing Error Scenarios

```typescript
const errorModule = await createTestModuleWithFailingMailService(
  new Error('Network timeout'),
  [UserService]
);

const userService = errorModule.get<UserService>(UserService);

it('should gracefully handle email failures', async () => {
  const user = { email: 'user@example.com', name: 'User' };

  await expect(
    userService.registerUser(user)
  ).rejects.toThrow('Network timeout');

  // Verify user was still created even though email failed
  const createdUser = await userService.findByEmail(user.email);
  expect(createdUser).toBeDefined();
});
```

## Best Practices

### 1. Use Type-Safe Mocks

```typescript
const mockMailService: jest.Mocked<MailService> = createMailServiceMock();
```

### 2. Reset Between Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  mailService = createMailServiceMock();
});
```

### 3. Test Both Success and Failure

```typescript
describe('Email sending', () => {
  it('should handle success', async () => {
    // Test success case
  });

  it('should handle failure', async () => {
    const module = await createTestModuleWithFailingMailService(
      new Error('Failed'),
      [Service]
    );
    // Test failure case
  });
});
```

### 4. Verify Fluent API Calls

```typescript
await mailService
  .to('user@example.com')
  .cc('manager@example.com')
  .subject('Test')
  .send();

expect(mailService.to).toHaveBeenCalledWith('user@example.com');
expect(mailService.cc).toHaveBeenCalledWith('manager@example.com');
expect(mailService.subject).toHaveBeenCalledWith('Test');
expect(mailService.send).toHaveBeenCalled();
```

## References

- [Jest Documentation](https://jestjs.io/docs/jest-object)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Mocking Guide](./jest-mocking.md)
