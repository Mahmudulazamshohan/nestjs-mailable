import { MailableBuilder } from '../builders/mailable.builder';

describe('MailableBuilder', () => {
  it('builds content with fluent APIs across all setters', () => {
    const builder = MailableBuilder.create()
      .subject('Welcome')
      .from('from@example.com')
      .to(['to1@example.com', { address: 'to2@example.com', name: 'To Two' }])
      .cc('cc@example.com')
      .bcc({ address: 'bcc@example.com', name: 'Bcc' })
      .replyTo(['reply1@example.com', { address: 'reply2@example.com', name: 'Reply Two' }])
      .html('<p>Hello</p>')
      .text('Hello')
      .template('welcome', { first: 'Ada' })
      .with('last', 'Lovelace')
      .with({ role: 'Engineer' })
      .attach({ filename: 'one.txt', content: 'one' })
      .attachFromPath('/tmp/two.txt', { filename: 'two.txt' })
      .attachData(Buffer.from('three'), 'three.txt', { contentType: 'text/plain' })
      .header('X-One', '1')
      .headers({ 'X-Two': '2' })
      .tag('tag-1')
      .tags(['tag-2', 'tag-3'])
      .metadata('m1', 'v1')
      .metadata({ m2: 'v2' });

    const content = builder.build();

    expect(content.subject).toBe('Welcome');
    expect(content.from).toEqual({ address: 'from@example.com' });
    expect(content.to).toEqual([{ address: 'to1@example.com' }, { address: 'to2@example.com', name: 'To Two' }]);
    expect(content.cc).toEqual({ address: 'cc@example.com' });
    expect(content.bcc).toEqual({ address: 'bcc@example.com', name: 'Bcc' });
    expect(content.replyTo).toEqual([
      { address: 'reply1@example.com' },
      { address: 'reply2@example.com', name: 'Reply Two' },
    ]);
    expect(content.html).toBe('<p>Hello</p>');
    expect(content.text).toBe('Hello');
    expect(content.template).toBe('welcome');
    expect(content.context).toEqual({ first: 'Ada', last: 'Lovelace', role: 'Engineer' });
    expect(content.attachments).toEqual([
      { filename: 'one.txt', content: 'one' },
      { path: '/tmp/two.txt', filename: 'two.txt' },
      { content: Buffer.from('three'), filename: 'three.txt', contentType: 'text/plain' },
    ]);
    expect(content.headers).toEqual({ 'X-One': '1', 'X-Two': '2' });
    expect(content.tags).toEqual(['tag-1', 'tag-2', 'tag-3']);
    expect(content.metadata).toEqual({ m1: 'v1', m2: 'v2' });
  });

  it('supports object input forms and template() without context', () => {
    const content = new MailableBuilder()
      .from({ address: 'from@example.com', name: 'From' })
      .to({ address: 'to@example.com', name: 'To' })
      .cc([{ address: 'cc@example.com', name: 'CC' }])
      .bcc(['bcc@example.com'])
      .replyTo({ address: 'reply@example.com', name: 'Reply' })
      .template('raw-template')
      .build();

    expect(content.from).toEqual({ address: 'from@example.com', name: 'From' });
    expect(content.to).toEqual({ address: 'to@example.com', name: 'To' });
    expect(content.cc).toEqual([{ address: 'cc@example.com', name: 'CC' }]);
    expect(content.bcc).toEqual([{ address: 'bcc@example.com' }]);
    expect(content.replyTo).toEqual({ address: 'reply@example.com', name: 'Reply' });
    expect(content.template).toBe('raw-template');
    expect(content.context).toBeUndefined();
  });

  it('covers string/object branches inside array mappers and direct assignment paths', () => {
    const content = new MailableBuilder()
      .to('to@example.com')
      .cc({ address: 'cc0@example.com', name: 'CC Zero' })
      .cc(['cc1@example.com', { address: 'cc2@example.com', name: 'CC Two' }])
      .bcc('bcc0@example.com')
      .bcc(['bcc1@example.com', { address: 'bcc2@example.com', name: 'BCC Two' }])
      .replyTo('reply@example.com')
      .build();

    expect(content.to).toEqual({ address: 'to@example.com' });
    expect(content.cc).toEqual([{ address: 'cc1@example.com' }, { address: 'cc2@example.com', name: 'CC Two' }]);
    expect(content.bcc).toEqual([{ address: 'bcc1@example.com' }, { address: 'bcc2@example.com', name: 'BCC Two' }]);
    expect(content.replyTo).toEqual({ address: 'reply@example.com' });
  });

  it('clone() performs a deep copy', () => {
    const builder = new MailableBuilder()
      .with({ nested: { a: 1 } })
      .tags(['a'])
      .metadata({ one: 1 });

    const cloned = builder.clone();
    cloned.with('new', true).tags(['b']).metadata('two', 2);

    expect(builder.build().context).toEqual({ nested: { a: 1 } });
    expect(builder.build().tags).toEqual(['a']);
    expect(builder.build().metadata).toEqual({ one: 1 });
    expect(cloned.build().context).toEqual({ nested: { a: 1 }, new: true });
    expect(cloned.build().tags).toEqual(['a', 'b']);
    expect(cloned.build().metadata).toEqual({ one: 1, two: 2 });
  });
});
