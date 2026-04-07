import {
  createTestModuleWithMockedMailService,
  createTestModuleWithFailingMailService,
  createTestModuleWithFakeMailService,
  createConfiguredTestModule,
  TestModuleBuilder,
} from '../testing/module.mock';
import { MailService } from '../services/mail.service';

describe('testing/module.mock', () => {
  it('createTestModuleWithMockedMailService registers MailService and additional providers', async () => {
    const moduleRef = await createTestModuleWithMockedMailService([{ provide: 'TOKEN', useValue: 123 }]);

    const mail = moduleRef.get<any>(MailService);
    const token = moduleRef.get<number>('TOKEN');

    await expect(mail.send({})).resolves.toEqual({ messageId: 'mock-msg-id' });
    expect(token).toBe(123);

    await moduleRef.close();
  });

  it('createTestModuleWithMockedMailService works with default providers argument', async () => {
    const moduleRef = await createTestModuleWithMockedMailService();
    const mail = moduleRef.get<any>(MailService);

    await expect(mail.send({})).resolves.toEqual({ messageId: 'mock-msg-id' });

    await moduleRef.close();
  });

  it('createTestModuleWithFailingMailService rejects send with provided error', async () => {
    const moduleRef = await createTestModuleWithFailingMailService(new Error('send failed'));
    const mail = moduleRef.get<any>(MailService);

    await expect(mail.send({})).rejects.toThrow('send failed');

    await moduleRef.close();
  });

  it('createTestModuleWithFakeMailService tracks sent emails and helper methods', async () => {
    const moduleRef = await createTestModuleWithFakeMailService();
    const mail = moduleRef.get<any>(MailService);

    await expect(mail.send({ subject: 'one' })).resolves.toEqual({ messageId: 'msg-1' });
    expect(mail.getSent()).toHaveLength(1);
    expect(mail.hasSent()).toBe(true);
    expect(mail.hasSentTo('test@example.com')).toBe(true);
    expect(mail.hasSentTo('@example.com')).toBe(true);
    mail.getSent().push({ to: undefined });
    expect(mail.hasSentTo('nobody@example.com')).toBe(false);

    mail.clearSent();
    expect(mail.getSent()).toHaveLength(0);

    await moduleRef.close();
  });

  it('createConfiguredTestModule supports withMailService=false', async () => {
    const moduleRef = await createConfiguredTestModule({ withMailService: false }, [{ provide: 'X', useValue: 'x' }]);

    expect(moduleRef.get<string>('X')).toBe('x');
    expect(() => moduleRef.get(MailService)).toThrow();

    await moduleRef.close();
  });

  it('createConfiguredTestModule supports default config argument branch', async () => {
    const moduleRef = await createConfiguredTestModule();
    const mail = moduleRef.get<any>(MailService);

    await expect(mail.send({})).resolves.toEqual({ messageId: 'mock-msg-id' });

    await moduleRef.close();
  });

  it('createConfiguredTestModule supports shouldFail branch', async () => {
    const moduleRef = await createConfiguredTestModule({
      withMailService: true,
      shouldFail: true,
      failError: new Error('configured fail'),
    });
    const mail = moduleRef.get<any>(MailService);

    await expect(mail.send({})).rejects.toThrow('configured fail');

    await moduleRef.close();
  });

  it('createConfiguredTestModule supports withFake branch with custom response', async () => {
    const moduleRef = await createConfiguredTestModule({
      withMailService: true,
      withFake: true,
      customResponse: { messageId: 'custom-fake' },
    });
    const mail = moduleRef.get<any>(MailService);

    await expect(mail.send({})).resolves.toEqual({ messageId: 'custom-fake' });
    expect(mail.getSent()).toHaveLength(1);

    mail.clearSent();
    expect(mail.getSent()).toHaveLength(0);

    await moduleRef.close();
  });

  it('createConfiguredTestModule supports withFake branch default response path', async () => {
    const moduleRef = await createConfiguredTestModule({
      withMailService: true,
      withFake: true,
    });
    const mail = moduleRef.get<any>(MailService);

    await expect(mail.send({})).resolves.toEqual({ messageId: 'msg-1' });
    expect(mail.getSent()).toHaveLength(1);

    await moduleRef.close();
  });

  it('createConfiguredTestModule supports success branch with custom response', async () => {
    const moduleRef = await createConfiguredTestModule({
      withMailService: true,
      customResponse: { messageId: 'custom-ok' },
    });
    const mail = moduleRef.get<any>(MailService);

    await expect(mail.send({})).resolves.toEqual({ messageId: 'custom-ok' });

    await moduleRef.close();
  });

  it('createConfiguredTestModule supports success branch default response path', async () => {
    const moduleRef = await createConfiguredTestModule({
      withMailService: true,
    });
    const mail = moduleRef.get<any>(MailService);

    await expect(mail.send({})).resolves.toEqual({ messageId: 'mock-msg-id' });

    await moduleRef.close();
  });

  it('TestModuleBuilder supports fluent provider APIs and failing mail setup', async () => {
    const builder = new TestModuleBuilder()
      .withMockedMailService()
      .addProvider({ provide: 'A', useValue: 1 })
      .addProviders([{ provide: 'B', useValue: 2 }])
      .withFailingMailService(new Error('builder fail'));

    const moduleRef = await builder.build();
    const mail = moduleRef.get<any>(MailService);

    expect(moduleRef.get<number>('A')).toBe(1);
    expect(moduleRef.get<number>('B')).toBe(2);
    await expect(mail.send({})).rejects.toThrow('builder fail');

    await moduleRef.close();
  });

  it('TestModuleBuilder auto-creates mocked mail service when omitted', async () => {
    const moduleRef = await new TestModuleBuilder().build();
    const mail = moduleRef.get<any>(MailService);

    await expect(mail.send({})).resolves.toEqual({ messageId: 'mock-msg-id' });

    await moduleRef.close();
  });
});
