import { TransportType } from './transport.type';
import {
  SMTPTransportConfiguration,
  SESTransportConfiguration,
  MailgunTransportConfiguration,
} from '../interfaces/mail.interface';

/**
 * Helper functions to create properly typed transport configurations
 * These functions ensure TypeScript type checking at compile time
 */

/**
 * Creates an SMTP transport configuration with required fields
 */
export function createSMTPConfig(config: {
  host: string;
  auth: {
    user: string;
    pass: string;
  };
  port?: number;
  secure?: boolean;
  ignoreTLS?: boolean;
}): SMTPTransportConfiguration {
  return {
    type: TransportType.SMTP,
    host: config.host,
    auth: config.auth,
    port: config.port,
    secure: config.secure,
    ignoreTLS: config.ignoreTLS,
  };
}

/**
 * Creates an SES transport configuration with required fields
 */
export function createSESConfig(config: {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  endpoint?: string;
}): SESTransportConfiguration {
  return {
    type: TransportType.SES,
    region: config.region,
    credentials: config.credentials,
    endpoint: config.endpoint,
  };
}

/**
 * Creates a Mailgun transport configuration with required fields
 */
export function createMailgunConfig(config: {
  domain: string;
  apiKey: string;
  host?: string;
  timeout?: number;
}): MailgunTransportConfiguration {
  return {
    type: TransportType.MAILGUN,
    options: {
      domain: config.domain,
      apiKey: config.apiKey,
      host: config.host,
      timeout: config.timeout,
    },
  };
}

/**
 * Type guard functions to check transport configuration types
 */
export function isSMTPConfig(config: any): config is SMTPTransportConfiguration {
  return config?.type === TransportType.SMTP;
}

export function isSESConfig(config: any): config is SESTransportConfiguration {
  return config?.type === TransportType.SES;
}

export function isMailgunConfig(config: any): config is MailgunTransportConfiguration {
  return config?.type === TransportType.MAILGUN;
}
