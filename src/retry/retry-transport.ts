import { Content, MailTransport, RetryOptions } from '../interfaces/mail.interface';

export class RetryExhaustedError extends Error {
  constructor(
    public readonly attempts: number,
    cause: Error,
  ) {
    super(`Mail delivery failed after ${attempts} attempt(s): ${cause.message}`);
    this.name = 'RetryExhaustedError';
    if (cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

export class RetryTransport implements MailTransport {
  constructor(
    private readonly inner: MailTransport,
    private readonly options: RetryOptions,
  ) {}

  async send(content: Content): Promise<unknown> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= this.options.attempts; attempt++) {
      try {
        return await this.inner.send(content);
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.options.attempts) {
          await this.sleep(this.computeDelay(attempt));
        }
      }
    }

    throw new RetryExhaustedError(this.options.attempts, lastError);
  }

  async verify(): Promise<boolean> {
    if (this.inner.verify) {
      return this.inner.verify();
    }
    return true;
  }

  async close(): Promise<void> {
    if (this.inner.close) {
      return this.inner.close();
    }
  }

  private computeDelay(attempt: number): number {
    const delay = this.options.delay ?? 1000;
    const maxDelay = this.options.maxDelay;
    const strategy = this.options.strategy ?? 'exponential';

    let computed: number;

    switch (strategy) {
      case 'linear':
        computed = delay * attempt;
        break;
      case 'fixed':
        computed = delay;
        break;
      case 'exponential':
      default:
        computed = delay * Math.pow(2, attempt - 1);
    }

    if (maxDelay !== undefined) {
      computed = Math.min(computed, maxDelay);
    }

    if (this.options.jitter) {
      computed += Math.random() * delay;
    }

    return computed;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
