/**
 * NestJS Module Mock Utilities
 * Factory functions for creating mocks of MailModule and related configuration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../services/mail.service';

/**
 * Creates a test module with mocked MailService
 *
 * @param providers - Additional providers to include
 * @example
 * const module = await createTestModuleWithMockedMailService([UserService]);
 * const userService = module.get<UserService>(UserService);
 * const mailService = module.get<MailService>(MailService);
 */
export async function createTestModuleWithMockedMailService(providers: any[] = []): Promise<TestingModule> {
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
    send: jest.fn().mockResolvedValue({ messageId: 'mock-msg-id' }),
    fake: jest.fn(),
    clearSent: jest.fn(),
    hasSent: jest.fn().mockReturnValue(false),
    hasSentTo: jest.fn().mockReturnValue(false),
    getSent: jest.fn().mockReturnValue([]),
    verifyTransport: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(undefined),
  };

  return Test.createTestingModule({
    providers: [...providers, { provide: MailService, useValue: mockMailService }],
  }).compile();
}

/**
 * Creates a test module with failing MailService
 * Useful for testing error handling
 *
 * @param error - Error to throw on send
 * @param providers - Additional providers
 * @example
 * const module = await createTestModuleWithFailingMailService(
 *   new Error('SMTP error'),
 *   [UserService]
 * );
 */
export async function createTestModuleWithFailingMailService(
  error: Error,
  providers: any[] = [],
): Promise<TestingModule> {
  const mockMailService = {
    to: jest.fn().mockReturnThis(),
    cc: jest.fn().mockReturnThis(),
    bcc: jest.fn().mockReturnThis(),
    subject: jest.fn().mockReturnThis(),
    html: jest.fn().mockReturnThis(),
    template: jest.fn().mockReturnThis(),
    send: jest.fn().mockRejectedValue(error),
    fake: jest.fn(),
    clearSent: jest.fn(),
  };

  return Test.createTestingModule({
    providers: [...providers, { provide: MailService, useValue: mockMailService }],
  }).compile();
}

/**
 * Creates a test module with fake MailService (tracks sent emails)
 * Useful for verifying email sending
 *
 * @param providers - Additional providers
 * @example
 * const module = await createTestModuleWithFakeMailService([UserService]);
 * const mailService = module.get<MailService>(MailService);
 * await userService.registerUser(user);
 * expect(mailService.getSent()).toHaveLength(1);
 */
export async function createTestModuleWithFakeMailService(providers: any[] = []): Promise<TestingModule> {
  const sentMails: any[] = [];

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
    send: jest.fn().mockImplementation((mailable) => {
      sentMails.push({
        to: 'test@example.com',
        subject: 'Test',
        mailable,
        timestamp: new Date(),
      });
      return Promise.resolve({ messageId: `msg-${sentMails.length}` });
    }),
    fake: jest.fn(),
    getSent: jest.fn().mockImplementation(() => sentMails),
    clearSent: jest.fn().mockImplementation(() => sentMails.splice(0)),
    hasSent: jest.fn().mockImplementation(() => sentMails.length > 0),
    hasSentTo: jest
      .fn()
      .mockImplementation((email) => sentMails.some((m) => m.to === email || m.to?.includes?.(email))),
    verifyTransport: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(undefined),
  };

  return Test.createTestingModule({
    providers: [...providers, { provide: MailService, useValue: mockMailService }],
  }).compile();
}

/**
 * Interface for module mock configuration
 */
export interface ModuleMockConfig {
  withMailService?: boolean;
  shouldFail?: boolean;
  failError?: Error;
  withFake?: boolean;
  customResponse?: any;
}

/**
 * Creates a test module with configured mocks
 *
 * @param config - Configuration options
 * @param providers - Additional providers
 * @example
 * const module = await createConfiguredTestModule(
 *   { withMailService: true, shouldFail: false },
 *   [UserService]
 * );
 */
export async function createConfiguredTestModule(
  config: ModuleMockConfig = {},
  providers: any[] = [],
): Promise<TestingModule> {
  const {
    withMailService = true,
    shouldFail = false,
    failError = new Error('Service failed'),
    withFake = false,
    customResponse,
  } = config;

  let mockMailService: any;

  if (withMailService) {
    if (shouldFail) {
      mockMailService = {
        to: jest.fn().mockReturnThis(),
        send: jest.fn().mockRejectedValue(failError),
        fake: jest.fn(),
      };
    } else if (withFake) {
      const sentMails: any[] = [];
      mockMailService = {
        to: jest.fn().mockReturnThis(),
        subject: jest.fn().mockReturnThis(),
        html: jest.fn().mockReturnThis(),
        template: jest.fn().mockReturnThis(),
        send: jest.fn().mockImplementation(() => {
          sentMails.push({ timestamp: new Date() });
          return Promise.resolve(customResponse || { messageId: `msg-${sentMails.length}` });
        }),
        getSent: jest.fn().mockReturnValue(sentMails),
        clearSent: jest.fn().mockImplementation(() => sentMails.splice(0)),
        fake: jest.fn(),
      };
    } else {
      mockMailService = {
        to: jest.fn().mockReturnThis(),
        cc: jest.fn().mockReturnThis(),
        bcc: jest.fn().mockReturnThis(),
        subject: jest.fn().mockReturnThis(),
        html: jest.fn().mockReturnThis(),
        template: jest.fn().mockReturnThis(),
        send: jest.fn().mockResolvedValue(customResponse || { messageId: 'mock-msg-id' }),
        fake: jest.fn(),
        clearSent: jest.fn(),
      };
    }
  }

  return Test.createTestingModule({
    providers: [...providers, ...(withMailService ? [{ provide: MailService, useValue: mockMailService }] : [])],
  }).compile();
}

/**
 * Helper to create a test module builder with fluent API
 *
 * @example
 * const moduleBuilder = new TestModuleBuilder()
 *   .withMockedMailService()
 *   .addProvider(UserService)
 *   .addProvider(AuthService);
 * const module = await moduleBuilder.build();
 */
export class TestModuleBuilder {
  private mockMailService: any = null;
  private providers: any[] = [];
  private shouldFail = false;
  private failError: Error = new Error('Service failed');

  /**
   * Add mocked MailService
   */
  withMockedMailService(): this {
    this.mockMailService = {
      to: jest.fn().mockReturnThis(),
      cc: jest.fn().mockReturnThis(),
      bcc: jest.fn().mockReturnThis(),
      subject: jest.fn().mockReturnThis(),
      html: jest.fn().mockReturnThis(),
      template: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue({ messageId: 'mock-msg-id' }),
      fake: jest.fn(),
      clearSent: jest.fn(),
    };
    return this;
  }

  /**
   * Configure MailService to fail
   */
  withFailingMailService(error: Error): this {
    this.shouldFail = true;
    this.failError = error;
    if (this.mockMailService) {
      this.mockMailService.send.mockRejectedValue(error);
    }
    return this;
  }

  /**
   * Add a provider
   */
  addProvider(provider: any): this {
    this.providers.push(provider);
    return this;
  }

  /**
   * Add multiple providers
   */
  addProviders(providers: any[]): this {
    this.providers.push(...providers);
    return this;
  }

  /**
   * Build the test module
   */
  async build(): Promise<TestingModule> {
    if (!this.mockMailService) {
      this.withMockedMailService();
    }

    return Test.createTestingModule({
      providers: [...this.providers, { provide: MailService, useValue: this.mockMailService }],
    }).compile();
  }
}
