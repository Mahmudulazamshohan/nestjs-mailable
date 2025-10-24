/**
 * NestJS Mailable Testing Utilities
 * Complete set of mocking utilities for testing NestJS Mailable functionality
 *
 * @example
 * import {
 *   createMailServiceMock,
 *   createSmtpTransportMock,
 *   createTestModuleWithMockedMailService,
 * } from 'nestjs-mailable/testing';
 *
 * // Mock MailService
 * const mailService = createMailServiceMock();
 * await mailService.to('user@example.com').send();
 *
 * // Mock Transport
 * const transport = createSmtpTransportMock();
 *
 * // Create test module with mocked services
 * const module = await createTestModuleWithMockedMailService([UserService]);
 */

// Mail Service Mocks
export {
  createMailServiceMock,
  createMailServiceMockWithError,
  createMailServiceMockWithResponse,
  createMailServiceMockWithSequentialResponses,
  createMailServiceMockWithFake,
  createConfiguredMailServiceMock,
  type MockMailServiceConfig,
} from './mail-service.mock';

// Transport Mocks
export {
  createSmtpTransportMock,
  createSESTransportMock,
  createMailgunTransportMock,
  createMailjetTransportMock,
  createResendTransportMock,
  createFailingTransportMock,
  createConfiguredTransportMock,
  type TransportMockConfig,
} from './transport.mock';

// Module Mocks
export {
  createTestModuleWithMockedMailService,
  createTestModuleWithFailingMailService,
  createTestModuleWithFakeMailService,
  createConfiguredTestModule,
  TestModuleBuilder,
  type ModuleMockConfig,
} from './module.mock';
