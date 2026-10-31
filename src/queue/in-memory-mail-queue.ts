import { Logger } from '@nestjs/common';
import { MailQueue, QueueDispatchOptions, QueuedMail, QueuedMailHandler } from './mail-queue.interface';

/**
 * In-process queue backed by timers. Jobs are lost on restart and never retried,
 * so use it for development and tests, and BullMQ (or a custom adapter) in production.
 */
export class InMemoryMailQueue implements MailQueue {
  private readonly logger = new Logger(InMemoryMailQueue.name);
  private handler?: QueuedMailHandler;
  private timers = new Set<NodeJS.Timeout>();
  private running = new Set<Promise<void>>();
  private nextId = 1;

  async dispatch(job: QueuedMail, options: QueueDispatchOptions = {}): Promise<{ id: string }> {
    const id = String(this.nextId++);
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      this.run(id, job);
    }, options.delay ?? 0);
    timer.unref?.();
    this.timers.add(timer);
    return { id };
  }

  process(handler: QueuedMailHandler): void {
    this.handler = handler;
  }

  /** Resolves once every job that has started running has finished. Pending delayed jobs are not awaited. */
  async drain(): Promise<void> {
    while (this.running.size > 0) {
      await Promise.allSettled([...this.running]);
    }
  }

  async close(): Promise<void> {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    await this.drain();
  }

  private run(id: string, job: QueuedMail): void {
    if (!this.handler) {
      this.logger.error(`Queued mail ${id} dropped: no handler registered`);
      return;
    }
    const promise = this.handler(job)
      .then(() => undefined)
      .catch((error: Error) => this.logger.error(`Queued mail ${id} failed: ${error.message}`, error.stack))
      .finally(() => this.running.delete(promise));
    this.running.add(promise);
  }
}
