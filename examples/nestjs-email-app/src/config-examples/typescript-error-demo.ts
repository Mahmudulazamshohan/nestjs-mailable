/**
 * This file demonstrates TypeScript compile-time errors for missing required fields
 * Uncomment the code blocks below to see TypeScript errors in your IDE
 */

import { MailModule, TransportType, TEMPLATE_ENGINE } from '../../../../dist';

/*
//  TYPESCRIPT ERROR: Property 'host' is missing in type
const invalidSMTPConfig = MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    // host: 'smtp.gmail.com', //  Missing required field - TypeScript error
    auth: {
      user: 'user@gmail.com',
      pass: 'password',
    },
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
});
*/

/*
//  TYPESCRIPT ERROR: Property 'user' is missing in type
const invalidSMTPAuthConfig = MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'smtp.gmail.com',
    auth: {
      // user: 'user@gmail.com', //  Missing required field - TypeScript error
      pass: 'password',
    },
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
});
*/

/*
//  TYPESCRIPT ERROR: Property 'pass' is missing in type
const invalidSMTPPasswordConfig = MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'smtp.gmail.com',
    auth: {
      user: 'user@gmail.com',
      // pass: 'password', //  Missing required field - TypeScript error
    },
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
});
*/

/*
//  TYPESCRIPT ERROR: Property 'region' is missing in type
const invalidSESConfig = MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    // region: 'us-east-1', //  Missing required field - TypeScript error
    credentials: {
      accessKeyId: 'your-access-key',
      secretAccessKey: 'your-secret-key',
    },
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
});
*/

/*
//  TYPESCRIPT ERROR: Property 'credentials' is missing in type
const invalidSESCredentialsConfig = MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    // credentials: { ... }, //  Missing required field - TypeScript error
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
});
*/

/*
//  TYPESCRIPT ERROR: Property 'accessKeyId' is missing in type
const invalidSESAccessKeyConfig = MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    credentials: {
      // accessKeyId: 'your-access-key', //  Missing required field - TypeScript error
      secretAccessKey: 'your-secret-key',
    },
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
});
*/

/*
//  TYPESCRIPT ERROR: Property 'secretAccessKey' is missing in type
const invalidSESSecretKeyConfig = MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'your-access-key',
      // secretAccessKey: 'your-secret-key', //  Missing required field - TypeScript error
    },
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
});
*/

/*
//  TYPESCRIPT ERROR: Property 'options' is missing in type
const invalidMailgunConfig = MailModule.forRoot({
  transport: {
    type: TransportType.MAILGUN,
    // options: { ... }, //  Missing required field - TypeScript error
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
});
*/

/*
//  TYPESCRIPT ERROR: Property 'domain' is missing in type
const invalidMailgunDomainConfig = MailModule.forRoot({
  transport: {
    type: TransportType.MAILGUN,
    options: {
      // domain: 'mg.yourdomain.com', //  Missing required field - TypeScript error
      apiKey: 'your-mailgun-api-key',
    },
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
});
*/

/*
//  TYPESCRIPT ERROR: Property 'apiKey' is missing in type
const invalidMailgunApiKeyConfig = MailModule.forRoot({
  transport: {
    type: TransportType.MAILGUN,
    options: {
      domain: 'mg.yourdomain.com',
      // apiKey: 'your-mailgun-api-key', //  Missing required field - TypeScript error
    },
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
});
*/

/*
//  TYPESCRIPT ERROR: Type '{ type: "ses"; host: string; }' is not assignable to type 'TransportConfiguration'
// This shows that you can't mix properties from different transport types
const invalidMixedConfig = MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    host: 'smtp.gmail.com', //  'host' is not valid for SES transport - TypeScript error
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
});
*/

// VALID: Correct SMTP configuration
export const validSMTPConfig = MailModule.forRoot({
  transport: {
    type: TransportType.SMTP,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'user@gmail.com',
      pass: 'password',
    },
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
  },
});

// VALID: Correct SES configuration
export const validSESConfig = MailModule.forRoot({
  transport: {
    type: TransportType.SES,
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'your-access-key',
      secretAccessKey: 'your-secret-key',
    },
    endpoint: 'https://email.us-east-1.amazonaws.com',
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
  },
});

// VALID: Correct Mailgun configuration
export const validMailgunConfig = MailModule.forRoot({
  transport: {
    type: TransportType.MAILGUN,
    options: {
      domain: 'mg.yourdomain.com',
      apiKey: 'your-mailgun-api-key',
      host: 'api.mailgun.net',
      timeout: 5000,
    },
  },
  from: { address: 'noreply@yourapp.com', name: 'Your App' },
  templates: {
    engine: TEMPLATE_ENGINE.HANDLEBARS,
    directory: './templates',
  },
});

/**
 * Instructions to test TypeScript errors:
 *
 * 1. Uncomment any of the invalid configuration blocks above
 * 2. Run: npx tsc --noEmit
 * 3. You should see TypeScript compilation errors pointing to missing required fields
 * 4. Your IDE (VS Code, WebStorm, etc.) should also show red squiggly lines
 *
 * This demonstrates that TypeScript now enforces:
 * - SMTP requires: host, auth.user, auth.pass
 * - SES requires: region, credentials.accessKeyId, credentials.secretAccessKey
 * - Mailgun requires: options.domain, options.apiKey
 * - You cannot mix properties from different transport types
 */
