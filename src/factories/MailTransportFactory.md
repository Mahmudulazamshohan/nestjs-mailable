# MailTransportFactory Usage

The `MailTransportFactory` is a core component responsible for creating and managing different types of mail transport mechanisms within the Mailable library. It implements the Factory Pattern, allowing for flexible and extensible mail transport configuration.

## Purpose

The primary purpose of `MailTransportFactory` is to abstract the complexity of creating various mail transport instances (e.g., SMTP, SES, custom transports). It provides a centralized way to configure and retrieve the appropriate transport based on your application's needs.

## Key Features

-   **Factory Pattern**: Provides a `createTransport` method to instantiate different `MailTransport` implementations based on a configuration.
-   **Extensibility**: Allows registration of custom transport types using `registerCustomTransport`.
-   **Transport Strategy**: Offers `getAvailableTransports` to list supported transport types.
-   **Builder Pattern Integration**: Integrates with `TransportChainBuilder` for constructing complex transport chains (though `buildFailover` and `buildRoundRobin` methods have been removed).

## Usage

### 1. Creating a Transport

You can create a mail transport by providing a `MailerConfig` object to the `createTransport` method.

```typescript
import { MailTransportFactory } from './mail-transport.factory';
import { MailerConfig, SesMailerOptions } from '../interfaces/mail.interface';

const factory = new MailTransportFactory();

// SMTP Transport Configuration
const smtpConfig: MailerConfig = {
    transport: 'smtp',
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
        user: 'username',
        pass: 'password',
    },
};

const smtpTransport = factory.createTransport(smtpConfig);
console.log('SMTP Transport created:', smtpTransport);

// SES Transport Configuration
const sesConfig: MailerConfig = {
    transport: 'ses',
    options: {
        accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
        secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
        region: 'YOUR_AWS_REGION',
        // You can add other SES-specific options here as defined in SesMailerOptions
        // e.g., sessionToken, httpOptions, etc.
    } as SesMailerOptions,
};

const sesTransport = factory.createTransport(sesConfig);
console.log('SES Transport created:', sesTransport);
```

### 2. Registering Custom Transports

If you have a custom mail transport implementation, you can register it with the factory.

```typescript
import { MailTransportFactory } from './mail-transport.factory';
import { MailTransport, MailerConfig } from '../interfaces/mail.interface';

class CustomMailTransport implements MailTransport {
    async send(mail: any): Promise<any> {
        console.log('Sending mail via custom transport:', mail);
        return { messageId: 'custom-123' };
    }
}

const factory = new MailTransportFactory();

factory.registerCustomTransport('my-custom-transport', () => new CustomMailTransport());

const customConfig: MailerConfig = {
    transport: 'custom',
    options: { type: 'my-custom-transport' },
};

const customTransport = factory.createTransport(customConfig);
console.log('Custom Transport created:', customTransport);
```

### 3. Getting Available Transports

You can retrieve a list of all currently supported transport types.

```typescript
import { MailTransportFactory } from './mail-transport.factory';

const factory = new MailTransportFactory();
const availableTransports = factory.getAvailableTransports();
console.log('Available Transports:', availableTransports); // Output: [ 'smtp', 'ses', 'mailgun', 'custom' ]
```

### 4. Building Transport Chains (Deprecated/Removed Methods)

The `buildTransportChain` method returns a `TransportChainBuilder`. While the original implementation might have supported failover or round-robin chains, these specific builder methods (`buildFailover`, `buildRoundRobin`) have been removed. You can still use `addSmtp` and `addSes` to add individual transports to a chain, but the chaining logic for failover/roundrobin would need to be implemented externally or through a custom transport.

```typescript
import { MailTransportFactory } from './mail-transport.factory';

const factory = new MailTransportFactory();
const chainBuilder = factory.buildTransportChain();

// Example of adding transports to a chain (without specific failover/roundrobin logic)
chainBuilder
    .addSmtp({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: { user: 'user1', pass: 'pass1' },
    })
    .addSes({
        accessKeyId: 'KEY2',
        secretAccessKey: 'SECRET2',
        region: 'us-east-2',
    });

// The transports are stored in the builder, but how they are used (e.g., failover) depends on external logic.
console.log('Transport Chain Builder:', chainBuilder);
```

## Integration with NestJS

Since `MailTransportFactory` is `@Injectable()`, you can inject it into your NestJS services or modules to leverage its functionality within your application's dependency injection system.

```typescript
import { Injectable } from '@nestjs/common';
import { MailTransportFactory } from './mail-transport.factory';
import { MailerConfig } from '../interfaces/mail.interface';

@Injectable()
export class MyMailService {
    constructor(private readonly mailTransportFactory: MailTransportFactory) {}

    sendEmail(config: MailerConfig, mailContent: any) {
        const transport = this.mailTransportFactory.createTransport(config);
        return transport.send(mailContent);
    }
}

// Example mailContent objects:

// Basic text email
const textEmail = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Hello from Mailable',
    text: 'This is a plain text email',
};

// HTML email with attachments
const htmlEmail = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'HTML Email with Attachments',
    html: '<h1>Welcome</h1><p>This is an HTML email</p>',
    attachments: [
        {
            filename: 'document.pdf',
            path: '/path/to/document.pdf'
        }
    ]
};

// Email with CC, BCC and custom headers
const complexEmail = {
    from: 'sender@example.com',
    to: 'recipient@example.com',
    cc: 'cc@example.com',
    bcc: 'bcc@example.com',
    subject: 'Complex Email',
    text: 'This email has multiple recipients and custom headers',
    headers: {
        'X-Custom-Header': 'Custom Value',
        'X-Another-Header': 'Another Value'
    }
};

// Using the service
const myMailService = new MyMailService(new MailTransportFactory());

// Send a text email
myMailService.sendEmail(smtpConfig, textEmail);

// Send an HTML email with attachments
myMailService.sendEmail(smtpConfig, htmlEmail);

// Send a complex email
myMailService.sendEmail(smtpConfig, complexEmail);
```