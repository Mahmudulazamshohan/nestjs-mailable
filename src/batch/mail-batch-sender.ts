import { Address, Content } from '../interfaces/mail.interface';
import { Mailable } from '../classes/mailable';
import { BatchItem, BatchOptions, BatchResult, BatchResultItem } from './batch.interface';
import { MAIL_BATCH_COMPLETED_EVENT, MailBatchCompletedEvent } from '../events/mail-events';

/**
 * Minimal interface to avoid circular dependency with MailService.
 */
interface BatchMailService {
  to(address: string | Address | Array<string | Address>): {
    send(mailable: Content | Mailable): Promise<unknown>;
  };
  emitEvent(event: string, payload: unknown): void;
}

export class MailBatchSender {
  private readonly batchSize: number;
  private readonly concurrency: number;
  private readonly continueOnError: boolean;

  constructor(
    private readonly mailService: BatchMailService,
    private readonly items: BatchItem[],
    options: BatchOptions = {},
  ) {
    this.batchSize = options.batchSize ?? 10;
    this.concurrency = options.concurrency ?? 5;
    this.continueOnError = options.continueOnError ?? true;
  }

  async send(): Promise<BatchResult> {
    const results: BatchResultItem[] = [];
    let succeeded = 0;
    let failed = 0;

    const chunks = this.chunk(this.items, this.batchSize);

    outer: for (const chunk of chunks) {
      const chunkResults = await this.processChunk(chunk);
      for (const r of chunkResults) {
        results.push(r);
        if (r.error) {
          failed++;
          if (!this.continueOnError) break outer;
        } else {
          succeeded++;
        }
      }
    }

    const batchResult: BatchResult = {
      total: this.items.length,
      succeeded,
      failed,
      results,
    };

    this.mailService.emitEvent(
      MAIL_BATCH_COMPLETED_EVENT,
      new MailBatchCompletedEvent(batchResult.total, batchResult.succeeded, batchResult.failed, new Date()),
    );

    return batchResult;
  }

  private async processChunk(chunk: BatchItem[]): Promise<BatchResultItem[]> {
    const results: BatchResultItem[] = [];

    for (let i = 0; i < chunk.length; i += this.concurrency) {
      const slice = chunk.slice(i, i + this.concurrency);
      const sliceResults = await Promise.all(
        slice.map(async (item): Promise<BatchResultItem> => {
          try {
            const result = await this.mailService.to(item.to).send(item.mailable);
            return { item, result };
          } catch (error) {
            if (!this.continueOnError) throw error;
            return { item, error: error as Error };
          }
        }),
      );
      results.push(...sliceResults);
    }

    return results;
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
