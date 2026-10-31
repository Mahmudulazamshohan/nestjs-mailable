import {
  MailQueue,
  BullMqQueueConfiguration,
  QueueDispatchOptions,
  QueuedMail,
  QueuedMailHandler,
} from './mail-queue.interface';
import { reviveJob, serializeJob } from './job-serialization';

const JOB_NAME = 'send-mail';

/* eslint-disable @typescript-eslint/no-explicit-any */
function loadBullMq(): { Queue: any; Worker: any } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('bullmq');
  } catch {
    throw new Error('BullMQ queue driver is not available. Please install it with: npm install bullmq');
  }
}

/** Durable, retryable queue on Redis via BullMQ. Requires the optional `bullmq` package. */
export class BullMqMailQueue implements MailQueue {
  private readonly queue: any;
  private worker?: any;
  private readonly bullmq = loadBullMq();

  constructor(private readonly config: BullMqQueueConfiguration) {
    if (!config.connection) {
      throw new Error('BullMQ queue requires a connection configuration');
    }
    this.queue = new this.bullmq.Queue(config.queueName ?? 'mail', {
      connection: config.connection,
      defaultJobOptions: config.defaultJobOptions,
    });
  }

  async dispatch(job: QueuedMail, options: QueueDispatchOptions = {}): Promise<{ id?: string }> {
    const added = await this.queue.add(JOB_NAME, serializeJob(job), options.delay ? { delay: options.delay } : {});
    return { id: added.id };
  }

  process(handler: QueuedMailHandler): void {
    this.worker = new this.bullmq.Worker(
      this.config.queueName ?? 'mail',
      async (bullJob: { data: QueuedMail }) => handler(reviveJob(bullJob.data)),
      { connection: this.config.connection, ...this.config.workerOptions },
    );
  }

  async close(): Promise<void> {
    await this.worker?.close();
    await this.queue.close();
  }
}
