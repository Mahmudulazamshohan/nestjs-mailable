import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';
import { Mailable, AttachmentBuilder } from '../classes/mailable';
import { MailableContent, MailableEnvelope, MailableHeaders } from '../interfaces/mail.interface';

class RichMailable extends Mailable {
  constructor(
    private readonly payload: {
      envelope: MailableEnvelope;
      content: MailableContent;
      headers?: MailableHeaders;
      attachments?: any[];
    },
  ) {
    super();
  }

  envelope(): MailableEnvelope {
    return this.payload.envelope;
  }

  content(): MailableContent {
    return this.payload.content;
  }

  headers(): MailableHeaders {
    return this.payload.headers || {};
  }

  attachments() {
    return this.payload.attachments || [];
  }
}

class MinimalMailable extends Mailable {
  envelope(): MailableEnvelope {
    return {};
  }

  content(): MailableContent {
    return {};
  }
}

describe('classes/Mailable', () => {
  let tempDir: string;
  let cwd: string;

  beforeEach(async () => {
    cwd = process.cwd();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nestjs-mailable-class-'));
    await fs.mkdir(path.join(tempDir, 'storage', 'docs'), { recursive: true });
    await fs.writeFile(path.join(tempDir, 'template.txt'), 'from-path', 'utf8');
    await fs.writeFile(path.join(tempDir, 'storage', 'docs', 'from-storage.txt'), 'from-storage', 'utf8');
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(cwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('build() combines envelope, content, headers, and all attachment types', async () => {
    const usingSpy = jest.fn();
    const mailable = new RichMailable({
      envelope: {
        subject: 'Subject',
        tags: ['welcome'],
        metadata: { tracking: true },
        using: [usingSpy],
      },
      content: {
        html: '<p>Hello</p>',
        text: 'Hello',
        template: 'welcome',
        with: { user: 'Ada' },
        markdown: '# Markdown body',
      },
      headers: {
        text: { 'X-Test': '1' },
        messageId: '<abc@id>',
        references: ['<ref-1>', '<ref-2>'],
      },
      attachments: [
        { path: path.join(tempDir, 'template.txt'), as: 'path.txt', mime: 'text/plain' },
        { storage: 'docs/from-storage.txt', as: 'storage.txt', mime: 'text/plain' },
        { data: () => 'raw-data', filename: 'string.txt', mime: 'text/plain' },
        { data: () => Buffer.from('buffer-data'), as: 'buffer.bin', mime: 'application/octet-stream' },
      ],
    });

    const built = await mailable.build();

    expect(built.subject).toBe('Subject');
    expect(built.tags).toEqual(['welcome']);
    expect(built.html).toBe('<p>Hello</p>');
    expect(built.text).toBe('Hello');
    expect(built.template).toBe('markdown');
    expect(built.context).toEqual({ markdown: '# Markdown body', user: 'Ada' });

    expect(built.headers).toEqual({
      'X-Test': '1',
      'Message-ID': '<abc@id>',
      References: '<ref-1> <ref-2>',
    });

    expect(built.metadata).toEqual({
      tracking: true,
      envelopeCustomizations: [usingSpy],
    });

    expect(built.attachments).toHaveLength(4);
    expect(built.attachments?.[0]).toMatchObject({ filename: 'path.txt', contentType: 'text/plain' });
    expect(built.attachments?.[1]).toMatchObject({ filename: 'storage.txt', contentType: 'text/plain' });
    expect(built.attachments?.[2]).toMatchObject({ filename: 'string.txt', contentType: 'text/plain' });
    expect(Buffer.isBuffer(built.attachments?.[2].content)).toBe(true);
    expect(built.attachments?.[3]).toMatchObject({ filename: 'buffer.bin', contentType: 'application/octet-stream' });
    expect(Buffer.isBuffer(built.attachments?.[3].content)).toBe(true);
  });

  it('supports default attachments() and headers() implementation', async () => {
    const mailable = new MinimalMailable();

    expect(mailable.attachments()).toEqual([]);
    expect(mailable.headers()).toEqual({});

    const built = await mailable.build();

    expect(built.attachments).toEqual([]);
    expect(built.subject).toBeUndefined();
    expect(built.headers).toBeUndefined();
  });

  it('skips references header when references array is empty', async () => {
    const mailable = new RichMailable({
      envelope: {},
      content: {},
      headers: {
        messageId: '<message-only@id>',
        references: [],
      },
    });

    const built = await mailable.build();

    expect(built.headers).toEqual({
      'Message-ID': '<message-only@id>',
    });
  });

  it('AttachmentBuilder and MailableAttachmentBuilder create expected attachment definitions', () => {
    const fromPath = AttachmentBuilder.fromPath('/tmp/file.txt').as('renamed.txt').withMime('text/plain').build();
    const fromStorage = AttachmentBuilder.fromStorage('docs/file.txt').as('storage.txt').build();
    const fromData = AttachmentBuilder.fromData(() => Buffer.from('x'), 'file.bin')
      .withMime('application/bin')
      .build();

    expect(fromPath).toEqual({ path: '/tmp/file.txt', as: 'renamed.txt', mime: 'text/plain' });
    expect(fromStorage).toEqual({ storage: 'docs/file.txt', as: 'storage.txt' });
    expect(fromData).toEqual({
      data: expect.any(Function),
      filename: 'file.bin',
      mime: 'application/bin',
    });
  });

  it('uses fallback names and markdown context fallback branches', async () => {
    const mailable = new RichMailable({
      envelope: {},
      content: {
        markdown: '# Just markdown',
      },
      attachments: [
        { path: path.join(tempDir, 'template.txt') },
        { storage: 'docs/from-storage.txt' },
        { data: () => 'inline' },
      ],
    });

    const built = await mailable.build();

    expect(built.template).toBe('markdown');
    expect(built.context).toEqual({ markdown: '# Just markdown' });
    expect(built.attachments?.[0].filename).toBe('template.txt');
    expect(built.attachments?.[1].filename).toBe('from-storage.txt');
    expect(built.attachments?.[2].filename).toBe('attachment');
  });
});
