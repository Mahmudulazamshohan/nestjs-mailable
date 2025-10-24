/**
 * Transport Mock Utilities
 * Factory functions for creating mocks of different transport implementations
 */

/**
 * Creates a mock SMTP transport
 *
 * @example
 * const mockSmtpTransport = createSmtpTransportMock();
 * expect(mockSmtpTransport.send).toHaveBeenCalled();
 */
export function createSmtpTransportMock(): jest.Mocked<any> {
  return {
    send: jest.fn().mockResolvedValue({
      messageId: '<test@example.com>',
      response: '250 OK',
    }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(undefined),
    isIdle: jest.fn().mockReturnValue(true),
  };
}

/**
 * Creates a mock AWS SES transport
 *
 * @example
 * const mockSESTransport = createSESTransportMock();
 * const result = await mockSESTransport.send({});
 * expect(result).toHaveProperty('MessageId');
 */
export function createSESTransportMock(): jest.Mocked<any> {
  return {
    send: jest.fn().mockResolvedValue({
      MessageId: 'ses-message-id-123456789',
      $metadata: {
        httpStatusCode: 200,
        requestId: 'request-id-123',
      },
    }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Creates a mock Mailgun transport
 *
 * @example
 * const mockMailgunTransport = createMailgunTransportMock();
 * const result = await mockMailgunTransport.send({});
 * expect(result.message).toContain('Queued');
 */
export function createMailgunTransportMock(): jest.Mocked<any> {
  return {
    send: jest.fn().mockResolvedValue({
      id: '<20230101.123456.mailgun-id@mg.example.com>',
      message: 'Queued. Thank you.',
    }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Creates a mock Mailjet transport
 *
 * @example
 * const mockMailjetTransport = createMailjetTransportMock();
 * const result = await mockMailjetTransport.send({});
 * expect(result.Messages).toBeDefined();
 */
export function createMailjetTransportMock(): jest.Mocked<any> {
  return {
    send: jest.fn().mockResolvedValue({
      Messages: [
        {
          Status: 'success',
          To: [{ Email: 'user@example.com' }],
          MessageID: 123456789,
          MessageUUID: 'message-uuid-123',
        },
      ],
    }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Creates a mock Resend transport
 *
 * @example
 * const mockResendTransport = createResendTransportMock();
 * const result = await mockResendTransport.send({});
 * expect(result.id).toBe('resend-id-123');
 */
export function createResendTransportMock(): jest.Mocked<any> {
  return {
    send: jest.fn().mockResolvedValue({
      id: 'resend-email-id-123456789',
      from: 'noreply@example.com',
      to: 'user@example.com',
      created_at: new Date().toISOString(),
    }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Creates a mock transport that fails
 *
 * @param error - The error to throw
 * @example
 * const mockTransport = createFailingTransportMock(
 *   new Error('Connection timeout')
 * );
 * await expect(mockTransport.send({})).rejects.toThrow('Connection timeout');
 */
export function createFailingTransportMock(error: Error): jest.Mocked<any> {
  return {
    send: jest.fn().mockRejectedValue(error),
    verify: jest.fn().mockRejectedValue(error),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Interface for transport mock configuration
 */
export interface TransportMockConfig {
  shouldFail?: boolean;
  failError?: Error;
  customResponse?: any;
  verifyFailure?: boolean;
}

/**
 * Creates a configured transport mock
 *
 * @param config - Configuration options
 * @example
 * const mockTransport = createConfiguredTransportMock({
 *   shouldFail: true,
 *   failError: new Error('SMTP error'),
 * });
 */
export function createConfiguredTransportMock(config: TransportMockConfig): jest.Mocked<any> {
  const baseMock = createSmtpTransportMock();

  if (config.shouldFail && config.failError) {
    baseMock.send.mockRejectedValue(config.failError);
  }

  if (config.customResponse) {
    baseMock.send.mockResolvedValue(config.customResponse);
  }

  if (config.verifyFailure) {
    baseMock.verify.mockRejectedValue(new Error('Verification failed'));
  }

  return baseMock;
}
