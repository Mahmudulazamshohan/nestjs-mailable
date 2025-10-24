// Core services and module
export { MailService } from './services/mail.service';
export { MailModule } from './mail.module';

// Interfaces and types
export * from './interfaces/mail.interface';
export * from './types/transport.type';
export * from './types/transport-config.helpers';

// Constants
export * from './constants/template.constants';

// Mailable classes
export { Mailable, AttachmentBuilder } from './classes/mailable';

// Builder for fluent API
export { MailableBuilder } from './builders/mailable.builder';

// Testing utilities
export * from './testing';
