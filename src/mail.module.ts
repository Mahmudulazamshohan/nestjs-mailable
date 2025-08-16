import { DynamicModule, Module, ModuleMetadata, Provider, Type } from '@nestjs/common';
import { MailService } from './services/mail.service';
import { MailConfigService } from './services/mail-config.service';
import { MailTransportFactory } from './factories/mail-transport.factory';
import { TemplateEngineFactory } from './services/template.service';

import { MailConfiguration } from './interfaces/mail.interface';

// Module options interface
export interface MailModuleOptions {
  config?: MailConfiguration;
  useFactory?: (...args: any[]) => MailConfiguration | Promise<MailConfiguration>;
  inject?: any[];
  imports?: any[];
  providers?: Provider[];
  exports?: any[];
}

export interface MailModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[]) => MailConfiguration | Promise<MailConfiguration>;
  inject?: any[];
  useClass?: Type<MailModuleOptionsFactory>;
  useExisting?: Type<MailModuleOptionsFactory>;
  providers?: Provider[];
  exports?: any[];
}

export interface MailModuleOptionsFactory {
  createMailOptions(): MailConfiguration | Promise<MailConfiguration>;
}

// Constants
export const MAIL_MODULE_OPTIONS = 'MAIL_MODULE_OPTIONS';

@Module({})
export class MailModule {
  static forRoot(options?: MailModuleOptions): DynamicModule {
    const configProvider: Provider = {
      provide: MailConfigService,
      useFactory: () => new MailConfigService(options?.config),
    };

    return {
      module: MailModule,
      providers: [
        configProvider,
        MailTransportFactory,
        TemplateEngineFactory,

        MailService,
        ...(options?.providers || []),
      ],
      exports: [
        MailService,
        MailConfigService,
        MailTransportFactory,
        TemplateEngineFactory,

        ...(options?.exports || []),
      ],
      global: true,
    };
  }

  static forRootAsync(options: MailModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: MailModule,
      imports: options.imports || [],
      providers: [
        ...asyncProviders,
        MailTransportFactory,
        TemplateEngineFactory,

        MailService,
        ...(options.providers || []),
      ],
      exports: [
        MailService,
        MailConfigService,
        MailTransportFactory,
        TemplateEngineFactory,

        ...(options.exports || []),
      ],
      global: true,
    };
  }

  private static createAsyncProviders(options: MailModuleAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: MAIL_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: MailConfigService,
          useFactory: (config: MailConfiguration) => new MailConfigService(config),
          inject: [MAIL_MODULE_OPTIONS],
        },
      ];
    }

    if (options.useClass) {
      return [
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
        {
          provide: MAIL_MODULE_OPTIONS,
          useFactory: async (optionsFactory: MailModuleOptionsFactory) => await optionsFactory.createMailOptions(),
          inject: [options.useClass],
        },
        {
          provide: MailConfigService,
          useFactory: (config: MailConfiguration) => new MailConfigService(config),
          inject: [MAIL_MODULE_OPTIONS],
        },
      ];
    }

    if (options.useExisting) {
      return [
        {
          provide: MAIL_MODULE_OPTIONS,
          useFactory: async (optionsFactory: MailModuleOptionsFactory) => await optionsFactory.createMailOptions(),
          inject: [options.useExisting],
        },
        {
          provide: MailConfigService,
          useFactory: (config: MailConfiguration) => new MailConfigService(config),
          inject: [MAIL_MODULE_OPTIONS],
        },
      ];
    }

    throw new Error('Invalid configuration. Must provide useFactory, useClass, or useExisting');
  }
}

// Feature modules for different providers
@Module({})
export class MailgunModule {
  static forRoot(config: { apiKey: string; domain: string; baseUrl?: string }): DynamicModule {
    const configProvider: Provider = {
      provide: 'MAILGUN_CONFIG',
      useValue: config,
    };

    return {
      module: MailgunModule,
      providers: [configProvider],
      exports: [configProvider],
    };
  }
}



@Module({})
export class SESModule {
  static forRoot(config: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    sessionToken?: string;
  }): DynamicModule {
    const configProvider: Provider = {
      provide: 'SES_CONFIG',
      useValue: config,
    };

    return {
      module: SESModule,
      providers: [configProvider],
      exports: [configProvider],
    };
  }
}
