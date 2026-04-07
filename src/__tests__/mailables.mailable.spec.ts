import { Mailable } from '../mailables/mailable';

class DemoLegacyMailable extends Mailable {
  compose(): this {
    return this.view('welcome', { first: 'Ada' })
      .with('last', 'Lovelace')
      .with({ role: 'Engineer' })
      .subject('Legacy Subject')
      .from('from@example.com', 'From User')
      .replyTo('reply@example.com', 'Reply User')
      .attach('/tmp/file.txt', { filename: 'file.txt' })
      .attachData('raw-content', 'raw.txt', { contentType: 'text/plain' })
      .header('X-Test', '1')
      .tag('welcome')
      .metadata('campaign', 'spring');
  }

  composeWithoutInitialContext(): this {
    return this.view('simple').with('k', 'v');
  }

  exposeBuild() {
    return this.build();
  }

  composeWithAttachDataOnly(): this {
    return this.attachData('only-data', 'only.txt');
  }
}

describe('mailables/Mailable (legacy)', () => {
  it('builds content via protected fluent API and getContent()', () => {
    const mailable = new DemoLegacyMailable().compose();

    const content = mailable.getContent();

    expect(content.template).toBe('welcome');
    expect(content.context).toEqual({ first: 'Ada', last: 'Lovelace', role: 'Engineer' });
    expect(content.subject).toBe('Legacy Subject');
    expect(content.from).toEqual({ address: 'from@example.com', name: 'From User' });
    expect(content.replyTo).toEqual({ address: 'reply@example.com', name: 'Reply User' });
    expect(content.attachments).toEqual([
      { path: '/tmp/file.txt', filename: 'file.txt' },
      { content: 'raw-content', filename: 'raw.txt', contentType: 'text/plain' },
    ]);
    expect(content.headers).toEqual({ 'X-Test': '1' });
    expect(content.tags).toEqual(['welcome']);
    expect(content.metadata).toEqual({ campaign: 'spring' });
  });

  it('initializes context when with() is called before any context exists', () => {
    const mailable = new DemoLegacyMailable().composeWithoutInitialContext();

    expect(mailable.getContent().context).toEqual({ k: 'v' });
  });

  it('render() merges built content with internal content', () => {
    const mailable = new DemoLegacyMailable().compose();

    const rendered = mailable.render();

    expect(rendered).toEqual(mailable.exposeBuild());
  });

  it('initializes attachments when attachData is first attachment call', () => {
    const mailable = new DemoLegacyMailable().composeWithAttachDataOnly();

    expect(mailable.getContent().attachments).toEqual([{ content: 'only-data', filename: 'only.txt' }]);
  });
});
