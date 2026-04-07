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

// Event system
export { MAIL_EVENT_EMITTER } from './events/mail-events.interface';
export type { MailEventEmitter } from './events/mail-events.interface';
export {
  MAIL_SENT_EVENT,
  MAIL_FAILED_EVENT,
  MAIL_BATCH_COMPLETED_EVENT,
  MailSentEvent,
  MailFailedEvent,
  MailBatchCompletedEvent,
} from './events/mail-events';

// Batch sending
export { MailBatchSender } from './batch/mail-batch-sender';
export type { BatchItem, BatchOptions, BatchResult, BatchResultItem } from './batch/batch.interface';

// Retry
export { RetryExhaustedError } from './retry/retry-transport';

// Testing utilities
export * from './testing';
