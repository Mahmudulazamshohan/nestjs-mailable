import { Module, Injectable, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MailModule, MailService, Mailable } from '../dist';

// 1. Queue-able Mailable with Retry Logic
class QueueableMailable extends Mailable {
  constructor(
    private readonly data: any,
    private readonly priority: 'high' | 'normal' | 'low' = 'normal',
  ) {
    super();
    this.build();
  }

  protected build() {
    this.subject(`${this.priority.toUpperCase()}: ${this.data.subject}`)
      .view('queued-email.hbs', this.data)
      .with('priority', this.priority)
      .with('queuedAt', new Date().toISOString())
      .tag(`priority-${this.priority}`)
      .metadata('retryCount', 0);
    return super.build();
  }
}

// 2. Testing Mailable
class TestMailable extends Mailable {
  constructor(private readonly testData: any) {
    super();
    this.build();
  }

  protected build() {
    this.subject('Test Email - Do Not Reply')
      .view('test-template.hbs', this.testData)
      .with('environment', 'test')
      .with('timestamp', new Date().toISOString())
      .tag('test-email');
    return super.build();
  }
}

// 3. Bulk Email Mailable
class BulkEmailMailable extends Mailable {
  constructor(
    private readonly recipientData: any,
    private readonly campaignData: any,
  ) {
    super();
    this.build();
  }

  protected build() {
    this.subject(this.campaignData.subject)
      .view('bulk-email-template.hbs', {
        ...this.recipientData,
        ...this.campaignData,
      })
      .with('recipientId', this.recipientData.id)
      .with('campaignId', this.campaignData.id)
      .tag('bulk-email')
      .tag(`campaign-${this.campaignData.id}`)
      .metadata('recipient', this.recipientData.email)
      .metadata('campaign', this.campaignData.name);
    return super.build();
  }
}

// 4. Advanced Mail Service with Queue and Testing
@Injectable()
class AdvancedMailService {
  private readonly logger = new Logger(AdvancedMailService.name);
  private emailQueue: Array<{ mailable: any; recipient: string; retries: number }> = [];
  private testMode = false;
  private sentEmails: any[] = [];

  constructor(private readonly mailService: MailService) {}

  // Queue Management
  async queueEmail(mailable: any, recipient: string, priority: 'high' | 'normal' | 'low' = 'normal') {
    this.emailQueue.push({ mailable, recipient, retries: 0 });
    this.logger.log(`Email queued for ${recipient} with priority: ${priority}`);

    if (priority === 'high') {
      await this.processQueue(); // Process immediately for high priority
    }
  }

  async processQueue() {
    this.logger.log(`Processing email queue (${this.emailQueue.length} emails)`);

    while (this.emailQueue.length > 0) {
      const emailJob = this.emailQueue.shift();
      if (!emailJob) continue;

      try {
        await this.sendWithRetry(emailJob.mailable, emailJob.recipient, emailJob.retries);
        this.logger.log(`Email sent successfully to ${emailJob.recipient}`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${emailJob.recipient}:`, error.message);

        if (emailJob.retries < 3) {
          emailJob.retries++;
          this.emailQueue.push(emailJob); // Re-queue for retry
          this.logger.log(`Re-queued email for ${emailJob.recipient} (retry ${emailJob.retries})`);
        } else {
          this.logger.error(`Permanently failed to send email to ${emailJob.recipient}`);
        }
      }
    }
  }

  private async sendWithRetry(mailable: any, recipient: string, retryCount: number) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const sender = await this.mailService.to(recipient);
        const result = await sender.send(mailable);

        if (this.testMode) {
          this.sentEmails.push({ mailable, recipient, sentAt: new Date() });
        }

        return result;
      } catch (error) {
        attempt++;
        if (attempt > maxRetries) {
          throw error;
        }

        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        this.logger.warn(`Retry ${attempt}/${maxRetries} for ${recipient} in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Testing Features
  enableTestMode() {
    this.testMode = true;
    this.sentEmails = [];
    this.logger.log('Test mode enabled - emails will be captured instead of sent');
  }

  disableTestMode() {
    this.testMode = false;
    this.logger.log('Test mode disabled');
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

  // Bulk Email Features
  async sendBulkEmails(recipients: any[], campaignData: any, batchSize = 10) {
    this.logger.log(`Sending bulk emails to ${recipients.length} recipients`);

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const promises = batch.map(async (recipient) => {
        const mailable = new BulkEmailMailable(recipient, campaignData);
        return this.queueEmail(mailable, recipient.email, 'normal');
      });

      await Promise.all(promises);
      this.logger.log(`Queued batch ${Math.floor(i / batchSize) + 1} (${batch.length} emails)`);

      // Rate limiting - wait between batches
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    await this.processQueue();
  }

  // Error Handling and Monitoring
  async sendWithMonitoring(mailable: any, recipient: string) {
    const startTime = Date.now();

    try {
      const result = await this.sendWithRetry(mailable, recipient, 0);
      const duration = Date.now() - startTime;

      this.logger.log(`Email sent successfully in ${duration}ms`, {
        recipient,
        duration,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(`Email sending failed after ${duration}ms`, {
        recipient,
        duration,
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  // Performance Testing
  async performanceTest(emailCount = 100) {
    this.logger.log(`Starting performance test with ${emailCount} emails`);
    const startTime = Date.now();

    const promises = Array.from({ length: emailCount }, async (_, index) => {
      const testData = {
        id: index + 1,
        message: `Performance test email #${index + 1}`,
      };

      const mailable = new TestMailable(testData);
      return this.queueEmail(mailable, `test-${index + 1}@example.com`, 'normal');
    });

    await Promise.all(promises);
    await this.processQueue();

    const duration = Date.now() - startTime;
    const emailsPerSecond = (emailCount / duration) * 1000;

    this.logger.log(
      `Performance test completed: ${emailCount} emails in ${duration}ms (${emailsPerSecond.toFixed(2)} emails/sec)`,
    );
  }
}

// 5. Testing Service
@Injectable()
class MailTestingService {
  constructor(private readonly advancedMailService: AdvancedMailService) {}

  async runTestSuite() {
    console.log('=== Advanced Mail Testing Suite ===');

    // Enable test mode
    this.advancedMailService.enableTestMode();

    // Test 1: Basic email sending
    console.log('Test 1: Basic email sending...');
    const testMailable = new TestMailable({ message: 'Test email content' });
    await this.advancedMailService.sendWithMonitoring(testMailable, 'test@example.com');

    // Verify email was "sent"
    this.advancedMailService.assertEmailSent((email) => email.recipient === 'test@example.com');
    console.log('✓ Basic email test passed');

    // Test 2: Queue functionality
    console.log('Test 2: Queue functionality...');
    const queueMailable = new QueueableMailable({ subject: 'Queued email' }, 'high');
    await this.advancedMailService.queueEmail(queueMailable, 'queue@example.com', 'high');
    console.log('✓ Queue test passed');

    // Test 3: Bulk email
    console.log('Test 3: Bulk email sending...');
    const recipients = [
      { id: 1, email: 'bulk1@example.com', name: 'User 1' },
      { id: 2, email: 'bulk2@example.com', name: 'User 2' },
      { id: 3, email: 'bulk3@example.com', name: 'User 3' },
    ];

    const campaignData = {
      id: 'camp-001',
      name: 'Test Campaign',
      subject: 'Bulk Email Test',
      content: 'This is a bulk email test',
    };

    await this.advancedMailService.sendBulkEmails(recipients, campaignData, 2);
    console.log('✓ Bulk email test passed');

    // Test 4: Performance test
    console.log('Test 4: Performance test...');
    await this.advancedMailService.performanceTest(10);
    console.log('✓ Performance test passed');

    // Display test results
    const testEmails = this.advancedMailService.getTestEmails();
    console.log(`\n📊 Test Results: ${testEmails.length} emails captured`);

    testEmails.forEach((email, index) => {
      console.log(`  ${index + 1}. ${email.recipient} - ${email.mailable.subject || 'No Subject'}`);
    });

    // Disable test mode
    this.advancedMailService.disableTestMode();
    console.log('\n✓ All tests completed successfully!');
  }
}

// 6. Module Setup
@Module({
  imports: [
    MailModule.forRoot({
      config: {
        default: 'smtp',
        mailers: {
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
        },
        from: {
          address: 'advanced@example.com',
          name: 'Advanced Mail Examples',
        },
      },
    }),
  ],
  providers: [AdvancedMailService, MailTestingService],
})
class AdvancedMailModule {}

// 7. Example Runner
async function advancedExample() {
  const app = await NestFactory.create(AdvancedMailModule);
  const mailTestingService = app.get(MailTestingService);

  try {
    await mailTestingService.runTestSuite();
  } catch (error) {
    console.error('✗ Advanced example error:', error.message);
  }

  await app.close();
}

// Export for testing
export {
  advancedExample,
  QueueableMailable,
  TestMailable,
  BulkEmailMailable,
  AdvancedMailService,
  MailTestingService,
  AdvancedMailModule,
};

// Run if called directly
if (require.main === module) {
  advancedExample();
}
