import { Mailable } from '../mailables/mailable';
import { Content } from '../interfaces/mail.interface';

// Test implementation of Mailable
class TestMailable extends Mailable {
  constructor(
    private userEmail: string,
    private userName: string,
  ) {
    super();
  }

  protected build(): Content {
    this.subject(`Hello ${this.userName}`)
      .from('noreply@example.com', 'Test App')
      .view('welcome', { name: this.userName })
      .tag('welcome')
      .tag('onboarding')
      .metadata('user_id', 'user-123')
      .metadata('campaign', 'welcome-series')
      .header('X-Priority', 'high')
      .header('X-Campaign-ID', 'welcome-001')
      .replyTo('support@example.com', 'Support Team');

    return this.content;
  }
}

class AttachmentMailable extends Mailable {
  protected build(): Content {
    const pdfData = Buffer.from('fake PDF content');

    this.subject('Document with Attachments')
      .from('documents@example.com')
      .attach('/path/to/file.pdf', { filename: 'document.pdf' })
      .attachData(pdfData, 'generated-report.pdf', { contentType: 'application/pdf' });

    return this.content;
  }
}

class ContextMailable extends Mailable {
  protected build(): Content {
    this.subject('Context Test')
      .view('test-template')
      .with('user', { name: 'John', email: 'john@example.com' })
      .with('appName', 'Test App')
      .with({ companyName: 'Test Company', year: 2023 });

    return this.content;
  }
}

describe('Mailable Comprehensive Tests', () => {
  describe('Basic Mailable Functionality', () => {
    it('should build email with all basic properties', () => {
      const mailable = new TestMailable('test@example.com', 'Test User');
      const content = mailable.render();

      expect(content.subject).toBe('Hello Test User');
      expect(content.from).toEqual({ address: 'noreply@example.com', name: 'Test App' });
      expect(content.template).toBe('welcome');
      expect(content.context?.name).toBe('Test User');
      expect(content.tags).toContain('welcome');
      expect(content.tags).toContain('onboarding');
      expect(content.metadata?.user_id).toBe('user-123');
      expect(content.metadata?.campaign).toBe('welcome-series');
      expect(content.headers?.['X-Priority']).toBe('high');
      expect(content.headers?.['X-Campaign-ID']).toBe('welcome-001');
      expect(content.replyTo).toEqual({ address: 'support@example.com', name: 'Support Team' });
    });

    it('should build email using getContent method', () => {
      const mailable = new TestMailable('test@example.com', 'Test User');
      const content = mailable.getContent();

      expect(content.subject).toBe('Hello Test User');
    });
  });

  describe('Attachment Functionality', () => {
    it('should handle file attachments', () => {
      const mailable = new AttachmentMailable();
      const content = mailable.render();

      expect(content.attachments).toHaveLength(2);
      expect(content.attachments?.[0]).toEqual({
        path: '/path/to/file.pdf',
        filename: 'document.pdf',
      });
      expect(content.attachments?.[1].filename).toBe('generated-report.pdf');
      expect(content.attachments?.[1].content).toBeInstanceOf(Buffer);
      expect(content.attachments?.[1].contentType).toBe('application/pdf');
    });
  });

  describe('Context and Data Handling', () => {
    it('should handle context data with various with() overloads', () => {
      const mailable = new ContextMailable();
      const content = mailable.render();

      expect(content.context).toEqual({
        user: { name: 'John', email: 'john@example.com' },
        appName: 'Test App',
        companyName: 'Test Company',
        year: 2023,
      });
    });

    it('should merge context data when called multiple times', () => {
      class MultiContextMailable extends Mailable {
        protected build(): Content {
          this.view('test').with('key1', 'value1').with({ key2: 'value2', key3: 'value3' }).with('key4', 'value4');

          return this.content;
        }
      }

      const mailable = new MultiContextMailable();
      const content = mailable.render();

      expect(content.context).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
        key4: 'value4',
      });
    });
  });

  describe('Fluent Interface Chain Methods', () => {
    it('should support method chaining for headers', () => {
      class HeaderMailable extends Mailable {
        protected build(): Content {
          this.subject('Header Test')
            .header('X-Custom-1', 'value1')
            .header('X-Custom-2', 'value2')
            .header('X-Custom-3', 'value3');

          return this.content;
        }
      }

      const mailable = new HeaderMailable();
      const content = mailable.render();

      expect(content.headers).toEqual({
        'X-Custom-1': 'value1',
        'X-Custom-2': 'value2',
        'X-Custom-3': 'value3',
      });
    });

    it('should support method chaining for tags', () => {
      class TagMailable extends Mailable {
        protected build(): Content {
          this.subject('Tag Test').tag('marketing').tag('newsletter').tag('monthly');

          return this.content;
        }
      }

      const mailable = new TagMailable();
      const content = mailable.render();

      expect(content.tags).toEqual(['marketing', 'newsletter', 'monthly']);
    });

    it('should support method chaining for metadata', () => {
      class MetadataMailable extends Mailable {
        protected build(): Content {
          this.subject('Metadata Test')
            .metadata('user_id', 'user-123')
            .metadata('campaign_id', 'camp-456')
            .metadata('source', 'website');

          return this.content;
        }
      }

      const mailable = new MetadataMailable();
      const content = mailable.render();

      expect(content.metadata).toEqual({
        user_id: 'user-123',
        campaign_id: 'camp-456',
        source: 'website',
      });
    });
  });

  describe('ReplyTo Functionality', () => {
    it('should set reply-to with just email address', () => {
      class ReplyToMailable extends Mailable {
        protected build(): Content {
          this.subject('Reply To Test').replyTo('support@example.com');

          return this.content;
        }
      }

      const mailable = new ReplyToMailable();
      const content = mailable.render();

      expect(content.replyTo).toEqual({ address: 'support@example.com' });
    });

    it('should set reply-to with email and name', () => {
      class ReplyToWithNameMailable extends Mailable {
        protected build(): Content {
          this.subject('Reply To Test').replyTo('support@example.com', 'Support Team');

          return this.content;
        }
      }

      const mailable = new ReplyToWithNameMailable();
      const content = mailable.render();

      expect(content.replyTo).toEqual({
        address: 'support@example.com',
        name: 'Support Team',
      });
    });
  });

  describe('Empty State Handling', () => {
    it('should handle mailable with minimal configuration', () => {
      class MinimalMailable extends Mailable {
        protected build(): Content {
          this.subject('Minimal Test');
          return this.content;
        }
      }

      const mailable = new MinimalMailable();
      const content = mailable.render();

      expect(content.subject).toBe('Minimal Test');
      expect(content.tags).toBeUndefined();
      expect(content.metadata).toBeUndefined();
      expect(content.headers).toBeUndefined();
      expect(content.attachments).toBeUndefined();
    });

    it('should initialize arrays and objects when first used', () => {
      class InitializationMailable extends Mailable {
        protected build(): Content {
          // First call should initialize the arrays/objects
          this.tag('first-tag').metadata('first-key', 'first-value').header('First-Header', 'first-header-value');

          return this.content;
        }
      }

      const mailable = new InitializationMailable();
      const content = mailable.render();

      expect(Array.isArray(content.tags)).toBe(true);
      expect(content.tags).toHaveLength(1);
      expect(typeof content.metadata).toBe('object');
      expect(Object.keys(content.metadata!)).toHaveLength(1);
      expect(typeof content.headers).toBe('object');
      expect(Object.keys(content.headers!)).toHaveLength(1);
    });
  });
});
