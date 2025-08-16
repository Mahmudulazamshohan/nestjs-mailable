---
sidebar_position: 6
---

# Advanced Features

Explore the advanced features of NestJS Mailable for complex email scenarios, monitoring, and performance optimization.

## Monitoring and Analytics

### Email Tracking

```typescript
export class AnalyticsService {
  async trackEmailEvent(eventData: EmailEvent) {
    // Track opens, clicks, bounces, etc.
    await this.saveEmailEvent(eventData);
    
    // Update user engagement metrics
    await this.updateUserEngagement(eventData.userId, eventData.type);
    
    // Trigger webhooks for external systems
    if (eventData.type === 'bounce') {
      await this.handleBounce(eventData);
    }
  }

  async getEmailAnalytics(filters: AnalyticsFilters) {
    return {
      totalSent: await this.getTotalSent(filters),
      delivered: await this.getDelivered(filters),
      opened: await this.getOpened(filters),
      clicked: await this.getClicked(filters),
      bounced: await this.getBounced(filters),
      unsubscribed: await this.getUnsubscribed(filters),
    };
  }
}
```

### Custom Email Events

```typescript
import { Injectable, EventEmitter2 } from '@nestjs/event-emitter';

@Injectable() 
export class EnhancedMailService extends MailService {
  constructor(
    private eventEmitter: EventEmitter2,
    // ... other dependencies
  ) {
    super();
  }

  async send(content: Content): Promise<any> {
    // Emit before send event
    this.eventEmitter.emit('email.sending', {
      to: content.to,
      subject: content.subject,
      tags: content.tags
    });

    try {
      const result = await super.send(content);
      
      // Emit success event
      this.eventEmitter.emit('email.sent', {
        to: content.to,
        subject: content.subject,
        messageId: result.messageId,
        tags: content.tags
      });

      return result;
    } catch (error) {
      // Emit error event
      this.eventEmitter.emit('email.failed', {
        to: content.to,
        subject: content.subject,
        error: error.message,
        tags: content.tags
      });

      throw error;
    }
  }
}
```

### Event Listeners

```typescript
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class EmailEventHandler {
  @OnEvent('email.sent')
  handleEmailSent(event: EmailSentEvent) {
    console.log(`Email sent to ${event.to}: ${event.subject}`);
    // Log to analytics service
    this.analyticsService.recordEmailSent(event);
  }

  @OnEvent('email.failed')
  handleEmailFailed(event: EmailFailedEvent) {
    console.error(`Email failed to ${event.to}: ${event.error}`);
    // Alert monitoring service
    this.monitoringService.recordEmailFailure(event);
    
    // Retry logic for critical emails
    if (event.tags?.includes('critical')) {
      this.retryService.scheduleRetry(event);
    }
  }

  @OnEvent('email.bounced')
  handleEmailBounced(event: EmailBouncedEvent) {
    // Mark email as invalid
    this.userService.markEmailInvalid(event.to);
    
    // Remove from mailing lists
    this.mailingListService.removeEmail(event.to);
  }
}
```

## Performance Optimization

### Connection Pooling

```typescript
{
  mailers: {
    smtp: {
      transport: 'smtp',
      host: 'smtp.gmail.com',
      port: 587,
      pool: true, // Enable connection pooling
      maxConnections: 5, // Max concurrent connections
      maxMessages: 100, // Messages per connection
      rateDelta: 1000, // Rate limiting: time window
      rateLimit: 10, // Rate limiting: max messages per window
    }
  }
}
```

### Batch Processing

```typescript
@Injectable()
export class BatchEmailService {
  async sendBatchEmails(
    emails: BatchEmail[],
    batchSize: number = 50
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    
    // Process emails in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming the server
      await this.delay(100);
    }
    
    return results;
  }

  private async processBatch(batch: BatchEmail[]): Promise<BatchResult[]> {
    const promises = batch.map(email => this.sendSingleEmail(email));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => ({
      email: batch[index].to.address,
      status: result.status === 'fulfilled' ? 'sent' : 'failed',
      error: result.status === 'rejected' ? result.reason : undefined
    }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Memory Optimization

```typescript
@Injectable()
export class OptimizedMailService {
  private emailCache = new Map<string, CachedTemplate>();
  private readonly MAX_CACHE_SIZE = 100;

  async sendWithOptimization(content: Content): Promise<any> {
    // Use streaming for large attachments
    if (content.attachments?.some(a => a.size > 1024 * 1024)) {
      return this.sendWithStreaming(content);
    }

    // Cache compiled templates
    if (content.template) {
      const cached = this.getCachedTemplate(content.template);
      if (cached) {
        content.html = this.renderTemplate(cached, content.context);
      }
    }

    return this.send(content);
  }

  private getCachedTemplate(templateName: string): CachedTemplate | null {
    if (this.emailCache.has(templateName)) {
      return this.emailCache.get(templateName)!;
    }

    // Load and cache template
    const template = this.loadTemplate(templateName);
    if (this.emailCache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = this.emailCache.keys().next().value;
      this.emailCache.delete(firstKey);
    }
    
    this.emailCache.set(templateName, template);
    return template;
  }
}
```

## Security Features

### Email Encryption

```typescript
import * as crypto from 'crypto';

@Injectable()
export class SecureMailService {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.EMAIL_ENCRYPTION_KEY || 'default-key';
  }

  async sendSecureEmail(content: Content & { encrypt?: boolean }): Promise<any> {
    if (content.encrypt) {
      content.html = this.encryptContent(content.html);
      content.text = this.encryptContent(content.text);
    }

    // Add security headers
    content.headers = {
      ...content.headers,
      'X-Secure-Email': 'true',
      'X-Content-Encrypted': content.encrypt ? 'true' : 'false'
    };

    return this.mailService.send(content);
  }

  private encryptContent(content: string): string {
    if (!content) return content;
    
    const cipher = crypto.createCipher('aes256', this.encryptionKey);
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
}
```

### Rate Limiting

```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class RateLimitedMailService {
  private rateLimiter = new RateLimiterMemory({
    keyPrefix: 'email_limit',
    points: 100, // 100 emails
    duration: 3600, // per hour
  });

  async sendWithRateLimit(
    content: Content, 
    userId: string
  ): Promise<any> {
    try {
      await this.rateLimiter.consume(userId);
      return this.mailService.send(content);
    } catch (rejRes) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.round(rejRes.msBeforeNext / 1000)} seconds`);
    }
  }
}
```

### Content Sanitization

```typescript
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

@Injectable()
export class SanitizedMailService {
  private window = new JSDOM('').window;
  private purify = DOMPurify(this.window);

  async sendSanitizedEmail(content: Content): Promise<any> {
    // Sanitize HTML content
    if (content.html) {
      content.html = this.purify.sanitize(content.html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'a', 'img'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'style']
      });
    }

    // Validate recipient email
    if (!this.isValidEmail(content.to.address)) {
      throw new Error('Invalid recipient email address');
    }

    return this.mailService.send(content);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

## Custom Transport Implementation

### Creating a Custom Transport

```typescript
import { MailTransport, Content } from 'nestjs-mailable';

export class SlackTransport implements MailTransport {
  private webhookUrl: string;

  constructor(options: { webhookUrl: string }) {
    this.webhookUrl = options.webhookUrl;
  }

  async send(content: Content): Promise<any> {
    const slackMessage = {
      text: `New Email: ${content.subject}`,
      attachments: [
        {
          color: 'good',
          fields: [
            {
              title: 'To',
              value: content.to.address,
              short: true
            },
            {
              title: 'Subject',
              value: content.subject,
              short: true
            },
            {
              title: 'Content',
              value: content.text || 'HTML content',
              short: false
            }
          ]
        }
      ]
    };

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }

    return {
      messageId: `slack-${Date.now()}`,
      accepted: [content.to.address],
      rejected: [],
      response: 'Message sent to Slack'
    };
  }
}
```

### Registering Custom Transport

```typescript
import { MailTransportFactory } from 'nestjs-mailable';

@Injectable()
export class CustomTransportFactory extends MailTransportFactory {
  createTransport(config: any): MailTransport {
    if (config.transport === 'slack') {
      return new SlackTransport(config.options);
    }
    
    return super.createTransport(config);
  }
}

// In your module
@Module({
  providers: [
    {
      provide: MailTransportFactory,
      useClass: CustomTransportFactory
    }
  ]
})
export class AppModule {}
```

## Webhook Integration

### Email Event Webhooks

```typescript
@Controller('webhooks/email')
export class EmailWebhookController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('mailgun')
  async handleMailgunWebhook(@Body() payload: any) {
    const event = {
      type: payload['event-data'].event,
      recipient: payload['event-data'].recipient,
      timestamp: new Date(payload['event-data'].timestamp * 1000),
      messageId: payload['event-data'].message.headers['message-id']
    };

    await this.analyticsService.trackEmailEvent(event);
    return { status: 'ok' };
  }

  @Post('ses')
  async handleSESWebhook(@Body() payload: any) {
    // Handle SES bounce/complaint notifications
    if (payload.Type === 'Notification') {
      const message = JSON.parse(payload.Message);
      
      if (message.notificationType === 'Bounce') {
        await this.handleBounce(message);
      } else if (message.notificationType === 'Complaint') {
        await this.handleComplaint(message);
      }
    }

    return { status: 'ok' };
  }

  private async handleBounce(message: any) {
    for (const recipient of message.bounce.bouncedRecipients) {
      await this.analyticsService.trackEmailEvent({
        type: 'bounce',
        recipient: recipient.emailAddress,
        bounceType: message.bounce.bounceType,
        timestamp: new Date(message.bounce.timestamp)
      });
    }
  }
}
```

This completes the advanced features documentation, covering monitoring, performance optimization, security, custom transports, and webhooks.