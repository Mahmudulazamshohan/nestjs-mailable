import { Address, Content } from '../interfaces/mail.interface';
import { Mailable } from '../classes/mailable';

export interface BatchItem {
  to: string | Address | Array<string | Address>;
  mailable: Content | Mailable;
}

export interface BatchOptions {
  batchSize?: number;
  concurrency?: number;
  continueOnError?: boolean;
}

export interface BatchResultItem {
  item: BatchItem;
  result?: unknown;
  error?: Error;
}

export interface BatchResult {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchResultItem[];
}
