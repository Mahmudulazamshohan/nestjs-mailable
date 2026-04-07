import { MailBatchSender } from '../batch/mail-batch-sender';
import { BatchItem } from '../batch/batch.interface';
import { MAIL_BATCH_COMPLETED_EVENT, MailBatchCompletedEvent } from '../events/mail-events';

function makeMailService(sendImpl?: (to: string) => Promise<unknown>) {
  const emitEvent = jest.fn();

  const mailService = {
    to: jest.fn().mockImplementation((address: string) => ({
      send: jest.fn().mockImplementation(() => {
        if (sendImpl) return sendImpl(address);
        return Promise.resolve({ messageId: `msg-${address}` });
      }),
    })),
    emitEvent,
  };

  return { mailService, emitEvent };
}

function makeItems(count: number): BatchItem[] {
  return Array.from({ length: count }, (_, i) => ({
    to: `user${i}@example.com`,
    mailable: { subject: `Email ${i}`, html: `<p>${i}</p>` },
  }));
}

describe('MailBatchSender', () => {
  describe('send() — success path', () => {
    it('should send all items and return correct totals', async () => {
      const { mailService } = makeMailService();
      const items = makeItems(5);

      const result = await new MailBatchSender(mailService, items, {}).send();

      expect(result.total).toBe(5);
      expect(result.succeeded).toBe(5);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(5);
    });

    it('should return a result entry for every item', async () => {
      const { mailService } = makeMailService();
      const items = makeItems(3);

      const result = await new MailBatchSender(mailService, items, {}).send();

      for (const r of result.results) {
        expect(r.item).toBeDefined();
        expect(r.result).toBeDefined();
        expect(r.error).toBeUndefined();
      }
    });

    it('should call mailService.to() with each item address', async () => {
      const { mailService } = makeMailService();
      const items = makeItems(3);

      await new MailBatchSender(mailService, items, {}).send();

      expect(mailService.to).toHaveBeenCalledTimes(3);
      expect(mailService.to).toHaveBeenCalledWith('user0@example.com');
      expect(mailService.to).toHaveBeenCalledWith('user1@example.com');
      expect(mailService.to).toHaveBeenCalledWith('user2@example.com');
    });

    it('should handle an empty item list', async () => {
      const { mailService } = makeMailService();

      const result = await new MailBatchSender(mailService, [], {}).send();

      expect(result.total).toBe(0);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(0);
      expect(mailService.to).not.toHaveBeenCalled();
    });
  });

  describe('batchSize', () => {
    it('should process items in chunks of batchSize', async () => {
      const sendOrder: string[] = [];
      const { mailService } = makeMailService(async (to) => {
        sendOrder.push(to);
        return {};
      });
      const items = makeItems(7);

      // batchSize=3: chunks are [0,1,2], [3,4,5], [6]
      await new MailBatchSender(mailService, items, { batchSize: 3, concurrency: 3 }).send();

      expect(sendOrder).toHaveLength(7);
    });

    it('should default batchSize to 10', async () => {
      const { mailService } = makeMailService();
      const items = makeItems(10);

      const result = await new MailBatchSender(mailService, items, {}).send();

      expect(result.total).toBe(10);
      expect(result.succeeded).toBe(10);
    });
  });

  describe('concurrency', () => {
    it('should send at most concurrency items in parallel within a chunk', async () => {
      let activeCount = 0;
      let maxActive = 0;

      const { mailService } = makeMailService(async () => {
        activeCount++;
        maxActive = Math.max(maxActive, activeCount);
        await new Promise((r) => setTimeout(r, 10));
        activeCount--;
        return {};
      });

      const items = makeItems(6);

      await new MailBatchSender(mailService, items, { batchSize: 6, concurrency: 3 }).send();

      expect(maxActive).toBeLessThanOrEqual(3);
    });
  });

  describe('error handling', () => {
    it('should record errors in results when continueOnError is true', async () => {
      let callCount = 0;
      const { mailService } = makeMailService(async () => {
        callCount++;
        if (callCount === 2) throw new Error('send failed');
        return {};
      });
      const items = makeItems(3);

      const result = await new MailBatchSender(mailService, items, { continueOnError: true }).send();

      expect(result.total).toBe(3);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results.find((r) => r.error)).toBeDefined();
    });

    it('should stop processing after first failure when continueOnError is false', async () => {
      let callCount = 0;
      const { mailService } = makeMailService(async () => {
        callCount++;
        if (callCount === 1) throw new Error('immediate fail');
        return {};
      });
      const items = makeItems(5);

      await expect(
        new MailBatchSender(mailService, items, {
          batchSize: 5,
          concurrency: 1,
          continueOnError: false,
        }).send(),
      ).rejects.toThrow('immediate fail');

      expect(callCount).toBeLessThan(5);
    });

    it('should populate the error property on failed result entries', async () => {
      const sendError = new Error('transport error');
      const { mailService } = makeMailService(async () => {
        throw sendError;
      });
      const items = makeItems(1);

      const result = await new MailBatchSender(mailService, items, { continueOnError: true }).send();

      expect(result.results[0].error).toBe(sendError);
      expect(result.results[0].result).toBeUndefined();
    });

    it('should stop collecting further chunks when a result has error and continueOnError is false', async () => {
      const { mailService } = makeMailService();
      const items = makeItems(4);
      const sender = new MailBatchSender(mailService, items, {
        batchSize: 2,
        concurrency: 1,
        continueOnError: false,
      });

      const processChunk = jest
        .spyOn(sender as any, 'processChunk')
        .mockResolvedValueOnce([{ item: items[0], error: new Error('chunk failure') }])
        .mockResolvedValueOnce([{ item: items[2], result: {} }]);

      const result = await sender.send();

      expect(result.total).toBe(4);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(processChunk).toHaveBeenCalledTimes(1);
    });
  });

  describe('event emission', () => {
    it('should emit MAIL_BATCH_COMPLETED_EVENT after send completes', async () => {
      const { mailService, emitEvent } = makeMailService();
      const items = makeItems(3);

      await new MailBatchSender(mailService, items, {}).send();

      expect(emitEvent).toHaveBeenCalledWith(MAIL_BATCH_COMPLETED_EVENT, expect.any(MailBatchCompletedEvent));
    });

    it('should include correct counts in the MailBatchCompletedEvent', async () => {
      let callCount = 0;
      const { mailService, emitEvent } = makeMailService(async () => {
        callCount++;
        if (callCount === 2) throw new Error('fail');
        return {};
      });
      const items = makeItems(3);

      await new MailBatchSender(mailService, items, { continueOnError: true }).send();

      const event: MailBatchCompletedEvent = emitEvent.mock.calls[0][1];
      expect(event.total).toBe(3);
      expect(event.succeeded).toBe(2);
      expect(event.failed).toBe(1);
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should emit MAIL_BATCH_COMPLETED_EVENT even when all items fail', async () => {
      const { mailService, emitEvent } = makeMailService(async () => {
        throw new Error('all fail');
      });
      const items = makeItems(2);

      await new MailBatchSender(mailService, items, { continueOnError: true }).send();

      expect(emitEvent).toHaveBeenCalledWith(MAIL_BATCH_COMPLETED_EVENT, expect.any(MailBatchCompletedEvent));
      const event: MailBatchCompletedEvent = emitEvent.mock.calls[0][1];
      expect(event.failed).toBe(2);
      expect(event.succeeded).toBe(0);
    });
  });

  describe('options defaults', () => {
    it('should work when options are omitted', async () => {
      const { mailService } = makeMailService();
      const items = makeItems(2);

      const result = await new MailBatchSender(mailService, items).send();

      expect(result.total).toBe(2);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should default continueOnError to true', async () => {
      let callCount = 0;
      const { mailService } = makeMailService(async () => {
        callCount++;
        if (callCount === 1) throw new Error('fail');
        return {};
      });
      const items = makeItems(3);

      // No continueOnError specified — should default to true
      const result = await new MailBatchSender(mailService, items, { batchSize: 3, concurrency: 1 }).send();

      expect(callCount).toBe(3);
      expect(result.failed).toBe(1);
      expect(result.succeeded).toBe(2);
    });
  });
});
