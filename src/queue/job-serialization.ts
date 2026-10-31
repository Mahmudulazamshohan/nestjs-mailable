import { Attachment } from '../interfaces/mail.interface';
import { QueuedMail } from './mail-queue.interface';

interface SerializedBuffer {
  __buffer: string;
}

const isSerializedBuffer = (value: unknown): value is SerializedBuffer =>
  typeof value === 'object' && value !== null && typeof (value as SerializedBuffer).__buffer === 'string';

/** Makes a job JSON-safe by encoding Buffer attachment content as base64. */
export function serializeJob(job: QueuedMail): QueuedMail {
  if (!job.content.attachments?.length) {
    return job;
  }
  const attachments = job.content.attachments.map((attachment) =>
    Buffer.isBuffer(attachment.content)
      ? ({ ...attachment, content: { __buffer: attachment.content.toString('base64') } } as unknown as Attachment)
      : attachment,
  );
  return { ...job, content: { ...job.content, attachments } };
}

/** Restores Buffer attachment content encoded by serializeJob. */
export function reviveJob(job: QueuedMail): QueuedMail {
  if (!job.content.attachments?.length) {
    return job;
  }
  const attachments = job.content.attachments.map((attachment) =>
    isSerializedBuffer(attachment.content)
      ? { ...attachment, content: Buffer.from(attachment.content.__buffer, 'base64') }
      : attachment,
  );
  return { ...job, content: { ...job.content, attachments } };
}
