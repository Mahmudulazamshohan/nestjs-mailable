# MailModule Usage

The `MailModule` provides a flexible way to integrate email sending capabilities into your application, supporting various transport mechanisms like SMTP, AWS SES, and Mailgun.

## Installation

First, ensure you have the necessary dependencies installed:

```bash
npm install @nestjs-modules/mail mailgun.js @aws-sdk/client-ses nodemailer
# or
yarn add @nestjs-modules/mail mailgun.js @aws-sdk/client-ses nodemailer
```

## Basic Usage (forRoot)

For synchronous configuration, you can use the `forRoot` method. This is suitable when your mail configuration is static and available at application startup.

```typescript
import { Module } from '@nestjs/common';
import { MailModule } from '@nestjs-modules/mail';

@Module({
  imports: [
    MailModule.forRoot({
      config: {
        transportType: 'smtp',
        options: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: {
            user: 'username',
            pass: 'password',
          },
        },
      },
    }),
  ],
})
export class AppModule {}
```

### Configuration Options for `forRoot`

The `config` property in `MailModuleOptions` expects a `MailConfiguration` object, which includes:

*   `transportType`: Specifies the email transport mechanism (e.g., `'smtp'`, `'ses'`, `'mailgun'`).
*   `options`: An object containing transport-specific configuration. The structure of this object depends on the `transportType`.

#### SMTP Configuration Example

```typescript
MailModule.forRoot({
  config: {
    transportType: 'smtp',
    options: {
      host: 'smtp.example.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'username',
        pass: 'password',
      },
    },
  },
})
```

#### AWS SES Configuration Example

For AWS SES, use `transportType: 'ses'` and provide `SesMailerOptions`:

```typescript
import { SesMailerOptions } from '@nestjs-modules/mail/dist/interfaces/mail.interface';

MailModule.forRoot({
  config: {
    transportType: 'ses',
    options: {
      accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
      secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
      region: 'YOUR_AWS_REGION', // e.g., 'us-east-1'
    } as SesMailerOptions,
  },
})
```

#### Mailgun Configuration Example

For Mailgun, use `transportType: 'mailgun'` and provide `MailgunMailerOptions`:

```typescript
import { MailgunMailerOptions } from '@nestjs-modules/mail/dist/interfaces/mail.interface';

MailModule.forRoot({
  config: {
    transportType: 'mailgun',
    options: {
      apiKey: 'YOUR_MAILGUN_API_KEY',
      domain: 'YOUR_MAILGUN_DOMAIN',
    } as MailgunMailerOptions,
  },
})
```

## Asynchronous Usage (forRootAsync)

For asynchronous configuration, such as when your mail configuration depends on other services or environment variables, use the `forRootAsync` method. This allows you to inject dependencies and resolve configuration dynamically.

```typescript
import { Module } from '@nestjs/common';
import { MailModule } from '@nestjs-modules/mail';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Example: Load environment variables
    MailModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        config: {
          transportType: configService.get<string>('MAIL_TRANSPORT_TYPE'),
          options: {
            host: configService.get<string>('MAIL_HOST'),
            port: configService.get<number>('MAIL_PORT'),
            secure: configService.get<boolean>('MAIL_SECURE'),
            auth: {
              user: configService.get<string>('MAIL_USER'),
              pass: configService.get<string>('MAIL_PASSWORD'),
            },
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Asynchronous Configuration Options

`forRootAsync` supports `useFactory`, `useClass`, and `useExisting` for flexible asynchronous configuration.

*   `useFactory`: A function that returns the `MailConfiguration` (or a Promise resolving to it). Dependencies can be injected using the `inject` array.
*   `useClass`: A class that implements `MailModuleOptionsFactory`. The `createMailOptions` method of this class will be called to get the configuration.
*   `useExisting`: An existing provider that implements `MailModuleOptionsFactory`.

## Feature Modules (MailgunModule, SESModule)

The library also provides specific feature modules for Mailgun and AWS SES, which can be used if you prefer to configure these services independently or need to pass specific credentials directly.

### MailgunModule

```typescript
import { Module } from '@nestjs/common';
import { MailgunModule } from '@nestjs-modules/mail';

@Module({
  imports: [
    MailgunModule.forRoot({
      apiKey: 'YOUR_MAILGUN_API_KEY',
      domain: 'YOUR_MAILGUN_DOMAIN',
    }),
  ],
})
export class AppModule {}
```

### SESModule

```typescript
import { Module } from '@nestjs/common';
import { SESModule } from '@nestjs-modules/mail';

@Module({
  imports: [
    SESModule.forRoot({
      accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
      secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
      region: 'YOUR_AWS_REGION',
    }),
  ],
})
export class AppModule {}
```

These feature modules are primarily for direct configuration of the respective services and might be used in conjunction with or as an alternative to the `MailModule`'s integrated transport configuration, depending on your application's architecture.