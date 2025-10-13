import { MailModule, TransportType, TEMPLATE_ENGINE } from '../../../../dist';
import { createSMTPConfig, createSESConfig, createMailgunConfig } from '../../../../dist';

/**
 * Examples demonstrating TypeScript type checking for transport configurations
 * These examples will show compile-time errors for missing required fields
 */

// CORRECT: SMTP Configuration with all required fields
const correctSMTPConfig = createSMTPConfig({
  host: 'smtp.gmail.com',
  auth: {
    user: 'user@gmail.com',
    pass: 'password',
  },
  port: 587,
  secure: false,
});

// INCORRECT: SMTP Configuration missing required 'host' field
// Uncomment the following to see TypeScript error:
/*
const incorrectSMTPConfig = createSMTPConfig({
  // host: 'smtp.gmail.com', // Missing required field
  auth: {
    user: 'user@gmail.com',
    pass: 'password',
  },
});
*/

// INCORRECT: SMTP Configuration missing required 'auth.user' field
// Uncomment the following to see TypeScript error:
/*
const incorrectSMTPAuthConfig = createSMTPConfig({
  host: 'smtp.gmail.com',
  auth: {
    // user: 'user@gmail.com', // Missing required field
    pass: 'password',
  },
});
*/

// CORRECT: SES Configuration with all required fields
const correctSESConfig = createSESConfig({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
  },
  endpoint: 'https://email.us-east-1.amazonaws.com',
});

// INCORRECT: SES Configuration missing required 'region' field
// Uncomment the following to see TypeScript error:
/*
const incorrectSESConfig = createSESConfig({
  // region: 'us-east-1', // Missing required field
  credentials: {
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
  },
});
*/

// INCORRECT: SES Configuration missing required 'credentials.accessKeyId' field
// Uncomment the following to see TypeScript error:
/*
const incorrectSESCredentialsConfig = createSESConfig({
  region: 'us-east-1',
  credentials: {
    // accessKeyId: 'your-access-key', // Missing required field
    secretAccessKey: 'your-secret-key',
  },
});
*/

// CORRECT: Mailgun Configuration with all required fields
const correctMailgunConfig = createMailgunConfig({
  domain: 'mg.yourdomain.com',
  apiKey: 'your-mailgun-api-key',
  host: 'api.mailgun.net',
  timeout: 5000,
});

// INCORRECT: Mailgun Configuration missing required 'domain' field
// Uncomment the following to see TypeScript error:
/*
const incorrectMailgunConfig = createMailgunConfig({
  // domain: 'mg.yourdomain.com', // Missing required field
  apiKey: 'your-mailgun-api-key',
});
*/

// INCORRECT: Mailgun Configuration missing required 'apiKey' field
// Uncomment the following to see TypeScript error:
/*
const incorrectMailgunApiConfig = createMailgunConfig({
  domain: 'mg.yourdomain.com',
  // apiKey: 'your-mailgun-api-key', // Missing required field
});
*/

// CORRECT: Module configuration examples with type checking
export class TypeSafeConfigExamples {
  // SMTP Module Configuration
  static getSMTPModule() {
    return MailModule.forRoot({
      transport: correctSMTPConfig,
      from: { address: 'noreply@yourapp.com', name: 'Your App' },
      templates: {
        engine: TEMPLATE_ENGINE.HANDLEBARS,
        directory: './templates',
      },
    });
  }

  // SES Module Configuration
  static getSESModule() {
    return MailModule.forRoot({
      transport: correctSESConfig,
      from: { address: 'noreply@yourapp.com', name: 'Your App' },
      templates: {
        engine: TEMPLATE_ENGINE.HANDLEBARS,
        directory: './templates',
      },
    });
  }

  // Mailgun Module Configuration
  static getMailgunModule() {
    return MailModule.forRoot({
      transport: correctMailgunConfig,
      from: { address: 'noreply@yourapp.com', name: 'Your App' },
      templates: {
        engine: TEMPLATE_ENGINE.HANDLEBARS,
        directory: './templates',
      },
    });
  }

  // INCORRECT: Direct configuration with wrong transport type
  // Uncomment the following to see TypeScript error:
  /*
  static getIncorrectModule() {
    return MailModule.forRoot({
      transport: {
        type: TransportType.SES,
        // TypeScript error: Missing required 'region' and 'credentials' for SES
        host: 'smtp.gmail.com', // Invalid field for SES transport
      },
      from: { address: 'noreply@yourapp.com', name: 'Your App' },
    });
  }
  */
}

/**
 * Runtime validation examples
 * TypeScript catches these at compile time, but you can also add runtime checks
 */
export function validateTransportConfig(config: any): void {
  switch (config.type) {
    case TransportType.SMTP:
      if (!config.host) {
        throw new Error('SMTP transport requires host field');
      }
      if (!config.auth || !config.auth.user || !config.auth.pass) {
        throw new Error('SMTP transport requires auth.user and auth.pass fields');
      }
      break;

    case TransportType.SES:
      if (!config.region) {
        throw new Error('SES transport requires region field');
      }
      if (!config.credentials || !config.credentials.accessKeyId || !config.credentials.secretAccessKey) {
        throw new Error('SES transport requires credentials.accessKeyId and credentials.secretAccessKey fields');
      }
      break;

    case TransportType.MAILGUN:
      if (!config.options || !config.options.domain || !config.options.apiKey) {
        throw new Error('Mailgun transport requires options.domain and options.apiKey fields');
      }
      break;

    default:
      throw new Error(`Unknown transport type: ${config.type}`);
  }
}
