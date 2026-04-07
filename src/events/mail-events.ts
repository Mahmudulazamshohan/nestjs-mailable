import { Content } from '../interfaces/mail.interface';

export const MAIL_SENT_EVENT = 'mail.sent';
export const MAIL_FAILED_EVENT = 'mail.failed';
export const MAIL_BATCH_COMPLETED_EVENT = 'mail.batch.completed';

export class MailSentEvent {
  constructor(
    public readonly content: Content,
    public readonly result: unknown,
    public readonly timestamp: Date,
  ) {}
}

export class MailFailedEvent {
  constructor(
    public readonly content: Content,
    public readonly error: Error,
    public readonly attempts: number,
    public readonly timestamp: Date,
  ) {}
}

export class MailBatchCompletedEvent {
  constructor(
    public readonly total: number,
    public readonly succeeded: number,
    public readonly failed: number,
    public readonly timestamp: Date,
  ) {}
}
