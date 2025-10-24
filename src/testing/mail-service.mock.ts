/**
 * Jest Mocking Utilities for NestJS Mailable
 * Provides factory functions and helpers for creating mocks in tests
 */

/**
 * Creates a basic mock of MailService with all methods stubbed
 * Supports fluent API chaining
 *
 * @example
 * const mockMailService = createMailServiceMock();
 * await mockMailService.to('user@example.com').send();
 * expect(mockMailService.to).toHaveBeenCalledWith('user@example.com');
 */
export function createMailServiceMock(): jest.Mocked<any> {
  return {
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
}

/**
 * Creates a mock MailService that fails on send
 * Useful for testing error handling
 *
 * @param error - The error to throw
 * @example
 * const mockMailService = createMailServiceMockWithError(
 *   new Error('SMTP connection failed')
 * );
 * await expect(mockMailService.to('user@example.com').send())
 *   .rejects.toThrow('SMTP connection failed');
 */
export function createMailServiceMockWithError(error: Error): jest.Mocked<any> {
  const mock = createMailServiceMock();
  mock.send.mockRejectedValue(error);
  return mock;
}

/**
 * Creates a mock MailService with specific send response
 *
 * @param response - The response to return from send()
 * @example
 * const mockMailService = createMailServiceMockWithResponse({
 *   messageId: 'msg-123',
 *   status: 'sent'
 * });
 * const result = await mockMailService.to('user@example.com').send();
 * expect(result).toEqual({ messageId: 'msg-123', status: 'sent' });
 */
export function createMailServiceMockWithResponse(response: any): jest.Mocked<any> {
  const mock = createMailServiceMock();
  mock.send.mockResolvedValue(response);
  return mock;
}

/**
 * Creates a mock MailService that returns different responses for multiple calls
 *
 * @param responses - Array of responses to return sequentially
 * @example
 * const mockMailService = createMailServiceMockWithSequentialResponses([
 *   { messageId: 'msg-1' },
 *   { messageId: 'msg-2' },
 * ]);
 */
export function createMailServiceMockWithSequentialResponses(responses: any[]): jest.Mocked<any> {
  const mock = createMailServiceMock();
  mock.send.mockImplementation(() => {
    const response = responses.shift();
    return Promise.resolve(response);
  });
  return mock;
}

/**
 * Creates a mock MailService with MailFake functionality
 * Useful for testing email sending without actual delivery
 *
 * @example
 * const mockMailService = createMailServiceMockWithFake();
 * await mockMailService.to('user@example.com').send();
 * expect(mockMailService.getSent()).toHaveLength(1);
 */
export function createMailServiceMockWithFake(): jest.Mocked<any> {
  const sentMails: any[] = [];

  return {
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
    fake: jest.fn().mockReturnValue({
      assertSent: jest.fn(),
      getSentMails: jest.fn().mockReturnValue(sentMails),
    }),
    getSent: jest.fn().mockReturnValue(sentMails),
    clearSent: jest.fn().mockImplementation(() => sentMails.splice(0)),
    hasSent: jest.fn().mockReturnValue(sentMails.length > 0),
    hasSentTo: jest.fn().mockImplementation((email) => sentMails.some((m) => m.to === email || m.to.includes(email))),
    verifyTransport: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Interface for mock mail service configuration
 */
export interface MockMailServiceConfig {
  defaultResponse?: any;
  shouldFail?: boolean;
  failError?: Error;
  sequentialResponses?: any[];
}

/**
 * Creates a configured mock MailService
 *
 * @param config - Configuration options
 * @example
 * const mockMailService = createConfiguredMailServiceMock({
 *   defaultResponse: { messageId: 'test-msg' },
 *   shouldFail: false,
 * });
 */
export function createConfiguredMailServiceMock(config: MockMailServiceConfig): jest.Mocked<any> {
  let callCount = 0;

  const mock = createMailServiceMock();

  if (config.sequentialResponses && config.sequentialResponses.length > 0) {
    mock.send.mockImplementation(() => {
      const response = config.sequentialResponses![callCount];
      callCount++;
      return Promise.resolve(response);
    });
  } else if (config.shouldFail && config.failError) {
    mock.send.mockRejectedValue(config.failError);
  } else if (config.defaultResponse) {
    mock.send.mockResolvedValue(config.defaultResponse);
  }

  return mock;
}
