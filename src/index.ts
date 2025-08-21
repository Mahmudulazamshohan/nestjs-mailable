// Core services and module
export { MailService } from './services/mail.service';
export { MailModule } from './mail.module';

// Interfaces and types
export * from './interfaces/mail.interface';
export * from './types/transport.type';

// Constants
export * from './constants/template.constants';
export { Mailable } from './mailables/mailable';

// Advanced mailable classes
export { Mailable as MailableClass, AttachmentBuilder } from './classes/mailable';

// Builder for fluent API
export { MailableBuilder } from './builders/mailable.builder';
