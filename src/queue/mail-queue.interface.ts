import { Content } from '../interfaces/mail.interface';

export const MAIL_QUEUE = 'MAIL_QUEUE';

/** A built message waiting to be delivered, optionally pinned to a named mailer. */
export interface QueuedMail {
  content: Content;
  mailer?: string;
}

export interface QueueDispatchOptions {
  /** Milliseconds to wait before the job becomes eligible for delivery. */
  delay?: number;
}

export type QueuedMailHandler = (job: QueuedMail) => Promise<unknown>;

/** Adapter between MailService and a job queue implementation. */
export interface MailQueue {
  /** Enqueues a job for later delivery. */
  dispatch(job: QueuedMail, options?: QueueDispatchOptions): Promise<unknown>;
  /** Registers the handler that delivers jobs. Called once by MailService. */
  process(handler: QueuedMailHandler): void;
  close?(): Promise<void>;
}

export interface MemoryQueueConfiguration {
  driver: 'memory';
}

export interface BullMqQueueConfiguration {
  driver: 'bullmq';
  /** ioredis connection options or instance, passed straight to BullMQ. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: any;
  queueName?: string;
  /** Default BullMQ job options, e.g. `{ attempts: 3, backoff: { type: 'exponential', delay: 1000 } }`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultJobOptions?: Record<string, any>;
  /** Extra BullMQ worker options, e.g. `{ concurrency: 5 }`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workerOptions?: Record<string, any>;
}

export type QueueConfiguration = MemoryQueueConfiguration | BullMqQueueConfiguration;
