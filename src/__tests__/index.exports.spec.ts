import * as pkg from '../index';

describe('root index exports', () => {
  it('exposes primary API surface', () => {
    expect(pkg.MailService).toBeDefined();
    expect(pkg.MailModule).toBeDefined();
    expect(pkg.TEMPLATE_ENGINE).toBeDefined();
    expect(pkg.TransportType).toBeDefined();
    expect(pkg.Mailable).toBeDefined();
    expect(pkg.AttachmentBuilder).toBeDefined();
    expect(pkg.MailableBuilder).toBeDefined();

    expect(pkg.MAIL_EVENT_EMITTER).toBeDefined();
    expect(pkg.MAIL_SENT_EVENT).toBeDefined();
    expect(pkg.MAIL_FAILED_EVENT).toBeDefined();
    expect(pkg.MAIL_BATCH_COMPLETED_EVENT).toBeDefined();
    expect(pkg.MailSentEvent).toBeDefined();
    expect(pkg.MailFailedEvent).toBeDefined();
    expect(pkg.MailBatchCompletedEvent).toBeDefined();
    expect(pkg.MailBatchSender).toBeDefined();
    expect(pkg.RetryExhaustedError).toBeDefined();

    const smtp = pkg.createSMTPConfig({
      host: 'smtp.example.com',
      auth: { user: 'u', pass: 'p' },
    });
    const ses = pkg.createSESConfig({
      region: 'us-east-1',
      credentials: { accessKeyId: 'a', secretAccessKey: 's' },
    });
    const mailgun = pkg.createMailgunConfig({
      domain: 'mg.example.com',
      apiKey: 'key',
    });

    expect(pkg.isSMTPConfig(smtp)).toBe(true);
    expect(pkg.isSESConfig(ses)).toBe(true);
    expect(pkg.isMailgunConfig(mailgun)).toBe(true);

    expect(smtp.type).toBe(pkg.TransportType.SMTP);
    expect(pkg.createMailServiceMock).toBeDefined();
    expect(pkg.createMailServiceMockWithError).toBeDefined();
    expect(pkg.createMailServiceMockWithResponse).toBeDefined();
    expect(pkg.createMailServiceMockWithSequentialResponses).toBeDefined();
    expect(pkg.createMailServiceMockWithFake).toBeDefined();
    expect(pkg.createConfiguredMailServiceMock).toBeDefined();
    expect(pkg.createSmtpTransportMock).toBeDefined();
    expect(pkg.createSESTransportMock).toBeDefined();
    expect(pkg.createMailgunTransportMock).toBeDefined();
    expect(pkg.createMailjetTransportMock).toBeDefined();
    expect(pkg.createResendTransportMock).toBeDefined();
    expect(pkg.createFailingTransportMock).toBeDefined();
    expect(pkg.createConfiguredTransportMock).toBeDefined();
    expect(pkg.createTestModuleWithMockedMailService).toBeDefined();
    expect(pkg.createTestModuleWithFailingMailService).toBeDefined();
    expect(pkg.createTestModuleWithFakeMailService).toBeDefined();
    expect(pkg.createConfiguredTestModule).toBeDefined();
    expect(pkg.TestModuleBuilder).toBeDefined();
  });
});
