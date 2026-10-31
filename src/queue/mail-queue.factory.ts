import { MailQueue, QueueConfiguration } from './mail-queue.interface';
import { InMemoryMailQueue } from './in-memory-mail-queue';
import { BullMqMailQueue } from './bullmq-mail-queue';

/** Builds the queue adapter for a queue configuration. Returns null when queueing is not configured. */
export function createMailQueue(config?: QueueConfiguration): MailQueue | null {
  if (!config) {
    return null;
  }
  switch (config.driver) {
    case 'memory':
      return new InMemoryMailQueue();
    case 'bullmq':
      return new BullMqMailQueue(config);
    default:
      throw new Error(`Unsupported queue driver: ${(config as { driver?: string }).driver ?? 'unknown'}`);
  }
}
