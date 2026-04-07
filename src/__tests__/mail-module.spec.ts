import { MAIL_EVENT_EMITTER, MailModule } from '../mail.module';
import { TransportType } from '../types/transport.type';
import { MailConfigService } from '../services/mail-config.service';

describe('MailModule', () => {
  const smtpConfig = {
    transport: {
      type: TransportType.SMTP,
      host: 'localhost',
      port: 1025,
      secure: false,
      ignoreTLS: true,
      auth: {
        user: 'user',
        pass: 'pass',
      },
    },
  };

  it('registers a default null MAIL_EVENT_EMITTER provider in forRoot()', () => {
    const moduleDefinition = MailModule.forRoot(smtpConfig);

    expect(moduleDefinition.providers).toEqual(
      expect.arrayContaining([expect.objectContaining({ provide: MAIL_EVENT_EMITTER, useValue: null })]),
    );
  });

  it('registers a default null MAIL_EVENT_EMITTER provider in forRootAsync()', () => {
    const moduleDefinition = MailModule.forRootAsync({
      useFactory: async () => smtpConfig,
    });

    expect(moduleDefinition.providers).toEqual(
      expect.arrayContaining([expect.objectContaining({ provide: MAIL_EVENT_EMITTER, useValue: null })]),
    );
  });

  it('forRootAsync keeps custom imports/providers/exports', () => {
    const customProvider = { provide: 'CUSTOM_PROVIDER', useValue: 123 };
    const customExport = 'CUSTOM_PROVIDER';

    const moduleDefinition = MailModule.forRootAsync({
      useFactory: async () => smtpConfig,
      imports: ['CUSTOM_IMPORT' as any],
      providers: [customProvider],
      exports: [customExport],
    });

    expect(moduleDefinition.imports).toEqual(['CUSTOM_IMPORT']);
    expect(moduleDefinition.providers).toEqual(expect.arrayContaining([customProvider]));
    expect(moduleDefinition.exports).toEqual(expect.arrayContaining([customExport]));
  });

  describe('createAsyncProviders()', () => {
    it('creates providers for useFactory with inject fallback', async () => {
      const providers = (MailModule as any).createAsyncProviders({
        useFactory: () => smtpConfig,
      });

      expect(providers).toHaveLength(2);
      expect(providers[0]).toEqual(
        expect.objectContaining({
          provide: 'MAIL_MODULE_OPTIONS',
          inject: [],
        }),
      );
      expect(providers[1]).toEqual(
        expect.objectContaining({
          provide: MailConfigService,
          inject: ['MAIL_MODULE_OPTIONS'],
        }),
      );

      const configService = providers[1].useFactory(smtpConfig);
      expect(configService).toBeInstanceOf(MailConfigService);
      expect(configService.getTransportConfig()).toEqual(smtpConfig.transport);
    });

    it('creates providers for useClass', async () => {
      class OptionsFactory {
        async createMailOptions() {
          return smtpConfig;
        }
      }

      const providers = (MailModule as any).createAsyncProviders({
        useClass: OptionsFactory,
      });

      expect(providers).toHaveLength(3);
      expect(providers[0]).toEqual(
        expect.objectContaining({
          provide: OptionsFactory,
          useClass: OptionsFactory,
        }),
      );
      expect(providers[1]).toEqual(
        expect.objectContaining({
          provide: 'MAIL_MODULE_OPTIONS',
          inject: [OptionsFactory],
        }),
      );
      expect(providers[2]).toEqual(
        expect.objectContaining({
          provide: MailConfigService,
          inject: ['MAIL_MODULE_OPTIONS'],
        }),
      );

      const optionsFactory = new OptionsFactory();
      const resolvedOptions = await providers[1].useFactory(optionsFactory);
      const configService = providers[2].useFactory(resolvedOptions);

      expect(resolvedOptions).toEqual(smtpConfig);
      expect(configService).toBeInstanceOf(MailConfigService);
      expect(configService.getTransportConfig()).toEqual(smtpConfig.transport);
    });

    it('creates providers for useExisting', async () => {
      class ExistingOptionsFactory {
        async createMailOptions() {
          return smtpConfig;
        }
      }

      const providers = (MailModule as any).createAsyncProviders({
        useExisting: ExistingOptionsFactory,
      });

      expect(providers).toHaveLength(2);
      expect(providers[0]).toEqual(
        expect.objectContaining({
          provide: 'MAIL_MODULE_OPTIONS',
          inject: [ExistingOptionsFactory],
        }),
      );
      expect(providers[1]).toEqual(
        expect.objectContaining({
          provide: MailConfigService,
          inject: ['MAIL_MODULE_OPTIONS'],
        }),
      );

      const existingFactory = new ExistingOptionsFactory();
      const resolvedOptions = await providers[0].useFactory(existingFactory);
      const configService = providers[1].useFactory(resolvedOptions);

      expect(resolvedOptions).toEqual(smtpConfig);
      expect(configService).toBeInstanceOf(MailConfigService);
      expect(configService.getTransportConfig()).toEqual(smtpConfig.transport);
    });

    it('throws for invalid async configuration', () => {
      expect(() => (MailModule as any).createAsyncProviders({})).toThrow(
        'Invalid configuration. Must provide useFactory, useClass, or useExisting',
      );
    });
  });
});
