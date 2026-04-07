import * as testing from '../testing';

describe('testing/index exports', () => {
  it('exposes all testing helpers', async () => {
    expect(testing.createMailServiceMock).toBeDefined();
    expect(testing.createMailServiceMockWithError).toBeDefined();
    expect(testing.createMailServiceMockWithResponse).toBeDefined();
    expect(testing.createMailServiceMockWithSequentialResponses).toBeDefined();
    expect(testing.createMailServiceMockWithFake).toBeDefined();
    expect(testing.createConfiguredMailServiceMock).toBeDefined();

    expect(testing.createSmtpTransportMock).toBeDefined();
    expect(testing.createSESTransportMock).toBeDefined();
    expect(testing.createMailgunTransportMock).toBeDefined();
    expect(testing.createMailjetTransportMock).toBeDefined();
    expect(testing.createResendTransportMock).toBeDefined();
    expect(testing.createFailingTransportMock).toBeDefined();
    expect(testing.createConfiguredTransportMock).toBeDefined();

    expect(testing.createTestModuleWithMockedMailService).toBeDefined();
    expect(testing.createTestModuleWithFailingMailService).toBeDefined();
    expect(testing.createTestModuleWithFakeMailService).toBeDefined();
    expect(testing.createConfiguredTestModule).toBeDefined();
    expect(testing.TestModuleBuilder).toBeDefined();
    expect(testing.createMailMockSupport).toBeDefined();

    await expect(testing.createSmtpTransportMock().send({})).resolves.toHaveProperty('messageId');
  });
});
