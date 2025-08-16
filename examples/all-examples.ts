/**
 * NestJS Mailable - Complete Examples Suite
 *
 * This file demonstrates all features of the NestJS Mailable package
 * in a single, comprehensive example file.
 */

import { Module, Injectable, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MailModule, MailService, Mailable } from '../dist';

// ===== BASIC EXAMPLES =====

// 1. Simple Mailable
class WelcomeMailable extends Mailable {
  constructor(private readonly userName: string) {
    super();
    this.build();
  }

  protected build() {
    this.subject('Welcome to Our Platform!')
      .with('name', this.userName)
      .with('greeting', 'Welcome aboard!')
      .with('message', "We're excited to have you join our community.");
    return super.build();
  }
}

// 2. Template-based Mailable
class InvoiceMailable extends Mailable {
  constructor(private readonly invoiceData: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject(`Invoice #${this.invoiceData.number}`)
      .view('invoice-template.hbs', this.invoiceData)
      .attach('./invoices/invoice.pdf', {
        filename: `invoice-${this.invoiceData.number}.pdf`,
        contentType: 'application/pdf',
      })
      .tag('invoice')
      .metadata('invoiceId', this.invoiceData.id);
    return super.build();
  }
}

// 3. Newsletter Mailable with Inline Images
class NewsletterMailable extends Mailable {
  constructor(private readonly newsletterData: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject(this.newsletterData.title)
      .view('newsletter.hbs', this.newsletterData)
      .attach('./images/header.jpg', {
        filename: false,
        cid: 'header-image',
        contentType: 'image/jpeg',
      })
      .attach('./images/footer.png', {
        filename: false,
        cid: 'footer-image',
        contentType: 'image/png',
      })
      .tag('newsletter')
      .metadata('edition', this.newsletterData.edition);
    return super.build();
  }
}

// ===== ADVANCED EXAMPLES =====

// 4. Multi-Provider Aware Mailable
class MultiProviderMailable extends Mailable {
  constructor(
    private readonly data: any,
    private readonly provider: string,
  ) {
    super();
    this.build();
  }

  protected build() {
    this.subject(`Email via ${this.provider.toUpperCase()}`)
      .view('multi-provider.hbs', this.data)
      .with('provider', this.provider)
      .with('timestamp', new Date().toISOString())
      .tag(`provider-${this.provider}`)
      .metadata('sentVia', this.provider);
    return super.build();
  }
}

// 5. Bulk Email Mailable
class BulkCampaignMailable extends Mailable {
  constructor(
    private readonly recipientData: any,
    private readonly campaignData: any,
  ) {
    super();
    this.build();
  }

  protected build() {
    this.subject(this.campaignData.subject)
      .view('campaign-template.hbs', {
        recipient: this.recipientData,
        campaign: this.campaignData,
      })
      .with('unsubscribeUrl', `https://example.com/unsubscribe/${this.recipientData.id}`)
      .tag('bulk-email')
      .tag(`campaign-${this.campaignData.id}`)
      .metadata('recipientId', this.recipientData.id)
      .metadata('campaignId', this.campaignData.id);
    return super.build();
  }
}

// ===== COMPREHENSIVE MAIL SERVICE =====

@Injectable()
class ComprehensiveMailService {
  private readonly logger = new Logger(ComprehensiveMailService.name);
  private emailQueue: Array<{ mailable: any; recipient: string; retries: number }> = [];
  private testMode = false;
  private sentEmails: any[] = [];

  constructor(private readonly mailService: MailService) {}

  // ===== BASIC OPERATIONS =====

  async sendWelcomeEmail(userEmail: string, userName: string) {
    const mailable = new WelcomeMailable(userName);
    return await this.sendWithRetry(mailable, userEmail, 0);
  }

  async sendSimpleTextEmail(to: string, subject: string, text: string) {
    const content = { subject, text };
    return await this.sendWithRetry(content, to, 0);
  }

  async sendHtmlEmail(to: string, subject: string, html: string) {
    const content = { subject, html };
    return await this.sendWithRetry(content, to, 0);
  }

  // ===== TEMPLATE OPERATIONS =====

  async sendTemplatedEmail(to: string, templateName: string, data: any) {
    const content = {
      subject: data.subject || 'Templated Email',
      template: templateName,
      context: data,
    };
    return await this.sendWithRetry(content, to, 0);
  }

  // ===== ATTACHMENT OPERATIONS =====

  async sendEmailWithAttachments(to: string, subject: string, html: string, attachments: any[]) {
    const content = { subject, html, attachments };
    return await this.sendWithRetry(content, to, 0);
  }

  async sendInvoiceEmail(customerEmail: string, invoiceData: any) {
    const mailable = new InvoiceMailable(invoiceData);
    return await this.sendWithRetry(mailable, customerEmail, 0);
  }

  // ===== MULTI-PROVIDER OPERATIONS =====

  async sendViaSpecificProvider(provider: string, recipient: string, data: any) {
    const providerService = this.mailService.mailer(provider);
    const mailable = new MultiProviderMailable(data, provider);
    const sender = await providerService.to(recipient);
    return await sender.send(mailable);
  }

  async sendWithFailover(recipient: string, content: any) {
    const providers = ['smtp', 'ses', 'mailgun'];

    for (const provider of providers) {
      try {
        this.logger.log(`Attempting to send via ${provider}...`);
        const result = await this.sendViaSpecificProvider(provider, recipient, content);
        this.logger.log(`✓ Successfully sent via ${provider}`);
        return result;
      } catch (error) {
        this.logger.warn(`✗ Failed to send via ${provider}: ${error.message}`);
        continue;
      }
    }

    throw new Error('All providers failed');
  }

  // ===== BULK OPERATIONS =====

  async sendBulkCampaign(recipients: any[], campaignData: any, batchSize = 10) {
    this.logger.log(`Starting bulk campaign: ${campaignData.name} to ${recipients.length} recipients`);

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const promises = batch.map(async (recipient) => {
        const mailable = new BulkCampaignMailable(recipient, campaignData);
        return this.queueEmail(mailable, recipient.email);
      });

      await Promise.all(promises);
      this.logger.log(`Queued batch ${Math.floor(i / batchSize) + 1}`);

      // Rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return this.processQueue();
  }

  // ===== QUEUE OPERATIONS =====

  async queueEmail(mailable: any, recipient: string, priority: 'high' | 'normal' | 'low' = 'normal') {
    this.emailQueue.push({ mailable, recipient, retries: 0 });
    this.logger.log(`Email queued for ${recipient} with priority: ${priority}`);

    if (priority === 'high') {
      await this.processQueue();
    }
  }

  async processQueue() {
    this.logger.log(`Processing email queue (${this.emailQueue.length} emails)`);

    while (this.emailQueue.length > 0) {
      const emailJob = this.emailQueue.shift();
      if (!emailJob) continue;

      try {
        await this.sendWithRetry(emailJob.mailable, emailJob.recipient, emailJob.retries);
        this.logger.log(`✓ Email sent to ${emailJob.recipient}`);
      } catch (error) {
        this.logger.error(`✗ Failed to send to ${emailJob.recipient}: ${error.message}`);

        if (emailJob.retries < 3) {
          emailJob.retries++;
          this.emailQueue.push(emailJob);
          this.logger.log(`Re-queued for retry ${emailJob.retries}`);
        }
      }
    }
  }

  private async sendWithRetry(mailable: any, recipient: string, retryCount: number) {
    // If in test mode, just capture the email and return success
    if (this.testMode) {
      this.sentEmails.push({ mailable, recipient, sentAt: new Date() });
      return { messageId: `test-${Date.now()}`, success: true };
    }

    const maxRetries = 3;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const sender = await this.mailService.to(recipient);
        const result = await sender.send(mailable);
        return result;
      } catch (error) {
        attempt++;
        if (attempt > maxRetries) throw error;

        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // ===== TESTING OPERATIONS =====

  enableTestMode() {
    this.testMode = true;
    this.sentEmails = [];
    this.logger.log('📧 Test mode enabled');
  }

  disableTestMode() {
    this.testMode = false;
    this.logger.log('📧 Test mode disabled');
  }

  getTestEmails() {
    return this.sentEmails;
  }

  clearTestEmails() {
    this.sentEmails = [];
  }

  assertEmailSent(predicate: (email: any) => boolean) {
    const found = this.sentEmails.find(predicate);
    if (!found) {
      throw new Error('Expected email was not sent');
    }
    return found;
  }

  // ===== COMPREHENSIVE DEMO =====

  async runComprehensiveDemo() {
    console.log('🚀 Starting NestJS Mailable Comprehensive Demo');
    console.log('=============================================');

    try {
      // Enable test mode
      this.enableTestMode();

      // 1. Basic Email Examples
      console.log('\n📧 1. Basic Email Examples');
      console.log('---------------------------');

      await this.sendSimpleTextEmail('user@example.com', 'Simple Text Email', 'Hello World!');
      console.log('✓ Simple text email sent');

      await this.sendHtmlEmail('user@example.com', 'HTML Email', '<h1>Hello HTML!</h1>');
      console.log('✓ HTML email sent');

      await this.sendWelcomeEmail('newuser@example.com', 'John Doe');
      console.log('✓ Welcome email sent');

      // 2. Template Examples
      console.log('\n🎨 2. Template Examples');
      console.log('------------------------');

      await this.sendTemplatedEmail('customer@example.com', 'notification.hbs', {
        subject: 'Account Update',
        name: 'Alice',
        message: 'Your account has been updated successfully.',
      });
      console.log('✓ Templated email sent');

      // 3. Attachment Examples
      console.log('\n📎 3. Attachment Examples');
      console.log('-------------------------');

      await this.sendEmailWithAttachments(
        'recipient@example.com',
        'Email with Attachments',
        '<h1>Please find attached files</h1>',
        [
          {
            content: Buffer.from('Sample CSV data'),
            filename: 'data.csv',
            contentType: 'text/csv',
          },
        ],
      );
      console.log('✓ Email with attachments sent');

      // 4. Multi-Provider Examples
      console.log('\n🔄 4. Multi-Provider Examples');
      console.log('------------------------------');

      await this.sendViaSpecificProvider('smtp', 'smtp-test@example.com', {
        message: 'Test via SMTP provider',
      });
      console.log('✓ SMTP provider email sent');

      // 5. Bulk Email Examples
      console.log('\n📬 5. Bulk Email Examples');
      console.log('-------------------------');

      const recipients = [
        { id: 1, email: 'bulk1@example.com', name: 'User 1' },
        { id: 2, email: 'bulk2@example.com', name: 'User 2' },
        { id: 3, email: 'bulk3@example.com', name: 'User 3' },
      ];

      const campaign = {
        id: 'camp-001',
        name: 'Demo Campaign',
        subject: 'Important Update',
        content: 'This is our monthly newsletter.',
      };

      await this.sendBulkCampaign(recipients, campaign, 2);
      console.log('✓ Bulk campaign sent');

      // 6. Queue Examples
      console.log('\n⏳ 6. Queue Examples');
      console.log('--------------------');

      await this.queueEmail(new WelcomeMailable('Queued User'), 'queued@example.com', 'high');
      console.log('✓ High priority email queued and processed');

      // 7. Test Results
      console.log('\n📊 7. Test Results');
      console.log('-------------------');

      const testEmails = this.getTestEmails();
      console.log(`Total emails captured: ${testEmails.length}`);

      testEmails.forEach((email, index) => {
        const subject = email.mailable.subject || email.mailable.content?.subject || 'No Subject';
        console.log(`  ${index + 1}. ${email.recipient} - ${subject}`);
      });

      // 8. Assertions
      console.log('\n✅ 8. Test Assertions');
      console.log('----------------------');

      this.assertEmailSent((email) => email.recipient === 'newuser@example.com');
      console.log('✓ Welcome email assertion passed');

      this.assertEmailSent((email) => email.mailable.tags && email.mailable.tags.includes('bulk-email'));
      console.log('✓ Bulk email assertion passed');

      // Disable test mode
      this.disableTestMode();

      console.log('\n🎉 Comprehensive Demo Completed Successfully!');
      console.log('==============================================');
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
      throw error;
    }
  }
}

// ===== MODULE CONFIGURATION =====

@Module({
  imports: [
    MailModule.forRoot({
      config: {
        default: 'smtp',
        mailers: {
          // SMTP Configuration
          smtp: {
            transport: 'smtp',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: 'your-email@gmail.com',
              pass: 'your-app-password',
            },
          },

          // AWS SES Configuration
          ses: {
            transport: 'ses',
            options: {
              accessKeyId: 'your-access-key-id',
              secretAccessKey: 'your-secret-access-key',
              region: 'us-east-1',
            },
          },

          // Mailgun Configuration
          mailgun: {
            transport: 'mailgun',
            options: {
              apiKey: 'your-mailgun-api-key',
              domain: 'your-domain.com',
            },
          },
        },
        from: {
          address: 'demo@example.com',
          name: 'NestJS Mailable Demo',
        },
      },
    }),
  ],
  providers: [ComprehensiveMailService],
})
class ComprehensiveMailModule {}

// ===== EXAMPLE RUNNER =====

async function runAllExamples() {
  const app = await NestFactory.create(ComprehensiveMailModule);
  const mailService = app.get(ComprehensiveMailService);

  try {
    await mailService.runComprehensiveDemo();
  } catch (error) {
    console.error('❌ Examples failed:', error.message);
    process.exit(1);
  }

  await app.close();
}

// ===== EXPORTS =====

export {
  runAllExamples,
  WelcomeMailable,
  InvoiceMailable,
  NewsletterMailable,
  MultiProviderMailable,
  BulkCampaignMailable,
  ComprehensiveMailService,
  ComprehensiveMailModule,
};

// ===== EXECUTION =====

if (require.main === module) {
  runAllExamples();
}
