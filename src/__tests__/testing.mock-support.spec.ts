import { createMailMockSupport } from '../testing/mock-support';

describe('testing/mock-support', () => {
  it('tracks sent mails via MailService and server assertions', async () => {
    const { mailService, server } = createMailMockSupport();

    await mailService.to('dev@example.com').subject('Hello').send({
      html: '<p>Test</p>',
    });

    expect(server.isRunning()).toBe(true);
    expect(server.getSentMails()).toHaveLength(1);
    expect(server.getSentMails()[0].content.to).toBe('dev@example.com');
    expect(server.getSentMails()[0].content.subject).toBe('Hello');
    expect(mailService.hasSent()).toBe(true);
    expect(mailService.hasSentTo('dev@example.com')).toBe(true);
    expect(mailService.getSent()).toHaveLength(1);
    expect(() => server.assertSent()).not.toThrow();
    expect(() => server.assertSentCount(1)).not.toThrow();
  });

  it('supports stop/start server behavior for test scenarios', async () => {
    const { mailService, server } = createMailMockSupport({ autoStart: false });

    expect(server.isRunning()).toBe(false);
    await expect(
      mailService.send({
        to: 'dev@example.com',
        subject: 'Should Fail',
      }),
    ).rejects.toThrow('Mock server is not running');

    server.start();
    await expect(mailService.send({ to: 'dev@example.com', subject: 'Should Pass' })).resolves.toHaveProperty(
      'messageId',
    );

    server.stop();
    await expect(mailService.send({ to: 'dev@example.com', subject: 'Should Fail Again' })).rejects.toThrow(
      'Mock server is not running',
    );
  });

  it('supports transport-level usage and server reset', async () => {
    const { transport, server } = createMailMockSupport();

    await transport.send({
      to: [{ address: 'one@example.com' }, 'two@example.com'],
      subject: 'Batch',
    });

    expect(server.getLastSentMail()?.content.subject).toBe('Batch');
    expect(() => server.assertSent((mail) => mail.content.subject === 'Batch')).not.toThrow();
    expect(() => server.assertSent((mail) => mail.content.subject === 'Missing')).toThrow('No mail was sent');

    server.reset();
    expect(server.getSentMails()).toHaveLength(0);
    expect(() => server.assertSentCount(0)).not.toThrow();
  });

  it('supports custom send responses and verify failure branch', async () => {
    const { mailService, transport } = createMailMockSupport({
      customResponse: { messageId: 'custom-dev-id' },
      verifyFailure: true,
    });

    await expect(mailService.send({ to: 'dev@example.com' })).resolves.toEqual({ messageId: 'custom-dev-id' });
    await expect(transport.verify()).rejects.toThrow('Verification failed');
  });

  it('exposes fake-style assertions from the mock mail service', async () => {
    const { mailService } = createMailMockSupport();

    await mailService.send({
      to: 'fake@example.com',
      subject: 'Fake API',
    });

    const fake = mailService.fake();
    expect(fake.getSentMails()).toHaveLength(1);
    expect(() => fake.assertSent()).not.toThrow();
    expect(() => fake.assertSentCount(1)).not.toThrow();
    expect(() => fake.assertSent((mail) => mail.subject === 'Fake API')).not.toThrow();
  });
});
