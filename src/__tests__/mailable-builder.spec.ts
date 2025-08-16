import { MailableBuilder } from '../builders/mailable.builder';
import { Address, Attachment } from '../interfaces/mail.interface';

describe('MailableBuilder - Comprehensive Tests', () => {
  let builder: MailableBuilder;

  beforeEach(() => {
    builder = MailableBuilder.create();
  });

  describe('Basic Builder Functionality', () => {
    it('should create a new builder instance', () => {
      expect(builder).toBeInstanceOf(MailableBuilder);
      expect(MailableBuilder.create()).toBeInstanceOf(MailableBuilder);
    });

    it('should build simple email with basic fields', () => {
      const content = builder
        .to('recipient@example.com')
        .subject('Test Subject')
        .html('<h1>Hello World</h1>')
        .text('Hello World')
        .build();

      expect(content.to).toEqual({ address: 'recipient@example.com' });
      expect(content.subject).toBe('Test Subject');
      expect(content.html).toBe('<h1>Hello World</h1>');
      expect(content.text).toBe('Hello World');
    });

    it('should handle fluent method chaining', () => {
      const content = builder
        .to({ address: 'user@example.com', name: 'User Name' })
        .from({ address: 'sender@example.com', name: 'Sender Name' })
        .subject('Fluent Test')
        .html('<p>Fluent content</p>')
        .text('Fluent content')
        .tag('fluent')
        .metadata('test', 'value')
        .build();

      expect(content.to).toEqual({ address: 'user@example.com', name: 'User Name' });
      expect(content.from).toEqual({ address: 'sender@example.com', name: 'Sender Name' });
      expect(content.subject).toBe('Fluent Test');
      expect(content.tags).toContain('fluent');
      expect(content.metadata?.test).toBe('value');
    });
  });

  describe('Recipient Management', () => {
    it('should set single TO recipient with string', () => {
      const content = builder
        .to('single@example.com')
        .subject('Single Recipient')
        .html('<p>Single recipient test</p>')
        .build();

      expect(content.to).toEqual({ address: 'single@example.com' });
    });

    it('should set single TO recipient with name', () => {
      const content = builder
        .to({ address: 'named@example.com', name: 'Named User' })
        .subject('Named Recipient')
        .html('<p>Named recipient test</p>')
        .build();

      expect(content.to).toEqual({ address: 'named@example.com', name: 'Named User' });
    });

    it('should set single TO recipient with Address object', () => {
      const recipient: Address = { address: 'object@example.com', name: 'Object User' };

      const content = builder.to(recipient).subject('Object Recipient').html('<p>Object recipient test</p>').build();

      expect(content.to).toEqual(recipient);
    });

    it('should set multiple TO recipients', () => {
      const recipients: Address[] = [
        { address: 'user1@example.com', name: 'User 1' },
        { address: 'user2@example.com', name: 'User 2' },
        { address: 'user3@example.com', name: 'User 3' },
      ];

      const content = builder
        .to(recipients)
        .subject('Multiple Recipients')
        .html('<p>Multiple recipients test</p>')
        .build();

      expect(content.to).toEqual(recipients);
      expect(Array.isArray(content.to)).toBe(true);
      expect((content.to as Address[]).length).toBe(3);
    });

    it('should handle CC recipients', () => {
      const content = builder
        .to('primary@example.com')
        .cc('cc@example.com')
        .subject('CC Test')
        .html('<p>CC test</p>')
        .build();

      expect(content.cc).toEqual({ address: 'cc@example.com' });
    });

    it('should handle multiple CC recipients', () => {
      const ccRecipients: Address[] = [
        { address: 'cc1@example.com', name: 'CC 1' },
        { address: 'cc2@example.com', name: 'CC 2' },
      ];

      const content = builder
        .to('primary@example.com')
        .cc(ccRecipients)
        .subject('Multiple CC Test')
        .html('<p>Multiple CC test</p>')
        .build();

      expect(content.cc).toEqual(ccRecipients);
      expect(Array.isArray(content.cc)).toBe(true);
    });

    it('should handle BCC recipients', () => {
      const content = builder
        .to('primary@example.com')
        .bcc('bcc@example.com')
        .subject('BCC Test')
        .html('<p>BCC test</p>')
        .build();

      expect(content.bcc).toEqual({ address: 'bcc@example.com' });
    });

    it('should handle multiple BCC recipients', () => {
      const bccRecipients: Address[] = [
        { address: 'bcc1@example.com' },
        { address: 'bcc2@example.com' },
        { address: 'bcc3@example.com' },
      ];

      const content = builder
        .to('primary@example.com')
        .bcc(bccRecipients)
        .subject('Multiple BCC Test')
        .html('<p>Multiple BCC test</p>')
        .build();

      expect(content.bcc).toEqual(bccRecipients);
      expect(Array.isArray(content.bcc)).toBe(true);
      expect((content.bcc as Address[]).length).toBe(3);
    });
  });

  describe('Sender Information', () => {
    it('should set FROM address with string', () => {
      const content = builder
        .from('sender@example.com')
        .to('recipient@example.com')
        .subject('From Test')
        .html('<p>From test</p>')
        .build();

      expect(content.from).toEqual({ address: 'sender@example.com' });
    });

    it('should set FROM address with name', () => {
      const content = builder
        .from({ address: 'sender@example.com', name: 'Sender Name' })
        .to('recipient@example.com')
        .subject('From Name Test')
        .html('<p>From name test</p>')
        .build();

      expect(content.from).toEqual({ address: 'sender@example.com', name: 'Sender Name' });
    });

    it('should set REPLY-TO address', () => {
      const content = builder
        .to('recipient@example.com')
        .replyTo('support@example.com')
        .subject('Reply-To Test')
        .html('<p>Reply-to test</p>')
        .build();

      expect(content.replyTo).toEqual({ address: 'support@example.com' });
    });

    it('should set REPLY-TO address with name', () => {
      const content = builder
        .to('recipient@example.com')
        .replyTo({ address: 'support@example.com', name: 'Support Team' })
        .subject('Reply-To Name Test')
        .html('<p>Reply-to name test</p>')
        .build();

      expect(content.replyTo).toEqual({ address: 'support@example.com', name: 'Support Team' });
    });
  });

  describe('Content Management', () => {
    it('should set HTML content', () => {
      const htmlContent = '<h1>HTML Content</h1><p>This is HTML content.</p>';

      const content = builder.to('recipient@example.com').subject('HTML Test').html(htmlContent).build();

      expect(content.html).toBe(htmlContent);
    });

    it('should set text content', () => {
      const textContent = 'This is plain text content.';

      const content = builder.to('recipient@example.com').subject('Text Test').text(textContent).build();

      expect(content.text).toBe(textContent);
    });

    it('should set both HTML and text content', () => {
      const htmlContent = '<h1>HTML Version</h1>';
      const textContent = 'Text Version';

      const content = builder
        .to('recipient@example.com')
        .subject('Both Content Test')
        .html(htmlContent)
        .text(textContent)
        .build();

      expect(content.html).toBe(htmlContent);
      expect(content.text).toBe(textContent);
    });

    it('should handle template with context', () => {
      const templateName = 'welcome';
      const templateContext = {
        name: 'John Doe',
        verificationUrl: 'https://example.com/verify',
        appName: 'Test App',
      };

      const content = builder
        .to('recipient@example.com')
        .subject('Template Test')
        .template(templateName, templateContext)
        .build();

      expect(content.template).toBe(templateName);
      expect(content.context).toEqual(templateContext);
    });

    it('should handle template without context', () => {
      const templateName = 'simple';

      const content = builder
        .to('recipient@example.com')
        .subject('Simple Template Test')
        .template(templateName)
        .build();

      expect(content.template).toBe(templateName);
      expect(content.context).toBeUndefined();
    });
  });

  describe('Attachments', () => {
    it('should add single attachment', () => {
      const attachment: Attachment = {
        filename: 'document.pdf',
        content: Buffer.from('fake PDF content'),
        contentType: 'application/pdf',
      };

      const content = builder
        .to('recipient@example.com')
        .subject('Attachment Test')
        .html('<p>Please find attachment.</p>')
        .attach(attachment)
        .build();

      expect(content.attachments).toHaveLength(1);
      expect(content.attachments![0]).toEqual(attachment);
    });

    it('should add multiple attachments', () => {
      const attachment1: Attachment = {
        filename: 'document.pdf',
        content: Buffer.from('PDF content'),
        contentType: 'application/pdf',
      };

      const attachment2: Attachment = {
        filename: 'image.jpg',
        content: Buffer.from('JPEG content'),
        contentType: 'image/jpeg',
      };

      const content = builder
        .to('recipient@example.com')
        .subject('Multiple Attachments Test')
        .html('<p>Please find attachments.</p>')
        .attach(attachment1)
        .attach(attachment2)
        .build();

      expect(content.attachments).toHaveLength(2);
      expect(content.attachments![0]).toEqual(attachment1);
      expect(content.attachments![1]).toEqual(attachment2);
    });

    it('should add attachment using attachData helper', () => {
      const fileContent = Buffer.from('Text file content');
      const filename = 'readme.txt';
      const options = { contentType: 'text/plain' };

      const content = builder
        .to('recipient@example.com')
        .subject('Attach Data Test')
        .html('<p>Text file attached.</p>')
        .attachData(fileContent, filename, options)
        .build();

      expect(content.attachments).toHaveLength(1);
      expect(content.attachments![0].filename).toBe(filename);
      expect(content.attachments![0].content).toEqual(fileContent);
      expect(content.attachments![0].contentType).toBe('text/plain');
    });

    it('should add attachment using attachData without options', () => {
      const fileContent = Buffer.from('Default content');
      const filename = 'default.txt';

      const content = builder
        .to('recipient@example.com')
        .subject('Attach Data Default Test')
        .html('<p>Default attachment.</p>')
        .attachData(fileContent, filename)
        .build();

      expect(content.attachments).toHaveLength(1);
      expect(content.attachments![0].filename).toBe(filename);
      expect(content.attachments![0].content).toEqual(fileContent);
    });
  });

  describe('Tags and Metadata', () => {
    it('should add single tag', () => {
      const content = builder
        .to('recipient@example.com')
        .subject('Tag Test')
        .html('<p>Tagged email</p>')
        .tag('newsletter')
        .build();

      expect(content.tags).toContain('newsletter');
      expect(content.tags).toHaveLength(1);
    });

    it('should add multiple tags', () => {
      const content = builder
        .to('recipient@example.com')
        .subject('Multiple Tags Test')
        .html('<p>Multi-tagged email</p>')
        .tag('newsletter')
        .tag('monthly')
        .tag('marketing')
        .build();

      expect(content.tags).toContain('newsletter');
      expect(content.tags).toContain('monthly');
      expect(content.tags).toContain('marketing');
      expect(content.tags).toHaveLength(3);
    });

    it('should add metadata', () => {
      const content = builder
        .to('recipient@example.com')
        .subject('Metadata Test')
        .html('<p>Email with metadata</p>')
        .metadata('campaign_id', 'campaign-123')
        .metadata('user_id', 'user-456')
        .metadata('priority', 'high')
        .build();

      expect(content.metadata?.campaign_id).toBe('campaign-123');
      expect(content.metadata?.user_id).toBe('user-456');
      expect(content.metadata?.priority).toBe('high');
    });

    it('should handle complex metadata values', () => {
      const complexValue = {
        nested: {
          value: 'test',
          number: 123,
          array: [1, 2, 3],
        },
      };

      const content = builder
        .to('recipient@example.com')
        .subject('Complex Metadata Test')
        .html('<p>Complex metadata</p>')
        .metadata('complex', complexValue)
        .build();

      expect(content.metadata?.complex).toEqual(complexValue);
    });
  });

  describe('Headers', () => {
    it('should add single header', () => {
      const content = builder
        .to('recipient@example.com')
        .subject('Header Test')
        .html('<p>Email with header</p>')
        .header('X-Custom-Header', 'custom-value')
        .build();

      expect(content.headers?.['X-Custom-Header']).toBe('custom-value');
    });

    it('should add multiple headers', () => {
      const content = builder
        .to('recipient@example.com')
        .subject('Multiple Headers Test')
        .html('<p>Email with multiple headers</p>')
        .header('X-Custom-Header', 'custom-value')
        .header('X-Priority', 'high')
        .header('X-Campaign-ID', 'campaign-123')
        .build();

      expect(content.headers?.['X-Custom-Header']).toBe('custom-value');
      expect(content.headers?.['X-Priority']).toBe('high');
      expect(content.headers?.['X-Campaign-ID']).toBe('campaign-123');
    });

    it('should overwrite existing header', () => {
      const content = builder
        .to('recipient@example.com')
        .subject('Header Overwrite Test')
        .html('<p>Header overwrite test</p>')
        .header('X-Test-Header', 'initial-value')
        .header('X-Test-Header', 'updated-value')
        .build();

      expect(content.headers?.['X-Test-Header']).toBe('updated-value');
    });
  });

  describe('Priority and Importance', () => {
    it('should set email priority', () => {
      const content = builder
        .to('recipient@example.com')
        .subject('Priority Test')
        .html('<p>High priority email</p>')
        .header('X-Priority', 'high')
        .build();

      expect(content.headers?.['X-Priority']).toBe('high');
    });

    it('should handle different priority levels', () => {
      const priorities = ['low', 'normal', 'high'];

      priorities.forEach((priority) => {
        const content = builder
          .to('recipient@example.com')
          .subject(`Priority ${priority} Test`)
          .html(`<p>${priority} priority email</p>`)
          .header('X-Priority', priority)
          .build();

        expect(content.headers?.['X-Priority']).toBe(priority);
      });
    });
  });

  describe('Builder State Management', () => {
    it('should clone builder with existing state', () => {
      const originalBuilder = MailableBuilder.create()
        .to('original@example.com')
        .subject('Original Subject')
        .html('<p>Original content</p>')
        .tag('original');

      const clonedBuilder = originalBuilder.clone();
      const clonedContent = clonedBuilder
        .to('cloned@example.com') // Override TO
        .tag('cloned') // Add additional tag
        .build();

      expect(clonedContent.to).toEqual({ address: 'cloned@example.com' });
      expect(clonedContent.subject).toBe('Original Subject'); // Inherited
      expect(clonedContent.html).toBe('<p>Original content</p>'); // Inherited
      expect(clonedContent.tags).toContain('original'); // Inherited
      expect(clonedContent.tags).toContain('cloned'); // Added
    });

    it('should maintain independent state between clones', () => {
      const baseBuilder = MailableBuilder.create().subject('Base Subject').html('<p>Base content</p>');

      const clone1 = baseBuilder.clone().to('clone1@example.com').tag('clone1');
      const clone2 = baseBuilder.clone().to('clone2@example.com').tag('clone2');

      const content1 = clone1.build();
      const content2 = clone2.build();

      expect(content1.to).toEqual({ address: 'clone1@example.com' });
      expect(content1.tags).toContain('clone1');
      expect(content1.tags).not.toContain('clone2');

      expect(content2.to).toEqual({ address: 'clone2@example.com' });
      expect(content2.tags).toContain('clone2');
      expect(content2.tags).not.toContain('clone1');
    });
  });

  describe('Complex Email Scenarios', () => {
    it('should build complex newsletter email', () => {
      const newsletterContent = builder
        .to([
          { address: 'subscriber1@example.com', name: 'Subscriber 1' },
          { address: 'subscriber2@example.com', name: 'Subscriber 2' },
        ])
        .from({ address: 'newsletter@example.com', name: 'Company Newsletter' })
        .replyTo({ address: 'support@example.com', name: 'Support Team' })
        .subject('Monthly Newsletter - March 2024')
        .html(
          `
          <h1>Monthly Newsletter</h1>
          <p>Dear subscribers,</p>
          <p>Here are the latest updates...</p>
        `,
        )
        .text('Monthly Newsletter - March 2024\n\nDear subscribers,\n\nHere are the latest updates...')
        .tag('newsletter')
        .tag('monthly')
        .tag('marketing')
        .metadata('campaign_id', 'newsletter-march-2024')
        .metadata('segment', 'premium-subscribers')
        .header('X-Campaign-Type', 'newsletter')
        .header('X-Unsubscribe-URL', 'https://example.com/unsubscribe')
        .header('X-Priority', 'normal')
        .build();

      expect(newsletterContent.to).toHaveLength(2);
      expect(newsletterContent.from).toEqual({ address: 'newsletter@example.com', name: 'Company Newsletter' });
      expect(newsletterContent.replyTo).toEqual({ address: 'support@example.com', name: 'Support Team' });
      expect(newsletterContent.tags).toEqual(['newsletter', 'monthly', 'marketing']);
      expect(newsletterContent.metadata?.campaign_id).toBe('newsletter-march-2024');
      expect(newsletterContent.headers?.['X-Campaign-Type']).toBe('newsletter');
      expect(newsletterContent.headers?.['X-Priority']).toBe('normal');
    });

    it('should build transactional email with attachments', () => {
      const invoicePdf = Buffer.from('fake invoice PDF content');
      const receiptImage = Buffer.from('fake receipt image content');

      const transactionalEmail = builder
        .to({ address: 'customer@example.com', name: 'John Customer' })
        .from({ address: 'billing@example.com', name: 'Billing Department' })
        .cc({ address: 'accounting@example.com', name: 'Accounting' })
        .subject('Invoice #INV-2024-001 - Payment Confirmation')
        .template('invoice-confirmation', {
          customerName: 'John Customer',
          invoiceNumber: 'INV-2024-001',
          amount: '$299.99',
          paymentDate: '2024-03-15',
        })
        .attachData(invoicePdf, 'invoice-INV-2024-001.pdf', {
          contentType: 'application/pdf',
        })
        .attachData(receiptImage, 'payment-receipt.png', {
          contentType: 'image/png',
        })
        .tag('transactional')
        .tag('invoice')
        .tag('payment-confirmation')
        .metadata('invoice_id', 'INV-2024-001')
        .metadata('customer_id', 'customer-123')
        .metadata('payment_method', 'credit-card')
        .header('X-Transaction-Type', 'payment-confirmation')
        .header('X-Priority', 'high')
        .build();

      expect(transactionalEmail.template).toBe('invoice-confirmation');
      expect(transactionalEmail.context?.invoiceNumber).toBe('INV-2024-001');
      expect(transactionalEmail.attachments).toHaveLength(2);
      expect(transactionalEmail.attachments![0].filename).toBe('invoice-INV-2024-001.pdf');
      expect(transactionalEmail.attachments![1].filename).toBe('payment-receipt.png');
      expect(transactionalEmail.tags).toContain('transactional');
      expect(transactionalEmail.metadata?.invoice_id).toBe('INV-2024-001');
      expect(transactionalEmail.headers?.['X-Priority']).toBe('high');
    });
  });

  describe('Input Validation and Edge Cases', () => {
    it('should handle empty strings gracefully', () => {
      const content = builder.to('recipient@example.com').subject('').html('').text('').build();

      expect(content.subject).toBe('');
      expect(content.html).toBe('');
      expect(content.text).toBe('');
    });

    it('should handle null and undefined values', () => {
      const content = builder
        .to('recipient@example.com')
        .subject('Test')
        .html('<p>Test</p>')
        .metadata('null_value', null)
        .metadata('undefined_value', undefined)
        .build();

      expect(content.metadata?.null_value).toBeNull();
      expect(content.metadata?.undefined_value).toBeUndefined();
    });

    it('should maintain array order for tags', () => {
      const tags = ['first', 'second', 'third', 'fourth'];
      let currentBuilder = builder.to('recipient@example.com').subject('Tag Order Test').html('<p>Tag order</p>');

      tags.forEach((tag) => {
        currentBuilder = currentBuilder.tag(tag);
      });

      const content = currentBuilder.build();
      expect(content.tags).toEqual(tags);
    });

    it('should handle special characters in content', () => {
      const specialContent = 'Special chars: üöäß αβγ 中文 🚀 <>&"\'';

      const content = builder
        .to('recipient@example.com')
        .subject(specialContent)
        .html(`<p>${specialContent}</p>`)
        .text(specialContent)
        .build();

      expect(content.subject).toBe(specialContent);
      expect(content.html).toBe(`<p>${specialContent}</p>`);
      expect(content.text).toBe(specialContent);
    });
  });

  describe('Method Return Types', () => {
    it('should return builder instance for chaining', () => {
      const builderInstance = MailableBuilder.create();

      expect(builderInstance.to('test@example.com')).toBe(builderInstance);
      expect(builderInstance.subject('Test')).toBe(builderInstance);
      expect(builderInstance.html('<p>Test</p>')).toBe(builderInstance);
      expect(builderInstance.tag('test')).toBe(builderInstance);
      expect(builderInstance.metadata('key', 'value')).toBe(builderInstance);
    });

    it('should return MailableContent from build method', () => {
      const content = builder.to('recipient@example.com').subject('Test').html('<p>Test</p>').build();

      expect(typeof content).toBe('object');
      expect(content.to).toBeDefined();
      expect(content.subject).toBeDefined();
      expect(content.html).toBeDefined();
    });
  });
});
