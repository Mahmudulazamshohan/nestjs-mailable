import { Content, MailTransport } from '../interfaces/mail.interface';

export type FailoverStrategy = 'ordered' | 'roundrobin';

export class FailoverExhaustedError extends Error {
  constructor(public readonly errors: Error[]) {
    super(`All ${errors.length} transport(s) failed: ${errors.map((e) => e.message).join(' | ')}`);
    this.name = 'FailoverExhaustedError';
  }
}

/**
 * Tries each transport until one succeeds.
 * `ordered` always starts from the first transport, `roundrobin` rotates the starting transport per send.
 */
export class FailoverTransport implements MailTransport {
  private next = 0;

  constructor(
    private readonly transports: MailTransport[],
    private readonly strategy: FailoverStrategy = 'ordered',
  ) {
    if (transports.length === 0) {
      throw new Error('Failover transport requires at least one transport');
    }
  }

  async send(content: Content): Promise<unknown> {
    const start = this.strategy === 'roundrobin' ? this.next++ % this.transports.length : 0;
    const errors: Error[] = [];

    for (let i = 0; i < this.transports.length; i++) {
      try {
        return await this.transports[(start + i) % this.transports.length].send(content);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    throw new FailoverExhaustedError(errors);
  }

  /** True when at least one transport verifies (transports without verify() count as healthy). */
  async verify(): Promise<boolean> {
    const results = await Promise.all(this.transports.map((t) => (t.verify ? t.verify().catch(() => false) : true)));
    return results.some(Boolean);
  }

  async close(): Promise<void> {
    await Promise.all(this.transports.map((t) => t.close?.()));
  }
}
